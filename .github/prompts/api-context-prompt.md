// filepath: .github/prompts/api.md

# API Context

Endpoints:

- GET /api/stations: Returns all station data
- GET /api/stations/:id: Returns specific station

Response codes:

- 200: Success
- 503: Data not yet available
- 500: Server error

Headers:

- Retry-After: 60 (when 503)
