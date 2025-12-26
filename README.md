# Plya

Minimal Next.js + Payload CMS 3 starter wired for Postgres, Lexical editor, i18n (en/fa), and a user-friendly admin with display names surfaced in the nav.

## Features

- Payload 3 + Next.js 15 with server components-first setup
- Postgres adapter, sharp image processing, Lexical rich text
- Zod and schema validation
- Media collection with uploads enabled
- I18n admin enabled and import map scaffolding

## Requirements

- Node >=20.9.0
- pnpm ^9 or ^10
- Postgres database connection string (`DATABASE_URI`)
- `PAYLOAD_SECRET` for session signing
- `CONTEXT7_API_KEY` (optional) for AI agent Context7 integration

## Quick start

1. Clone the repository.
2. Set required envs in `.env`:
   - `DATABASE_URI=postgres://user:pass@localhost:5432/dbname`
   - `PAYLOAD_SECRET=<random-long-string>`
   - `CONTEXT7_API_KEY=<your-key>`
3. Install and run:
   - `pnpm install`
   - `pnpm dev`
4. Open `http://localhost:3000/admin`, create the first user.

## Useful scripts

- `pnpm dev` – start Next.js + Payload in dev mode
- `pnpm build` / `pnpm start` – production build and serve
- `pnpm lint`, `pnpm lint:style`, `pnpm lint:md`, `pnpm lint:all` – lint code, styles, markdown
- `pnpm test` – run integration + e2e; or `pnpm test:int`, `pnpm test:e2e`
- `pnpm generate:types` – regenerate `src/payload-types.ts`
- `pnpm generate:importmap` – refresh admin import map

## Project layout

- `src/payload.config.ts` – core Payload configuration
- `src/collections/*` – Users, Media schemas and access
- `src/components/` – User components
- `src/validations` – Zod schemas used with `validateZod`
- `src/app/(frontend)` – public Next.js pages; `src/app/(payload)` – admin routes

## Docker (optional)

- Update `.env` with your Postgres connection.
- Run `docker-compose up -d` to start dependencies, then `pnpm dev` locally.

## Deployment

- Ensure env vars are set in your host (DATABASE_URI, PAYLOAD_SECRET).
- Build with `pnpm build` and serve with `pnpm start` behind your platform's process manager.

## Troubleshooting

- Regenerate types after schema changes: `pnpm generate:types`.
- If admin assets fail to load, run `pnpm generate:importmap` to refresh
  aliases.

## Bale OTP Scraper

This project includes an automated OTP scraper that retrieves Atabat OTP codes from Bale messenger and refreshes them daily at midnight.

### Features

- **Automated OTP Refresh**: Daily cron job at midnight to scrape fresh OTP from Bale
- **Session Management**: Uses Playwright's `storageState` API to persist both cookies and localStorage
- **Smart OTP Detection**: Automatically checks if OTP is expired (from previous day) and refreshes when needed
- **Authentication Flow**: Integrates with Atabat login to complete the authentication cycle

### Setup

1. **Initial Bale Login** (one-time):

   ```bash
   PLAYWRIGHT_HEADLESS=false pnpm payload bale-login
   ```

   - Opens browser to Bale login page
   - Prompts for OTP in terminal
   - Saves session to `data/bale-storage.json`

2. **Configure Environment**:
   ```bash
   PLAYWRIGHT_HEADLESS=true  # Set to false to see browser during scraping
   ```

### Architecture

- **`src/scraper/bale.ts`**: Core Bale scraper with Playwright best practices
  - Uses `getByRole()`, `getByTestId()` for accessibility-based selectors
  - Saves full browser state (cookies + localStorage) via `storageState()`
  - Scrapes OTP from chat with "سازمان حج و زیارت" using regex pattern

- **`src/scraper/auth.ts`**: Single source of truth for Atabat authentication
  - Exports reusable functions: `handleLoginForm()`, `handleOTPVerification()`
  - `authenticateWithFreshOTP()`: Forces fresh login and OTP scraping
  - Auto-refreshes OTP from Bale when expired

- **`src/jobs/otpRefreshTask.ts`**: Payload Jobs Queue task
  - Runs daily at midnight (cron: `0 0 * * *`)
  - Calls `authenticateWithFreshOTP()` from auth.ts
  - Updates `KargozarConfig` global with new OTP and session cookies

### Files

- `data/bale-storage.json` - Bale session (cookies + localStorage)
- `data/cookies.json` - Atabat session cookies
- `src/globals/KargozarConfig/` - Stores OTP, credentials, and session data

### Manual Testing

To test OTP refresh manually:

```bash
# Via Payload CLI
pnpm payload jobs:run --queue nightly

# Via API (while dev server is running)
curl http://localhost:3000/api/payload-jobs/run?queue=nightly
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
