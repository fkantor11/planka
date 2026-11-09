/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * CardReminder.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CardReminder:
 *       type: object
 *       required:
 *         - id
 *         - cardId
 *         - userId
 *         - nextAt
 *         - anchorAt
 *         - repeat
 *         - note
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the reminder
 *           example: "1357158568008091264"
 *         cardId:
 *           type: string
 *           description: ID of the card the reminder is for
 *           example: "1357158568008091265"
 *         userId:
 *           type: string
 *           description: ID of the user the reminder belongs to (reminders are personal)
 *           example: "1357158568008091266"
 *         nextAt:
 *           type: string
 *           format: date-time
 *           description: When the reminder fires next
 *           example: 2026-11-10T08:00:00.000Z
 *         anchorAt:
 *           type: string
 *           format: date-time
 *           description: The first occurrence, keeps the time of day and day of month of the series
 *           example: 2026-11-10T08:00:00.000Z
 *         repeat:
 *           type: string
 *           enum: [none, daily, workdays, weekly, monthly]
 *           description: Repeat rule
 *           example: workdays
 *         note:
 *           type: string
 *           nullable: true
 *           description: Optional note shown with the reminder
 *           example: Zavolat klientovi
 *         createdAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the reminder was created
 *           example: 2024-01-01T00:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: When the reminder was last updated
 *           example: 2024-01-01T00:00:00.000Z
 */

// SPECIAL1: personal recurring reminders on a card

const Repeats = {
  NONE: 'none',
  DAILY: 'daily',
  WORKDAYS: 'workdays',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

module.exports = {
  Repeats,

  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    nextAt: {
      type: 'ref',
      required: true,
      columnName: 'next_at',
    },
    anchorAt: {
      type: 'ref',
      required: true,
      columnName: 'anchor_at',
    },
    repeat: {
      type: 'string',
      isIn: Object.values(Repeats),
      required: true,
    },
    note: {
      type: 'string',
      isNotEmptyString: true,
      allowNull: true,
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    cardId: {
      model: 'Card',
      required: true,
      columnName: 'card_id',
    },
    userId: {
      model: 'User',
      required: true,
      columnName: 'user_id',
    },
  },

  tableName: 'card_reminder',
};
