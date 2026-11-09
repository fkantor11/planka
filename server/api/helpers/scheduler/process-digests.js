/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: daily (08:00) / weekly (Monday 08:00, Europe/Prague) summary email with the user's
// unread notifications since the previous digest and their cards due in the next 7 days. The
// period is claimed by a compare-and-set on user_account.last_digest_at, so it is sent once.
// The first run after turning the digest on only starts the clock.

const escapeHtml = require('escape-html');

const {
  normalize: normalizeNotificationSettings,
} = require('../../../utils/notification-settings');
const { getLatestDigestSlot } = require('../../../utils/zoned-time');
const {
  buildTitle,
  buildBodyByFormat,
  formatDateTime,
} = require('../../../utils/notification-content');

const UPCOMING_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_NOTIFICATIONS = 50;

const toIsoOrNull = (value) => (value ? new Date(value).toISOString() : null);

const buildDigestHtml = async (user, since, now, t) => {
  const { baseUrl } = sails.config.custom;

  const notificationsResult = await sails.sendNativeQuery(
    `
      SELECT id FROM notification
      WHERE user_id = $1 AND is_read = FALSE AND created_at > $2
      ORDER BY id DESC
      LIMIT $3
    `,
    [user.id, since.toISOString(), MAX_NOTIFICATIONS],
  );

  const notifications =
    notificationsResult.rows.length > 0
      ? await Notification.qm.getByIds(notificationsResult.rows.map(({ id }) => id))
      : [];

  const upcomingResult = await sails.sendNativeQuery(
    `
      SELECT card.id
      FROM card
      JOIN card_membership ON card_membership.card_id = card.id
      JOIN list ON list.id = card.list_id
      WHERE card_membership.user_id = $1
        AND card.due_date IS NOT NULL
        AND card.due_date > $2
        AND card.due_date <= $3
        AND card.is_closed = FALSE
        AND COALESCE(card.is_due_completed, FALSE) = FALSE
        AND list.type NOT IN ('archive', 'trash')
      ORDER BY card.due_date
    `,
    [user.id, now.toISOString(), new Date(now.getTime() + UPCOMING_MS).toISOString()],
  );

  const upcomingCards =
    upcomingResult.rows.length > 0
      ? _.sortBy(await Card.qm.getByIds(upcomingResult.rows.map(({ id }) => id)), (card) =>
          new Date(card.dueDate).getTime(),
        )
      : [];

  if (notifications.length === 0 && upcomingCards.length === 0) {
    return null;
  }

  const cardIds = _.compact(_.map(notifications, 'cardId'));
  const cards = cardIds.length > 0 ? await Card.qm.getByIds(_.uniq(cardIds)) : [];
  const cardById = _.keyBy([...cards, ...upcomingCards], 'id');

  const boardIds = _.uniq(
    _.compact([..._.map(notifications, 'boardId'), ..._.map(upcomingCards, 'boardId')]),
  );
  const boards = boardIds.length > 0 ? await Board.qm.getByIds(boardIds) : [];
  const boardById = _.keyBy(boards, 'id');

  const creatorUserIds = _.uniq(_.compact(_.map(notifications, 'creatorUserId')));
  const creatorUsers = creatorUserIds.length > 0 ? await User.qm.getByIds(creatorUserIds) : [];
  const creatorUserById = _.keyBy(creatorUsers, 'id');

  let html = '';

  if (notifications.length > 0) {
    const items = notifications.flatMap((notification) => {
      const body = buildBodyByFormat(
        {
          card: notification.cardId && cardById[notification.cardId],
          board: notification.boardId && boardById[notification.boardId],
        },
        notification,
        creatorUserById[notification.creatorUserId] || null,
        t,
        user.language,
      );

      if (!body) {
        return [];
      }

      return `<li><b>${escapeHtml(buildTitle(notification, t))}</b>: ${body.html.replace(/\n/g, ' ')}</li>`;
    });

    html += `<h3>${escapeHtml(t('Unread notifications'))}</h3><ul>${items.join('')}</ul>`;
  }

  if (upcomingCards.length > 0) {
    const items = upcomingCards.map((card) => {
      const board = boardById[card.boardId];

      return `<li>${t(
        '%s on %s, due %s',
        `<a href="${baseUrl}/cards/${card.id}">${escapeHtml(card.name)}</a>`,
        escapeHtml(board ? board.name : ''),
        `<b>${escapeHtml(formatDateTime(card.dueDate, user.language))}</b>`,
      )}</li>`;
    });

    html += `<h3>${escapeHtml(t('Due in the next 7 days'))}</h3><ul>${items.join('')}</ul>`;
  }

  html += `<p><a href="${baseUrl}">${escapeHtml(t('Open Planka'))}</a></p>`;

  return html;
};

module.exports = {
  inputs: {
    now: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const now = new Date(inputs.now);

    const usersResult = await sails.sendNativeQuery(
      `
        SELECT id FROM user_account
        WHERE is_deactivated = FALSE
          AND notification_settings->>'digest' IN ('daily', 'weekly')
      `,
    );

    if (usersResult.rows.length === 0) {
      return 0;
    }

    const users = await User.qm.getByIds(
      usersResult.rows.map(({ id }) => id),
      { withDeactivated: false },
    );

    let sent = 0;

    /* eslint-disable no-await-in-loop */
    // eslint-disable-next-line no-restricted-syntax
    for (const user of users) {
      const { digest } = normalizeNotificationSettings(user.notificationSettings);
      const slot = getLatestDigestSlot(now, digest);
      const lastDigestAt = toIsoOrNull(user.lastDigestAt);

      if (!lastDigestAt) {
        await sails.sendNativeQuery(
          'UPDATE user_account SET last_digest_at = $2 WHERE id = $1 AND last_digest_at IS NULL',
          [user.id, now.toISOString()],
        );

        continue; // eslint-disable-line no-continue
      }

      if (new Date(lastDigestAt).getTime() >= slot.getTime()) {
        continue; // eslint-disable-line no-continue
      }

      const claimResult = await sails.sendNativeQuery(
        'UPDATE user_account SET last_digest_at = $3 WHERE id = $1 AND last_digest_at = $2 RETURNING id',
        [user.id, lastDigestAt, now.toISOString()],
      );

      if (claimResult.rows.length === 0) {
        continue; // eslint-disable-line no-continue
      }

      const t = sails.helpers.utils.makeTranslator(user.language);
      const html = await buildDigestHtml(user, new Date(lastDigestAt), now, t);

      if (html) {
        const result = await sails.helpers.notifications.deliverEmails.with({
          user,
          now,
          emails: [
            {
              html,
              subject: t('Your Planka Summary'),
            },
          ],
        });

        if (result !== 'skipped') {
          sent += 1;
        }
      }
    }
    /* eslint-enable no-await-in-loop */

    return sent;
  },
};
