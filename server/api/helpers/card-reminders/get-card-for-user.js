/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: the card with its path when the user can see it (same rule as GET /api/cards/:id)

module.exports = {
  inputs: {
    cardId: {
      type: 'string',
      required: true,
    },
    user: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    cardNotFound: {},
  },

  async fn(inputs) {
    const path = await sails.helpers.cards
      .getPathToProjectById(inputs.cardId)
      .intercept('pathNotFound', () => 'cardNotFound');

    const { card, project } = path;
    const { user } = inputs;

    if (user.role !== User.Roles.ADMIN || project.ownerProjectManagerId) {
      const isProjectManager = await sails.helpers.users.isProjectManager(user.id, project.id);

      if (!isProjectManager) {
        const boardMembership = await BoardMembership.qm.getOneByBoardIdAndUserId(
          card.boardId,
          user.id,
        );

        if (!boardMembership) {
          throw 'cardNotFound';
        }
      }
    }

    return path;
  },
};
