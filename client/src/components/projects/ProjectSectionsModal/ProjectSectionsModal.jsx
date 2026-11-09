/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Form, Input } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { useClosableModal, useForm, useNestedRef } from '../../../hooks';
import Item from './Item';

import styles from './ProjectSectionsModal.module.scss';

// SPECIAL1: admins create, rename, reorder and delete the company-wide home page sections
const ProjectSectionsModal = React.memo(() => {
  const projectSections = useSelector(selectors.selectProjectSections);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const [data, handleFieldChange, setData] = useForm({
    name: '',
  });

  const [nameFieldRef, handleNameFieldRef] = useNestedRef('inputRef');

  const handleClose = useCallback(() => {
    dispatch(entryActions.closeModal());
  }, [dispatch]);

  const handleCreateSubmit = useCallback(() => {
    const name = data.name.trim();

    if (!name) {
      nameFieldRef.current.select();
      return;
    }

    dispatch(
      entryActions.createProjectSection({
        name,
      }),
    );

    setData({
      name: '',
    });

    nameFieldRef.current.focus();
  }, [dispatch, data, setData, nameFieldRef]);

  const handleUpdate = useCallback(
    (id, nextData) => {
      dispatch(entryActions.updateProjectSection(id, nextData));
    },
    [dispatch],
  );

  const handleMove = useCallback(
    (id, index) => {
      dispatch(entryActions.moveProjectSection(id, index));
    },
    [dispatch],
  );

  const handleDelete = useCallback(
    (id) => {
      dispatch(entryActions.deleteProjectSection(id));
    },
    [dispatch],
  );

  const [ClosableModal] = useClosableModal();

  return (
    <ClosableModal
      closeIcon
      size="tiny"
      centered={false}
      className={styles.wrapper}
      onClose={handleClose}
    >
      <ClosableModal.Header>
        {t('common.manageSections', {
          context: 'title',
        })}
      </ClosableModal.Header>
      <ClosableModal.Content>
        <p className={styles.description}>{t('common.sectionsAreSharedByEveryone')}</p>
        {projectSections.length > 0 ? (
          <div className={styles.items}>
            {projectSections.map((projectSection, index) => (
              <Item
                key={projectSection.id}
                id={projectSection.id}
                index={index}
                name={projectSection.name}
                isPersisted={projectSection.isPersisted}
                canMoveUp={index > 0}
                canMoveDown={index < projectSections.length - 1}
                onUpdate={handleUpdate}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>{t('common.noSectionsYet')}</div>
        )}
        <Form className={styles.addForm} onSubmit={handleCreateSubmit}>
          <Input
            ref={handleNameFieldRef}
            name="name"
            value={data.name}
            maxLength={128}
            placeholder={t('common.sectionName')}
            className={styles.addField}
            onChange={handleFieldChange}
          />
          <Button primary icon="plus" content={t('action.addSection')} />
        </Form>
      </ClosableModal.Content>
    </ClosableModal>
  );
});

export default ProjectSectionsModal;
