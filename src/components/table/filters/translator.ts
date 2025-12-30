/**
 * Translates filter conditions to Supabase/PostgreSQL queries
 */

import { FilterCondition, FilterGroup, FilterConfig } from './types';

interface TranslatedFilter {
  query: string;
  params: Record<string, any>;
  humanReadable: string;
}

/**
 * Translates a single condition to SQL WHERE clause
 */
export function translateCondition(
  condition: FilterCondition,
  paramPrefix: string = 'param'
): { sql: string; params: Record<string, any>; human: string } {
  const { field, operator, value, fieldType } = condition;
  const paramName = `${paramPrefix}_${condition.id}`;
  const params: Record<string, any> = {};
  let sql = '';
  let human = '';

  switch (operator) {
    // TEXT: EQUALS
    case 'equals':
      sql = `${field} = $${paramName}`;
      params[paramName] = value;
      human = `${condition.label || field} equals "${value}"`;
      break;

    // TEXT: NOT EQUALS
    case 'notEquals':
      sql = `${field} != $${paramName}`;
      params[paramName] = value;
      human = `${condition.label || field} is not "${value}"`;
      break;

    // TEXT: CONTAINS
    case 'contains':
      sql = `${field} ILIKE $${paramName}`;
      params[paramName] = `%${value}%`;
      human = `${condition.label || field} contains "${value}"`;
      break;

    // TEXT: NOT CONTAINS
    case 'notContains':
      sql = `${field} NOT ILIKE $${paramName}`;
      params[paramName] = `%${value}%`;
      human = `${condition.label || field} does not contain "${value}"`;
      break;

    // TEXT: STARTS WITH
    case 'startsWith':
      sql = `${field} ILIKE $${paramName}`;
      params[paramName] = `${value}%`;
      human = `${condition.label || field} starts with "${value}"`;
      break;

    // TEXT: ENDS WITH
    case 'endsWith':
      sql = `${field} ILIKE $${paramName}`;
      params[paramName] = `%${value}`;
      human = `${condition.label || field} ends with "${value}"`;
      break;

    // EMPTY/NULL
    case 'isEmpty':
      sql = `(${field} IS NULL OR ${field} = '')`;
      human = `${condition.label || field} is empty`;
      break;

    case 'isNotEmpty':
      sql = `(${field} IS NOT NULL AND ${field} != '')`;
      human = `${condition.label || field} is not empty`;
      break;

    case 'isNull':
      sql = `${field} IS NULL`;
      human = `${condition.label || field} is null`;
      break;

    case 'isNotNull':
      sql = `${field} IS NOT NULL`;
      human = `${condition.label || field} is not null`;
      break;

    // REGEX
    case 'regex':
      sql = `${field} ~ $${paramName}`;
      params[paramName] = value;
      human = `${condition.label || field} matches pattern "${value}"`;
      break;

    // NUMBER: GREATER THAN
    case 'greaterThan':
      sql = `${field} > $${paramName}`;
      params[paramName] = Number(value);
      human = `${condition.label || field} > ${value}`;
      break;

    // NUMBER: LESS THAN
    case 'lessThan':
      sql = `${field} < $${paramName}`;
      params[paramName] = Number(value);
      human = `${condition.label || field} < ${value}`;
      break;

    // NUMBER: GREATER EQUAL
    case 'greaterEqual':
      sql = `${field} >= $${paramName}`;
      params[paramName] = Number(value);
      human = `${condition.label || field} >= ${value}`;
      break;

    // NUMBER: LESS EQUAL
    case 'lessEqual':
      sql = `${field} <= $${paramName}`;
      params[paramName] = Number(value);
      human = `${condition.label || field} <= ${value}`;
      break;

    // NUMBER: BETWEEN
    case 'between':
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error('Between operator requires [min, max] array');
      }
      sql = `${field} BETWEEN $${paramName}_min AND $${paramName}_max`;
      params[`${paramName}_min`] = Number(value[0]);
      params[`${paramName}_max`] = Number(value[1]);
      human = `${condition.label || field} between ${value[0]} and ${value[1]}`;
      break;

    // NUMBER: NOT BETWEEN
    case 'notBetween':
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error('NotBetween operator requires [min, max] array');
      }
      sql = `${field} NOT BETWEEN $${paramName}_min AND $${paramName}_max`;
      params[`${paramName}_min`] = Number(value[0]);
      params[`${paramName}_max`] = Number(value[1]);
      human = `${condition.label || field} not between ${value[0]} and ${value[1]}`;
      break;

    // DATE: EQUALS
    case 'dateEquals':
      sql = `DATE(${field}) = $${paramName}`;
      params[paramName] = value;  // YYYY-MM-DD format
      human = `${condition.label || field} equals ${value}`;
      break;

    // DATE: NOT EQUALS
    case 'dateNotEquals':
      sql = `DATE(${field}) != $${paramName}`;
      params[paramName] = value;
      human = `${condition.label || field} is not ${value}`;
      break;

    // DATE: BEFORE
    case 'dateBefore':
      sql = `DATE(${field}) < $${paramName}`;
      params[paramName] = value;
      human = `${condition.label || field} before ${value}`;
      break;

    // DATE: AFTER
    case 'dateAfter':
      sql = `DATE(${field}) > $${paramName}`;
      params[paramName] = value;
      human = `${condition.label || field} after ${value}`;
      break;

    // DATE: DAYS AGO
    case 'daysAgo':
      sql = `${field} > NOW() - INTERVAL '${value} days'`;
      human = `${condition.label || field} within last ${value} days`;
      break;

    // DATE: DAYS AFTER
    case 'daysAfter':
      sql = `${field} < NOW() + INTERVAL '${value} days'`;
      human = `${condition.label || field} in next ${value} days`;
      break;

    // DATE: CURRENT MONTH
    case 'currentMonth':
      sql = `EXTRACT(MONTH FROM ${field}) = EXTRACT(MONTH FROM NOW()) AND EXTRACT(YEAR FROM ${field}) = EXTRACT(YEAR FROM NOW())`;
      human = `${condition.label || field} in current month`;
      break;

    // DATE: CURRENT YEAR
    case 'currentYear':
      sql = `EXTRACT(YEAR FROM ${field}) = EXTRACT(YEAR FROM NOW())`;
      human = `${condition.label || field} in current year`;
      break;

    // DATE: TODAY
    case 'isToday':
      sql = `DATE(${field}) = CURRENT_DATE`;
      human = `${condition.label || field} is today`;
      break;

    // DATE: YESTERDAY
    case 'isYesterday':
      sql = `DATE(${field}) = CURRENT_DATE - 1`;
      human = `${condition.label || field} is yesterday`;
      break;

    // DATE: TOMORROW
    case 'isTomorrow':
      sql = `DATE(${field}) = CURRENT_DATE + 1`;
      human = `${condition.label || field} is tomorrow`;
      break;

    // ARRAY: IN
    case 'in':
      if (!Array.isArray(value)) {
        throw new Error('IN operator requires array value');
      }
      const inParams = value.map((v, i) => `$${paramName}_${i}`);
      value.forEach((v, i) => {
        params[`${paramName}_${i}`] = v;
      });
      sql = `${field} IN (${inParams.join(', ')})`;
      human = `${condition.label || field} in [${value.join(', ')}]`;
      break;

    // ARRAY: NOT IN
    case 'notIn':
      if (!Array.isArray(value)) {
        throw new Error('NOT IN operator requires array value');
      }
      const notInParams = value.map((v, i) => `$${paramName}_${i}`);
      value.forEach((v, i) => {
        params[`${paramName}_${i}`] = v;
      });
      sql = `${field} NOT IN (${notInParams.join(', ')})`;
      human = `${condition.label || field} not in [${value.join(', ')}]`;
      break;

    // ARRAY: CONTAINS ANY (for PostgreSQL array types)
    case 'contains_any':
      if (!Array.isArray(value)) {
        throw new Error('contains_any requires array value');
      }
      sql = `${field} && $${paramName}`;  // PostgreSQL array overlap operator
      params[paramName] = value;
      human = `${condition.label || field} contains any of [${value.join(', ')}]`;
      break;

    // ARRAY: CONTAINS ALL
    case 'contains_all':
      if (!Array.isArray(value)) {
        throw new Error('contains_all requires array value');
      }
      sql = `${field} @> $${paramName}`;  // PostgreSQL array contains operator
      params[paramName] = value;
      human = `${condition.label || field} contains all of [${value.join(', ')}]`;
      break;

    // BOOLEAN
    case 'isTrue':
      sql = `${field} = true`;
      human = `${condition.label || field} is true`;
      break;

    case 'isFalse':
      sql = `${field} = false`;
      human = `${condition.label || field} is false`;
      break;

    default:
      throw new Error(`Unknown operator: ${operator}`);
  }

  return { sql, params, human };
}

