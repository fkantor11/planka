/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: sections are shared by the whole company, so every active user is notified

module.exports = {
  inputs: {
    event: {
      type: 'string',
      required: true,
    },
    data: {
      type: 'json',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const userIds = await sails.helpers.users.getAllActiveIds(Object.values(User.Roles));

    userIds.forEach((userId) => {
      sails.sockets.broadcast(`user:${userId}`, inputs.event, inputs.data, inputs.request);
    });
  },
};
