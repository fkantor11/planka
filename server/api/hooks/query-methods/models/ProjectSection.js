/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/* Query methods */

const createOne = (values) => ProjectSection.create({ ...values }).fetch();

const getAll = () => ProjectSection.find().sort([{ position: 'ASC' }, { id: 'ASC' }]);

const getOneById = (id) => ProjectSection.findOne(id);

const updateOne = (criteria, values) => ProjectSection.updateOne(criteria).set({ ...values });

// Projects of a deleted section become unsorted
const deleteOne = (id) =>
  sails.getDatastore().transaction(async (db) => {
    const projects = await Project.update({
      projectSectionId: id,
    })
      .set({
        projectSectionId: null,
      })
      .fetch()
      .usingConnection(db);

    const projectSection = await ProjectSection.destroyOne(id).usingConnection(db);

    return { projectSection, projects };
  });

module.exports = {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne,
};
