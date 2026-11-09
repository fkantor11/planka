/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const { v4: uuid } = require('uuid');

const normalizeValues = require('../../../utils/normalize-values');

module.exports = {
  inputs: {
    values: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  exits: {
    userAlreadyBoardMember: {},
  },

  async fn(inputs) {
    const { values } = inputs;

    const normalizedValues = normalizeValues(
      {
        ...BoardMembership.SHARED_RULES,
        ...BoardMembership.RULES_BY_ROLE[values.role],
      },
      values,
    );

    let boardMembership;
    try {
      boardMembership = await BoardMembership.qm.createOne({
        ...normalizedValues,
        projectId: values.board.projectId,
        boardId: values.board.id,
        userId: values.user.id,
      });
    } catch (error) {
      if (error.code === 'E_UNIQUE') {
        throw 'userAlreadyBoardMember';
      }

      throw error;
    }

    sails.sockets.broadcast(
      `user:${boardMembership.userId}`,
      'boardMembershipCreate',
      {
        item: boardMembership,
      },
      inputs.request,
    );

    const tempRoom = uuid();

    sails.sockets.addRoomMembersToRooms(`board:${boardMembership.boardId}`, tempRoom, () => {
      sails.sockets.removeRoomMembersFromRooms(`user:${boardMembership.userId}`, tempRoom, () => {
        sails.sockets.broadcast(
          tempRoom,
          'boardMembershipCreate',
          {
            item: boardMembership,
            included: {
              users: [sails.helpers.users.presentOne(values.user, {})], // FIXME: hack
            },
          },
          inputs.request,
        );

        sails.sockets.removeRoomMembersFromRooms(tempRoom, tempRoom);
      });
    });

    const webhooks = await Webhook.qm.getAll();

    sails.helpers.utils.sendWebhooks.with({
      webhooks,
      event: Webhook.Events.BOARD_MEMBERSHIP_CREATE,
      buildData: () => ({
        item: boardMembership,
        included: {
          users: [sails.helpers.users.presentOne(values.user)],
          projects: [inputs.project],
          boards: [values.board],
        },
      }),
      user: inputs.actorUser,
    });

    // SPECIAL1: addedToProjectOrBoard (createMany skips the actor, e.g. the board creator)
    try {
      await sails.helpers.notifications.createOne.with({
        webhooks,
        values: {
          userId: values.user.id,
          type: Notification.Types.ADD_TO_BOARD,
          data: {
            project: _.pick(inputs.project, ['id', 'name']),
            board: _.pick(values.board, ['id', 'name']),
          },
          creatorUser: inputs.actorUser,
        },
        project: inputs.project,
        board: values.board,
      });
    } catch (error) {
      sails.log.error(`Error creating board membership notification: ${error}`);
    }

    return boardMembership;
  },
};
