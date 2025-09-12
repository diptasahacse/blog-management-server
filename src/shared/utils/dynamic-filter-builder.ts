import { SQL, eq, ilike, gte, lte, and, or } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

export interface FilterCondition<T = unknown> {
  field: PgColumn;
  operator: 'eq' | 'ilike' | 'gte' | 'lte' | 'like' | 'in' | 'notIn';
  value: T;
  pattern?: string; // For like/ilike operations (e.g., '%value%', 'value%', '%value')
}

export interface SearchCondition {
  fields: PgColumn[];
  value: string;
  operator?: 'ilike' | 'like';
}

export class DynamicFilterBuilder {
  private conditions: SQL[] = [];

  /**
   * Add a condition to the filter
   */
  addCondition<T>(condition: FilterCondition<T>): this {
    if (condition.value === undefined || condition.value === null) {
      return this;
    }

    let sqlCondition: SQL;

    switch (condition.operator) {
      case 'eq': {
        sqlCondition = eq(condition.field, condition.value);
        break;
      }
      case 'ilike': {
        const ilikeValue = condition.pattern
          ? condition.pattern.replace('value', String(condition.value))
          : `%${String(condition.value)}%`;
        sqlCondition = ilike(condition.field, ilikeValue);
        break;
      }
      case 'like': {
        const likeValue = condition.pattern
          ? condition.pattern.replace('value', String(condition.value))
          : `%${String(condition.value)}%`;
        sqlCondition = ilike(condition.field, likeValue);
        break;
      }
      case 'gte': {
        sqlCondition = gte(condition.field, condition.value);
        break;
      }
      case 'lte': {
        sqlCondition = lte(condition.field, condition.value);
        break;
      }
      default:
        throw new Error(`Unsupported operator: ${condition.operator}`);
    }

    this.conditions.push(sqlCondition);
    return this;
  }

  /**
   * Add multiple conditions at once
   */
  addConditions(conditions: FilterCondition[]): this {
    conditions.forEach((condition) => this.addCondition(condition));
    return this;
  }

  /**
   * Add a search condition that searches across multiple fields
   */
  addSearch(searchCondition: SearchCondition): this {
    if (!searchCondition.value?.trim()) {
      return this;
    }

    const operator = searchCondition.operator || 'ilike';
    const searchValue = `%${searchCondition.value.trim()}%`;

    const searchConditions = searchCondition.fields.map((field) =>
      operator === 'ilike'
        ? ilike(field, searchValue)
        : ilike(field, searchValue),
    );

    if (searchConditions.length > 0) {
      const combinedSearch =
        searchConditions.length === 1
          ? searchConditions[0]
          : or(...searchConditions);

      if (combinedSearch) {
        this.conditions.push(combinedSearch);
      }
    }

    return this;
  }

  /**
   * Build the final WHERE condition
   */
  build(): SQL | undefined {
    return this.conditions.length > 0 ? and(...this.conditions) : undefined;
  }

  /**
   * Clear all conditions
   */
  clear(): this {
    this.conditions = [];
    return this;
  }

  /**
   * Get the number of conditions
   */
  count(): number {
    return this.conditions.length;
  }
}
