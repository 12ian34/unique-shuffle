# Supabase Security Guide

This document outlines best practices for using Supabase clients in your application.

## Client Types

We use different Supabase clients depending on the context:

1. **Client-side authenticated client**
   - Used in React components with `createSupabaseClient()`
   - Uses `createBrowserClient` from `@supabase/ssr`
   - Respects Row Level Security (RLS) policies
   - User can only access their own data
   - Example: `src/lib/supabase-client.ts`

2. **Server-side authenticated client**
   - Used in API routes with `createSupabaseServer()`
   - Uses `createServerClient` from `@supabase/ssr`
   - Maintains the user's session from cookies
   - Still respects RLS policies
   - Example: `src/lib/supabase-server.ts`

3. **Admin client**
   - Used in API routes with `createSupabaseAdmin()`
   - Uses `createClient` from `@supabase/supabase-js` with the service role key
   - Bypasses RLS using the service role key
   - Has complete database access
   - Example: `src/lib/supabase-admin.ts`

## Security Guidelines

### When to use each client type

- **Client-side authenticated client**:
  - For all user-facing components
  - When you need to fetch data that belongs to the current user
  - When making real-time subscriptions

- **Server-side authenticated client**:
  - For API routes that need to access the user's session
  - When you need to ensure the action is performed by the authenticated user
  - When RLS policies should be enforced

- **Admin client**:
  - Only in API routes that need to bypass RLS
  - For operations that need cross-user access (e.g., leaderboards)
  - For administrative functions that need to manage other users' data

### Best Practices

1. **Minimize admin client usage**:
   - Only use the admin client when absolutely necessary
   - Prefer server-side authenticated clients when possible
   - Use RLS policies to secure your data

2. **Secure your service role key**:
   - Never expose the service role key to the client
   - Only use it in server-side contexts (API routes)
   - Store it in environment variables

3. **Implement proper RLS policies**:
   - Create secure RLS policies for each table
   - Test policies to make sure they restrict access properly
   - Use row-level security as your primary security mechanism

4. **Validate requests**:
   - Always validate user inputs on the server side
   - Check that users only modify their own data
   - Use type checking to prevent unexpected inputs

## Example: Hybrid Approach

This example from `src/app/api/shuffle/save/route.ts` shows a hybrid approach:

```typescript
// Regular authenticated client for user data
const supabase = createSupabaseServer()

// Admin client only for operations that need to bypass RLS
const supabaseAdmin = createSupabaseAdmin()

// Use regular client for user's own data
const { data, error } = await supabase
  .from('shuffles')
  .insert([{ user_id: userId, cards }])
  .select()

// Use admin client for leaderboard operations
const { data: leaderboardData } = await supabaseAdmin
  .from('leaderboard')
  .upsert({ ... })
```

## Using the Latest Supabase Packages

As of the latest update, this project uses the modern `@supabase/ssr` package instead of the deprecated `@supabase/auth-helpers-nextjs`. The `@supabase/ssr` package provides:

- `createBrowserClient` for client-side usage
- `createServerClient` for server-side usage with cookies
- Improved TypeScript support

By following these guidelines, we can maintain a secure application while still utilizing the power of Supabase's admin capabilities when needed. 