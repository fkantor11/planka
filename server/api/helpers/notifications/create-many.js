/*!
 * Copyright (c) 2024 PLANKA Software GmbH
 * Licensed under the Fair Use License: https://github.com/plankanban/planka/blob/master/LICENSE.md
 */

// SPECIAL1: every notification goes through here and honours the recipient's settings: the in-app
// toggle decides the Notification row, its broadcast, webhooks and Apprise services; the email
// toggle decides the email (independently). The actor and deactivated users are never notified.

const { getChannels } = require('../../../utils/notification-settings');
const {
  buildTitle,
  buildBodyByFormat,
  buildEmailHtml,
} = require('../../../utils/notification-content');

const buildAndSendNotifications = async (services, context, notification, actorUser, user, t) => {
  await sails.helpers.utils.sendNotifications(
    services,
    buildTitle(notification, t),
    buildBodyByFormat(context, notification, actorUser, t, user.language),
  );
};

module.exports = {
  inputs: {
    // [{ userId, type, data, creatorUser?, card?, comment?, action? }]
    arrayOfValues: {
      type: 'ref',
      required: true,
    },
    project: {
      type: 'ref',
    },
    board: {
      type: 'ref',
    },
    list: {
      type: 'ref',
    },
    webhooks: {
      type: 'ref',
    },
    now: {
      type: 'ref',
    },
  },

  async fn(inputs) {
    // Internal (non-database) actors such as User.INTERNAL are stored as no creator
    const getCreatorUserId = (values) =>
      values.creatorUser && /^\d+$/.test(values.creatorUser.id) ? values.creatorUser.id : null;

    let arrayOfValues = _.uniqBy(
      inputs.arrayOfValues.filter(
        (values) =>
          values.userId && (!values.creatorUser || values.userId !== values.creatorUser.id),
      ),
      (values) => `${values.userId}:${values.type}`,
    );

    if (arrayOfValues.length === 0) {
      return [];
    }

    const users = await User.qm.getByIds(_.uniq(_.map(arrayOfValues, 'userId')), {
      withDeactivated: false,
    });

    const userById = _.keyBy(users, 'id');
    arrayOfValues = arrayOfValues.filter((values) => userById[values.userId]);

    const channelsByValues = new Map(
      arrayOfValues.map((values) => [
        values,
        getChannels(
          userById[values.userId].notificationSettings,
          Notification.EVENT_KEY_BY_TYPE[values.type],
        ),
      ]),
    );

    const inAppArrayOfValues = arrayOfValues.filter((values) => channelsByValues.get(values).inApp);
    const emailArrayOfValues = arrayOfValues.filter((values) => channelsByValues.get(values).email);

    const context = {
      project: inputs.project,
      board: inputs.board,
    };

    const getCard = (values) => values.card || null;

    let notifications = [];

    if (inAppArrayOfValues.length > 0) {
      const ids = await sails.helpers.utils.generateIds(inAppArrayOfValues.length);
      const valuesById = {};

      notifications = await Notification.qm.create(
        inAppArrayOfValues.map((values) => {
          const id = ids.shift();
          const card = getCard(values);

          const nextValues = {
            id,
            userId: values.userId,
            type: values.type,
            data: values.data,
            creatorUserId: getCreatorUserId(values),
            boardId: card ? card.boardId : (inputs.board && inputs.board.id) || null,
            cardId: card ? card.id : null,
          };

          if (values.comment) {
            nextValues.commentId = values.comment.id;
          }

          if (values.action) {
            nextValues.actionId = values.action.id;
          }

          valuesById[id] = values;
          return nextValues;
        }),
      );

      const { webhooks = await Webhook.qm.getAll() } = inputs;

      notifications.forEach((notification) => {
        const values = valuesById[notification.id];

        sails.sockets.broadcast(`user:${notification.userId}`, 'notificationCreate', {
          item: notification,
          included: {
            users: getCreatorUserId(values)
              ? [sails.helpers.users.presentOne(values.creatorUser, {})] // FIXME: hack
              : [],
          },
        });

        sails.helpers.utils.sendWebhooks.with({
          webhooks,
          event: Webhook.Events.NOTIFICATION_CREATE,
          buildData: () => ({
            item: notification,
            included: {
              ...(inputs.project && {
                projects: [inputs.project],
              }),
              ...(inputs.board && {
                boards: [inputs.board],
              }),
              ...(inputs.list && {
                lists: [inputs.list],
              }),
              ...(values.card && {
                cards: [values.card],
              }),
              ...(values.comment && {
                comments: [values.comment],
              }),
              ...(values.action && {
                actions: [values.action],
              }),
            },
          }),
          user: values.creatorUser || {},
        });
      });

      // Apprise services follow the in-app decision
      const notificationServices = await NotificationService.qm.getByUserIds(
        Object.keys(_.groupBy(notifications, 'userId')),
      );

      if (notificationServices.length > 0) {
        const notificationServicesByUserId = _.groupBy(notificationServices, 'userId');

        notifications.forEach((notification) => {
          const userNotificationServices = notificationServicesByUserId[notification.userId];

          if (!userNotificationServices) {
            return;
          }

          const values = valuesById[notification.id];
          const user = userById[notification.userId];

          buildAndSendNotifications(
            userNotificationServices.map((notificationService) =>
              _.pick(notificationService, ['url', 'format']),
            ),
            {
              ...context,
              card: getCard(values),
            },
            notification,
            values.creatorUser || null,
            user,
            sails.helpers.utils.makeTranslator(user.language),
          ).catch((error) => {
            sails.log.error(`Error sending notification: ${error}`);
          });
        });
      }
    }

    if (emailArrayOfValues.length > 0) {
      const emailArrayOfValuesByUserId = _.groupBy(emailArrayOfValues, 'userId');

      // Not awaited, like before: SMTP must not slow down the request
      Promise.all(
        Object.entries(emailArrayOfValuesByUserId).map(async ([userId, userArrayOfValues]) => {
          const user = userById[userId];
          const t = sails.helpers.utils.makeTranslator(user.language);

          const emails = userArrayOfValues.flatMap((values) => {
            const html = buildEmailHtml(
              {
                ...context,
                card: getCard(values),
              },
              values,
              values.creatorUser || null,
              t,
              user.language,
            );

            if (!html) {
              return [];
            }

            return {
              html,
              subject: buildTitle(values, t),
            };
          });

          try {
            await sails.helpers.notifications.deliverEmails.with({
              user,
              emails,
              now: inputs.now,
            });
          } catch (error) {
            sails.log.error(`Error delivering notification emails: ${error}`);
          }
        }),
      );
    }

    return notifications;
  },
};
