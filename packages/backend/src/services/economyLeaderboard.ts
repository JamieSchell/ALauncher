import { Prisma } from '@prisma/client';
import { EconomyLeaderboardConfig, EconomyLeaderboardPayload } from '@modern-launcher/shared';
import { prisma } from './database';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const IDENTIFIER_REGEX = /^[A-Za-z0-9_]+$/;
const TABLE_REGEX = /^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)?$/;
const ENV_PLACEHOLDER_REGEX = /^\$\{([A-Z0-9_]+)\}$/;
const ALLOWED_OPERATORS = new Set(['=', '!=', '>', '<', '>=', '<=', 'LIKE']);

const DEFAULT_LIMIT = config.economy.defaultLimit || 5;
const MAX_LIMIT = config.economy.maxLimit || 20;

function resolveEnvValue(value?: string | number | null) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }

  const envMatch = value.match(ENV_PLACEHOLDER_REGEX);
  if (envMatch) {
    const envValue = process.env[envMatch[1]];
    return envValue !== undefined ? envValue : undefined;
  }

  return value;
}

function sanitizeColumn(column?: string) {
  const resolved = resolveEnvValue(column) as string | undefined;
  if (!resolved || !IDENTIFIER_REGEX.test(resolved)) {
    throw new AppError(400, `Invalid column name: ${column}`);
  }
  return Prisma.raw(`\`${resolved}\``);
}

function sanitizeTable(table?: string) {
  const resolved = resolveEnvValue(table) as string | undefined;
  if (!resolved || !TABLE_REGEX.test(resolved)) {
    throw new AppError(400, 'Invalid table name for economy leaderboard');
  }

  const parts = resolved.split('.');
  const quoted = parts.map(part => `\`${part}\``).join('.');
  return Prisma.raw(quoted);
}

function sanitizeOperator(operator?: string) {
  const op = operator?.toUpperCase();
  if (op && ALLOWED_OPERATORS.has(op)) {
    return Prisma.raw(op);
  }
  return Prisma.raw('=');
}

function normalizeLimit(limit?: number) {
  const fallback = Number.isFinite(limit || NaN) ? Number(limit) : DEFAULT_LIMIT;
  return Math.min(Math.max(1, fallback), MAX_LIMIT);
}

export async function getEconomyLeaderboard(configData: EconomyLeaderboardConfig): Promise<EconomyLeaderboardPayload> {
  if (!configData?.table || !configData.usernameColumn || !configData.balanceColumn) {
    throw new AppError(400, 'Economy leaderboard config is incomplete');
  }

  const tableIdentifier = sanitizeTable(configData.table);
  const usernameColumn = sanitizeColumn(configData.usernameColumn);
  const balanceColumn = sanitizeColumn(configData.balanceColumn);
  const orderDirection = (configData.order || 'desc').toLowerCase() === 'asc' ? Prisma.raw('ASC') : Prisma.raw('DESC');
  const limit = normalizeLimit(configData.limit);
  const precision = typeof configData.precision === 'number' && configData.precision >= 0 ? configData.precision : 0;
  const currencySymbol = resolveEnvValue(configData.currencySymbol) as string | undefined;

  const filters = Array.isArray(configData.filters) ? configData.filters : [];
  const filterClauses = filters
    .map(filter => {
      if (!filter?.column) return null;
      const column = sanitizeColumn(filter.column);
      const operator = sanitizeOperator(filter.operator);
      const value = resolveEnvValue(filter.value);
      if (value === undefined) return null;
      return Prisma.sql`${column} ${operator} ${value}`;
    })
    .filter((clause): clause is Prisma.Sql => clause !== null);

  const whereClause =
    filterClauses.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(filterClauses, ' AND ')}`
      : Prisma.sql``;

  try {
    const rows = await prisma.$queryRaw<
      Array<{ username: string | null; balance: string | number | null }>
    >(
      Prisma.sql`
        SELECT ${usernameColumn} AS username,
               ${balanceColumn} AS balance
        FROM ${tableIdentifier}
        ${whereClause}
        ORDER BY ${balanceColumn} ${orderDirection}
        LIMIT ${limit}
      `
    );

    const players = rows.map((row, index) => ({
      username: row.username ?? 'Unknown',
      balance: Number(row.balance ?? 0),
      rank: index + 1,
    }));

    return {
      players,
      currencySymbol,
      precision,
      limit,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error: any) {
    // Check if error is due to table not existing
    const errorMessage = error?.message || '';
    const isTableNotFound = 
      errorMessage.includes("doesn't exist") ||
      errorMessage.includes("Unknown table") ||
      errorMessage.includes("Table") && errorMessage.includes("doesn't exist") ||
      error?.code === 'ER_NO_SUCH_TABLE' ||
      error?.code === '42S02';

    if (isTableNotFound) {
      logger.warn('[EconomyLeaderboard] Table not found, returning empty leaderboard', {
        table: configData.table,
        error: errorMessage,
      });
      // Return empty leaderboard instead of throwing error
      return {
        players: [],
        currencySymbol,
        precision,
        limit: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    logger.error('[EconomyLeaderboard] Failed to fetch leaderboard', {
      error: error?.message,
      code: error?.code,
    });
    throw new AppError(500, 'Failed to fetch economy leaderboard');
  }
}

