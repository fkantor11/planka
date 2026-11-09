/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import socket from './socket';

/* Actions */

// SPECIAL1: the list itself comes included with GET /projects

const createProjectSection = (data, headers) => socket.post('/project-sections', data, headers);

const updateProjectSection = (id, data, headers) =>
  socket.patch(`/project-sections/${id}`, data, headers);

const deleteProjectSection = (id, headers) =>
  socket.delete(`/project-sections/${id}`, undefined, headers);

export default {
  createProjectSection,
  updateProjectSection,
  deleteProjectSection,
};
