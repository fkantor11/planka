/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Checkbox, Dropdown, Radio } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import {
  Digests,
  DueReminderOffsets,
  NOTIFICATION_EVENT_GROUPS,
  NotificationChannels,
  normalizeNotificationSettings,
  setNotificationEventChannel,
  setNotificationOption,
} from '../../../utils/notification-settings';

import styles from './NotificationSettings.module.scss';

const CHANNELS = [NotificationChannels.IN_APP, NotificationChannels.EMAIL];
const DUE_REMINDER_OFFSET_ORDER = [
  DueReminderOffsets.HOUR_1,
  DueReminderOffsets.DAY_1,
  DueReminderOffsets.DAYS_2,
];
const DIGEST_ORDER = [Digests.NONE, Digests.DAILY, Digests.WEEKLY];

// SPECIAL1: which events notify the current user where, plus due reminders, digest and quiet
// hours. Every change is saved immediately, like the other settings.
const NotificationSettings = React.memo(() => {
  const user = useSelector(selectors.selectCurrentUser);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const settings = useMemo(
    () => normalizeNotificationSettings(user.notificationSettings),
    [user.notificationSettings],
  );

  const save = useCallback(
    (data) => {
      dispatch(entryActions.updateCurrentUser(data));
    },
    [dispatch],
  );

  const handleChannelChange = useCallback(
    (_, { name, checked }) => {
      const [eventKey, channel] = name.split('.');

      save({
        notificationSettings: setNotificationEventChannel(settings, eventKey, channel, checked),
      });
    },
    [settings, save],
  );

  const handleOptionChange = useCallback(
    (_, { name, value }) => {
      save({
        notificationSettings: setNotificationOption(settings, name, value),
      });
    },
    [settings, save],
  );

  const handleQuietHoursChange = useCallback(
    (_, { checked }) => {
      save({
        notificationSettings: setNotificationOption(settings, 'quietHours', checked),
      });
    },
    [settings, save],
  );

  const handleUserFlagChange = useCallback(
    (_, { name, checked }) => {
      save({
        [name]: checked,
      });
    },
    [save],
  );

  const dueReminderOffsetOptions = useMemo(
    () =>
      DUE_REMINDER_OFFSET_ORDER.map((offset) => ({
        key: offset,
        value: offset,
        text: t(`notify.dueReminderOffset_${offset}`),
      })),
    [t],
  );

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.eventHeader}>{t('notify.whatToNotify')}</th>
            {CHANNELS.map((channel) => (
              <th key={channel} className={styles.channelHeader}>
                {t(`notify.channel_${channel}`)}
              </th>
            ))}
          </tr>
        </thead>
        {NOTIFICATION_EVENT_GROUPS.map((group) => (
          <tbody key={group.key}>
            <tr>
              <th colSpan={CHANNELS.length + 1} className={styles.groupHeader}>
                {t(`notify.group_${group.key}`)}
              </th>
            </tr>
            {group.eventKeys.map((eventKey) => (
              <tr key={eventKey} className={styles.row}>
                <td className={styles.eventCell}>{t(`notify.event_${eventKey}`)}</td>
                {CHANNELS.map((channel) => (
                  <td key={channel} className={styles.channelCell}>
                    <Checkbox
                      name={`${eventKey}.${channel}`}
                      checked={settings.events[eventKey][channel]}
                      aria-label={`${t(`notify.event_${eventKey}`)}: ${t(`notify.channel_${channel}`)}`}
                      className={styles.checkbox}
                      onChange={handleChannelChange}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>

      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('notify.dueReminderOffset')}</span>
        <Dropdown
          selection
          name="dueReminderOffset"
          options={dueReminderOffsetOptions}
          value={settings.dueReminderOffset}
          className={styles.dropdown}
          onChange={handleOptionChange}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('notify.digest')}</div>
        <div className={styles.cardText}>{t('notify.digestDescription')}</div>
        <div className={styles.radios}>
          {DIGEST_ORDER.map((digest) => (
            <Radio
              key={digest}
              name="digest"
              value={digest}
              checked={settings.digest === digest}
              label={t(`notify.digest_${digest}`)}
              className={styles.radio}
              onChange={handleOptionChange}
            />
          ))}
        </div>
      </div>

      <div className={styles.toggles}>
        <div className={styles.toggle}>
          <Radio
            toggle
            className={styles.toggleInput}
            name="subscribeToOwnCards"
            checked={user.subscribeToOwnCards}
            label={t('notify.subscribeToOwnCards')}
            onChange={handleUserFlagChange}
          />
        </div>
        <div className={styles.toggle}>
          <Radio
            toggle
            className={styles.toggleInput}
            name="subscribeToCardWhenCommenting"
            checked={user.subscribeToCardWhenCommenting}
            label={t('notify.subscribeToCardWhenCommenting')}
            onChange={handleUserFlagChange}
          />
        </div>
        <div className={styles.toggle}>
          <Radio
            toggle
            className={styles.toggleInput}
            name="quietHours"
            checked={settings.quietHours}
            label={t('notify.quietHours')}
            onChange={handleQuietHoursChange}
          />
          <div className={styles.toggleHint}>{t('notify.quietHoursDescription')}</div>
        </div>
      </div>
    </div>
  );
});

export default NotificationSettings;
