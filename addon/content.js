// Detect a passed challenge by the "Submit and go to next challenge" button fCC shows after tests pass.
// shortcut: matches English UI text only, add other locales' strings if needed.
const DONE_TEXT = /go to next (challenge|step)|submit and continue/i;
const today = () => new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD

// Build the panel once, then only update text.
const el = (tag, cls) => Object.assign(document.createElement(tag), { className: cls });
const hud = el("div", "gfcc-hud"), row = el("div", "gfcc-row"), bar = el("div", "gfcc-bar");
const lvlEl = el("span", ""), xpEl = el("span", "gfcc-num"), streakEl = el("span", "gfcc-num gfcc-streak"), streakNum = el("span", ""), goalEl = el("span", "gfcc-num");
// lucide "flame", 1.5 stroke
const SVG = "http://www.w3.org/2000/svg", flame = document.createElementNS(SVG, "svg"), path = document.createElementNS(SVG, "path");
for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", width: 14, height: 14, fill: "none", stroke: "currentColor", "stroke-width": 1.5, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) flame.setAttribute(k, v);
path.setAttribute("d", "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z");
flame.append(path);
streakEl.append(flame, streakNum);
row.append(lvlEl, xpEl, streakEl, goalEl);
hud.append(row, bar);
const toasts = el("div", "gfcc-toasts");
toasts.setAttribute("role", "status");
document.documentElement.append(hud, toasts);

function render(s) {
  const lvl = GAME.levelOf(s.xp);
  const lo = GAME.xpForLevel(lvl), hi = GAME.xpForLevel(lvl + 1);
  lvlEl.textContent = `Level ${lvl}`;
  xpEl.textContent = `${s.xp} XP`;
  streakNum.textContent = GAME.liveStreak(s, today());
  streakEl.title = `Day streak, ${s.freezes} freeze${s.freezes === 1 ? "" : "s"} left`;
  goalEl.textContent = `${Math.min(GAME.todayXp(s, today()), GAME.GOAL_XP)}/${GAME.GOAL_XP}`;
  goalEl.title = "Daily goal (XP today)";
  bar.style.setProperty("--p", Math.round(((s.xp - lo) / (hi - lo)) * 100) + "%");
  hud.title = `${hi - s.xp} XP to level ${lvl + 1}`;
}

function toast(text) {
  const t = document.createElement("div");
  t.className = "gfcc-toast";
  t.textContent = "// " + text;
  toasts.append(t);
  setTimeout(() => t.remove(), 3500);
}

async function load() {
  return GAME.load((await browser.storage.local.get("state")).state);
}

let busy = false;
async function check() {
  busy = false;
  const passed = [...document.querySelectorAll("button")].some((b) => DONE_TEXT.test(b.textContent));
  if (!passed) return;
  const r = GAME.award(await load(), location.pathname.replace(/\/$/, ""), today());
  if (!r) return;
  await browser.storage.local.set({ state: r.state });
  render(r.state);
  toast(`+${r.gained} XP`);
  if (r.freezesUsed) toast(`streak saved, ${r.freezesUsed} freeze${r.freezesUsed > 1 ? "s" : ""} used`);
  if (r.goalMet) toast("daily goal complete");
  if (r.freezeEarned) toast("streak freeze earned");
  if (r.leveledUp) toast(`level ${GAME.levelOf(r.state.xp)} reached`);
  for (const [, name, desc] of r.newBadges) toast(`badge earned: ${name}, ${desc.toLowerCase()}`);
}

new MutationObserver(() => {
  if (!busy) { busy = true; setTimeout(check, 400); } // debounce DOM churn
}).observe(document.documentElement, { childList: true, subtree: true });

load().then(render);
browser.storage.onChanged.addListener((c) => c.state && render(GAME.load(c.state.newValue))); // sync across tabs
