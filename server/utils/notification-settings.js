/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: per-user notification settings. Stored as jsonb on user_account (null = defaults).

const Events = {
  ADDED_TO_CARD: 'addedToCard',
  MENTIONED: 'mentioned',
  COMMENT_ON_SUBSCRIBED: 'commentOnSubscribed',
  MOVED_SUBSCRIBED: 'movedSubscribed',
  COMPLETED_SUBSCRIBED: 'completedSubscribed',
  DUE_DATE_CHANGED: 'dueDateChanged',
  DUE_SOON: 'dueSoon',
  OVERDUE: 'overdue',
  ADDED_TO_PROJECT_OR_BOARD: 'addedToProjectOrBoard',
  NEW_CARD_ON_SUBSCRIBED_BOARD: 'newCardOnSubscribedBoard',
  REMINDER: 'reminder',
};

const DEFAULT_EVENTS = {
  [Events.ADDED_TO_CARD]: { inApp: true, email: true },
  [Events.MENTIONED]: { inApp: true, email: true },
  [Events.COMMENT_ON_SUBSCRIBED]: { inApp: true, email: false },
  [Events.MOVED_SUBSCRIBED]: { inApp: true, email: false },
  [Events.COMPLETED_SUBSCRIBED]: { inApp: true, email: false },
  [Events.DUE_DATE_CHANGED]: { inApp: true, email: true },
  [Events.DUE_SOON]: { inApp: true, email: true },
  [Events.OVERDUE]: { inApp: true, email: true },
  [Events.ADDED_TO_PROJECT_OR_BOARD]: { inApp: true, email: true },
  [Events.NEW_CARD_ON_SUBSCRIBED_BOARD]: { inApp: true, email: false },
  [Events.REMINDER]: { inApp: true, email: true },
};

const DueReminderOffsets = {
  HOUR_1: '1h',
  DAY_1: '1d',
  DAYS_2: '2d',
};

const DUE_REMINDER_OFFSET_MS = {
  [DueReminderOffsets.HOUR_1]: 60 * 60 * 1000,
  [DueReminderOffsets.DAY_1]: 24 * 60 * 60 * 1000,
  [DueReminderOffsets.DAYS_2]: 2 * 24 * 60 * 60 * 1000,
};

const MAX_DUE_REMINDER_OFFSET_MS = Math.max(...Object.values(DUE_REMINDER_OFFSET_MS));

const Digests = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
};

const DEFAULT_SETTINGS = {
  events: DEFAULT_EVENTS,
  dueReminderOffset: DueReminderOffsets.DAY_1,
  digest: Digests.NONE,
  quietHours: false,
};

const CHANNELS = ['inApp', 'email'];

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// Always returns a complete settings object, filling anything missing or invalid with defaults
const normalize = (settings) => {
  const source = isPlainObject(settings) ? settings : {};
  const sourceEvents = isPlainObject(source.events) ? source.events : {};

  const events = Object.keys(DEFAULT_EVENTS).reduce((result, key) => {
    const sourceEvent = isPlainObject(sourceEvents[key]) ? sourceEvents[key] : {};

    return {
      ...result,
      [key]: CHANNELS.reduce(
        (channels, channel) => ({
          ...channels,
          [channel]:
            typeof sourceEvent[channel] === 'boolean'
              ? sourceEvent[channel]
              : DEFAULT_EVENTS[key][channel],
        }),
        {},
      ),
    };
  }, {});

  return {
    events,
    dueReminderOffset: Object.values(DueReminderOffsets).includes(source.dueReminderOffset)
      ? source.dueReminderOffset
      : DEFAULT_SETTINGS.dueReminderOffset,
    digest: Object.values(Digests).includes(source.digest)
      ? source.digest
      : DEFAULT_SETTINGS.digest,
    quietHours:
      typeof source.quietHours === 'boolean' ? source.quietHours : DEFAULT_SETTINGS.quietHours,
  };
};

// Strict check of a (possibly partial) settings patch sent by a client
const isValidPatch = (value) => {
  if (!isPlainObject(value)) {
    return false;
  }

  const allowedKeys = ['events', 'dueReminderOffset', 'digest', 'quietHours'];

  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    return false;
  }

  if (value.events !== undefined) {
    if (!isPlainObject(value.events)) {
      return false;
    }

    const isEventsValid = Object.entries(value.events).every(
      ([key, channels]) =>
        Object.prototype.hasOwnProperty.call(DEFAULT_EVENTS, key) &&
        isPlainObject(channels) &&
        Object.entries(channels).every(
          ([channel, enabled]) => CHANNELS.includes(channel) && typeof enabled === 'boolean',
        ),
    );

    if (!isEventsValid) {
      return false;
    }
  }

  if (
    value.dueReminderOffset !== undefined &&
    !Object.values(DueReminderOffsets).includes(value.dueReminderOffset)
  ) {
    return false;
  }

  if (value.digest !== undefined && !Object.values(Digests).includes(value.digest)) {
    return false;
  }

  if (value.quietHours !== undefined && typeof value.quietHours !== 'boolean') {
    return false;
  }

  return true;
};

const merge = (settings, patch) => {
  const current = normalize(settings);

  const events = { ...current.events };
  if (patch.events) {
    Object.entries(patch.events).forEach(([key, channels]) => {
      events[key] = {
        ...events[key],
        ...channels,
      };
    });
  }

  return normalize({
    ...current,
    ...patch,
    events,
  });
};

const getChannels = (settings, eventKey) => {
  const { events } = normalize(settings);

  return events[eventKey] || { inApp: true, email: false };
};

module.exports = {
  Events,
  DEFAULT_EVENTS,
  DEFAULT_SETTINGS,
  DueReminderOffsets,
  DUE_REMINDER_OFFSET_MS,
  MAX_DUE_REMINDER_OFFSET_MS,
  Digests,
  normalize,
  isValidPatch,
  merge,
  getChannels,
};
