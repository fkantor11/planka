/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { attr } from 'redux-orm';

import BaseModel from './BaseModel';
import ActionTypes from '../constants/ActionTypes';

// SPECIAL1: company-wide sections the home page groups projects into
export default class extends BaseModel {
  static modelName = 'ProjectSection';

  static fields = {
    id: attr(),
    name: attr(),
    position: attr(),
  };

  static reducer({ type, payload }, ProjectSection, { Project }) {
    switch (type) {
      case ActionTypes.SOCKET_RECONNECT_HANDLE:
        ProjectSection.all().delete();

        if (payload.projectSections) {
          payload.projectSections.forEach((projectSection) => {
            ProjectSection.upsert(projectSection);
          });
        }

        break;
      case ActionTypes.CORE_INITIALIZE:
        if (payload.projectSections) {
          payload.projectSections.forEach((projectSection) => {
            ProjectSection.upsert(projectSection);
          });
        }

        break;
      case ActionTypes.PROJECT_SECTION_CREATE:
      case ActionTypes.PROJECT_SECTION_CREATE_HANDLE:
      case ActionTypes.PROJECT_SECTION_UPDATE__SUCCESS:
      case ActionTypes.PROJECT_SECTION_UPDATE_HANDLE:
        ProjectSection.upsert(payload.projectSection);

        break;
      case ActionTypes.PROJECT_SECTION_CREATE__SUCCESS:
        ProjectSection.withId(payload.localId).delete();
        ProjectSection.upsert(payload.projectSection);

        break;
      case ActionTypes.PROJECT_SECTION_CREATE__FAILURE:
        ProjectSection.withId(payload.localId).delete();

        break;
      case ActionTypes.PROJECT_SECTION_UPDATE:
        ProjectSection.withId(payload.id).update(payload.data);

        break;
      case ActionTypes.PROJECT_SECTION_DELETE:
      case ActionTypes.PROJECT_SECTION_DELETE__SUCCESS:
      case ActionTypes.PROJECT_SECTION_DELETE_HANDLE: {
        const id = payload.id || payload.projectSection.id;
        const projectSectionModel = ProjectSection.withId(id);

        if (projectSectionModel) {
          projectSectionModel.delete();
        }

        // Projects of a deleted section become unsorted, as on the server
        Project.filter({
          projectSectionId: id,
        }).update({
          projectSectionId: null,
        });

        break;
      }
      default:
    }
  }

  static getAllQuerySet() {
    return this.orderBy(['position', 'id.length', 'id']);
  }
}
