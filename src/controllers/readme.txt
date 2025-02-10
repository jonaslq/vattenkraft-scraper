Controllers Layer
---------------
- Handles HTTP requests and responses
- Validates input data
- Calls appropriate service methods
- Returns formatted responses
- Does not contain business logic
- Handles errors from services

Example:
- GET /api/stations -> StationController.getStations()
- Maps HTTP status codes to responses
- Formats JSON responses