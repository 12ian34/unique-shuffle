# API Directory Structure

This document outlines the organization of the API routes and indicates which ones are active versus deprecated.

## Active APIs

### `/api/shuffles/count`

- **Description**: Unified API for counting shuffles (both global and user-specific)
- **Methods**: GET
- **Query Parameters**:
  - `userId` (optional): Get counts for a specific user
- **Response**: Returns either total count or user-specific counts

### `/api/shuffle/save`

- **Description**: Saves a shuffle for an authenticated user
- **Methods**: POST
- **Body**: `{ cards: Card[] }`
- **Response**: Returns the saved shuffle data

### `/api/shuffle/track`

- **Description**: Tracks a shuffle event (for analytics)
- **Methods**: POST
- **Body**: `{ is_saved?: boolean }`
- **Response**: Returns success status

### `/api/leaderboard`

- **Description**: Gets leaderboard data
- **Methods**: GET
- **Query Parameters**:
  - `sortBy`: Field to sort by
  - `sortOrder`: Sort direction ('asc' or 'desc')
  - `limit`: Number of entries to return
- **Response**: Returns leaderboard entries

### `/api/achievements`

- **Description**: Get or update user achievements
- **Methods**: GET, POST
- **Query/Body Parameters**:
  - `userId`: User ID to get/update achievements for
- **Response**: Returns achievements data

### `/api/user/stats`

- **Description**: Get or update user statistics
- **Methods**: GET, POST
- **Query/Body Parameters**:
  - `userId`: User ID to get/update stats for
- **Response**: Returns user statistics

### `/api/users/profile`

- **Description**: Get or update user profile
- **Methods**: GET, PUT
- **Query/Body Parameters**:
  - `userId`: User ID
- **Response**: Returns user profile data

### `/api/users/username`

- **Description**: Update username
- **Methods**: PUT
- **Body Parameters**:
  - `userId`: User ID
  - `username`: New username
- **Response**: Returns updated user data

## Deprecated APIs (Scheduled for Removal)

The following APIs have been deprecated and should not be used in new code:

### `/api/shuffle/count` (use `/api/shuffles/count` instead)

### `/api/shuffles/global-count` (use `/api/shuffles/count` instead)

## API Consolidation

We've consolidated redundant APIs to simplify the codebase. If you're maintaining or developing for this project, please use the active APIs listed above.

## Notable Recent Fixes

1. Fixed API calls between routes by using relative URLs instead of absolute URLs with environment variables
2. Consolidated shuffle counting APIs to reduce duplication
