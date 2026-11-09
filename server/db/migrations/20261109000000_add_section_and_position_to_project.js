/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: projects can be sorted into company-wide sections (sales, delivery, ...) and ordered
// within them by an admin. Both are optional: a project with no section is shown as unsorted, one
// with no position comes after the ordered ones.
module.exports.up = async (knex) => {
  await knex.schema.alterTable('project', (table) => {
    table.text('section');
    table.specificType('position', 'double precision');
  });
};

module.exports.down = async (knex) => {
  await knex.schema.alterTable('project', (table) => {
    table.dropColumn('section');
    table.dropColumn('position');
  });
};
