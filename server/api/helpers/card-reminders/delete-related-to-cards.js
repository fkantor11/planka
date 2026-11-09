/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: reminders and scheduler markers die with their card

module.exports = {
  inputs: {
    cardIdOrIds: {
      type: 'json',
      required: true,
    },
  },

  async fn(inputs) {
    const cardIds = _.castArray(inputs.cardIdOrIds);

    if (cardIds.length === 0) {
      return;
    }

    await CardReminder.qm.delete({
      cardId: cardIds,
    });

    await sails.sendNativeQuery('DELETE FROM notification_marker WHERE card_id = ANY($1)', [
      cardIds,
    ]);
  },
};
