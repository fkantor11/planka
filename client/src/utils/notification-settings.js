/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: per-user notification settings (mirrors server/utils/notification-settings.js)

export const NotificationEventKeys = {
  ADDED_TO_CARD: 'addedToCard',
  MENTIONED: 'mentioned',
  COMMENT_ON_SUBSCRIBED: 'commentOnSubscribed',
  MOVED_SUBSCRIBED: 'movedSubscribed',
  COMPLETED_SUBSCRIBED: 'completedSubscribed',
  DUE_DATE_CHANGED: 'dueDateChanged',
  DUE_SOON: 'dueSoon',
  OVERDUE: 'overdue',
  REMINDER: 'reminder',
  ADDED_TO_PROJECT_OR_BOARD: 'addedToProjectOrBoard',
  NEW_CARD_ON_SUBSCRIBED_BOARD: 'newCardOnSubscribedBoard',
};

export const NotificationChannels = {
  IN_APP: 'inApp',
  EMAIL: 'email',
};

export const DueReminderOffsets = {
  HOUR_1: '1h',
  DAY_1: '1d',
  DAYS_2: '2d',
};

export const Digests = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
};

// Rows of the settings table, in display order
export const NOTIFICATION_EVENT_GROUPS = [
  {
    key: 'myCards',
    eventKeys: [
      NotificationEventKeys.ADDED_TO_CARD,
      NotificationEventKeys.MENTIONED,
      NotificationEventKeys.COMMENT_ON_SUBSCRIBED,
      NotificationEventKeys.MOVED_SUBSCRIBED,
      NotificationEventKeys.COMPLETED_SUBSCRIBED,
    ],
  },
  {
    key: 'dueDates',
    eventKeys: [
      NotificationEventKeys.DUE_DATE_CHANGED,
      NotificationEventKeys.DUE_SOON,
      NotificationEventKeys.OVERDUE,
      NotificationEventKeys.REMINDER,
    ],
  },
  {
    key: 'projectsAndBoards',
    eventKeys: [
      NotificationEventKeys.ADDED_TO_PROJECT_OR_BOARD,
      NotificationEventKeys.NEW_CARD_ON_SUBSCRIBED_BOARD,
    ],
  },
];

const DEFAULT_EVENTS = {
  [NotificationEventKeys.ADDED_TO_CARD]: { inApp: true, email: true },
  [NotificationEventKeys.MENTIONED]: { inApp: true, email: true },
  [NotificationEventKeys.COMMENT_ON_SUBSCRIBED]: { inApp: true, email: false },
  [NotificationEventKeys.MOVED_SUBSCRIBED]: { inApp: true, email: false },
  [NotificationEventKeys.COMPLETED_SUBSCRIBED]: { inApp: true, email: false },
  [NotificationEventKeys.DUE_DATE_CHANGED]: { inApp: true, email: true },
  [NotificationEventKeys.DUE_SOON]: { inApp: true, email: true },
  [NotificationEventKeys.OVERDUE]: { inApp: true, email: true },
  [NotificationEventKeys.REMINDER]: { inApp: true, email: true },
  [NotificationEventKeys.ADDED_TO_PROJECT_OR_BOARD]: { inApp: true, email: true },
  [NotificationEventKeys.NEW_CARD_ON_SUBSCRIBED_BOARD]: { inApp: true, email: false },
};

export const DEFAULT_NOTIFICATION_SETTINGS = {
  events: DEFAULT_EVENTS,
  dueReminderOffset: DueReminderOffsets.DAY_1,
  digest: Digests.NONE,
  quietHours: false,
};

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const normalizeNotificationSettings = (settings) => {
  const source = isPlainObject(settings) ? settings : {};
  const sourceEvents = isPlainObject(source.events) ? source.events : {};

  const events = Object.keys(DEFAULT_EVENTS).reduce((result, key) => {
    const sourceEvent = isPlainObject(sourceEvents[key]) ? sourceEvents[key] : {};

    return {
      ...result,
      [key]: Object.values(NotificationChannels).reduce(
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
      : DEFAULT_NOTIFICATION_SETTINGS.dueReminderOffset,
    digest: Object.values(Digests).includes(source.digest)
      ? source.digest
      : DEFAULT_NOTIFICATION_SETTINGS.digest,
    quietHours:
      typeof source.quietHours === 'boolean'
        ? source.quietHours
        : DEFAULT_NOTIFICATION_SETTINGS.quietHours,
  };
};

// Complete settings with one event channel changed (the whole object is sent, so the optimistic
// update of the current user stays complete)
export const setNotificationEventChannel = (settings, eventKey, channel, value) => {
  const normalized = normalizeNotificationSettings(settings);

  return {
    ...normalized,
    events: {
      ...normalized.events,
      [eventKey]: {
        ...normalized.events[eventKey],
        [channel]: value,
      },
    },
  };
};

export const setNotificationOption = (settings, name, value) => ({
  ...normalizeNotificationSettings(settings),
  [name]: value,
});
