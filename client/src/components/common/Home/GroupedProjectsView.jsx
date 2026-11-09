/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { isUserAdminOrProjectOwner } from '../../../utils/record-helpers';
import { ProjectOrders, ProjectTypes, UserRoles } from '../../../constants/Enums';
import Projects from './Projects';

// SPECIAL1: the grouped home view shows the company-wide sections (managed by admins) instead of
// ownership groups, followed by the unsorted projects. Admins arrange projects by dragging them
// within and between sections.
const GroupedProjectsView = React.memo(() => {
  const groups = useSelector(selectors.selectProjectIdsBySectionForCurrentUser);
  const projectsSearch = useSelector(selectors.selectProjectsSearch);
  const projectsOrder = useSelector(selectors.selectProjectsOrder);

  const canAdd = useSelector((state) =>
    isUserAdminOrProjectOwner(selectors.selectCurrentUser(state)),
  );

  const isAdmin = useSelector(
    (state) => selectors.selectCurrentUser(state).role === UserRoles.ADMIN,
  );

  // Dragging only makes sense while the arranged order is shown in full
  const canArrange = isAdmin && !projectsSearch && projectsOrder === ProjectOrders.BY_DEFAULT;

  const dispatch = useDispatch();

  const handleAdd = useCallback(() => {
    dispatch(entryActions.openAddProjectModal(ProjectTypes.SHARED));
  }, [dispatch]);

  const handleMove = useCallback(
    (id, sectionId, index) => {
      dispatch(entryActions.moveProjectToSection(id, sectionId, index));
    },
    [dispatch],
  );

  if (!groups) {
    return null;
  }

  return (
    <>
      {groups.map((group) => {
        if (group.projectIds.length === 0 && !canArrange && !(group.isUnsorted && canAdd)) {
          return null;
        }

        return (
          <Projects
            key={group.id}
            ids={group.projectIds}
            title={group.isUnsorted ? 'common.projectSection_unsorted' : undefined}
            titleText={group.isUnsorted ? undefined : group.name}
            titleIcon={group.isUnsorted ? 'inbox' : 'folder outline'}
            section={group.id}
            isSortable={canArrange}
            onMove={handleMove}
            onAdd={group.isUnsorted ? handleAdd : undefined}
          />
        );
      })}
    </>
  );
});

export default GroupedProjectsView;
