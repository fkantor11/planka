/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: helpers for personal card reminders

export const ReminderRepeats = {
  NONE: 'none',
  DAILY: 'daily',
  WORKDAYS: 'workdays',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const REMINDER_REPEAT_ORDER = [
  ReminderRepeats.NONE,
  ReminderRepeats.DAILY,
  ReminderRepeats.WORKDAYS,
  ReminderRepeats.WEEKLY,
  ReminderRepeats.MONTHLY,
];

const pad = (value) => String(value).padStart(2, '0');

// Values for <input type="date"> / <input type="time"> in local time
export const toDateInputValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const toTimeInputValue = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// Tomorrow at 9:00 local time
export const getDefaultReminderInput = (now = new Date()) => {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);

  return {
    date: toDateInputValue(date),
    time: toTimeInputValue(date),
  };
};

// Local date ("2026-11-10") + time ("09:30") -> Date, or null when invalid
export const parseReminderInput = (dateValue, timeValue) => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || '');
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeValue || '');

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const [year, month, day] = dateMatch.slice(1).map(Number);
  const [hours, minutes] = timeMatch.slice(1).map(Number);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
};

export const sortReminders = (reminders) =>
  [...reminders].sort((a, b) => new Date(a.nextAt).getTime() - new Date(b.nextAt).getTime());