/**
 * Translates a filter group to SQL WHERE clause
 */
export function translateFilterGroup(
  group: FilterGroup,
  paramPrefix: string = 'param'
): { sql: string; params: Record<string, any>; human: string } {
  const allParams: Record<string, any> = {};
  const sqlParts: string[] = [];
  const humanParts: string[] = [];

  let paramCounter = 0;

  // Process conditions
  group.conditions.forEach((condition) => {
    const prefix = `${paramPrefix}_${paramCounter++}`;
    const { sql, params, human } = translateCondition(condition, prefix);
    sqlParts.push(`(${sql})`);
    humanParts.push(human);
    Object.assign(allParams, params);
  });

  // Process nested groups
  if (group.groups && group.groups.length > 0) {
    group.groups.forEach((nestedGroup) => {
      const prefix = `${paramPrefix}_${paramCounter++}`;
      const { sql, params, human } = translateFilterGroup(nestedGroup, prefix);
      sqlParts.push(`(${sql})`);
      humanParts.push(human);
      Object.assign(allParams, params);
    });
  }

  const joiner = ` ${group.logic.toUpperCase()} `;
  const sql = sqlParts.join(joiner);
  const human = humanParts.join(` ${group.logic.toUpperCase()} `);

  return { sql, params: allParams, human };
}

