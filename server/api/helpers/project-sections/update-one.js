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
    values: {
      type: 'json',
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
    const projectSection = await ProjectSection.qm.updateOne(inputs.record.id, inputs.values);

    if (projectSection) {
      await sails.helpers.projectSections.broadcast.with({
        event: 'projectSectionUpdate',
        data: {
          item: projectSection,
        },
        request: inputs.request,
      });
    }

    return projectSection;
  },
};
