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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
