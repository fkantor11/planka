/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /project-sections/{id}:
 *   patch:
 *     summary: Update project section
 *     description: Renames or moves a company-wide project section. Requires admin privileges.
 *     tags:
 *       - Project Sections
 *     operationId: updateProjectSection
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the project section to update
 *         schema:
 *           type: string
 *           example: "1357158568008091264"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 128
 *                 description: Name of the section
 *                 example: Sales
 *               position:
 *                 type: number
 *                 minimum: 0
 *                 description: Position of the section on the home page
 *                 example: 65536
 *     responses:
 *       200:
 *         description: Project section updated successfully
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
    name: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 128,
    },
    position: {
      type: 'number',
      min: 0,
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

    const values = _.pick(inputs, ['name', 'position']);

    projectSection = await sails.helpers.projectSections.updateOne.with({
      values,
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
