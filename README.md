# Doug’s interview app showcase

A compact, responsive launcher for four real projects. Each browser-style window and its launch button opens the live project in a separate tab, so the gallery stays ready for the next interview demo.

- IntentShot links only to **https://app.intent-shot.com/**. The separate marketing landing page is not Doug’s work.
- Ash and Oath: https://ash-and-oath.web.app/
- Project Rone: https://project-rone.vercel.app/
- Fuller Chiro: https://fuller-chiro-d66b1.web.app/

The restored workspace did not contain the earlier portfolio source or commits, so this is a new implementation based on the confirmed project list. No existing source was overwritten. The deployed portfolio is unchanged until a Firebase deployment succeeds.

## Develop and verify

Use Node.js 24 (or 22.12+) and npm:

```sh
npm ci
npm run dev
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

On a restricted cloud filesystem, use `npm --cache /tmp/interview-npm-cache ci`. If system Chromium is unavailable, install it with `npx playwright install chromium` and run `npm test` without the executable override. Tests cover launch URLs, real popup navigation with a stubbed external page, filtering, ownership scope, keyboard focus, and responsive rendering. They do not claim to validate third-party application features.

## Visual previews

The current windows show real public entry-screen screenshots for Ash and Oath and Project Rone, and **labeled project covers** for IntentShot and Fuller Chiro. The capture browser could not reach IntentShot’s styling CDN or Fuller Chiro’s image storage, so incomplete screenshots of those apps were excluded. Covers are not presented as screenshots. No third-party preview service or iframe is required for the live buttons to work. IntentShot and Ash and Oath are marked as requiring sign-in; sign into them before presenting during the interview.

To replace the covers with real public entry-screen screenshots:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run previews:capture
npm run build
```

The script captures only reachable public pages with HTTPS verification enabled, saves images in `public/previews/`, and updates `src/previews.json`. Failed captures retain existing previews and return a nonzero exit code. Successful screenshots are labeled “App screenshot.” Review them before deploying; signed-in app screens require separately supplied, sanitized images. Keep screenshots and the generated manifest together in version control.

Project metadata and links live in `src/projects.json`. Edit the intro in `src/main.ts` and appearance in `src/style.css`. The gallery has no database, credentials, analytics, or backend requirements.

## Firebase Hosting

The selected project and Hosting site are `portfolio-dd8f5`. The Hosting predeploy hook runs the production build. On a machine authenticated to that project:

```sh
npx firebase login
npm run hosting:deploy
```

On a restricted cloud filesystem, prefix CLI commands with `XDG_CONFIG_HOME=/tmp/portfolio-firebase-config`. Remote login can use `./node_modules/.bin/firebase login --no-localhost`. Keep login codes and tokens in the terminal, never in chat or the repository.

`npm run hosting:serve` serves the production build through Firebase’s local Hosting emulator with a demo project, without login. The eventual live address is https://portfolio-dd8f5.web.app/. Do not assume deployment has happened based on configuration alone.

If network access is blocked, the cloud environment must permit the exact project hosts plus Firebase’s API, upload, and authentication hosts. A saved draft does not apply or publish settings. Do not disable HTTPS verification. Save/publish the environment or preserve this source in Git before starting a fresh task; uncommitted local files did not survive the previous restoration.
