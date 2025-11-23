/**
 * Statistics Service
 * Сервис для работы со статистикой использования лаунчера
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GameLaunchData {
  userId?: string;
  username?: string;
  profileId?: string;
  profileVersion?: string;
  serverAddress?: string;
  serverPort?: number;
  javaVersion?: string;
  javaPath?: string;
  ram?: number;
  resolution?: string;
  fullScreen?: boolean;
  autoEnter?: boolean;
  os?: string;
  osVersion?: string;
}

export interface GameSessionData {
  launchId: string;
  userId?: string;
  username?: string;
  profileId?: string;
  profileVersion?: string;
  serverAddress?: string;
  serverPort?: number;
  exitCode?: number;
  crashed?: boolean;
}

/**
 * Создать запись о запуске игры
 */
export async function createGameLaunch(data: GameLaunchData): Promise<string> {
  const launch = await prisma.gameLaunch.create({
    data: {
      userId: data.userId,
      username: data.username,
      profileId: data.profileId,
      profileVersion: data.profileVersion,
      serverAddress: data.serverAddress,
      serverPort: data.serverPort,
      javaVersion: data.javaVersion,
      javaPath: data.javaPath,
      ram: data.ram,
      resolution: data.resolution,
      fullScreen: data.fullScreen ?? false,
      autoEnter: data.autoEnter ?? false,
      os: data.os,
      osVersion: data.osVersion,
    },
  });

  return launch.id;
}

/**
 * Создать сессию игры
 */
export async function createGameSession(data: GameSessionData): Promise<string> {
  const session = await prisma.gameSession.create({
    data: {
      launchId: data.launchId,
      userId: data.userId,
      username: data.username,
      profileId: data.profileId,
      profileVersion: data.profileVersion,
      serverAddress: data.serverAddress,
      serverPort: data.serverPort,
      exitCode: data.exitCode,
      crashed: data.crashed ?? false,
    },
  });

  return session.id;
}

/**
 * Завершить сессию игры
 */
export async function endGameSession(sessionId: string, exitCode?: number, crashed?: boolean): Promise<void> {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  const endedAt = new Date();
  const duration = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: {
      endedAt,
      duration,
      exitCode: exitCode ?? session.exitCode,
      crashed: crashed ?? (exitCode !== undefined && exitCode !== 0),
    },
  });
}

/**
 * Найти активную сессию по launchId
 */
export async function findActiveSessionByLaunchId(launchId: string) {
  return await prisma.gameSession.findFirst({
    where: {
      launchId,
      endedAt: null,
    },
  });
}

/**
 * Получить статистику использования для пользователя
 */
