/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: dueSoon (per user offset before the due date) and overdue notifications for card
// members (or followers when the card has no members) of cards that are not done. Sent once per
// (kind, card, user, due date): the marker row is inserted first and only the inserting process
// notifies. Changing the due date makes a new marker possible.

const {
  normalize: normalizeNotificationSettings,
  DUE_REMINDER_OFFSET_MS,
  MAX_DUE_REMINDER_OFFSET_MS,
} = require('../../../utils/notification-settings');

// Overdue cards older than this are not notified (avoids a flood of old cards on the first run)
const OVERDUE_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

const Kinds = {
  DUE_SOON: 'dueSoon',
  OVERDUE: 'overdue',
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

    const queryResult = await sails.sendNativeQuery(
      `
        SELECT card.id
        FROM card
        JOIN list ON list.id = card.list_id
        WHERE card.due_date IS NOT NULL
          AND card.is_closed = FALSE
          AND COALESCE(card.is_due_completed, FALSE) = FALSE
          AND list.type NOT IN ('archive', 'trash')
          AND card.due_date > $1
          AND card.due_date <= $2
        ORDER BY card.due_date
      `,
      [
        new Date(now.getTime() - OVERDUE_LOOKBACK_MS).toISOString(),
        new Date(now.getTime() + MAX_DUE_REMINDER_OFFSET_MS).toISOString(),
      ],
    );

    let sent = 0;

    /* eslint-disable no-await-in-loop */
    // eslint-disable-next-line no-restricted-syntax
    for (const { id: cardId } of queryResult.rows) {
      let path;
      try {
        path = await sails.helpers.cards.getPathToProjectById(cardId);
      } catch (error) {
        continue; // eslint-disable-line no-continue
      }

      const { card } = path;
      const dueDate = new Date(card.dueDate);

      const userIds = await sails.helpers.notifications.getCardFollowerUserIds.with({
        card,
        membersFirst: true,
      });

      const users =
        userIds.length > 0 ? await User.qm.getByIds(userIds, { withDeactivated: false }) : [];

      const arrayOfValues = [];

      // eslint-disable-next-line no-restricted-syntax
      for (const user of users) {
        let kind = null;

        if (dueDate.getTime() <= now.getTime()) {
          kind = Kinds.OVERDUE;
        } else {
          const { dueReminderOffset } = normalizeNotificationSettings(user.notificationSettings);

          if (dueDate.getTime() - DUE_REMINDER_OFFSET_MS[dueReminderOffset] <= now.getTime()) {
            kind = Kinds.DUE_SOON;
          }
        }

        if (kind) {
          const markerResult = await sails.sendNativeQuery(
            `
              INSERT INTO notification_marker (kind, card_id, user_id, for_date, created_at)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT DO NOTHING
              RETURNING id
            `,
            [kind, card.id, user.id, dueDate.toISOString(), now.toISOString()],
          );

          if (markerResult.rows.length > 0) {
            arrayOfValues.push({
              card,
              userId: user.id,
              type:
                kind === Kinds.OVERDUE ? Notification.Types.OVERDUE : Notification.Types.DUE_SOON,
              data: {
                card: _.pick(card, ['name']),
                dueDate: dueDate.toISOString(),
              },
            });
          }
        }
      }

      if (arrayOfValues.length > 0) {
        await sails.helpers.notifications.createMany.with({
          now,
          arrayOfValues,
          project: path.project,
          board: path.board,
          list: path.list,
        });

        sent += arrayOfValues.length;
      }
    }
    /* eslint-enable no-await-in-loop */

    return sent;
  },
};
