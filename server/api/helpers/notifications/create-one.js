/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: a single notification is just a batch of one, so settings are honoured in one place.
// Returns null when the recipient turned the in-app notification off (or is the actor).

module.exports = {
  inputs: {
    values: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
    },
    board: {
      type: 'ref',
    },
    list: {
      type: 'ref',
    },
    webhooks: {
      type: 'ref',
    },
    now: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const notifications = await sails.helpers.notifications.createMany.with({
      arrayOfValues: [inputs.values],
      project: inputs.project,
      board: inputs.board,
      list: inputs.list,
      webhooks: inputs.webhooks,
      now: inputs.now,
    });

    return notifications[0] || null;
  },
};
