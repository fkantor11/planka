/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import EntryActionTypes from '../constants/EntryActionTypes';

const createProjectSection = (data) => ({
  type: EntryActionTypes.PROJECT_SECTION_CREATE,
  payload: {
    data,
  },
});

const handleProjectSectionCreate = (projectSection) => ({
  type: EntryActionTypes.PROJECT_SECTION_CREATE_HANDLE,
  payload: {
    projectSection,
  },
});

const updateProjectSection = (id, data) => ({
  type: EntryActionTypes.PROJECT_SECTION_UPDATE,
  payload: {
    id,
    data,
  },
});

const handleProjectSectionUpdate = (projectSection) => ({
  type: EntryActionTypes.PROJECT_SECTION_UPDATE_HANDLE,
  payload: {
    projectSection,
  },
});

const moveProjectSection = (id, index) => ({
  type: EntryActionTypes.PROJECT_SECTION_MOVE,
  payload: {
    id,
    index,
  },
});

const deleteProjectSection = (id) => ({
  type: EntryActionTypes.PROJECT_SECTION_DELETE,
  payload: {
    id,
  },
});

const handleProjectSectionDelete = (projectSection) => ({
  type: EntryActionTypes.PROJECT_SECTION_DELETE_HANDLE,
  payload: {
    projectSection,
  },
});

export default {
  createProjectSection,
  handleProjectSectionCreate,
  updateProjectSection,
  handleProjectSectionUpdate,
  moveProjectSection,
  deleteProjectSection,
  handleProjectSectionDelete,
};
