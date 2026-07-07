# Custom Agent Rules (Project-Scoped)

This file defines the custom behaviors and guidelines that the agent should follow for this workspace.

## PostgreSQL & Node.js 'pg' Integration Rules
1. **Sanitize parameters**: Always verify that no parameter in a `pg` database query values array is `undefined`. Explicitly convert optional fields to null (e.g., `param || null`) or clean values to avoid driver bind crashes.
2. **Synchronize generated server states**: Database creation helpers (`save...` methods) must return the completed record with all server-generated fields (like dates or defaults) to prevent stale or missing client-side state.
3. **Handle native pg Date parsing safely**: Note that the `pg` database driver automatically parses SQL `DATE` columns into JavaScript native `Date` objects. Ensure formatters safely check for and format native `Date` types, preventing `Invalid Date` errors on concatenations.
