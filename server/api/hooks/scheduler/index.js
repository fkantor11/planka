/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * scheduler hook
 *
 * @description :: SPECIAL1: runs time based notification jobs (card reminders, due soon / overdue,
 *                 digests, quiet hours bundles) every minute. See helpers/scheduler/tick.js.
 *                 SCHEDULER_DISABLED=true turns it off, SCHEDULER_INTERVAL_MS changes the period.
 * @docs        :: https://sailsjs.com/docs/concepts/extending-sails/hooks
 */

module.exports = function defineSchedulerHook(sails) {
  let isRunning = false;
  let interval = null;

  const tick = async (now) => {
    if (isRunning) {
      return {
        skipped: true,
      };
    }

    isRunning = true;

    try {
      return await sails.helpers.scheduler.tick.with({
        now,
      });
    } catch (error) {
      sails.log.error(`Scheduler tick failed: ${error}`);

      return {
        error: true,
      };
    } finally {
      isRunning = false;
    }
  };

  return {
    tick,

    /**
     * Runs when this Sails app loads/lifts.
     */

    async initialize() {
      sails.log.info('Initializing custom hook (`scheduler`)');

      // Tests run on sails-disk, which has no native queries / advisory locks
      if (process.env.SCHEDULER_DISABLED === 'true' || process.env.NODE_ENV === 'test') {
        return;
      }

      const intervalMs = parseInt(process.env.SCHEDULER_INTERVAL_MS, 10) || 60 * 1000;

      sails.on('lifted', () => {
        interval = setInterval(() => {
          tick();
        }, intervalMs);
      });

      sails.on('lower', () => {
        clearInterval(interval);
      });
    },
  };
};
