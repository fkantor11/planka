/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { call, put, select } from 'redux-saga/effects';

import request from '../request';
import selectors from '../../../selectors';
import actions from '../../../actions';
import api from '../../../api';
import { createLocalId } from '../../../utils/local-id';

// SPECIAL1: company-wide project sections, managed by admins

export function* createProjectSection(data) {
  const localId = yield call(createLocalId);
  const position = yield select(selectors.selectNextProjectSectionPosition);

  const nextData = {
    position,
    ...data,
  };

  yield put(
    actions.createProjectSection({
      ...nextData,
      id: localId,
    }),
  );

  let projectSection;
  try {
    ({ item: projectSection } = yield call(request, api.createProjectSection, nextData));
  } catch (error) {
    yield put(actions.createProjectSection.failure(localId, error));
    return;
  }

  yield put(actions.createProjectSection.success(localId, projectSection));
}

export function* handleProjectSectionCreate(projectSection) {
  yield put(actions.handleProjectSectionCreate(projectSection));
}

export function* updateProjectSection(id, data) {
  yield put(actions.updateProjectSection(id, data));

  let projectSection;
  try {
    ({ item: projectSection } = yield call(request, api.updateProjectSection, id, data));
  } catch (error) {
    yield put(actions.updateProjectSection.failure(id, error));
    return;
  }

  yield put(actions.updateProjectSection.success(projectSection));
}

export function* moveProjectSection(id, index) {
  const position = yield select(selectors.selectNextProjectSectionPosition, index, id);

  yield call(updateProjectSection, id, {
    position,
  });
}

export function* handleProjectSectionUpdate(projectSection) {
  yield put(actions.handleProjectSectionUpdate(projectSection));
}

export function* deleteProjectSection(id) {
  yield put(actions.deleteProjectSection(id));

  let projectSection;
  try {
    ({ item: projectSection } = yield call(request, api.deleteProjectSection, id));
  } catch (error) {
    yield put(actions.deleteProjectSection.failure(id, error));
    return;
  }

  yield put(actions.deleteProjectSection.success(projectSection));
}

export function* handleProjectSectionDelete(projectSection) {
  yield put(actions.handleProjectSectionDelete(projectSection));
}

export default {
  createProjectSection,
  handleProjectSectionCreate,
  updateProjectSection,
  moveProjectSection,
  handleProjectSectionUpdate,
  deleteProjectSection,
  handleProjectSectionDelete,
};
