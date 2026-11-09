/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

module.exports = {
  inputs: {
    record: {
      type: 'ref',
      required: true,
    },
    actorUser: {
      type: 'ref',
      required: true,
    },
    request: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    const { projectSection } = await ProjectSection.qm.deleteOne(inputs.record.id);

    if (projectSection) {
      // Clients move the projects of the deleted section to unsorted themselves
      await sails.helpers.projectSections.broadcast.with({
        event: 'projectSectionDelete',
        data: {
          item: projectSection,
        },
        request: inputs.request,
      });
    }

    return projectSection;
  },
};
