/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown, Form, Icon } from 'semantic-ui-react';
import { Popup } from '../../../lib/custom-ui';

import {
  REMINDER_REPEAT_ORDER,
  getDefaultReminderInput,
  parseReminderInput,
} from '../../../utils/card-reminders';

import styles from './CardReminders.module.scss';

const CardRemindersStep = React.memo(({ reminders, error, onCreate, onDelete, onBack }) => {
  const [t] = useTranslation();

  const [data, setData] = useState(() => ({
    ...getDefaultReminderInput(),
    repeat: 'none',
    note: '',
  }));

  const [isInvalid, setIsInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const repeatOptions = useMemo(
    () =>
      REMINDER_REPEAT_ORDER.map((repeat) => ({
        key: repeat,
        value: repeat,
        text: t(`notify.repeat_${repeat}`),
      })),
    [t],
  );

  const handleFieldChange = useCallback((event, { name, value } = {}) => {
    const fieldName = name || event.target.name;
    const fieldValue = value !== undefined ? value : event.target.value;

    setData((prevData) => ({
      ...prevData,
      [fieldName]: fieldValue,
    }));

    setIsInvalid(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const nextAt = parseReminderInput(data.date, data.time);

    if (!nextAt) {
      setIsInvalid(true);
      return;
    }

    setIsSubmitting(true);

    const item = await onCreate({
      nextAt: nextAt.toISOString(),
      repeat: data.repeat,
      note: data.note.trim() || null,
    });

    setIsSubmitting(false);

    if (item) {
      setData((prevData) => ({
        ...prevData,
        note: '',
      }));
    }
  }, [data, onCreate]);

  return (
    <>
      <Popup.Header onBack={onBack}>
        {t('notify.reminder_title', {
          context: 'title',
        })}
      </Popup.Header>
      <Popup.Content>
        {reminders.length > 0 && (
          <ul className={styles.list}>
            {reminders.map((reminder) => (
              <li key={reminder.id} className={styles.item}>
                <Icon name="bell outline" className={styles.itemIcon} />
                <div className={styles.itemContent}>
                  <div className={styles.itemDate}>
                    {t('format:dateTime', {
                      postProcess: 'formatDate',
                      value: new Date(reminder.nextAt),
                    })}
                    <span className={styles.itemRepeat}>
                      {t(`notify.repeat_${reminder.repeat}`)}
                    </span>
                  </div>
                  {reminder.note && <div className={styles.itemNote}>{reminder.note}</div>}
                </div>
                <Button
                  type="button"
                  icon="trash alternate outline"
                  className={styles.itemDelete}
                  title={t('action.delete')}
                  onClick={() => onDelete(reminder.id)}
                />
              </li>
            ))}
          </ul>
        )}
        <Form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>{t('common.date')}</span>
              <input
                type="date"
                name="date"
                value={data.date}
                className={styles.input}
                onChange={handleFieldChange}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t('common.time')}</span>
              <input
                type="time"
                name="time"
                value={data.time}
                className={styles.input}
                onChange={handleFieldChange}
              />
            </label>
          </div>
          <div className={styles.fieldBlock}>
            <span className={styles.label}>{t('notify.repeat')}</span>
            <Dropdown
              fluid
              selection
              name="repeat"
              options={repeatOptions}
              value={data.repeat}
              onChange={handleFieldChange}
            />
          </div>
          <label className={styles.fieldBlock}>
            <span className={styles.label}>{t('notify.reminderNote')}</span>
            <input
              type="text"
              name="note"
              value={data.note}
              maxLength={1024}
              placeholder={t('notify.reminderNotePlaceholder')}
              className={styles.input}
              onChange={handleFieldChange}
            />
          </label>
          {(isInvalid || error) && (
            <div className={styles.error}>
              {isInvalid ? t('notify.reminderInvalidDate') : t('notify.reminderSaveFailed')}
            </div>
          )}
          <Button
            positive
            fluid
            loading={isSubmitting}
            disabled={isSubmitting}
            content={t('notify.addReminder')}
          />
        </Form>
        <p className={styles.hint}>{t('notify.reminderHint')}</p>
      </Popup.Content>
    </>
  );
});

CardRemindersStep.propTypes = {
  reminders: PropTypes.arrayOf(PropTypes.object).isRequired, // eslint-disable-line react/forbid-prop-types
  error: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  onCreate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onBack: PropTypes.func,
};

CardRemindersStep.defaultProps = {
  error: null,
  onBack: undefined,
};

export default CardRemindersStep;
