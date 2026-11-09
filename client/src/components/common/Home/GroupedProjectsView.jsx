/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { isUserAdminOrProjectOwner } from '../../../utils/record-helpers';
import { ProjectOrders, ProjectSections, ProjectTypes, UserRoles } from '../../../constants/Enums';
import { ProjectSectionIcons } from '../../../constants/Icons';
import Projects from './Projects';

// SPECIAL1: the grouped home view shows company-wide sections instead of ownership groups.
// Admins arrange projects by dragging them within and between sections.
const SECTIONS = [
  ProjectSections.SALES,
  ProjectSections.DELIVERY,
  ProjectSections.FINANCE,
  ProjectSections.MARKETING,
  ProjectSections.EVERYONE,
  ProjectSections.UNSORTED,
];

const GroupedProjectsView = React.memo(() => {
  const projectIdsBySection = useSelector(selectors.selectProjectIdsBySectionForCurrentUser);
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
    (id, section, index) => {
      dispatch(entryActions.moveProjectToSection(id, section, index));
    },
    [dispatch],
  );

  if (!projectIdsBySection) {
    return null;
  }

  return (
    <>
      {SECTIONS.map((section) => {
        const ids = projectIdsBySection[section];
        const isUnsorted = section === ProjectSections.UNSORTED;

        if (ids.length === 0 && !canArrange && !(isUnsorted && canAdd)) {
          return null;
        }

        return (
          <Projects
            key={section}
            ids={ids}
            title={`common.projectSection_${section}`}
            titleIcon={ProjectSectionIcons[section]}
            section={section}
            isSortable={canArrange}
            onMove={handleMove}
            onAdd={isUnsorted ? handleAdd : undefined}
          />
        );
      })}
    </>
  );
});

export default GroupedProjectsView;
