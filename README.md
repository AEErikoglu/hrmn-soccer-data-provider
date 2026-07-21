# hrmn-soccer-data-provider

Standalone Angular 22 starter with:

- Tailwind CSS 4
- Angular Material
- `.env` to Angular environment generation

## Getting started

Install dependencies if needed:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Environment variables

The app reads environment values from `.env` before `serve`, `build`, and `test`, then generates `src/environments/environment.ts`.

Supported file pattern:

- `.env`
- `.env.<mode>`
- `.env.local`
- `.env.<mode>.local`

Included sample variables:

```bash
NG_APP_NAME=HRMN Soccer Data Provider
NG_APP_API_URL=http://localhost:3000
NG_APP_API_VERSION=v1
```

Only variables prefixed with `NG_APP_` are exposed to the Angular app.

## Notes

Angular 22 expects an even-numbered supported Node release. This repo was initialized on Node `25.4.0`, which works for scaffolding here but is outside Angular's supported range. Prefer Node `24.15.0` or Node `26+` for day-to-day development.