# API Tests

This directory contains tests for the API routes and utilities to verify database integrity.

## Running Tests

To run the tests:

```bash
# Run all tests with a specific user ID
npm run test <userId>

# Or set TEST_USER_ID in .env.test.local and run
npm run test
```

## Environment Setup

1. Copy `.env.test` to `.env.test.local`
2. Set your own values in `.env.test.local`:
   - `TEST_USER_ID`: A valid user ID in your Supabase auth.users table
   - Supabase credentials

## Test Files

- `index.ts`: Main test runner
- `api/shuffles/test-insert.ts`: Tests for inserting test shuffles
- `api/shuffles/fix-constraint.ts`: Tests for checking and fixing database constraints

## Production Builds

Before production builds, test API routes are automatically removed from the codebase using the `scripts/cleanup-test-routes.js` script, which is executed during the `prebuild` step. 