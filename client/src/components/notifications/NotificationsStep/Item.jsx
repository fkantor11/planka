/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import truncate from 'lodash/truncate';
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router';
import { Button, Icon } from 'semantic-ui-react';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import { mentionMarkupToText } from '../../../utils/mentions';
import { isUserStatic } from '../../../utils/record-helpers';
import Paths from '../../../constants/Paths';
import { NotificationTypes } from '../../../constants/Enums';
import TimeAgo from '../../common/TimeAgo';
import UserAvatar from '../../users/UserAvatar';

import styles from './Item.module.scss';
import systemStyles from './SystemItem.module.scss';

const Item = React.memo(({ id, onClose }) => {
  const selectNotificationById = useMemo(() => selectors.makeSelectNotificationById(), []);
  const selectCreatorUserById = useMemo(() => selectors.makeSelectUserById(), []);
  const selectCardById = useMemo(() => selectors.makeSelectCardById(), []);

  const notification = useSelector((state) => selectNotificationById(state, id));

  const creatorUser = useSelector((state) =>
    selectCreatorUserById(state, notification.creatorUserId),
  );

  const card = useSelector((state) => selectCardById(state, notification.cardId));

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const handleDeleteClick = useCallback(() => {
    dispatch(entryActions.deleteNotification(id));
  }, [id, dispatch]);

  // SPECIAL1: system notifications (due dates, reminders) have no creator
  let creatorUserName = '';
  if (creatorUser) {
    creatorUserName = isUserStatic(creatorUser)
      ? t(`common.${creatorUser.name}`, {
          context: 'title',
        })
      : creatorUser.name;
  }

  const notificationData = notification.data || {};
  const cardName = card ? card.name : (notificationData.card && notificationData.card.name) || '';

  const cardLink = (
    <Link to={Paths.CARDS.replace(':id', notification.cardId)} onClick={onClose}>
      {cardName}
    </Link>
  );

  const formatDueDate = (value) =>
    value
      ? t('format:longDateTime', {
          postProcess: 'formatDate',
          value: new Date(value),
        })
      : '';

  let contentNode;
  switch (notification.type) {
    case NotificationTypes.MOVE_CARD: {
      const { fromList, toList } = notification.data;

      const fromListName = fromList.name || t(`common.${fromList.type}`);
      const toListName = toList.name || t(`common.${toList.type}`);

      contentNode = (
        <Trans
          i18nKey="common.userMovedCardFromListToList"
          values={{
            user: creatorUserName,
            card: cardName,
            fromList: fromListName,
            toList: toListName,
          }}
        >
          <span className={styles.author}>{creatorUserName}</span>
          {' moved '}
          <Link to={Paths.CARDS.replace(':id', notification.cardId)} onClick={onClose}>
            {cardName}
          </Link>
          {' from '}
          {fromListName}
          {' to '}
          {toListName}
        </Trans>
      );

      break;
    }
    case NotificationTypes.COMMENT_CARD: {
      const commentText = truncate(mentionMarkupToText(notification.data.text));

      contentNode = (
        <Trans
          i18nKey="common.userLeftNewCommentToCard"
          values={{
            user: creatorUserName,
            comment: commentText,
            card: cardName,
          }}
        >
          <span className={styles.author}>{creatorUserName}</span>
          {` left a new comment «${commentText}» to `}
          <Link to={Paths.CARDS.replace(':id', notification.cardId)} onClick={onClose}>
            {cardName}
          </Link>
        </Trans>
      );

      break;
    }
    case NotificationTypes.ADD_MEMBER_TO_CARD:
      contentNode = (
        <Trans
          i18nKey="common.userAddedYouToCard"
          values={{
            user: creatorUserName,
            card: cardName,
          }}
        >
          <span className={styles.author}>{creatorUserName}</span>
          {` added you to `}
          <Link to={Paths.CARDS.replace(':id', notification.cardId)} onClick={onClose}>
            {cardName}
          </Link>
        </Trans>
      );

      break;
    case NotificationTypes.MENTION_IN_COMMENT: {
      const commentText = truncate(mentionMarkupToText(notification.data.text));

      contentNode = (
        <Trans
          i18nKey="common.userMentionedYouInCommentOnCard"
          values={{
            user: creatorUserName,
            comment: commentText,
            card: cardName,
          }}
        >
          <span className={styles.author}>{creatorUserName}</span>
          {` mentioned you in «${commentText}» on `}
          <Link to={Paths.CARDS.replace(':id', notification.cardId)} onClick={onClose}>
            {cardName}
          </Link>
        </Trans>
      );

      break;
    }
    case NotificationTypes.COMPLETE_CARD:
      contentNode = (
        <Trans i18nKey="notify.cardCompleted" values={{ card: cardName }}>
          {'Card '}
          {cardLink}
          {' is done'}
        </Trans>
      );

      break;
    case NotificationTypes.CHANGE_DUE_DATE: {
      const date = formatDueDate(notificationData.dueDate);

      contentNode = (
        <Trans i18nKey="notify.cardDueDateChanged" values={{ card: cardName, date }}>
          {'The due date of '}
          {cardLink}
          {` changed to ${date}`}
        </Trans>
      );

      break;
    }
    case NotificationTypes.DUE_SOON: {
      const date = formatDueDate(notificationData.dueDate);

      contentNode = (
        <Trans i18nKey="notify.cardDueSoon" values={{ card: cardName, date }}>
          {'Card '}
          {cardLink}
          {` is due ${date}`}
        </Trans>
      );

      break;
    }
    case NotificationTypes.OVERDUE:
      contentNode = (
        <Trans i18nKey="notify.cardOverdue" values={{ card: cardName }}>
          {'Card '}
          {cardLink}
          {' is overdue'}
        </Trans>
      );

      break;
    case NotificationTypes.ADD_TO_PROJECT: {
      const project = notificationData.project || {};

      contentNode = (
        <Trans i18nKey="notify.addedToProject" values={{ project: project.name }}>
          {'You were added to project '}
          <Link to={Paths.PROJECTS.replace(':id', project.id)} onClick={onClose}>
            {project.name}
          </Link>
        </Trans>
      );

      break;
    }
    case NotificationTypes.ADD_TO_BOARD: {
      const board = notificationData.board || {};

      contentNode = (
        <Trans i18nKey="notify.addedToBoard" values={{ board: board.name }}>
          {'You were added to board '}
          <Link to={Paths.BOARDS.replace(':id', notification.boardId)} onClick={onClose}>
            {board.name}
          </Link>
        </Trans>
      );

      break;
    }
    case NotificationTypes.CREATE_CARD: {
      const boardName = (notificationData.board && notificationData.board.name) || '';

      contentNode = (
        <Trans i18nKey="notify.cardCreatedOnBoard" values={{ card: cardName, board: boardName }}>
          {'New card '}
          {cardLink}
          {` on ${boardName}`}
        </Trans>
      );

      break;
    }
    case NotificationTypes.CARD_REMINDER:
      contentNode = (
        <>
          <Trans i18nKey="notify.cardReminder" values={{ card: cardName }}>
            {'Reminder: '}
            {cardLink}
          </Trans>
          {notificationData.note && (
            <span className={systemStyles.note}>{`«${notificationData.note}»`}</span>
          )}
        </>
      );

      break;
    default:
      contentNode = null;
  }

  return (
    <div className={styles.wrapper}>
      {notification.creatorUserId ? (
        <UserAvatar id={notification.creatorUserId} size="large" />
      ) : (
        <span className={systemStyles.avatar}>
          <Icon
            fitted
            name={notification.type === NotificationTypes.CARD_REMINDER ? 'bell' : 'clock'}
          />
        </span>
      )}
      <span className={styles.content}>
        <div>{contentNode}</div>
        <span className={styles.date}>
          <TimeAgo date={notification.createdAt} />
        </span>
      </span>
      <Button
        type="button"
        icon="trash alternate outline"
        className={styles.button}
        onClick={handleDeleteClick}
      />
    </div>
  );
});

Item.propTypes = {
  id: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Item;
