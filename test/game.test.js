const assert = require("node:assert");
const G = require("../addon/game.js");
let r = G.award(G.empty(), "/learn/a", "2026-01-01");
assert.equal(r.gained, 10); assert.equal(r.state.streak, 1); assert.deepEqual(r.state.badges, ["first"]);
assert.equal(G.award(r.state, "/learn/a", "2026-01-01"), null, "no double reward");
r = G.award(r.state, "/learn/b", "2026-01-02");
assert.equal(r.state.streak, 2); assert.equal(r.gained, 12);
r = G.award(r.state, "/learn/c", "2026-01-05");
assert.equal(r.state.streak, 1, "streak resets after gap"); assert.equal(r.state.bestStreak, 2);
assert.equal(G.liveStreak(r.state, "2026-01-06"), 1); assert.equal(G.liveStreak(r.state, "2026-01-07"), 0);
assert.equal(G.levelOf(49), 1); assert.equal(G.levelOf(50), 2); assert.equal(G.levelOf(200), 3);
let s = G.empty(), up = 0;
for (let i = 0; i < 10; i++) { r = G.award(s, "/x" + i, "2026-02-01"); s = r.state; up += r.leveledUp; }
assert.ok(s.badges.includes("ten") && s.badges.includes("daily10")); assert.equal(up, 1);
console.log("ok");
// Daily goal and streak freezes.
s = G.empty();
for (let i = 0; i < 3; i++) { r = G.award(s, "/g" + i, "2026-03-01"); s = r.state; }
assert.ok(r.goalMet); assert.equal(G.todayXp(s, "2026-03-01"), 30); assert.equal(G.todayXp(s, "2026-03-02"), 0);
s = G.empty();
for (let d = 1; d <= 7; d++) { r = G.award(s, "/f" + d, `2026-04-0${d}`); s = r.state; }
assert.ok(r.freezeEarned); assert.equal(s.freezes, 1);
assert.equal(G.liveStreak(s, "2026-04-09"), 7, "freeze keeps streak alive"); assert.equal(G.liveStreak(s, "2026-04-10"), 0);
r = G.award(s, "/f8", "2026-04-09");
assert.equal(r.freezesUsed, 1); assert.equal(r.state.streak, 8); assert.deepEqual(r.state.frozen, ["2026-04-08"]); assert.equal(r.state.freezes, 0);
assert.equal(G.load({ xp: 5 }).freezes, 0, "old saves get new fields");
assert.equal(G.load({ todayCount: 2 }).todayXp, 20, "old saves backfill todayXp");
s = { ...G.empty(), streak: 13, lastDay: "2026-05-01", freezes: 2 };
r = G.award(s, "/c", "2026-05-02"); assert.equal(r.state.freezes, 2, "freeze cap"); assert.ok(!r.freezeEarned);
r = G.award(s, "/m", "2026-05-04"); assert.equal(r.freezesUsed, 2); assert.deepEqual(r.state.frozen, ["2026-05-02", "2026-05-03"]);
r = G.award(s, "/r", "2026-05-05"); assert.equal(r.state.streak, 1, "gap > freezes resets"); assert.equal(r.state.freezes, 2);
console.log("ok freezes");
const UI = require("../addon/ui.js");
for (const [id] of G.BADGES) assert.ok(UI.PATHS[UI.BADGE_ICON[id]], "badge icon missing: " + id);
console.log("ok badge icons");
