/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import selectors from '../../../selectors';
import api from '../../../api/card-reminders';
import socket from '../../../api/socket';
import { sortReminders } from '../../../utils/card-reminders';

// SPECIAL1: the current user's reminders for a card, kept in local state (they are personal and
// only needed while the card is open). Socket events keep other tabs and scheduler runs in sync.
export default (cardId) => {
  const accessToken = useSelector(selectors.selectAccessToken);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState(null);

  const headers = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : undefined;

  const upsert = useCallback(
    (item) => {
      if (item.cardId !== cardId) {
        return;
      }

      setReminders((prevReminders) =>
        sortReminders([...prevReminders.filter(({ id }) => id !== item.id), item]),
      );
    },
    [cardId],
  );

  const remove = useCallback((item) => {
    setReminders((prevReminders) => prevReminders.filter(({ id }) => id !== item.id));
  }, []);

  useEffect(() => {
    let isActive = true;

    setReminders([]);

    api
      .getCardReminders(cardId, headers)
      .then(({ items }) => {
        if (isActive) {
          setReminders(sortReminders(items));
        }
      })
      .catch(() => {
        /* empty */
      });

    const handleUpsert = ({ item }) => upsert(item);
    const handleRemove = ({ item }) => remove(item);

    socket.on('cardReminderCreate', handleUpsert);
    socket.on('cardReminderUpdate', handleUpsert);
    socket.on('cardReminderDelete', handleRemove);

    return () => {
      isActive = false;

      socket.off('cardReminderCreate', handleUpsert);
      socket.off('cardReminderUpdate', handleUpsert);
      socket.off('cardReminderDelete', handleRemove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, accessToken, upsert, remove]);

  const create = useCallback(
    async (data) => {
      setError(null);

      try {
        const { item } = await api.createCardReminder(cardId, data, headers);
        upsert(item);

        return item;
      } catch (createError) {
        setError(createError);

        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cardId, accessToken, upsert],
  );

  const destroy = useCallback(
    async (id) => {
      setReminders((prevReminders) => prevReminders.filter((reminder) => reminder.id !== id));

      try {
        await api.deleteCardReminder(id, headers);
      } catch {
        /* empty */
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken],
  );

  return {
    reminders,
    error,
    create,
    destroy,
  };
};
