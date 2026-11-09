/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /project-sections/{id}:
 *   delete:
 *     summary: Delete project section
 *     description: Deletes a company-wide project section; its projects become unsorted. Requires admin privileges.
 *     tags:
 *       - Project Sections
 *     operationId: deleteProjectSection
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the project section to delete
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     responses:
 *       200:
 *         description: Project section deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - item
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/ProjectSection'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

const { idInput } = require('../../../utils/inputs');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  PROJECT_SECTION_NOT_FOUND: {
    projectSectionNotFound: 'Project section not found',
  },
};

module.exports = {
  inputs: {
    id: {
      ...idInput,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    projectSectionNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    if (currentUser.role !== User.Roles.ADMIN) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    let projectSection = await ProjectSection.qm.getOneById(inputs.id);

    if (!projectSection) {
      throw Errors.PROJECT_SECTION_NOT_FOUND;
    }

    projectSection = await sails.helpers.projectSections.deleteOne.with({
      record: projectSection,
      actorUser: currentUser,
      request: this.req,
    });

    if (!projectSection) {
      throw Errors.PROJECT_SECTION_NOT_FOUND;
    }

    return {
      item: projectSection,
    };
  },
};
