/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Grid, Icon } from 'semantic-ui-react';

import selectors from '../../../selectors';
import { isUserAdminOrProjectOwner } from '../../../utils/record-helpers';
import ProjectCard from '../../projects/ProjectCard';
import PlusIcon from '../../../assets/images/plus-icon.svg?react';

import styles from './Projects.module.scss';

// SPECIAL1: tiles of a sortable section can be dragged (native HTML drag and drop, which handles a
// wrapping grid) within the section and into other sections
const DRAG_DATA_TYPE = 'application/x-planka-project';

const readDragData = (event) => {
  try {
    return JSON.parse(event.dataTransfer.getData(DRAG_DATA_TYPE));
  } catch {
    return null;
  }
};

const isProjectDrag = (event) => event.dataTransfer.types.includes(DRAG_DATA_TYPE);

const Projects = React.memo(
  ({ ids, title, titleText, titleIcon, withTypeIndicator, section, isSortable, onMove, onAdd }) => {
    const canAdd = useSelector((state) => {
      const user = selectors.selectCurrentUser(state);
      return isUserAdminOrProjectOwner(user);
    });

    const [t] = useTranslation();
    const [dropIndex, setDropIndex] = useState(null);
    const [draggingId, setDraggingId] = useState(null);

    const handleDragStart = useCallback(
      (event, id, index) => {
        event.dataTransfer.effectAllowed = 'move'; // eslint-disable-line no-param-reassign
        event.dataTransfer.setData(DRAG_DATA_TYPE, JSON.stringify({ id, section, index }));

        // Show the whole tile under the cursor while dragging, not a link
        const tile = event.currentTarget.firstElementChild || event.currentTarget;
        const rect = tile.getBoundingClientRect();
        event.dataTransfer.setDragImage(tile, event.clientX - rect.left, event.clientY - rect.top);

        // Dim the original tile once the drag image has been taken
        setTimeout(() => setDraggingId(id));
      },
      [section],
    );

    const handleTileDragOver = useCallback((event, index) => {
      if (!isProjectDrag(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const rect = event.currentTarget.getBoundingClientRect();
      const isAfter = event.clientX > rect.left + rect.width / 2;

      setDropIndex(isAfter ? index + 1 : index);
    }, []);

    const handleSectionDragOver = useCallback(
      (event) => {
        if (!isProjectDrag(event)) {
          return;
        }

        event.preventDefault();
        setDropIndex((prevDropIndex) => (prevDropIndex === null ? ids.length : prevDropIndex));
      },
      [ids.length],
    );

    const handleDragLeave = useCallback((event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setDropIndex(null);
      }
    }, []);

    const handleDrop = useCallback(
      (event) => {
        const data = readDragData(event);
        const index = dropIndex === null ? ids.length : dropIndex;

        setDropIndex(null);

        if (!data) {
          return;
        }

        event.preventDefault();

        // The dragged tile still counts in this section's indexes when moved down within it
        const nextIndex = data.section === section && data.index < index ? index - 1 : index;

        if (data.section === section && data.index === nextIndex) {
          return;
        }

        onMove(data.id, section, nextIndex);
      },
      [ids.length, dropIndex, section, onMove],
    );

    const handleDragEnd = useCallback(() => {
      setDropIndex(null);
      setDraggingId(null);
    }, []);

    const sortableProps = isSortable
      ? {
          onDragOver: handleSectionDragOver,
          onDragLeave: handleDragLeave,
          onDrop: handleDrop,
        }
      : {};

    return (
      <div
        className={classNames(
          styles.wrapper,
          !title && !titleText && styles.wrapperWithoutTitle,
          isSortable && styles.wrapperSortable,
          dropIndex !== null && styles.wrapperDropTarget,
        )}
        {...sortableProps} // eslint-disable-line react/jsx-props-no-spreading
      >
        {(title || titleText) && (
          <div className={styles.title}>
            {titleIcon && <Icon name={titleIcon} className={styles.titleIcon} />}
            {titleText ||
              t(title, {
                context: 'title',
              })}
          </div>
        )}
        <Grid>
          {ids.map((id, index) => (
            <Grid.Column
              key={id}
              className={classNames(
                styles.column,
                isSortable && styles.columnDraggable,
                draggingId === id && styles.columnDragging,
                dropIndex === index && styles.columnDropBefore,
                dropIndex === index + 1 && index === ids.length - 1 && styles.columnDropAfter,
              )}
              draggable={isSortable}
              onDragStart={isSortable ? (event) => handleDragStart(event, id, index) : undefined}
              onDragOver={isSortable ? (event) => handleTileDragOver(event, index) : undefined}
              onDragEnd={isSortable ? handleDragEnd : undefined}
            >
              <ProjectCard
                withDescription
                withFavoriteButton
                id={id}
                withTypeIndicator={withTypeIndicator}
                className={styles.card}
              />
            </Grid.Column>
          ))}
          {isSortable && ids.length === 0 && (
            <Grid.Column className={styles.column}>
              <div className={classNames(styles.card, styles.emptySection)}>
                {t('common.dragProjectHere')}
              </div>
            </Grid.Column>
          )}
          {onAdd && canAdd && (
            <Grid.Column className={styles.column}>
              <button
                type="button"
                className={classNames(styles.card, styles.addButton)}
                onClick={onAdd}
              >
                <div className={styles.addButtonCover} />
                <div className={styles.addButtonTitleWrapper}>
                  <div className={styles.addButtonTitle}>
                    <PlusIcon className={styles.addButtonTitleIcon} />
                    {t('action.createProject')}
                  </div>
                </div>
              </button>
            </Grid.Column>
          )}
        </Grid>
      </div>
    );
  },
);

Projects.propTypes = {
  ids: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  title: PropTypes.string,
  titleText: PropTypes.string, // SPECIAL1: shown as is, e.g. a section name
  titleIcon: PropTypes.string,
  withTypeIndicator: PropTypes.bool, // TODO: use plural form?
  section: PropTypes.string,
  isSortable: PropTypes.bool,
  onMove: PropTypes.func,
  onAdd: PropTypes.func,
};

Projects.defaultProps = {
  title: undefined,
  titleText: undefined,
  titleIcon: undefined,
  withTypeIndicator: false,
  section: undefined,
  isSortable: false,
  onMove: undefined,
  onAdd: undefined,
};

export default Projects;
