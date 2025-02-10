Routes Layer
-----------
- Defines API endpoints
- Maps URLs to controllers
- Handles middleware chains
- Manages route grouping
- No business logic

Example:
- GET /api/stations -> StationController.getStations
- Route middleware (auth, validation)
- API versioning
- Route documentation