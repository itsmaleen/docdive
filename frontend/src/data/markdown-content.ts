export const SAMPLE_MARKDOWN_DOCUMENTATION = `
# API Reference

This documentation describes the endpoints and resources available in our API.

## Authentication

All API requests require authentication using an API key. Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Users

#### GET /api/users

Returns a list of users in the system.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| page | integer | Page number for pagination |
| limit | integer | Number of results per page |

**Example Request:**

\`\`\`
GET https://api.example.com/api/users?page=1&limit=10
\`\`\`

**Example Response:**

\`\`\`json
{
  "users": [
    {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "admin"
    },
    {
      "id": "user_456",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "user"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10
}
\`\`\`

#### GET /api/users/{id}

Returns a specific user by ID.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | User ID |

**Example Request:**

\`\`\`
GET https://api.example.com/api/users/user_123
\`\`\`

**Example Response:**

\`\`\`json
{
  "id": "user_123",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "created_at": "2023-01-15T08:30:00Z",
  "updated_at": "2023-06-20T14:20:00Z"
}
\`\`\`

#### POST /api/users

Creates a new user.

**Request Body:**

\`\`\`json
{
  "name": "New User",
  "email": "newuser@example.com",
  "role": "user"
}
\`\`\`

**Example Response:**

\`\`\`json
{
  "id": "user_789",
  "name": "New User",
  "email": "newuser@example.com",
  "role": "user",
  "created_at": "2023-07-01T10:15:00Z",
  "updated_at": "2023-07-01T10:15:00Z"
}
\`\`\`

#### PUT /api/users/{id}

Updates an existing user.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | User ID |

**Request Body:**

\`\`\`json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "admin"
}
\`\`\`

**Example Response:**

\`\`\`json
{
  "id": "user_123",
  "name": "Updated Name",
  "email": "updated@example.com",
  "role": "admin",
  "created_at": "2023-01-15T08:30:00Z",
  "updated_at": "2023-07-01T11:45:00Z"
}
\`\`\`

#### DELETE /api/users/{id}

Deletes a user.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | User ID |

**Example Response:**

\`\`\`json
{
  "success": true,
  "message": "User deleted successfully"
}
\`\`\`

### Products

#### GET /api/products

Returns a list of products.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| page | integer | Page number for pagination |
| limit | integer | Number of results per page |
| category | string | Filter by category |

**Example Request:**

\`\`\`
GET https://api.example.com/api/products?category=electronics&page=1&limit=10
\`\`\`

**Example Response:**

\`\`\`json
{
  "products": [
    {
      "id": "prod_123",
      "name": "Smartphone",
      "price": 599.99,
      "category": "electronics",
      "in_stock": true
    },
    {
      "id": "prod_456",
      "name": "Laptop",
      "price": 1299.99,
      "category": "electronics",
      "in_stock": true
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10
}
\`\`\`

#### GET /api/products/{id}

Returns a specific product by ID.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| id | string | Product ID |

**Example Request:**

\`\`\`
GET https://api.example.com/api/products/prod_123
\`\`\`

**Example Response:**

\`\`\`json
{
  "id": "prod_123",
  "name": "Smartphone",
  "description": "Latest model with advanced features",
  "price": 599.99,
  "category": "electronics",
  "in_stock": true,
  "variants": [
    {
      "id": "var_1",
      "color": "black",
      "storage": "128GB"
    },
    {
      "id": "var_2",
      "color": "white",
      "storage": "256GB"
    }
  ],
  "created_at": "2023-03-10T09:00:00Z",
  "updated_at": "2023-06-15T16:30:00Z"
}
\`\`\`

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests.

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - The request was malformed |
| 401 | Unauthorized - Authentication failed |
| 403 | Forbidden - You don't have permission |
| 404 | Not Found - The resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Something went wrong on our end |

### Error Response Format

\`\`\`json
{
  "error": {
    "code": "invalid_request",
    "message": "The request was invalid",
    "details": "The 'email' field must be a valid email address"
  }
}
\`\`\`

## Rate Limits

API requests are limited to 100 requests per minute per API key. If you exceed this limit, you'll receive a 429 Too Many Requests response.

The response headers include rate limit information:

- \`X-RateLimit-Limit\`: The maximum number of requests allowed per minute
- \`X-RateLimit-Remaining\`: The number of requests remaining in the current window
- \`X-RateLimit-Reset\`: The time at which the current rate limit window resets, in UTC epoch seconds

## Pagination

List endpoints support pagination using the \`page\` and \`limit\` query parameters.

The response includes pagination metadata:

\`\`\`json
{
  "items": [...],
  "total": 42,
  "page": 2,
  "limit": 10,
  "pages": 5
}
\`\`\`

## Versioning

The API is versioned using URL path versioning. The current version is v1:

\`\`\`
https://api.example.com/v1/users
\`\`\`

## Support

If you have any questions or need assistance, please contact our support team at api-support@example.com.
`;

