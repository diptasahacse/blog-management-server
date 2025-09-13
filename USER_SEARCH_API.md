# Professional User Search & Pagination API

## Overview
A comprehensive user search and pagination system with advanced filtering, sorting, and field-specific search capabilities.

## Endpoint
```
GET /user/search
```

## Features
- ✅ **Pagination**: Page-based pagination with configurable limits
- ✅ **Global Search**: Search across name and email fields simultaneously  
- ✅ **Field-Specific Filtering**: Filter by specific user attributes
- ✅ **Advanced Sorting**: Sort by any user field with ASC/DESC options
- ✅ **Date Range Filtering**: Filter by creation/update date ranges
- ✅ **Role-Based Filtering**: Filter users by role
- ✅ **Case-Insensitive Search**: All text searches are case-insensitive
- ✅ **Security**: Password field excluded from all responses

## Query Parameters

### Pagination
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Current page number (min: 1) |
| `limit` | number | 10 | Items per page (min: 1, max: 100) |

### Sorting
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | enum | `createdAt` | Field to sort by: `id`, `name`, `email`, `role`, `createdAt`, `updatedAt` |
| `sortOrder` | enum | `desc` | Sort direction: `asc`, `desc` |

### Search & Filtering
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Global search across name and email |
| `id` | UUID | Exact user ID match |
| `name` | string | Partial name search (case-insensitive) |
| `email` | string | Partial email search (case-insensitive) |
| `role` | enum | Filter by role: `admin`, `user` |

### Date Range Filtering
| Parameter | Type | Description |
|-----------|------|-------------|
| `createdFrom` | ISO Date | Users created after this date |
| `createdTo` | ISO Date | Users created before this date |
| `updatedFrom` | ISO Date | Users updated after this date |
| `updatedTo` | ISO Date | Users updated before this date |

## Example Requests

### Basic Pagination
```bash
GET /user/search?page=1&limit=20
```

### Global Search
```bash
GET /user/search?search=john&page=1&limit=10
```

### Advanced Filtering
```bash
GET /user/search?role=admin&sortBy=name&sortOrder=asc&page=1&limit=15
```

### Date Range Search
```bash
GET /user/search?createdFrom=2023-01-01&createdTo=2023-12-31&sortBy=createdAt&sortOrder=desc
```

### Complex Query
```bash
GET /user/search?search=admin&role=admin&createdFrom=2023-06-01&sortBy=updatedAt&sortOrder=desc&page=2&limit=25
```

### Field-Specific Search
```bash
GET /user/search?name=John&email=gmail.com&sortBy=email&sortOrder=asc
```

## Response Format

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "verifiedAt": "2023-08-15T10:30:00.000Z",
      "createdAt": "2023-08-01T09:00:00.000Z",
      "updatedAt": "2023-08-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "totalItems": 150,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 15,
    "currentPage": 1
  }
}
```

## Response Fields

### User Data
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique user identifier |
| `name` | string | User's full name |
| `email` | string | User's email address |
| `role` | enum | User role: `admin` or `user` |
| `verifiedAt` | Date/null | Email verification timestamp |
| `createdAt` | Date | User creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### Pagination Metadata
| Field | Type | Description |
|-------|------|-------------|
| `totalItems` | number | Total users matching filters |
| `itemCount` | number | Users returned in current page |
| `itemsPerPage` | number | Configured page size |
| `totalPages` | number | Total pages available |
| `currentPage` | number | Current page number |

## Use Cases

### 1. Admin Dashboard - User Management
```bash
# Get all admin users, sorted by creation date
GET /user/search?role=admin&sortBy=createdAt&sortOrder=desc&limit=50
```

### 2. User Lookup
```bash
# Find users by name or email
GET /user/search?search=john.doe&limit=5
```

### 3. Recent Registrations
```bash
# Users registered in the last 30 days
GET /user/search?createdFrom=2023-07-15&sortBy=createdAt&sortOrder=desc
```

### 4. Email Domain Analysis
```bash
# Find all Gmail users
GET /user/search?email=@gmail.com&sortBy=createdAt&limit=100
```

### 5. Activity Report
```bash
# Recently active users
GET /user/search?updatedFrom=2023-08-01&sortBy=updatedAt&sortOrder=desc&limit=25
```

## Performance Features

- **Database Indexing**: Optimized queries on frequently searched fields
- **Efficient Pagination**: Uses LIMIT/OFFSET for optimal performance
- **Case-Insensitive Search**: Uses ILIKE for PostgreSQL optimization
- **Selective Fields**: Password field excluded for security
- **Query Optimization**: Dynamic WHERE conditions built only when needed

## Security Notes

- ✅ Password field is never returned in responses
- ✅ All email searches are automatically lowercased
- ✅ Input validation on all parameters
- ✅ SQL injection protection via parameterized queries
- ✅ Rate limiting recommended for production use

## Error Handling

The API returns appropriate HTTP status codes and error messages:
- `400 Bad Request`: Invalid query parameters
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Database or server errors

## Validation Rules

- Page must be ≥ 1
- Limit must be between 1 and 100
- Date strings must be valid ISO format
- UUID fields must be valid UUID format
- Email must be valid email format
