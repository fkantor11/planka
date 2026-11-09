/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

/**
 * @swagger
 * /project-sections:
 *   post:
 *     summary: Create project section
 *     description: Creates a company-wide section the home page groups projects into. Requires admin privileges.
 *     tags:
 *       - Project Sections
 *     operationId: createProjectSection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - position
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
 *         description: Project section created successfully
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
 */

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
};

module.exports = {
  inputs: {
    name: {
      type: 'string',
      isNotEmptyString: true,
      maxLength: 128,
      required: true,
    },
    position: {
      type: 'number',
      min: 0,
      required: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
  },

  async fn(inputs) {
    const { currentUser } = this.req;

    // SPECIAL1: sections are shared by everyone, so only admins manage them
    if (currentUser.role !== User.Roles.ADMIN) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const values = _.pick(inputs, ['name', 'position']);

    const projectSection = await sails.helpers.projectSections.createOne.with({
      values,
      actorUser: currentUser,
      request: this.req,
    });

    return {
      item: projectSection,
    };
  },
};
