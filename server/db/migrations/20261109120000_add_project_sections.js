/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: the company-wide home page sections become records that admins manage. The fixed
// sections of the previous migration become the default records, and projects keep their section.

const POSITION_GAP = 65536;

const DEFAULT_SECTIONS = [
  { key: 'sales', name: 'Obchod' },
  { key: 'delivery', name: 'Delivery' },
  { key: 'finance', name: 'Finance' },
  { key: 'marketing', name: 'Marketing' },
  { key: 'everyone', name: 'Pro všechny' },
];

module.exports.up = async (knex) => {
  await knex.schema.createTable('project_section', (table) => {
    /* Columns */

    table.bigInteger('id').primary().defaultTo(knex.raw('next_id()'));

    table.text('name').notNullable();
    table.specificType('position', 'double precision').notNullable();

    table.timestamp('created_at', true);
    table.timestamp('updated_at', true);

    /* Indexes */

    table.index('position');
  });

  await knex.schema.alterTable('project', (table) => {
    /* Columns */

    table
      .bigInteger('project_section_id')
      .references('id')
      .inTable('project_section')
      .onDelete('SET NULL');

    /* Indexes */

    table.index('project_section_id');
  });

  const now = new Date().toISOString();

  // eslint-disable-next-line no-restricted-syntax
  for (const [index, { key, name }] of DEFAULT_SECTIONS.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const [{ id }] = await knex('project_section')
      .insert({
        name,
        position: POSITION_GAP * (index + 1),
        created_at: now,
      })
      .returning('id');

    // eslint-disable-next-line no-await-in-loop
    await knex('project')
      .update({
        project_section_id: id,
      })
      .where('section', key);
  }

  await knex.schema.alterTable('project', (table) => {
    table.dropColumn('section');
  });
};

module.exports.down = async (knex) => {
  await knex.schema.alterTable('project', (table) => {
    table.text('section');
  });

  // Only the default sections can be expressed in the old fixed set, by name; projects of sections
  // created later become unsorted
  // eslint-disable-next-line no-restricted-syntax
  for (const { key, name } of DEFAULT_SECTIONS) {
    // eslint-disable-next-line no-await-in-loop
    await knex.raw(
      `UPDATE project SET section = ? FROM project_section
        WHERE project.project_section_id = project_section.id AND project_section.name = ?`,
      [key, name],
    );
  }

  await knex.schema.alterTable('project', (table) => {
    table.dropIndex('project_section_id');
    table.dropForeign('project_section_id');
    table.dropColumn('project_section_id');
  });

  await knex.schema.dropTable('project_section');
};
