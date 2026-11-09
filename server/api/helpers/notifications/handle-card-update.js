/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: notifications caused by a card update: the card became done (completedSubscribed) and
// its due date was set or changed (dueDateChanged). Never throws, a failed notification must not
// fail the update.

module.exports = {
  inputs: {
    prevCard: {
      type: 'ref',
      required: true,
    },
    card: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    board: {
      type: 'ref',
      required: true,
    },
    list: {
      type: 'ref',
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    webhooks: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const { prevCard, card, actorUser } = inputs;

    const common = {
      project: inputs.project,
      board: inputs.board,
      list: inputs.list,
      webhooks: inputs.webhooks,
    };

    try {
      if (!prevCard.isClosed && card.isClosed) {
        const userIds = await sails.helpers.notifications.getCardFollowerUserIds.with({
          card,
          exceptUserIdOrIds: actorUser.id,
        });

        await sails.helpers.notifications.createMany.with({
          ...common,
          arrayOfValues: userIds.map((userId) => ({
            userId,
            card,
            type: Notification.Types.COMPLETE_CARD,
            data: {
              card: _.pick(card, ['name']),
            },
            creatorUser: actorUser,
          })),
        });
      }

      const prevDueTime = prevCard.dueDate ? new Date(prevCard.dueDate).getTime() : null;
      const dueTime = card.dueDate ? new Date(card.dueDate).getTime() : null;

      if (dueTime !== null && dueTime !== prevDueTime) {
        const cardMemberships = await CardMembership.qm.getByCardId(card.id);

        await sails.helpers.notifications.createMany.with({
          ...common,
          arrayOfValues: cardMemberships.map(({ userId }) => ({
            userId,
            card,
            type: Notification.Types.CHANGE_DUE_DATE,
            data: {
              card: _.pick(card, ['name']),
              dueDate: new Date(card.dueDate).toISOString(),
            },
            creatorUser: actorUser,
          })),
        });
      }
    } catch (error) {
      sails.log.error(`Error creating card update notifications: ${error}`);
    }
  },
};
