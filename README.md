<img src="assets/icon.svg" width="64" height="64" alt="">

# gamify-freecodecamp

Created in [T3 Code](https://t3.codes).

A Firefox add-on that gives you XP, levels, daily streaks and badges for freeCodeCamp challenges.

## Install (development)

1. Open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick `addon/manifest.json`.
2. Solve a challenge on freecodecamp.org. When the "Submit and go to next challenge" button appears you get XP.
3. Click the toolbar icon for stats and badges.

## Rules

- 10 XP per challenge, +2 per streak day (max +10). Each challenge pays out once.
- Level N starts at 50·(N−1)² XP.
- Progress lives in `browser.storage.local`. Nothing leaves your browser.

## Develop

```sh
node test/game.test.js          # game rules
npx web-ext lint -s addon
npx web-ext build -s addon -a dist
```