export interface SourceReference {
  title: string;
  section: string;
  content: string;
  url: string;
}

export const DOCUMENTATION_SOURCES: Record<string, SourceReference[]> = {
  authentication: [
    {
      title: "Authentication",
      section: "authentication",
      content:
        "All API requests require authentication using an API key. Include your API key in the Authorization header: `Authorization: Bearer YOUR_API_KEY`",
      url: "https://api.example.com/docs#authentication",
    },
  ],

  users: [
    {
      title: "GET /api/users",
      section: "get-api-users",
      content:
        "Returns a list of users in the system. Supports pagination with page and limit parameters.",
      url: "https://api.example.com/docs#get-api-users",
    },
    {
      title: "GET /api/users/{id}",
      section: "get-api-users-id",
      content: "Returns a specific user by ID.",
      url: "https://api.example.com/docs#get-api-users-id",
    },
    {
      title: "POST /api/users",
      section: "post-api-users",
      content: "Creates a new user with the provided name, email, and role.",
      url: "https://api.example.com/docs#post-api-users",
    },
  ],

  products: [
    {
      title: "GET /api/products",
      section: "get-api-products",
      content:
        "Returns a list of products. Supports filtering by category and pagination.",
      url: "https://api.example.com/docs#get-api-products",
    },
    {
      title: "GET /api/products/{id}",
      section: "get-api-products-id",
      content:
        "Returns a specific product by ID, including variants and detailed information.",
      url: "https://api.example.com/docs#get-api-products-id",
    },
  ],

  errors: [
    {
      title: "Error Handling",
      section: "error-handling",
      content:
        "The API uses standard HTTP status codes to indicate the success or failure of requests.",
      url: "https://api.example.com/docs#error-handling",
    },
  ],

  "rate limits": [
    {
      title: "Rate Limits",
      section: "rate-limits",
      content:
        "API requests are limited to 100 requests per minute per API key. If you exceed this limit, you'll receive a 429 Too Many Requests response.",
      url: "https://api.example.com/docs#rate-limits",
    },
  ],

  pagination: [
    {
      title: "Pagination",
      section: "pagination",
      content:
        "List endpoints support pagination using the `page` and `limit` query parameters.",
      url: "https://api.example.com/docs#pagination",
    },
  ],
};

export const SAMPLE_CHAT_RESPONSES = {
  "how do I authenticate?": {
    answer:
      "To authenticate with the API, you need to include your API key in the Authorization header of your requests. The format should be `Authorization: Bearer YOUR_API_KEY`. This authentication method is required for all API endpoints to verify your identity and permissions.",
    sources: ["authentication"],
  },
  "tell me about users endpoint": {
    answer:
      "The API provides several endpoints for managing users:\n\n1. `GET /api/users` - Returns a list of all users with pagination support\n2. `GET /api/users/{id}` - Returns details for a specific user\n3. `POST /api/users` - Creates a new user\n4. `PUT /api/users/{id}` - Updates an existing user\n5. `DELETE /api/users/{id}` - Deletes a user\n\nEach endpoint requires authentication and returns JSON responses with appropriate HTTP status codes.",
    sources: ["users"],
  },
  "how do I create a new user?": {
    answer:
      'To create a new user, send a POST request to `/api/users` with a JSON body containing the user\'s information. You must include the `name`, `email`, and `role` fields.\n\nExample request body:\n```json\n{\n  "name": "New User",\n  "email": "newuser@example.com",\n  "role": "user"\n}\n```\n\nUpon success, the API will return a 201 Created status with the newly created user object including its generated ID and timestamps.',
    sources: ["users"],
  },
  "what are the rate limits?": {
    answer:
      "The API has a rate limit of 100 requests per minute per API key. If you exceed this limit, you'll receive a 429 Too Many Requests response.\n\nThe response headers include helpful rate limit information:\n- `X-RateLimit-Limit`: The maximum number of requests allowed per minute\n- `X-RateLimit-Remaining`: The number of requests remaining in the current window\n- `X-RateLimit-Reset`: The time at which the current rate limit window resets, in UTC epoch seconds\n\nIt's recommended to implement exponential backoff in your client when you receive a 429 response.",
    sources: ["rate limits"],
  },
  "how does pagination work?": {
    answer:
      'Pagination is supported on list endpoints (like GET /api/users and GET /api/products) using the `page` and `limit` query parameters.\n\nFor example: `GET /api/users?page=2&limit=10`\n\nThe response includes pagination metadata:\n```json\n{\n  "items": [...],\n  "total": 42,\n  "page": 2,\n  "limit": 10,\n  "pages": 5\n}\n```\n\nThis makes it easy to implement pagination controls in your application and navigate through large result sets efficiently.',
    sources: ["pagination"],
  },
};
