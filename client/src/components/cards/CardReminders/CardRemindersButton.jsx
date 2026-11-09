/*!
 * Copyright (c) 2026 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Button, Icon } from 'semantic-ui-react';

import { usePopupInClosableContext } from '../../../hooks';
import useCardReminders from './use-card-reminders';
import CardRemindersStep from './CardRemindersStep';

import styles from './CardReminders.module.scss';

// SPECIAL1: "Připomínka" entry of the card modal sidebar, shows how many reminders the user has
const CardRemindersButton = React.memo(({ cardId, className, iconClassName }) => {
  const [t] = useTranslation();
  const { reminders, error, create, destroy } = useCardReminders(cardId);

  const CardRemindersPopup = usePopupInClosableContext(CardRemindersStep);

  return (
    <CardRemindersPopup reminders={reminders} error={error} onCreate={create} onDelete={destroy}>
      <Button fluid className={className}>
        <Icon name="bell outline" className={iconClassName} />
        {t('notify.reminder')}
        {reminders.length > 0 && (
          <span className={classNames(styles.count)} title={t('notify.activeReminders')}>
            {reminders.length}
          </span>
        )}
      </Button>
    </CardRemindersPopup>
  );
});

CardRemindersButton.propTypes = {
  cardId: PropTypes.string.isRequired,
  className: PropTypes.string,
  iconClassName: PropTypes.string,
};

CardRemindersButton.defaultProps = {
  className: undefined,
  iconClassName: undefined,
};

export default CardRemindersButton;
