/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: personal card reminders (always scoped to the current user by the server)

import socket from './socket';

const getCardReminders = (cardId, headers) =>
  socket.get(`/cards/${cardId}/card-reminders`, undefined, headers);

const createCardReminder = (cardId, data, headers) =>
  socket.post(`/cards/${cardId}/card-reminders`, data, headers);

const updateCardReminder = (id, data, headers) =>
  socket.patch(`/card-reminders/${id}`, data, headers);

const deleteCardReminder = (id, headers) =>
  socket.delete(`/card-reminders/${id}`, undefined, headers);

export default {
  getCardReminders,
  createCardReminder,
  updateCardReminder,
  deleteCardReminder,
};
