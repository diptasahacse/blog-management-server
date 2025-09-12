import {
  DynamicFilterBuilder,
  FilterCondition,
} from '../shared/utils/dynamic-filter-builder';
import * as schema from '../core/database/schemas';

// Example 1: Simple field filtering for posts
export function buildPostFilters(filters: {
  search?: string;
  id?: string;
  title?: string;
  status?: string;
  createdFrom?: string;
  createdTo?: string;
}) {
  const filterBuilder = new DynamicFilterBuilder();

  // Search across title and content
  if (filters.search) {
    filterBuilder.addSearch({
      fields: [schema.PostTable.title, schema.PostTable.content],
      value: filters.search,
      operator: 'ilike',
    });
  }

  // Define filter conditions
  const conditions: FilterCondition[] = [
    {
      field: schema.PostTable.id,
      operator: 'eq',
      value: filters.id,
    },
    {
      field: schema.PostTable.title,
      operator: 'ilike',
      value: filters.title,
    },
    {
      field: schema.PostTable.status,
      operator: 'eq',
      value: filters.status,
    },
    {
      field: schema.PostTable.createdAt,
      operator: 'gte',
      value: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
    },
    {
      field: schema.PostTable.createdAt,
      operator: 'lte',
      value: filters.createdTo ? new Date(filters.createdTo) : undefined,
    },
  ];

  return filterBuilder.addConditions(conditions).build();
}

// Example 2: Complex filtering with custom patterns
export function buildAdvancedFilters(filters: {
  emailDomain?: string;
  namePrefix?: string;
}) {
  const filterBuilder = new DynamicFilterBuilder();

  // Add individual conditions with custom logic
  filterBuilder
    .addCondition({
      field: schema.UserTable.email,
      operator: 'ilike',
      value: filters.emailDomain,
      pattern: '%@value', // Search for specific email domain
    })
    .addCondition({
      field: schema.UserTable.name,
      operator: 'ilike',
      value: filters.namePrefix,
      pattern: 'value%', // Search for names starting with prefix
    });

  return filterBuilder.build();
}

// Example 3: Usage in a service method
export function exampleServiceMethod(filters: { search?: string }) {
  const whereConditions = buildPostFilters(filters);

  // Use with your Drizzle query
  // const results = await db.select().from(schema.PostTable).where(whereConditions);

  return whereConditions;
}
