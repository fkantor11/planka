/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /card-reminders/{id}:
 *   delete:
 *     summary: Delete a reminder
 *     description: Deletes one of the current user's reminders.
 *     tags:
 *       - Card Reminders
 *     operationId: deleteCardReminder
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the reminder
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     responses:
 *       200:
 *         description: Reminder deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/CardReminder'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  CARD_REMINDER_NOT_FOUND: {
    cardReminderNotFound: 'Card reminder not found',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    cardReminderNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // Own reminders only; deleting one stays possible after losing access to the card
    const cardReminder = await CardReminder.qm.deleteOne({
      id: inputs.id,
      userId: currentUser.id,
    });

    if (!cardReminder) {
      throw Errors.CARD_REMINDER_NOT_FOUND;
    }

    sails.sockets.broadcast(`user:${currentUser.id}`, 'cardReminderDelete', {
      item: cardReminder,
    });

    return {
      item: cardReminder,
    };
  },
};
