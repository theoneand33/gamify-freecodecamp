<img src="assets/icon.svg" width="64" height="64" alt="">

# gamify-freecodecamp

A Firefox add-on that gives you XP, levels, daily streaks and badges for freeCodeCamp challenges.

## Install (development)

1. Open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick `addon/manifest.json`.
2. Solve a challenge on freecodecamp.org. When the "Submit and go to next challenge" button appears you get XP.
3. Click the toolbar icon for stats and badges.

## Rules

- 10 XP per challenge, +2 per streak day (max +10). Each challenge pays out once.
- Daily goal: 30 XP. The HUD shows today's progress; the popup shows the last 7 days.
- Streak freezes: every 7th streak day earns one (hold up to 2). A missed day spends one instead of breaking the streak.
- Level N starts at 50·(N−1)² XP.
- Progress lives in `browser.storage.local`. Nothing leaves your browser.

## Develop

```sh
node test/game.test.js          # game rules
npx web-ext lint -s addon
npx web-ext build -s addon -a dist
```
