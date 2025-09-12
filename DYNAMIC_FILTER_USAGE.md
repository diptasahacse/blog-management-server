# Dynamic Filter System

## Overview
The dynamic filter system provides a reusable, type-safe way to build WHERE conditions for your Drizzle ORM queries. It replaces the manual condition building with a declarative approach.

## Key Features
- ✅ **Type-safe**: Full TypeScript support with proper typing
- ✅ **Reusable**: Use across different entities and services
- ✅ **Flexible**: Support for various operators and patterns
- ✅ **Clean**: Declarative syntax replaces manual condition building
- ✅ **Maintainable**: Easy to add new filter types

## Basic Usage

### 1. Import the Dynamic Filter Builder
```typescript
import { DynamicFilterBuilder, FilterCondition } from 'src/shared/utils/dynamic-filter-builder';
```

### 2. Simple Filter Example
```typescript
private buildWhereConditions(filters: FindUsersDto): SQL | undefined {
  const filterBuilder = new DynamicFilterBuilder();

  // Global search across multiple fields
  if (filters.search) {
    filterBuilder.addSearch({
      fields: [schema.UserTable.name, schema.UserTable.email],
      value: filters.search,
      operator: 'ilike',
    });
  }

  // Define filter conditions declaratively
  const conditions: FilterCondition[] = [
    {
      field: schema.UserTable.id,
      operator: 'eq',
      value: filters.id,
    },
    {
      field: schema.UserTable.name,
      operator: 'ilike',
      value: filters.name,
    },
    {
      field: schema.UserTable.email,
      operator: 'ilike',
      value: filters.email,
    },
    {
      field: schema.UserTable.role,
      operator: 'eq',
      value: filters.role,
    },
    {
      field: schema.UserTable.createdAt,
      operator: 'gte',
      value: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
    },
    {
      field: schema.UserTable.createdAt,
      operator: 'lte',
      value: filters.createdTo ? new Date(filters.createdTo) : undefined,
    },
  ];

  return filterBuilder.addConditions(conditions).build();
}
```

## FilterCondition Interface

```typescript
interface FilterCondition<T = unknown> {
  field: PgColumn;           // The database column to filter on
  operator: 'eq' | 'ilike' | 'gte' | 'lte' | 'like' | 'in' | 'notIn';
  value: T;                  // The value to filter by
  pattern?: string;          // Custom pattern for like/ilike operations
}
```

## Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `WHERE name = 'John'` |
| `ilike` | Case-insensitive like | `WHERE name ILIKE '%john%'` |
| `like` | Case-sensitive like | `WHERE name LIKE '%John%'` |
| `gte` | Greater than or equal | `WHERE age >= 18` |
| `lte` | Less than or equal | `WHERE age <= 65` |

## Advanced Patterns

### 1. Custom Like Patterns
```typescript
{
  field: schema.UserTable.email,
  operator: 'ilike',
  value: 'gmail.com',
  pattern: '%@value',  // Results in: WHERE email ILIKE '%@gmail.com'
}

{
  field: schema.UserTable.name,
  operator: 'ilike',
  value: 'John',
  pattern: 'value%',   // Results in: WHERE name ILIKE 'John%'
}
```

### 2. Multiple Field Search
```typescript
filterBuilder.addSearch({
  fields: [schema.PostTable.title, schema.PostTable.content],
  value: 'javascript',
  operator: 'ilike',
});
// Results in: WHERE (title ILIKE '%javascript%' OR content ILIKE '%javascript%')
```

### 3. Method Chaining
```typescript
const whereConditions = new DynamicFilterBuilder()
  .addCondition({
    field: schema.UserTable.role,
    operator: 'eq',
    value: 'admin',
  })
  .addCondition({
    field: schema.UserTable.createdAt,
    operator: 'gte',
    value: new Date('2023-01-01'),
  })
  .addSearch({
    fields: [schema.UserTable.name, schema.UserTable.email],
    value: 'john',
  })
  .build();
```

## Migration from Manual Approach

### Before (Manual)
```typescript
private buildWhereConditions(filters: FindUsersDto) {
  const conditions: any[] = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(schema.UserTable.name, `%${filters.search}%`),
        ilike(schema.UserTable.email, `%${filters.search}%`),
      ),
    );
  }

  if (filters.id) {
    conditions.push(eq(schema.UserTable.id, filters.id));
  }

  if (filters.name) {
    conditions.push(ilike(schema.UserTable.name, `%${filters.name}%`));
  }

  // ... more manual conditions

  return conditions.length > 0 ? and(...conditions) : undefined;
}
```

### After (Dynamic)
```typescript
private buildWhereConditions(filters: FindUsersDto): SQL | undefined {
  const filterBuilder = new DynamicFilterBuilder();

  if (filters.search) {
    filterBuilder.addSearch({
      fields: [schema.UserTable.name, schema.UserTable.email],
      value: filters.search,
    });
  }

  const conditions: FilterCondition[] = [
    { field: schema.UserTable.id, operator: 'eq', value: filters.id },
    { field: schema.UserTable.name, operator: 'ilike', value: filters.name },
    // ... more declarative conditions
  ];

  return filterBuilder.addConditions(conditions).build();
}
```

## Benefits

1. **Type Safety**: No more `any[]` types, full TypeScript support
2. **Reusability**: Same pattern works for all entities
3. **Maintainability**: Easy to add/remove/modify filters
4. **Readability**: Declarative approach is self-documenting
5. **Consistency**: Same API across all services

## Best Practices

1. **Always specify return types**: Use `SQL | undefined` for better type safety
2. **Handle undefined values**: The builder automatically skips null/undefined values
3. **Use method chaining**: For better readability when adding multiple conditions
4. **Leverage patterns**: Use custom patterns for specific search requirements
5. **Group related filters**: Use arrays of FilterCondition for related filters

## Example for Other Entities

```typescript
// For Posts
private buildPostFilters(filters: FindPostsDto): SQL | undefined {
  const filterBuilder = new DynamicFilterBuilder();

  const conditions: FilterCondition[] = [
    { field: schema.PostTable.id, operator: 'eq', value: filters.id },
    { field: schema.PostTable.title, operator: 'ilike', value: filters.title },
    { field: schema.PostTable.status, operator: 'eq', value: filters.status },
    { field: schema.PostTable.createdAt, operator: 'gte', value: filters.createdFrom ? new Date(filters.createdFrom) : undefined },
  ];

  return filterBuilder.addConditions(conditions).build();
}
```

This approach makes your filtering logic more maintainable, reusable, and type-safe across your entire application.
