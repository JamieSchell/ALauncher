/**
 * Server Statistics Service
 * Сохранение и получение статистики онлайн игроков (каждые 5 минут)
 */

import { prisma } from './database';

interface StatisticsData {
  online: number;
  average: number;
  minimum: number;
  maximum: number;
}

/**
 * Сохранить статистику для сервера (каждые 5 минут)
 */
export async function saveServerStatistics(
  serverAddress: string,
  online: number
): Promise<void> {
  try {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    // Округляем до ближайших 5 минут
    const minuteSlot = Math.floor(minute / 5) * 5;
    
    // Создаем уникальный ключ для 5-минутного интервала
    const timeSlot = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minuteSlot, 0);
    
    // Получить статистику за текущий 5-минутный интервал
    const currentSlotStats = await prisma.serverStatistics.findFirst({
      where: {
        serverAddress,
        hour,
        timestamp: {
          gte: timeSlot,
          lt: new Date(timeSlot.getTime() + 5 * 60 * 1000), // +5 минут
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (currentSlotStats) {
      // Обновить существующую запись
      const newAverage = Math.round((currentSlotStats.average + online) / 2);
      const newMinimum = Math.min(currentSlotStats.minimum, online);
      const newMaximum = Math.max(currentSlotStats.maximum, online);

      await prisma.serverStatistics.update({
        where: { id: currentSlotStats.id },
        data: {
          online,
          average: newAverage,
          minimum: newMinimum,
          maximum: newMaximum,
          timestamp: timeSlot, // Используем timeSlot вместо now для правильного сопоставления
        },
      });
      console.log(`[Server Statistics] Updated stats for ${serverAddress} at ${timeSlot.toISOString()}: online=${online}, avg=${newAverage}`);
    } else {
      // Создать новую запись
      await prisma.serverStatistics.create({
        data: {
          serverAddress,
          hour,
          online,
          average: online,
          minimum: online,
          maximum: online,
          timestamp: timeSlot,
        },
      });
      console.log(`[Server Statistics] Created new stats for ${serverAddress} at ${timeSlot.toISOString()}: online=${online}`);
    }

    // Удалить старые записи (старше 7 дней)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await prisma.serverStatistics.deleteMany({
      where: {
        serverAddress,
        timestamp: {
          lt: sevenDaysAgo,
        },
      },
    });
  } catch (error) {
    console.error(`[Server Statistics] Error saving statistics for ${serverAddress}:`, error);
  }
}

/**
 * Получить статистику за последние 24 часа (каждые 5 минут)
 * 24 часа * 12 интервалов по 5 минут = 288 точек данных
 */
export async function getServerStatistics24h(serverAddress: string): Promise<StatisticsData[]> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Получить все записи за последние 24 часа
  const stats = await prisma.serverStatistics.findMany({
    where: {
      serverAddress,
      timestamp: {
        gte: twentyFourHoursAgo,
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
  });

  console.log(`[Server Statistics] Found ${stats.length} records for ${serverAddress} in last 24h`);

  // Создать массив для всех 288 интервалов (24 часа * 12 интервалов по 5 минут)
  const result: StatisticsData[] = [];
  const statsMap = new Map<string, StatisticsData>();

  // Заполнить карту данными из базы с правильным ключом (округленное время)
  stats.forEach(stat => {
    // Округляем timestamp до 5 минут для правильного сопоставления
    const roundedMinutes = Math.floor(stat.timestamp.getMinutes() / 5) * 5;
    const roundedTime = new Date(
      stat.timestamp.getFullYear(),
      stat.timestamp.getMonth(),
      stat.timestamp.getDate(),
      stat.timestamp.getHours(),
      roundedMinutes,
      0
    );
    const key = roundedTime.getTime().toString(); // Используем timestamp для точного сопоставления
    
    statsMap.set(key, {
      online: stat.online,
      average: stat.average,
      minimum: stat.minimum,
      maximum: stat.maximum,
    });
  });

  // Создать массив для всех 288 интервалов (каждые 5 минут за последние 24 часа)
  for (let i = 287; i >= 0; i--) {
    const intervalTime = new Date(now.getTime() - i * 5 * 60 * 1000);
    // Округляем до ближайших 5 минут
    const roundedMinutes = Math.floor(intervalTime.getMinutes() / 5) * 5;
    const roundedTime = new Date(
      intervalTime.getFullYear(),
      intervalTime.getMonth(),
      intervalTime.getDate(),
      intervalTime.getHours(),
      roundedMinutes,
      0
    );
    
    const key = roundedTime.getTime().toString();
    const stat = statsMap.get(key);
    
    if (stat) {
      result.push(stat);
    } else {
      // Если данных нет, используем предыдущее значение или 0
      const prevStat = result.length > 0 ? result[result.length - 1] : { online: 0, average: 0, minimum: 0, maximum: 0 };
      result.push({ ...prevStat });
    }
  }

  const intervalsWithData = result.filter(s => s.online > 0 || s.average > 0 || s.minimum > 0 || s.maximum > 0).length;
  console.log(`[Server Statistics] Returning ${result.length} intervals, ${intervalsWithData} with data`);

  return result;
}

