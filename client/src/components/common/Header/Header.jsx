/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React, { useCallback } from 'react';
import classNames from 'classnames';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Menu } from 'semantic-ui-react';
import { Tooltip } from '../../../lib/custom-ui';
import { usePopup } from '../../../lib/popup';

import selectors from '../../../selectors';
import entryActions from '../../../entry-actions';
import Paths from '../../../constants/Paths';
import { UserRoles } from '../../../constants/Enums';
import UserAvatar from '../../users/UserAvatar';
import UserActionsStep from '../../users/UserActionsStep';
import NotificationsStep from '../../notifications/NotificationsStep';

import logo from '../../../assets/special1/special1-logo-white.svg';
import styles from './Header.module.scss';

const POPUP_PROPS = {
  position: 'bottom right',
};

const Header = React.memo(() => {
  const user = useSelector(selectors.selectCurrentUser);
  const project = useSelector(selectors.selectCurrentProject);

  const projectSection = useSelector((state) =>
    project && project.projectSectionId
      ? selectors.selectProjectSectionById(state, project.projectSectionId)
      : null,
  );
  const notificationIds = useSelector(selectors.selectNotificationIdsForCurrentUser);
  const isFavoritesEnabled = useSelector(selectors.selectIsFavoritesEnabled);

  const withFavoritesToggler = useSelector(
    // TODO: use selector instead?
    (state) => selectors.selectFavoriteProjectIdsForCurrentUser(state).length > 0,
  );

  // SPECIAL1: no edit-mode lock, so managers (and admins in shared projects) can always open
  // the project settings
  const canEditProject = useSelector((state) => {
    if (!project) {
      return false;
    }

    const isAdminInSharedProject = user.role === UserRoles.ADMIN && !project.ownerProjectManagerId;
    return isAdminInSharedProject || selectors.selectIsCurrentUserManagerForCurrentProject(state);
  });

  const dispatch = useDispatch();
  const [t] = useTranslation();

  const handleToggleFavoritesClick = useCallback(() => {
    dispatch(entryActions.toggleFavorites(!isFavoritesEnabled));
  }, [isFavoritesEnabled, dispatch]);

  const handleProjectSettingsClick = useCallback(() => {
    if (!canEditProject) {
      return;
    }

    dispatch(entryActions.openProjectSettingsModal());
  }, [canEditProject, dispatch]);

  const NotificationsPopup = usePopup(NotificationsStep, POPUP_PROPS);
  const UserActionsPopup = usePopup(UserActionsStep, POPUP_PROPS);

  return (
    <div className={styles.wrapper}>
      <Link to={Paths.ROOT} className={classNames(styles.logo, styles.title)}>
        <img src={logo} alt="SPECIAL1" className={styles.logoImage} />
      </Link>
      <Menu inverted size="large" className={styles.menu}>
        {project && (
          <Menu.Menu position="left">
            {/* SPECIAL1: breadcrumb navigation Projects / section / project */}
            <nav aria-label={t('common.breadcrumbs')} className={styles.breadcrumbs}>
              <Link to={Paths.ROOT} className={styles.breadcrumbLink}>
                {t('common.projects')}
              </Link>
              {projectSection && (
                <>
                  <span className={styles.breadcrumbSeparator} aria-hidden="true">
                    /
                  </span>
                  <span className={styles.breadcrumbSection}>{projectSection.name}</span>
                </>
              )}
              <span className={styles.breadcrumbSeparator} aria-hidden="true">
                /
              </span>
              <span className={styles.breadcrumbCurrent}>{project.name}</span>
              {canEditProject && (
                <Tooltip content={t('common.openProjectSettings')}>
                  <Button className={styles.editButton} onClick={handleProjectSettingsClick}>
                    <Icon fitted name="pencil" size="small" />
                  </Button>
                </Tooltip>
              )}
            </nav>
          </Menu.Menu>
        )}
        <Menu.Menu position="right">
          {withFavoritesToggler && (
            <Tooltip
              content={t(isFavoritesEnabled ? 'action.hideProjectList' : 'action.showProjectList')}
            >
              <Menu.Item
                className={classNames(styles.item, styles.itemHoverable)}
                onClick={handleToggleFavoritesClick}
              >
                <Icon
                  fitted
                  name={isFavoritesEnabled ? 'star' : 'star outline'}
                  className={classNames(isFavoritesEnabled && styles.itemIconEnabled)}
                />
              </Menu.Item>
            </Tooltip>
          )}
          <NotificationsPopup>
            <Tooltip content={t('common.openNotifications')}>
              <Menu.Item className={classNames(styles.item, styles.itemHoverable)}>
                <Icon fitted name="bell" />
                {notificationIds.length > 0 && (
                  <span className={styles.notification}>{notificationIds.length}</span>
                )}
              </Menu.Item>
            </Tooltip>
          </NotificationsPopup>
          <UserActionsPopup>
            <Menu.Item className={classNames(styles.item, styles.itemHoverable)}>
              <span className={styles.userName}>{user.name}</span>
              <UserAvatar id={user.id} size="small" />
            </Menu.Item>
          </UserActionsPopup>
        </Menu.Menu>
      </Menu>
    </div>
  );
});

export default Header;
