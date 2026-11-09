/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: who follows a card. `membersFirst` returns the card members and falls back to the card
// and board subscribers only when the card has no members (due date notifications); otherwise it
// returns members and subscribers together.

module.exports = {
  inputs: {
    card: {
      type: 'ref',
      required: true,
    },
    membersFirst: {
      type: 'boolean',
      defaultsTo: false,
    },
    exceptUserIdOrIds: {
      type: 'json',
    },
  },

  async fn(inputs) {
    const { card } = inputs;

    const cardMemberships = await CardMembership.qm.getByCardId(card.id);
    const memberUserIds = sails.helpers.utils.mapRecords(cardMemberships, 'userId');

    let userIds;
    if (inputs.membersFirst && memberUserIds.length > 0) {
      userIds = memberUserIds;
    } else {
      const cardSubscriptionUserIds = await sails.helpers.cards.getSubscriptionUserIds(card.id);
      const boardSubscriptionUserIds = await sails.helpers.boards.getSubscriptionUserIds(
        card.boardId,
      );

      userIds = _.union(
        inputs.membersFirst ? [] : memberUserIds,
        cardSubscriptionUserIds,
        boardSubscriptionUserIds,
      );
    }

    if (inputs.exceptUserIdOrIds) {
      userIds = _.difference(userIds, _.castArray(inputs.exceptUserIdOrIds));
    }

    return _.uniq(userIds);
  },
};
