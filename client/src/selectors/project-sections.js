/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { createSelector } from 'redux-orm';

import orm from '../orm';
import { isLocalId } from '../utils/local-id';

// SPECIAL1

export const makeSelectProjectSectionById = () =>
  createSelector(
    orm,
    (_, id) => id,
    ({ ProjectSection }, id) => {
      const projectSectionModel = ProjectSection.withId(id);

      if (!projectSectionModel) {
        return projectSectionModel;
      }

      return {
        ...projectSectionModel.ref,
        isPersisted: !isLocalId(projectSectionModel.id),
      };
    },
  );

export const selectProjectSectionById = makeSelectProjectSectionById();

export const selectProjectSections = createSelector(orm, ({ ProjectSection }) =>
  ProjectSection.getAllQuerySet()
    .toRefArray()
    .map((projectSection) => ({
      ...projectSection,
      isPersisted: !isLocalId(projectSection.id),
    })),
);

export const selectProjectSectionIds = createSelector(orm, ({ ProjectSection }) =>
  ProjectSection.getAllQuerySet()
    .toRefArray()
    .map((projectSection) => projectSection.id),
);

export default {
  makeSelectProjectSectionById,
  selectProjectSectionById,
  selectProjectSections,
  selectProjectSectionIds,
};
