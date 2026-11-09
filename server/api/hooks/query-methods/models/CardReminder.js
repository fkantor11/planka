/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

const defaultFind = (criteria) => CardReminder.find(criteria).sort([{ nextAt: 'ASC' }, 'id']);

/* Query methods */

const createOne = (values) => CardReminder.create({ ...values }).fetch();

const getByCardIdAndUserId = (cardId, userId) =>
  defaultFind({
    cardId,
    userId,
  });

const getOneById = (id, { userId } = {}) => {
  const criteria = {
    id,
  };

  if (userId) {
    criteria.userId = userId;
  }

  return CardReminder.findOne(criteria);
};

// Due reminders of open cards, oldest first
const getDue = async (now, limit = 100) => {
  const queryResult = await sails.sendNativeQuery(
    `
      SELECT card_reminder.id
      FROM card_reminder
      JOIN card ON card.id = card_reminder.card_id
      WHERE card_reminder.next_at <= $1 AND card.is_closed = FALSE
      ORDER BY card_reminder.next_at
      LIMIT $2
    `,
    [new Date(now).toISOString(), limit],
  );

  const ids = queryResult.rows.map(({ id }) => id);

  return ids.length > 0 ? defaultFind(ids) : [];
};

const updateOne = (criteria, values) => CardReminder.updateOne(criteria).set({ ...values });

// eslint-disable-next-line no-underscore-dangle
const delete_ = (criteria) => CardReminder.destroy(criteria).fetch();

const deleteOne = (criteria) => CardReminder.destroyOne(criteria);

module.exports = {
  createOne,
  getByCardIdAndUserId,
  getOneById,
  getDue,
  updateOne,
  deleteOne,
  delete: delete_,
};
