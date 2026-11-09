/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: fires due personal reminders. Each reminder is claimed by moving its next_at forward
// (or deleting it) with a compare-and-set on the old next_at, so it fires once even if two
// processes get here.

const { getNextOccurrence } = require('../../../utils/zoned-time');

const toIso = (value) => new Date(value).toISOString();

module.exports = {
  inputs: {
    now: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const now = new Date(inputs.now);
    const cardReminders = await CardReminder.qm.getDue(now);

    let fired = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const cardReminder of cardReminders) {
      const prevNextAt = toIso(cardReminder.nextAt);

      const nextAt = getNextOccurrence({
        now,
        nextAt: cardReminder.nextAt,
        anchorAt: cardReminder.anchorAt,
        repeat: cardReminder.repeat,
      });

      /* eslint-disable no-await-in-loop */
      const user = await User.qm.getOneById(cardReminder.userId, {
        withDeactivated: false,
      });

      const path = user
        ? await sails.helpers.cardReminders.getCardForUser
            .with({
              user,
              cardId: cardReminder.cardId,
            })
            .tolerate('cardNotFound', () => null)
        : null;

      // Lost access to the card: the reminder has no reader any more
      const shouldDelete = !nextAt || (user && !path);

      const claimResult = shouldDelete
        ? await sails.sendNativeQuery(
            'DELETE FROM card_reminder WHERE id = $1 AND next_at = $2 RETURNING id',
            [cardReminder.id, prevNextAt],
          )
        : await sails.sendNativeQuery(
            'UPDATE card_reminder SET next_at = $3, updated_at = $4 WHERE id = $1 AND next_at = $2 RETURNING id',
            [cardReminder.id, prevNextAt, nextAt.toISOString(), now.toISOString()],
          );

      if (claimResult.rows.length === 0) {
        continue; // eslint-disable-line no-continue
      }

      if (shouldDelete) {
        sails.sockets.broadcast(`user:${cardReminder.userId}`, 'cardReminderDelete', {
          item: cardReminder,
        });
      } else {
        sails.sockets.broadcast(`user:${cardReminder.userId}`, 'cardReminderUpdate', {
          item: {
            ...cardReminder,
            nextAt: nextAt.toISOString(),
          },
        });
      }

      if (user && path) {
        await sails.helpers.notifications.createOne.with({
          now,
          values: {
            userId: user.id,
            card: path.card,
            type: Notification.Types.CARD_REMINDER,
            data: {
              card: _.pick(path.card, ['name']),
              note: cardReminder.note,
              cardReminderId: cardReminder.id,
            },
          },
          project: path.project,
          board: path.board,
          list: path.list,
        });

        fired += 1;
      }
      /* eslint-enable no-await-in-loop */
    }

    return fired;
  },
};
