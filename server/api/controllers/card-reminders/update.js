/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /card-reminders/{id}:
 *   patch:
 *     summary: Update a reminder
 *     description: Updates one of the current user's reminders.
 *     tags:
 *       - Card Reminders
 *     operationId: updateCardReminder
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the reminder
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nextAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the reminder fires next (also becomes the new anchor of the series)
 *               repeat:
 *                 type: string
 *                 enum: [none, daily, workdays, weekly, monthly]
 *               note:
 *                 type: string
 *                 maxLength: 1024
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Reminder updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/CardReminder'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
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

const isDateString = (value) => !Number.isNaN(new Date(value).getTime());

// Reminders have minute precision
const toMinuteIso = (value) => {
  const date = new Date(value);
  date.setUTCSeconds(0, 0);

  return date.toISOString();
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
    nextAt: {
      type: 'string',
      custom: isDateString,
    },
    repeat: {
      type: 'string',
      isIn: Object.values(CardReminder.Repeats),
    },
    note: {
      type: 'string',
      maxLength: 1024,
      allowNull: true,
    },
  },

  exits: {
    cardReminderNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    let cardReminder = await CardReminder.qm.getOneById(inputs.id, {
      userId: currentUser.id,
    });

    if (!cardReminder) {
      throw Errors.CARD_REMINDER_NOT_FOUND;
    }

    // The user may have lost access to the card in the meantime
    await sails.helpers.cardReminders.getCardForUser
      .with({
        cardId: cardReminder.cardId,
        user: currentUser,
      })
      .intercept('cardNotFound', () => Errors.CARD_REMINDER_NOT_FOUND);

    const values = _.pick(inputs, ['repeat']);

    if (inputs.nextAt) {
      values.nextAt = toMinuteIso(inputs.nextAt);
      values.anchorAt = values.nextAt;
    }

    if (!_.isUndefined(inputs.note)) {
      values.note = (inputs.note && inputs.note.trim()) || null;
    }

    cardReminder = await CardReminder.qm.updateOne(
      {
        id: cardReminder.id,
        userId: currentUser.id,
      },
      values,
    );

    if (!cardReminder) {
      throw Errors.CARD_REMINDER_NOT_FOUND;
    }

    sails.sockets.broadcast(`user:${currentUser.id}`, 'cardReminderUpdate', {
      item: cardReminder,
    });

    return {
      item: cardReminder,
    };
  },
};
