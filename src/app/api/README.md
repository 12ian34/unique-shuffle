# API Directory Structure

This document provides a comprehensive overview of all API routes available in the application, including their descriptions, methods, parameters, and responses.

## Shuffle APIs

### `/api/shuffle/save`

- **Description**: Saves a shuffle for an authenticated user, verifies achievements, and updates user statistics
- **Methods**: POST
- **Body**: `{ cards: Card[] }`
- **Authentication**: Required
- **Response**: Returns the saved shuffle data and any pattern-based achievements

### `/api/shuffle/track`

- **Description**: Tracks a shuffle event in the database (for analytics), every shuffle operation is recorded
- **Methods**: POST
- **Body**: `{ is_saved?: boolean, cards?: Card[] }`
- **Authentication**: Optional (works for both authenticated and anonymous users)
- **Response**: Returns success status and tracking data

### `/api/shuffle/last-saved`

- **Description**: Retrieves the most recently saved shuffle for the authenticated user
- **Methods**: GET
- **Authentication**: Required
- **Response**: Returns the last saved shuffle or null

### `/api/shuffle/share`

- **Description**: Creates or retrieves a share code for a saved shuffle
- **Methods**: POST
- **Body**: `{ shuffleId: string }`
- **Authentication**: Required
- **Response**: Returns share code and shareable URL

### `/api/shuffle/shared`

- **Description**: Retrieves a shared shuffle by its share code
- **Methods**: GET
- **Query Parameters**:
  - `code`: The share code to look up
- **Response**: Returns the shared shuffle data

## Shuffles APIs

### `/api/shuffles/count`

- **Description**: Unified API for counting shuffles (both global and user-specific)
- **Methods**: GET
- **Query Parameters**:
  - `userId` (optional): Get counts for a specific user
- **Response**: Returns either total count or user-specific counts

### `/api/shuffles/user`

- **Description**: Gets paginated list of a user's saved shuffles
- **Methods**: GET
- **Query Parameters**:
  - `userId`: User ID to get shuffles for
  - `limit` (optional): Number of shuffles per page (default: 10)
  - `page` (optional): Page number (0-indexed, default: 0)
- **Response**: Returns list of shuffles and total count

## User Management APIs

### `/api/auth/signup`

- **Description**: Sign up a new user with email and password
- **Methods**: POST
- **Body**: `{ email: string, password: string }`
- **Response**: Returns user data or error

### `/api/auth/check-user`

- **Description**: Check if a user exists in the system
- **Methods**: GET
- **Query Parameters**:
  - `userId`: User ID to check
- **Response**: Returns whether user exists and user data if found

### `/api/users`

- **Description**: List all users in the system (admin only)
- **Methods**: GET
- **Authentication**: Admin access required
- **Response**: Returns list of all users

### `/api/users/profile`

- **Description**: Get or update a user's profile
- **Methods**: GET, PUT
- **Query/Body Parameters**:
  - `userId`: User ID to get/update profile for
  - (PUT only) `username`: New username
  - (PUT only) `email`: New email
  - (PUT only) `password`: New password
- **Response**: Returns user profile data or update confirmation

### `/api/users/username`

- **Description**: Update a user's username
- **Methods**: PUT
- **Body Parameters**:
  - `userId`: User ID
  - `username`: New username
- **Response**: Returns updated user data

### `/api/user/stats`

- **Description**: Get or update user statistics
- **Methods**: GET, POST
- **Query/Body Parameters**:
  - GET: No parameters (uses authenticated user)
  - POST: `userId`: User ID to update stats for
  - POST: `forceRecalculate` (optional): Force recalculation of streak
- **Response**: Returns user statistics or update confirmation

## Achievements and Leaderboard APIs

### `/api/achievements`

- **Description**: Get or update user achievements
- **Methods**: GET, POST
- **Query/Body Parameters**:
  - `userId`: User ID to get/update achievements for
- **Response**: Returns achievements data and count

### `/api/leaderboard`

- **Description**: Gets leaderboard data
- **Methods**: GET
- **Query Parameters**:
  - `sortBy` (optional): Field to sort by (default: total_shuffles)
  - `sortOrder` (optional): Sort direction ('asc' or 'desc', default: 'desc')
  - `limit` (optional): Number of entries to return (default: 10)
- **Response**: Returns leaderboard entries

## API Consolidation

We've consolidated redundant APIs to simplify the codebase. Previously deprecated APIs (`/api/shuffle/count` and `/api/shuffles/global-count`) have been removed. All shuffle counting is now handled by the unified `/api/shuffles/count` endpoint.

## Notable Recent Fixes

1. Fixed API calls between routes by using relative URLs instead of absolute URLs with environment variables
2. Consolidated shuffle counting APIs to reduce duplication
3. Implemented server-side caching for frequently accessed endpoints to reduce database load
4. Removed deprecated API endpoints to simplify the codebase
5. Removed client-side rate limiting for shuffle tracking to ensure every shuffle is recorded
