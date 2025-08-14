# Documentation Search API

## Endpoint
```
GET /docs/search
POST /api/v1/universal/search
```

## Description
Provides comprehensive search functionality across all HERA documentation content. The search system integrates with HERA's universal search architecture to deliver fast, relevant results across developer and user documentation.

## Search Parameters

### Query Parameters (GET /docs/search)
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query string |
| type | string | No | Filter by doc type ('dev' or 'user') |
| section | string | No | Filter by documentation section |

### API Request (POST /api/v1/universal/search)
```json
{
  "query": "authentication",
  "entity_types": ["doc_page"],
  "filters": {
    "metadata.doc_type": "dev",
    "metadata.status": "published"
  },
  "include_dynamic_data": true,
  "limit": 20,
  "offset": 0
}
```

## Response Format

### Search Results
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Authentication Guide",
      "slug": "authentication-guide",
      "docType": "dev",
      "excerpt": "Learn how to implement authentication in HERA applications...",
      "section": "Security",
      "relevanceScore": 0.95
    }
  ],
  "total": 15,
  "hasMore": true
}
```

## Implementation

### Search Algorithm
The search system uses HERA's universal search with documentation-specific enhancements:

1. **Full-text Search**: Searches across page titles, content, and metadata
2. **Relevance Scoring**: Ranks results based on query match quality
3. **Type Filtering**: Separates developer and user documentation
4. **Section Filtering**: Allows filtering by documentation sections
5. **Excerpt Generation**: Creates contextual excerpts highlighting search terms

### Performance Optimizations
- **Indexed Content**: All documentation content is indexed for fast retrieval
- **Caching**: Search results are cached for common queries
- **Pagination**: Results are paginated to improve response times
- **Debounced Requests**: Client-side debouncing prevents excessive API calls

### Integration with HERA
The search leverages existing HERA universal search patterns:

```typescript
// Search configuration
const searchConfig = {
  entity_types: ['doc_page'],
  search_fields: ['entity_name', 'dynamic_data.content', 'metadata'],
  result_fields: ['entity_name', 'entity_code', 'metadata', 'dynamic_data'],
  filters: {
    'metadata.status': 'published'
  }
}
```

## Usage Examples

### Basic Search
```typescript
// Client-side search
const results = await searchDocs('API development');

// Display results
results.forEach(result => {
  console.log(`${result.title} - ${result.excerpt}`);
});
```

### Filtered Search
```typescript
// Search only developer documentation
const devResults = await searchDocs('authentication', 'dev');

// Search specific section
const apiResults = await searchDocs('endpoints', 'dev', 'API Reference');
```

### Advanced Search
```typescript
// Direct API call with advanced filters
const response = await fetch('/api/v1/universal/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'component props',
    entity_types: ['doc_page'],
    filters: {
      'metadata.doc_type': 'dev',
      'metadata.section': 'Components'
    },
    sort: [{ field: 'relevance', direction: 'desc' }],
    limit: 10
  })
});
```

## Error Handling

### Common Error Responses
- `400 Bad Request`: Invalid search parameters
- `404 Not Found`: No results found
- `500 Internal Server Error`: Search service error

### Error Response Format
```json
{
  "error": "Invalid search parameters",
  "message": "Search query must be at least 2 characters",
  "code": "INVALID_QUERY"
}
```

## Authentication
Search endpoints are publicly accessible for published documentation. Private documentation requires authentication:

```typescript
// Authenticated search
const response = await fetch('/api/v1/universal/search', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Rate Limiting
- **Public searches**: 100 requests per minute per IP
- **Authenticated searches**: 500 requests per minute per user
- **Bulk operations**: Special rate limits apply

*Auto-generated documentation for Documentation Search API*