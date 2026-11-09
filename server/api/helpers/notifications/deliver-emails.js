/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: sends notification emails to one user, or holds them in held_email when the user has
// quiet hours on and it is outside the working window (they are bundled by the scheduler later).

const {
  normalize: normalizeNotificationSettings,
} = require('../../../utils/notification-settings');
const { isWorkingTime } = require('../../../utils/zoned-time');

module.exports = {
  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
    emails: {
      type: 'ref', // [{ subject, html }]
      required: true,
    },
    now: {
      type: 'ref',
    },
    ignoreQuietHours: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  async fn(inputs) {
    const { user, emails } = inputs;

    if (emails.length === 0 || !user.email) {
      return 'skipped';
    }

    const { transporter } = await sails.helpers.utils.makeSmtpTransporter();

    if (!transporter) {
      return 'skipped';
    }

    const now = inputs.now ? new Date(inputs.now) : new Date();
    const { quietHours } = normalizeNotificationSettings(user.notificationSettings);

    if (quietHours && !inputs.ignoreQuietHours && !isWorkingTime(now)) {
      transporter.close();

      const createdAt = now.toISOString();

      // eslint-disable-next-line no-restricted-syntax
      for (const email of emails) {
        // eslint-disable-next-line no-await-in-loop
        await sails.sendNativeQuery(
          'INSERT INTO held_email (user_id, subject, html, created_at) VALUES ($1, $2, $3, $4)',
          [user.id, email.subject, email.html, createdAt],
        );
      }

      return 'held';
    }

    try {
      await Promise.all(
        emails.map((email) =>
          sails.helpers.utils.sendEmail.with({
            transporter,
            to: user.email,
            subject: email.subject,
            html: email.html,
          }),
        ),
      );
    } finally {
      transporter.close();
    }

    return 'sent';
  },
};
