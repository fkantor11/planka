/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: one scheduler run. A Postgres session advisory lock (held on a leased connection)
// makes sure only one server process runs the jobs at a time; each job is idempotent on its own
// as well (markers / compare-and-set), so a crash in the middle never double-sends.

const LOCK_KEY = 461700001;

const JOBS = [
  ['reminders', 'processReminders'],
  ['dueDates', 'processDueDates'],
  ['digests', 'processDigests'],
  ['heldEmails', 'processHeldEmails'],
];

module.exports = {
  inputs: {
    now: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const now = inputs.now ? new Date(inputs.now) : new Date();

    return sails.getDatastore().leaseConnection(async (db) => {
      const lockResult = await sails
        .sendNativeQuery('SELECT pg_try_advisory_lock($1) AS locked', [LOCK_KEY])
        .usingConnection(db);

      if (!lockResult.rows[0].locked) {
        return {
          locked: false,
        };
      }

      const result = {
        locked: true,
      };

      try {
        /* eslint-disable no-await-in-loop */
        // eslint-disable-next-line no-restricted-syntax
        for (const [name, helperName] of JOBS) {
          try {
            result[name] = await sails.helpers.scheduler[helperName].with({
              now,
            });
          } catch (error) {
            sails.log.error(`Scheduler job ${name} failed: ${error}`);
            result[name] = 'error';
          }
        }
        /* eslint-enable no-await-in-loop */
      } finally {
        await sails
          .sendNativeQuery('SELECT pg_advisory_unlock($1)', [LOCK_KEY])
          .usingConnection(db);
      }

      return result;
    });
  },
};
