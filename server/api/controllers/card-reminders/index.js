/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /cards/{cardId}/card-reminders:
 *   get:
 *     summary: Get my reminders for a card
 *     description: Retrieves the current user's personal reminders for a card. Reminders of other users are never returned.
 *     tags:
 *       - Card Reminders
 *     operationId: getCardReminders
 *     parameters:
 *       - name: cardId
 *         in: path
 *         required: true
 *         description: ID of the card
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     responses:
 *       200:
 *         description: Reminders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - items
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CardReminder'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
};

module.exports = {
  inputs: {
    cardId: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    cardNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    await sails.helpers.cardReminders.getCardForUser
      .with({
        cardId: inputs.cardId,
        user: currentUser,
      })
      .intercept('cardNotFound', () => Errors.CARD_NOT_FOUND);

    const cardReminders = await CardReminder.qm.getByCardIdAndUserId(inputs.cardId, currentUser.id);

    return {
      items: cardReminders,
    };
  },
};
