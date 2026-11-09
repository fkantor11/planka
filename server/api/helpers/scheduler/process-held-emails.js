/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: inside the working window, emails held by quiet hours are sent as one bundle per
// user. Rows are claimed with DELETE ... RETURNING, so a bundle is sent once.

const escapeHtml = require('escape-html');

const { isWorkingTime } = require('../../../utils/zoned-time');

module.exports = {
  inputs: {
    now: {
      type: 'ref',
      required: true,
    },
  },

  async fn(inputs) {
    const now = new Date(inputs.now);

    if (!isWorkingTime(now)) {
      return 0;
    }

    const usersResult = await sails.sendNativeQuery('SELECT DISTINCT user_id FROM held_email');

    if (usersResult.rows.length === 0) {
      return 0;
    }

    const { transporter } = await sails.helpers.utils.makeSmtpTransporter();

    if (!transporter) {
      return 0; // Keep them until SMTP works again
    }

    transporter.close();

    let sent = 0;

    /* eslint-disable no-await-in-loop */
    // eslint-disable-next-line no-restricted-syntax
    for (const { user_id: userId } of usersResult.rows) {
      const user = await User.qm.getOneById(userId, {
        withDeactivated: false,
      });

      const claimResult = await sails.sendNativeQuery(
        'DELETE FROM held_email WHERE user_id = $1 RETURNING subject, html, created_at',
        [userId],
      );

      const heldEmails = _.sortBy(claimResult.rows, (row) => new Date(row.created_at).getTime());

      if (user && heldEmails.length > 0) {
        const t = sails.helpers.utils.makeTranslator(user.language);

        const html = [
          `<p>${escapeHtml(t('These emails were held outside working hours:'))}</p>`,
          ...heldEmails.map(
            (heldEmail) => `<hr><h3>${escapeHtml(heldEmail.subject)}</h3>${heldEmail.html}`,
          ),
        ].join('');

        await sails.helpers.notifications.deliverEmails.with({
          user,
          now,
          ignoreQuietHours: true,
          emails: [
            {
              html,
              subject: t('Notifications From Outside Working Hours (%s)', heldEmails.length),
            },
          ],
        });

        sent += 1;
      }
    }
    /* eslint-enable no-await-in-loop */

    return sent;
  },
};
