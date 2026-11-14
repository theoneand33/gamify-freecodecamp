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
