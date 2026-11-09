/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Input } from 'semantic-ui-react';

import { usePopupInClosableContext } from '../../../hooks';
import ConfirmationStep from '../../common/ConfirmationStep';

import styles from './Item.module.scss';

const Item = React.memo(
  ({ id, index, name, isPersisted, canMoveUp, canMoveDown, onUpdate, onMove, onDelete }) => {
    const [t] = useTranslation();
    const [value, setValue] = useState(name);

    // Follow renames made elsewhere (e.g. by another admin)
    useEffect(() => {
      setValue(name);
    }, [name]);

    const submit = useCallback(() => {
      const nextName = value.trim();

      if (!nextName) {
        setValue(name);
        return;
      }

      if (nextName !== name) {
        onUpdate(id, {
          name: nextName,
        });
      }
    }, [id, name, value, onUpdate]);

    const handleChange = useCallback((_, { value: nextValue }) => {
      setValue(nextValue);
    }, []);

    const handleKeyDown = useCallback(
      (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.target.blur();
        } else if (event.key === 'Escape') {
          setValue(name);
        }
      },
      [name],
    );

    const handleMoveUpClick = useCallback(() => {
      onMove(id, index - 1);
    }, [id, index, onMove]);

    const handleMoveDownClick = useCallback(() => {
      onMove(id, index + 1);
    }, [id, index, onMove]);

    const handleDeleteConfirm = useCallback(() => {
      onDelete(id);
    }, [id, onDelete]);

    const ConfirmationPopup = usePopupInClosableContext(ConfirmationStep);

    return (
      <div className={styles.wrapper}>
        <Icon name="folder outline" className={styles.icon} />
        <Input
          transparent
          value={value}
          maxLength={128}
          disabled={!isPersisted}
          aria-label={t('common.sectionName')}
          className={styles.field}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={submit}
        />
        <Button
          basic
          icon="arrow up"
          size="mini"
          disabled={!isPersisted || !canMoveUp}
          title={t('action.moveUp')}
          aria-label={t('action.moveUp')}
          className={styles.button}
          onClick={handleMoveUpClick}
        />
        <Button
          basic
          icon="arrow down"
          size="mini"
          disabled={!isPersisted || !canMoveDown}
          title={t('action.moveDown')}
          aria-label={t('action.moveDown')}
          className={styles.button}
          onClick={handleMoveDownClick}
        />
        <ConfirmationPopup
          title="common.deleteSection"
          content="common.areYouSureYouWantToDeleteThisSection"
          buttonContent="action.deleteSection"
          onConfirm={handleDeleteConfirm}
        >
          <Button
            basic
            icon="trash alternate outline"
            size="mini"
            disabled={!isPersisted}
            title={t('action.deleteSection')}
            aria-label={t('action.deleteSection')}
            className={styles.button}
          />
        </ConfirmationPopup>
      </div>
    );
  },
);

Item.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  isPersisted: PropTypes.bool.isRequired,
  canMoveUp: PropTypes.bool.isRequired,
  canMoveDown: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default Item;
