# New Era Youths

## Custom authentication setup

This project uses a custom game-name/password flow, not Supabase Auth. The Edge Function hashes and verifies passwords on the server and returns a random, revocable session token. The token is kept in `sessionStorage` and expires server-side after seven days.

1. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anon key is public; never put the service-role key in a `VITE_` variable. `.env.local` is ignored by git.
2. In the Supabase **SQL Editor**, run these files in order, one at a time:
   - [`supabase/01_tables.sql`](./supabase/01_tables.sql)
   - [`supabase/02_rls.sql`](./supabase/02_rls.sql)
   - [`supabase/03_rate_limit_function.sql`](./supabase/03_rate_limit_function.sql)
   - [`supabase/04_page_crud_tables.sql`](./supabase/04_page_crud_tables.sql)
   - [`supabase/05_page_crud_rls.sql`](./supabase/05_page_crud_rls.sql)
   - [`supabase/06_bank_transaction_function.sql`](./supabase/06_bank_transaction_function.sql)
   - [`supabase/07_seed_page_data.sql`](./supabase/07_seed_page_data.sql)

   If you already ran the original authentication setup files (`01`-`03`), run only `04`-`07`. These create and seed the guild page tables, enable RLS, and create the bank ledger function. Paste only each file's SQL into the editor, not the shell commands below. Browser clients receive no direct table access; authenticated page operations use the custom-session Edge Function.
   If you already ran the page CRUD scripts before this role update, rerun `04`, `05`, and `06`; they apply the build-owner column and bank ownership check.
3. In the VS Code **Terminal** (from the project folder), log in to the Supabase CLI, link this project, and deploy both Edge Functions with JWT verification disabled:

   ```sh
   npx supabase login
   npx supabase link --project-ref xjfuqwjkvzpplimvubft
   npx supabase functions deploy game-name-auth --no-verify-jwt
   npx supabase functions deploy guild-data --no-verify-jwt
   ```

4. Restart the Vite dev server after changing `.env.local`.

To change an account's displayed guild role after signup, run this in the SQL Editor and replace the game name:

```sql
update public.authuser
set role = 'Guild Master'
where game_name_key = lower('REPLACE_WITH_GAME_NAME')
returning game_name, role;
```

Custom sessions are not Supabase Auth JWTs, so `auth.uid()` policies do not identify these users. Keep credential/session tables inaccessible to browser clients and route database operations through server-side Edge Functions. Signed-in accounts can access guild page data. Guild Masters can edit member roles and delete roster entries; other accounts can edit only their own profile details, not their name or role. Guild Masters and Officers can add roster entries. In the shared build collection, any signed-in account can create a build, but only its creator can edit or delete it; other accounts have read-only access. Member loadout edits are limited to the signed-in member's own roster profile. Builds without an owner (including seeded builds) are read-only to everyone. Accounts saved by the old local-only or Supabase Auth flow are not automatically migrated. No SQL migration is required for this access change; redeploy `guild-data`.

The `game-name-auth` function adds a newly registered account to `guild_members` and synchronizes the roster role from the account on sign-in or session restore. After deploying this function update, refresh the app or sign in again to sync an existing account; no additional SQL migration is required.

The page CRUD tables are seeded with the current sample roster, builds, rules, and guides. Older custom builds, member loadouts, and bank transactions saved only in browser local storage are not automatically imported.

The Supabase-managed `auth.users` system table still exists in every project, but this app no longer uses it. If you ran an older schema, its old `public.users` table is left untouched and unused. This custom game-name flow does not currently include password reset or account recovery.
