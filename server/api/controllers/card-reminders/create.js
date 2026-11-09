/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /cards/{cardId}/card-reminders:
 *   post:
 *     summary: Create a reminder
 *     description: Creates a personal reminder for the current user on a card they can see.
 *     tags:
 *       - Card Reminders
 *     operationId: createCardReminder
 *     parameters:
 *       - name: cardId
 *         in: path
 *         required: true
 *         description: ID of the card
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nextAt
 *               - repeat
 *             properties:
 *               nextAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the reminder fires first
 *                 example: 2026-11-10T08:00:00.000Z
 *               repeat:
 *                 type: string
 *                 enum: [none, daily, workdays, weekly, monthly]
 *                 example: workdays
 *               note:
 *                 type: string
 *                 maxLength: 1024
 *                 nullable: true
 *                 example: Zavolat klientovi
 *     responses:
 *       200:
 *         description: Reminder created successfully
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
 *       422:
 *         $ref: '#/components/responses/UnprocessableEntity'
 */

const { idInput } = require('../../../utils/inputs');

const MAX_REMINDERS_PER_CARD = 20;

const Errors = {
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
  TOO_MANY_REMINDERS: {
    tooManyReminders: 'Too many reminders',
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
    cardId: {
      ...idInput,
      required: true,
    },
    nextAt: {
      type: 'string',
      custom: isDateString,
      required: true,
    },
    repeat: {
      type: 'string',
      isIn: Object.values(CardReminder.Repeats),
      required: true,
    },
    note: {
      type: 'string',
      maxLength: 1024,
      allowNull: true,
    },
  },

  exits: {
    cardNotFound: {
      responseType: 'notFound',
    },
    tooManyReminders: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    const { card } = await sails.helpers.cardReminders.getCardForUser
      .with({
        cardId: inputs.cardId,
        user: currentUser,
      })
      .intercept('cardNotFound', () => Errors.CARD_NOT_FOUND);

    const cardReminders = await CardReminder.qm.getByCardIdAndUserId(card.id, currentUser.id);

    if (cardReminders.length >= MAX_REMINDERS_PER_CARD) {
      throw Errors.TOO_MANY_REMINDERS;
    }

    const nextAt = toMinuteIso(inputs.nextAt);
    const note = inputs.note && inputs.note.trim();

    const cardReminder = await CardReminder.qm.createOne({
      nextAt,
      cardId: card.id,
      userId: currentUser.id,
      anchorAt: nextAt,
      repeat: inputs.repeat,
      note: note || null,
    });

    sails.sockets.broadcast(`user:${currentUser.id}`, 'cardReminderCreate', {
      item: cardReminder,
    });

    return {
      item: cardReminder,
    };
  },
};
