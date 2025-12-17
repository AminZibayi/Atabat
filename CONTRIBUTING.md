<!-- In the Name of God, the Creative, the Originator -->

# Contributing

Thanks for helping improve this Payload starter. Follow the guidelines below to keep contributions smooth and consistent.

## Quick start

- Install dependencies with `pnpm install`.
- Create a feature branch from `main`.
- Keep commits conventional (e.g., `feat: ...`, `fix: ...`).
- Prefer `pnpm dev` during development; run `pnpm build` before shipping changes that affect runtime.

## Development checklist

- Lint everything: `pnpm lint:all`.
- Run tests: `pnpm test` (or `pnpm test:int` / `pnpm test:e2e`).
- Regenerate types after schema changes: `pnpm generate:types`.
- Update documentation when behavior changes (README, agent file, i18n labels, validations).

## Pull requests

- Keep diffs focused; avoid formatting-only changes unless intentional.
- Describe what changed, why, and how to verify (include commands or screenshots when relevant).
- Add or update tests for new behavior, especially for collections, access controls, and admin UI.

## Project conventions

- Use PNPM for all scripts and installs.
- Place new collections under `src/collections/<Name>/` with matching validations in `src/validations/`.
- Put shared utilities in `src/utils/`, hooks in `src/hooks/`, and policies in `src/policies/`.
- Favor server components; add client components only when hooks (e.g., `useAuth`, `useTheme`) are required.

## TODO for contributors

- [ ] Add i18n for zod error messages.
- [x] Add custom logo and favicon files.
- [ ] Update vscode folder icons for folder without icons
- [ ] Document a recommended production logging/monitoring stack.
- [ ] Be more specific about policy implementation, e.g. write and segment policies regarding the functionality, not the collection
