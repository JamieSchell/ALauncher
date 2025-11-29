/**
 * Notification Service
 * Сервис для создания и управления уведомлениями
 */

import { PrismaClient, NotificationType } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  /**
   * Создать уведомление для пользователя
   * Автоматически ограничивает количество уведомлений до 10 (удаляет старые)
   */
  static async createNotification(data: CreateNotificationData): Promise<void> {
    try {
      // Создать новое уведомление
      await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || null,
        },
      });

      // Получить общее количество уведомлений пользователя
      const totalCount = await prisma.notification.count({
        where: { userId: data.userId },
      });

      // Если больше 10, удалить самые старые
      if (totalCount > 10) {
        const notificationsToDelete = await prisma.notification.findMany({
          where: { userId: data.userId },
          orderBy: { createdAt: 'asc' },
          take: totalCount - 10,
          select: { id: true },
        });

        if (notificationsToDelete.length > 0) {
          await prisma.notification.deleteMany({
            where: {
              id: { in: notificationsToDelete.map(n => n.id) },
            },
          });

          logger.info(`[NotificationService] Deleted ${notificationsToDelete.length} old notifications for user ${data.userId}`);
        }
      }

      logger.info(`[NotificationService] Created notification for user ${data.userId}: ${data.type} - ${data.title}`);
    } catch (error) {
      logger.error(`[NotificationService] Error creating notification:`, error);
      throw error;
    }
  }

  /**
   * Создать уведомление для всех пользователей
   */
  static async createNotificationForAllUsers(
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      // Создать уведомления для всех пользователей параллельно
      await Promise.all(
        users.map(user =>
          this.createNotification({
            userId: user.id,
            type,
            title,
            message,
            data,
          })
        )
      );

      logger.info(`[NotificationService] Created notification for all ${users.length} users: ${type} - ${title}`);
    } catch (error) {
      logger.error(`[NotificationService] Error creating notification for all users:`, error);
      throw error;
    }
  }

  /**
   * Создать уведомление об обновлении лаунчера
   */
  static async notifyLauncherUpdate(
    userId: string,
    currentVersion: string,
    newVersion: string,
    isRequired: boolean = false
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.LAUNCHER_UPDATE_AVAILABLE,
      title: isRequired ? 'Обновление лаунчера (обязательное)' : 'Доступно обновление лаунчера',
      message: `Доступна новая версия лаунчера: ${newVersion}\nТекущая версия: ${currentVersion}\n\n${isRequired ? 'Обновление обязательно для продолжения работы.' : 'Рекомендуется обновить лаунчер для получения новых функций и исправлений.'}`,
      data: {
        currentVersion,
        newVersion,
        isRequired,
      },
    });
  }

  /**
   * Создать уведомление об обновлении клиента
   */
  static async notifyClientUpdate(
    userId: string,
    version: string,
    profileTitle?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.CLIENT_UPDATE_AVAILABLE,
      title: 'Доступно обновление клиента',
      message: profileTitle
        ? `Доступна новая версия клиента для профиля "${profileTitle}": ${version}\n\nКлиент будет автоматически загружен при следующем запуске.`
        : `Доступна новая версия клиента: ${version}\n\nКлиент будет автоматически загружен при следующем запуске.`,
      data: {
        version,
        profileTitle,
      },
    });
  }

  /**
   * Создать уведомление об ошибке лаунчера
   */
  static async notifyLauncherError(
    userId: string,
    errorMessage: string,
    component?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.LAUNCHER_ERROR,
      title: 'Ошибка лаунчера',
      message: component
        ? `Произошла ошибка в компоненте "${component}":\n${errorMessage}`
        : `Произошла ошибка:\n${errorMessage}`,
      data: {
        component,
        errorMessage,
      },
    });
  }

  /**
   * Создать уведомление о крэше игры
   */
  static async notifyGameCrash(
    userId: string,
    profileTitle: string,
    exitCode: number,
    errorMessage?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.GAME_CRASH,
      title: 'Игра завершилась с ошибкой',
      message: `Игра "${profileTitle}" завершилась с кодом выхода ${exitCode}.\n${errorMessage ? `\nОшибка: ${errorMessage}` : ''}`,
      data: {
        profileTitle,
        exitCode,
        errorMessage,
      },
    });
  }

  /**
   * Создать системное сообщение
   */
  static async notifySystemMessage(
    userId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: NotificationType.SYSTEM_MESSAGE,
      title,
      message,
      data,
    });
  }
}

