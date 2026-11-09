/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { all, takeEvery } from 'redux-saga/effects';

import services from '../services';
import EntryActionTypes from '../../../constants/EntryActionTypes';

export default function* projectSectionsWatchers() {
  yield all([
    takeEvery(EntryActionTypes.PROJECT_SECTION_CREATE, ({ payload: { data } }) =>
      services.createProjectSection(data),
    ),
    takeEvery(EntryActionTypes.PROJECT_SECTION_CREATE_HANDLE, ({ payload: { projectSection } }) =>
      services.handleProjectSectionCreate(projectSection),
    ),
    takeEvery(EntryActionTypes.PROJECT_SECTION_UPDATE, ({ payload: { id, data } }) =>
      services.updateProjectSection(id, data),
    ),
    takeEvery(EntryActionTypes.PROJECT_SECTION_UPDATE_HANDLE, ({ payload: { projectSection } }) =>
      services.handleProjectSectionUpdate(projectSection),
    ),
    takeEvery(EntryActionTypes.PROJECT_SECTION_MOVE, ({ payload: { id, index } }) =>
      services.moveProjectSection(id, index),
    ),
    takeEvery(EntryActionTypes.PROJECT_SECTION_DELETE, ({ payload: { id } }) =>
      services.deleteProjectSection(id),
    ),
    takeEvery(EntryActionTypes.PROJECT_SECTION_DELETE_HANDLE, ({ payload: { projectSection } }) =>
      services.handleProjectSectionDelete(projectSection),
    ),
  ]);
}
