/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: per-user notification settings, personal recurring card reminders and the bookkeeping
// the scheduler needs to send due date reminders, digests and held (quiet hours) emails only once.

module.exports.up = async (knex) => {
  await knex.schema.alterTable('user_account', (table) => {
    /* Columns */

    table.jsonb('notification_settings');
    table.timestamp('last_digest_at', true);
  });

  // Notifications about being added to a project or a board have no card (and the project one no
  // board either)
  await knex.schema.alterTable('notification', (table) => {
    table.bigInteger('board_id').nullable().alter();
    table.bigInteger('card_id').nullable().alter();
  });

  await knex.schema.createTable('card_reminder', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('card_id').notNullable();
    table.bigInteger('user_id').notNullable();

    table.timestamp('next_at', true).notNullable();
    // The first chosen occurrence, keeps the time of day and the day of month of the series
    table.timestamp('anchor_at', true).notNullable();
    table.text('repeat').notNullable();
    table.text('note');

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('card_id');
    table.index('user_id');
    table.index('next_at');
  });

  // One row per (kind, card, user, due date) that was already notified, e.g. dueSoon / overdue
  await knex.schema.createTable('notification_marker', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.text('kind').notNullable();
    table.bigInteger('card_id').notNullable();
    table.bigInteger('user_id').notNullable();
    table.timestamp('for_date', true).notNullable();

    table.timestamp('created_at', true);

    /* Indexes */

    table.unique(['kind', 'card_id', 'user_id', 'for_date']);
    table.index('card_id');
    table.index('user_id');
  });

  // Emails held back by quiet hours, sent as one bundle at the start of the next working window
  return knex.schema.createTable('held_email', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.bigInteger('user_id').notNullable();
    table.text('subject').notNullable();
    table.text('html').notNullable();

    table.timestamp('created_at', true);

    /* Indexes */

    table.index('user_id');
  });
};

module.exports.down = async (knex) => {
  await knex.schema.dropTable('held_email');
  await knex.schema.dropTable('notification_marker');
  await knex.schema.dropTable('card_reminder');

  await knex('notification').whereNull('card_id').orWhereNull('board_id').delete();

  await knex.schema.alterTable('notification', (table) => {
    table.bigInteger('board_id').notNullable().alter();
    table.bigInteger('card_id').notNullable().alter();
  });

  return knex.schema.alterTable('user_account', (table) => {
    table.dropColumn('notification_settings');
    table.dropColumn('last_digest_at');
  });
};
