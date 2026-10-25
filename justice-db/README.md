# Justice database

One Supabase project shared by **CaseWin Court** (`apps/court`, court.casewinai.com)
and **OpenLegal Nigeria** (`apps/openlegal`, openlegal.casewinai.com). It is
separate from the main CaseWin database.

```
court.casewinai.com ──(service role, after a staff-role check)──┐
                                                                 ├── Justice DB
openlegal.casewinai.com ──(anon key; RLS = published only)──────┘
```

When a registrar publishes a judgment in the court app, the same row becomes
readable by OpenLegal, its REST API and its MCP server. Drafts, filings, staff
and hearings are never readable with the anon key.

## Set up

1. Create a Supabase project (region **London, eu-west-2**, closest to the
   Vercel `lhr1` region the apps run in).
2. In the SQL editor, run the files in `migrations/` in order.
3. Create your platform-admin login:

   ```bash
   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
     node justice-db/scripts/create-platform-admin.mjs you@casewinai.com "Your Name"
   ```

4. Optional, for demos — load clearly-labelled sample data:

   ```bash
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node justice-db/scripts/seed-sample.mjs imo-high-court
   ```

   Remove it later in the court app: Registry → Court settings → Remove all sample data.

5. Supabase → Authentication → Providers → Email: turn **off** "Allow new users
   to sign up". Court staff accounts are created by administrators only.

## Environment variables

| Variable | court | openlegal |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | — never |
| `NEXT_PUBLIC_OPENLEGAL_URL` | optional | — |
| `NEXT_PUBLIC_COURT_URL` | — | optional |

## Roles

| Role | Can |
|---|---|
| Platform admin (CaseWin) | Onboard courts, create each court's first administrator, see network analytics |
| Court administrator | Manage staff logins, judges, divisions and the fee schedule |
| Registrar | Everything a clerk can, plus accept/reject filings and publish judgments |
| Clerk | Review filings, assess fees, list hearings, keep the cause list |
| Judge | See their own docket and record hearing outcomes |

## Before onboarding Imo State High Court

- Confirm division names and suit-number prefixes with the Chief Registrar
  (seeded: Owerri `HOW`, Orlu `HOR`, Okigwe `HOK`).
- Replace the starter fee schedule with the court's current approved fees.
- Check the constitutional provisions in `004_seed_laws.sql` against the
  official text before public launch.
