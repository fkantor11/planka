/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: titles, Apprise bodies and email bodies of every notification type in one place
// (used to be duplicated in helpers/notifications/create-one.js and create-many.js).
// Runs inside Sails (uses the `sails` and `_` globals at call time).

const escapeMarkdown = require('escape-markdown');
const escapeHtml = require('escape-html');

const { mentionMarkupToText } = require('./mentions');
const { TIME_ZONE } = require('./zoned-time');

const formatDateTime = (value, language) => {
  if (!value) {
    return '';
  }

  try {
    return new Date(value).toLocaleString(language || sails.config.i18n.defaultLocale, {
      timeZone: TIME_ZONE,
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    return new Date(value).toISOString();
  }
};

const buildTitle = (notification, t) => {
  switch (notification.type) {
    case Notification.Types.MOVE_CARD:
      return t('Card Moved');
    case Notification.Types.COMMENT_CARD:
      return t('New Comment');
    case Notification.Types.ADD_MEMBER_TO_CARD:
      return t('You Were Added to Card');
    case Notification.Types.MENTION_IN_COMMENT:
      return t('You Were Mentioned in Comment');
    case Notification.Types.COMPLETE_CARD:
      return t('Card Completed');
    case Notification.Types.CHANGE_DUE_DATE:
      return t('Due Date Changed');
    case Notification.Types.DUE_SOON:
      return t('Due Date Approaching');
    case Notification.Types.OVERDUE:
      return t('Card Overdue');
    case Notification.Types.ADD_TO_PROJECT:
      return t('You Were Added to Project');
    case Notification.Types.ADD_TO_BOARD:
      return t('You Were Added to Board');
    case Notification.Types.CREATE_CARD:
      return t('New Card');
    case Notification.Types.CARD_REMINDER:
      return t('Reminder');
    default:
      return null;
  }
};

/*
  Builds the same sentence in three formats. `context` holds { project, board, card } (any may be
  missing for project / board notifications), `actorUser` may be null for system notifications.
*/
const buildBodyByFormat = (context, notification, actorUser, t, language, { isFull } = {}) => {
  const { project, board, card } = context;
  const { data } = notification;
  const { baseUrl } = sails.config.custom;

  const actorName = actorUser ? actorUser.name : '';
  const cardName = card ? card.name : (data.card && data.card.name) || '';
  const boardName = board ? board.name : (data.board && data.board.name) || '';
  const projectName = project ? project.name : (data.project && data.project.name) || '';

  const cardUrl = card && `${baseUrl}/cards/${card.id}`;
  const boardId = board ? board.id : data.board && data.board.id;
  const boardUrl = boardId && `${baseUrl}/boards/${boardId}`;
  const projectId = project ? project.id : data.project && data.project.id;
  const projectUrl = projectId && `${baseUrl}/projects/${projectId}`;

  const link = {
    text: (name) => name,
    markdown: (name, url) => (url ? `[${escapeMarkdown(name)}](${url})` : escapeMarkdown(name)),
    html: (name, url) =>
      url ? `<a href="${url}">${escapeHtml(name)}</a>` : `<b>${escapeHtml(name)}</b>`,
  };

  const plain = {
    text: (value) => value,
    markdown: (value) => escapeMarkdown(value),
    html: (value) => escapeHtml(value),
  };

  const bold = {
    text: (value) => value,
    markdown: (value) => `**${escapeMarkdown(value)}**`,
    html: (value) => `<b>${escapeHtml(value)}</b>`,
  };

  const shorten = (value) => (isFull ? value : _.truncate(value));

  const quote = {
    text: (value) => `:\n${value}`,
    markdown: (value) => `:\n\n*${escapeMarkdown(value)}*`,
    html: (value) => `:\n\n<i>${escapeHtml(value)}</i>`,
  };

  const build = (format) => {
    const cardLink = link[format](cardName, cardUrl);
    const boardLink = link[format](boardName, boardUrl);
    const projectLink = link[format](projectName, projectUrl);
    const actor = plain[format](actorName);

    switch (notification.type) {
      case Notification.Types.MOVE_CARD:
        return t(
          '%s moved %s from %s to %s on %s',
          actor,
          cardLink,
          bold[format](sails.helpers.lists.resolveName(data.fromList, t)),
          bold[format](sails.helpers.lists.resolveName(data.toList, t)),
          plain[format](boardName),
        );
      case Notification.Types.COMMENT_CARD:
        return `${t('%s left a new comment to %s on %s', actor, cardLink, plain[format](boardName))}${quote[
          format
        ](shorten(mentionMarkupToText(data.text)))}`;
      case Notification.Types.ADD_MEMBER_TO_CARD:
        return t('%s added you to %s on %s', actor, cardLink, plain[format](boardName));
      case Notification.Types.MENTION_IN_COMMENT:
        return `${t('%s mentioned you in %s on %s', actor, cardLink, plain[format](boardName))}${quote[
          format
        ](shorten(mentionMarkupToText(data.text)))}`;
      case Notification.Types.COMPLETE_CARD:
        return t('Card %s on %s is done (%s)', cardLink, plain[format](boardName), actor);
      case Notification.Types.CHANGE_DUE_DATE:
        return t(
          'The due date of %s on %s changed to %s (%s)',
          cardLink,
          plain[format](boardName),
          bold[format](formatDateTime(data.dueDate, language)),
          actor,
        );
      case Notification.Types.DUE_SOON:
        return t(
          'Card %s on %s is due %s',
          cardLink,
          plain[format](boardName),
          bold[format](formatDateTime(data.dueDate, language)),
        );
      case Notification.Types.OVERDUE:
        return t(
          'Card %s on %s is overdue (due %s)',
          cardLink,
          plain[format](boardName),
          bold[format](formatDateTime(data.dueDate, language)),
        );
      case Notification.Types.ADD_TO_PROJECT:
        return t('You were added to project %s (%s)', projectLink, actor);
      case Notification.Types.ADD_TO_BOARD:
        return t(
          'You were added to board %s in project %s (%s)',
          boardLink,
          plain[format](projectName),
          actor,
        );
      case Notification.Types.CREATE_CARD:
        return t('New card %s on %s (%s)', cardLink, plain[format](boardName), actor);
      case Notification.Types.CARD_REMINDER:
        return `${t('Reminder: %s on %s', cardLink, plain[format](boardName))}${
          data.note ? quote[format](data.note) : ''
        }`;
      default:
        return null;
    }
  };

  const text = build('text');

  if (text === null) {
    return null;
  }

  return {
    text,
    markdown: build('markdown'),
    html: build('html'),
  };
};

const buildEmailHtml = (context, notification, actorUser, t, language) => {
  const body = buildBodyByFormat(context, notification, actorUser, t, language, {
    isFull: true,
  });

  if (!body) {
    return null;
  }

  return body.html
    .split('\n\n')
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
};

module.exports = {
  formatDateTime,
  buildTitle,
  buildBodyByFormat,
  buildEmailHtml,
};