export async function getUserStatistics(userId: string, days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Общее время игры (в секундах)
    const totalPlayTime = await prisma.gameSession.aggregate({
    where: {
      userId,
      endedAt: { not: null },
      startedAt: { gte: startDate },
    },
    _sum: {
      duration: true,
    },
  });

  // Количество запусков
  const totalLaunches = await prisma.gameLaunch.count({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
  });

  // Количество завершенных сессий
  const totalSessions = await prisma.gameSession.count({
    where: {
      userId,
      endedAt: { not: null },
      startedAt: { gte: startDate },
    },
  });

  // Время игры по профилям
  const playTimeByProfile = await prisma.gameSession.groupBy({
    by: ['profileId'],
    where: {
      userId,
      endedAt: { not: null },
      startedAt: { gte: startDate },
    },
    _sum: {
      duration: true,
    },
    _count: {
      id: true,
    },
  });

  // Популярные профили (по количеству запусков)
  const popularProfiles = await prisma.gameLaunch.groupBy({
    by: ['profileId'],
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  });

  // История запусков
  const launchHistory = await prisma.gameLaunch.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    include: {
      session: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  // Статистика по дням (для графика)
  // Получаем все запуски и сессии, затем группируем по дням в памяти
  const allLaunches = await prisma.gameLaunch.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  const allSessions = await prisma.gameSession.findMany({
    where: {
      userId,
      endedAt: { not: null },
      startedAt: { gte: startDate },
    },
    select: {
      duration: true,
      startedAt: true,
    },
  });

  // Группируем по дням
  const dailyStatsMap = new Map<string, { launches: number; playTime: number }>();
  
  allLaunches.forEach(launch => {
    const date = new Date(launch.createdAt).toISOString().split('T')[0];
    const existing = dailyStatsMap.get(date) || { launches: 0, playTime: 0 };
    dailyStatsMap.set(date, { launches: existing.launches + 1, playTime: existing.playTime });
  });

  allSessions.forEach(session => {
    const date = new Date(session.startedAt).toISOString().split('T')[0];
    const existing = dailyStatsMap.get(date) || { launches: 0, playTime: 0 };
    dailyStatsMap.set(date, { launches: existing.launches, playTime: existing.playTime + (session.duration || 0) });
  });

  // Заполняем пропущенные дни нулями
  const dailyStats: Array<{ date: Date; launches: number; playTime: number }> = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const stats = dailyStatsMap.get(dateStr) || { launches: 0, playTime: 0 };
    dailyStats.push({
      date: new Date(date),
      launches: stats.launches,
      playTime: stats.playTime,
    });
  }

  dailyStats.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    totalPlayTime: totalPlayTime._sum.duration || 0,
    totalLaunches,
    totalSessions,
    playTimeByProfile: playTimeByProfile.map(p => ({
      profileId: p.profileId,
      duration: p._sum.duration || 0,
      sessions: p._count.id,
    })),
    popularProfiles: popularProfiles.map(p => ({
      profileId: p.profileId,
      launches: p._count.id,
    })),
    launchHistory: launchHistory.map(launch => ({
      id: launch.id,
      createdAt: launch.createdAt,
      profileId: launch.profileId,
      profileVersion: launch.profileVersion,
      serverAddress: launch.serverAddress,
      serverPort: launch.serverPort,
      duration: launch.session?.duration || null,
      exitCode: launch.session?.exitCode || null,
      crashed: launch.session?.crashed || false,
    })),
    dailyStats: dailyStats.map(stat => ({
      date: stat.date.toISOString(),
      launches: Number(stat.launches),
      playTime: Number(stat.playTime),
    })),
  };
  } catch (error: any) {
    console.error('[Statistics] Error getting user statistics:', error);
    console.error('[Statistics] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    // Если таблицы не существуют, возвращаем пустую статистику
    if (
      error.message?.includes('does not exist') || 
      error.message?.includes('Unknown table') || 
      error.code === 'P2021' ||
      error.code === 'P2001' ||
      error.message?.includes('Table') && error.message?.includes('doesn\'t exist')
    ) {
      console.warn('[Statistics] Tables do not exist, returning empty statistics');
      return {
        totalPlayTime: 0,
        totalLaunches: 0,
        totalSessions: 0,
        playTimeByProfile: [],
        popularProfiles: [],
        launchHistory: [],
        dailyStats: [],
      };
    }
    throw error;
  }
}

/**
 * Получить аналитику для администраторов
 */