/**
 * Translates a complete filter config to SQL WHERE clause
 */
export function translateFilterConfig(config: FilterConfig): {
  sql: string;
  params: Record<string, any>;
  human: string;
} {
  if (config.conditions.length === 0 && (!config.groups || config.groups.length === 0)) {
    return { sql: '1=1', params: {}, human: 'No filters' };
  }

  const group: FilterGroup = {
    id: 'root',
    logic: config.logic,
    conditions: config.conditions,
    groups: config.groups
  };

  return translateFilterGroup(group);
}

/**
 * Helper to apply filter to Supabase query
 * Note: Supabase doesn't support full SQL WHERE syntax directly
 * This returns the where clause for manual query construction
 */
export function buildSupabaseWhereClause(
  conditions: FilterCondition[],
  logic: 'and' | 'or' = 'and'
): string[] {
  const clauses: string[] = [];

  conditions.forEach((condition) => {
    const { sql } = translateCondition(condition);
    clauses.push(sql);
  });

  return clauses;
}

// ========================================
// HUMAN READABLE DESCRIPTIONS
// ========================================

export function getFilterDescription(config: FilterConfig): string {
  const { sql, human } = translateFilterConfig(config);
  return human;
}

export function formatFilterForDisplay(config: FilterConfig): string {
  const parts: string[] = [];

  if (config.name) {
    parts.push(`<strong>${config.name}</strong>`);
  }

  if (config.conditions.length > 0) {
    const conditions = config.conditions
      .map((c) => `${c.label || c.field} ${OPERATOR_CONFIG[c.operator]?.label || c.operator}`)
      .join(` ${config.logic.toUpperCase()} `);
    parts.push(conditions);
  }

  return parts.join(': ');
}

// Re-export operator config for use in filters module
import { OPERATOR_CONFIG } from './types';
