/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import ActionTypes from '../constants/ActionTypes';

const createProjectSection = (projectSection) => ({
  type: ActionTypes.PROJECT_SECTION_CREATE,
  payload: {
    projectSection,
  },
});

createProjectSection.success = (localId, projectSection) => ({
  type: ActionTypes.PROJECT_SECTION_CREATE__SUCCESS,
  payload: {
    localId,
    projectSection,
  },
});

createProjectSection.failure = (localId, error) => ({
  type: ActionTypes.PROJECT_SECTION_CREATE__FAILURE,
  payload: {
    localId,
    error,
  },
});

const handleProjectSectionCreate = (projectSection) => ({
  type: ActionTypes.PROJECT_SECTION_CREATE_HANDLE,
  payload: {
    projectSection,
  },
});

const updateProjectSection = (id, data) => ({
  type: ActionTypes.PROJECT_SECTION_UPDATE,
  payload: {
    id,
    data,
  },
});

updateProjectSection.success = (projectSection) => ({
  type: ActionTypes.PROJECT_SECTION_UPDATE__SUCCESS,
  payload: {
    projectSection,
  },
});

updateProjectSection.failure = (id, error) => ({
  type: ActionTypes.PROJECT_SECTION_UPDATE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleProjectSectionUpdate = (projectSection) => ({
  type: ActionTypes.PROJECT_SECTION_UPDATE_HANDLE,
  payload: {
    projectSection,
  },
});

const deleteProjectSection = (id) => ({
  type: ActionTypes.PROJECT_SECTION_DELETE,
  payload: {
    id,
  },
});

deleteProjectSection.success = (projectSection) => ({
  type: ActionTypes.PROJECT_SECTION_DELETE__SUCCESS,
  payload: {
    projectSection,
  },
});

deleteProjectSection.failure = (id, error) => ({
  type: ActionTypes.PROJECT_SECTION_DELETE__FAILURE,
  payload: {
    id,
    error,
  },
});

const handleProjectSectionDelete = (projectSection) => ({
  type: ActionTypes.PROJECT_SECTION_DELETE_HANDLE,
  payload: {
    projectSection,
  },
});

export default {
  createProjectSection,
  handleProjectSectionCreate,
  updateProjectSection,
  handleProjectSectionUpdate,
  deleteProjectSection,
  handleProjectSectionDelete,
};