export async function getAdminAnalytics(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Активные пользователи (пользователи, которые запускали игру за период)
    const activeUsers = await prisma.gameLaunch.groupBy({
    by: ['userId'],
    where: {
      userId: { not: null },
      createdAt: { gte: startDate },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 20,
  });

  // Популярные серверы (по количеству запусков)
  const popularServers = await prisma.gameLaunch.groupBy({
    by: ['serverAddress', 'serverPort'],
    where: {
      serverAddress: { not: null },
      createdAt: { gte: startDate },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 20,
  });

  // Популярные профили (по количеству запусков)
  const popularProfiles = await prisma.gameLaunch.groupBy({
    by: ['profileId'],
    where: {
      profileId: { not: null },
      createdAt: { gte: startDate },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 20,
  });

  // Общая статистика
  const totalLaunches = await prisma.gameLaunch.count({
    where: {
      createdAt: { gte: startDate },
    },
  });

  const totalSessions = await prisma.gameSession.count({
    where: {
      startedAt: { gte: startDate },
      endedAt: { not: null },
    },
  });

  const totalPlayTime = await prisma.gameSession.aggregate({
    where: {
      endedAt: { not: null },
      startedAt: { gte: startDate },
    },
    _sum: {
      duration: true,
    },
  });

  // Проблемы и ошибки
  const totalCrashes = await prisma.gameCrash.count({
    where: {
      createdAt: { gte: startDate },
    },
  });

  const totalConnectionIssues = await prisma.serverConnectionIssue.count({
    where: {
      createdAt: { gte: startDate },
    },
  });

  const crashedSessions = await prisma.gameSession.count({
    where: {
      crashed: true,
      startedAt: { gte: startDate },
    },
  });

  // Статистика по дням
  // Получаем все данные, затем группируем по дням в памяти
  const allLaunches = await prisma.gameLaunch.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  const allSessions = await prisma.gameSession.findMany({
    where: {
      startedAt: { gte: startDate },
    },
    select: {
      id: true,
      duration: true,
      startedAt: true,
      endedAt: true,
    },
  });

  const allCrashes = await prisma.gameCrash.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  const allIssues = await prisma.serverConnectionIssue.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  // Группируем по дням
  const dailyStatsMap = new Map<string, { launches: number; sessions: number; playTime: number; crashes: number; connectionIssues: number }>();
  
  allLaunches.forEach(launch => {
    const date = new Date(launch.createdAt).toISOString().split('T')[0];
    const existing = dailyStatsMap.get(date) || { launches: 0, sessions: 0, playTime: 0, crashes: 0, connectionIssues: 0 };
    dailyStatsMap.set(date, { ...existing, launches: existing.launches + 1 });
  });

  allSessions.forEach(session => {
    const date = new Date(session.startedAt).toISOString().split('T')[0];
    const existing = dailyStatsMap.get(date) || { launches: 0, sessions: 0, playTime: 0, crashes: 0, connectionIssues: 0 };
    dailyStatsMap.set(date, { 
      ...existing, 
      sessions: existing.sessions + (session.endedAt ? 1 : 0),
      playTime: existing.playTime + (session.duration || 0),
    });
  });

  allCrashes.forEach(crash => {
    const date = new Date(crash.createdAt).toISOString().split('T')[0];
    const existing = dailyStatsMap.get(date) || { launches: 0, sessions: 0, playTime: 0, crashes: 0, connectionIssues: 0 };
    dailyStatsMap.set(date, { ...existing, crashes: existing.crashes + 1 });
  });

  allIssues.forEach(issue => {
    const date = new Date(issue.createdAt).toISOString().split('T')[0];
    const existing = dailyStatsMap.get(date) || { launches: 0, sessions: 0, playTime: 0, crashes: 0, connectionIssues: 0 };
    dailyStatsMap.set(date, { ...existing, connectionIssues: existing.connectionIssues + 1 });
  });

  // Заполняем пропущенные дни нулями
  const dailyStats: Array<{ date: Date; launches: number; sessions: number; playTime: number; crashes: number; connectionIssues: number }> = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const stats = dailyStatsMap.get(dateStr) || { launches: 0, sessions: 0, playTime: 0, crashes: 0, connectionIssues: 0 };
    dailyStats.push({
      date: new Date(date),
      launches: stats.launches,
      sessions: stats.sessions,
      playTime: stats.playTime,
      crashes: stats.crashes,
      connectionIssues: stats.connectionIssues,
    });
  }

  dailyStats.sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    activeUsers: activeUsers.map(u => ({
      userId: u.userId,
      launches: u._count.id,
    })),
    popularServers: popularServers.map(s => ({
      serverAddress: s.serverAddress,
      serverPort: s.serverPort,
      launches: s._count.id,
    })),
    popularProfiles: popularProfiles.map(p => ({
      profileId: p.profileId,
      launches: p._count.id,
    })),
    totalLaunches,
    totalSessions,
    totalPlayTime: totalPlayTime._sum.duration || 0,
    totalCrashes,
    totalConnectionIssues,
    crashedSessions,
    dailyStats: dailyStats.map(stat => ({
      date: stat.date.toISOString(),
      launches: Number(stat.launches),
      sessions: Number(stat.sessions),
      playTime: Number(stat.playTime),
      crashes: Number(stat.crashes),
      connectionIssues: Number(stat.connectionIssues),
    })),
  };
  } catch (error: any) {
    console.error('[Statistics] Error getting admin analytics:', error);
    console.error('[Statistics] Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    // Если таблицы не существуют, возвращаем пустую аналитику
    if (
      error.message?.includes('does not exist') || 
      error.message?.includes('Unknown table') || 
      error.code === 'P2021' ||
      error.code === 'P2001' ||
      error.message?.includes('Table') && error.message?.includes('doesn\'t exist')
    ) {
      console.warn('[Statistics] Tables do not exist, returning empty analytics');
      return {
        activeUsers: [],
        popularServers: [],
        popularProfiles: [],
        totalLaunches: 0,
        totalSessions: 0,
        totalPlayTime: 0,
        totalCrashes: 0,
        totalConnectionIssues: 0,
        crashedSessions: 0,
        dailyStats: [],
      };
    }
    throw error;
  }
}

