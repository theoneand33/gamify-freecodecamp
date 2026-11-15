// Detect a passed challenge by the "Submit and go to next challenge" button fCC shows after tests pass.
// shortcut: matches English UI text only, add other locales' strings if needed.
const DONE_TEXT = /go to next (challenge|step)|submit and continue/i;
const today = () => new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD

const el = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls || "", textContent: text ?? "" });
const hud = el("div", "gfcc-hud");
const toasts = el("div", "gfcc-toasts");
toasts.setAttribute("role", "status");
document.documentElement.append(hud, toasts);

const EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const fmt = (xp) => `${xp.toLocaleString("en-US")} XP`;

function render(s) {
  const lvl = GAME.levelOf(s.xp);
  const lo = GAME.xpForLevel(lvl), hi = GAME.xpForLevel(lvl + 1);
  const goal = Math.min(GAME.todayXp(s, today()), GAME.GOAL_XP);
  const days = GAME.liveStreak(s, today());
  const key = [s.xp, goal, days, s.freezes].join();
  if (key === hud.dataset.k) return; // onChanged echoes our own write; rebuilding would cut the animation short
  const prevXp = hud.dataset.k ? Number(hud.dataset.xp) : null;
  const prevDash = {};
  for (const c of hud.querySelectorAll("circle")) prevDash[c.getAttribute("r")] = parseFloat(c.getAttribute("stroke-dasharray"));
  Object.assign(hud.dataset, { k: key, xp: s.xp });
  const streak = el("span", "gfcc-num gfcc-streak", days);
  streak.prepend(UI.icon("flame", 14));
  streak.title = `Day streak, ${s.freezes} freeze${s.freezes === 1 ? "" : "s"} left`;
  const xpEl = el("span", "gfcc-num", fmt(s.xp));
  hud.replaceChildren(UI.ring(32, (s.xp - lo) / (hi - lo), goal / GAME.GOAL_XP, lvl), xpEl, el("span", "gfcc-sep"), streak);
  hud.title = `${hi - s.xp} XP to level ${lvl + 1}, ${goal}/${GAME.GOAL_XP} XP today`;
  if (prevXp !== null && s.xp > prevXp) celebrate(prevDash, xpEl, prevXp, s.xp);
}

// XP gained: pop the HUD, fill the rings from their old length, count the number up.
function celebrate(prevDash, xpEl, from, to) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const base = "rgba(245, 246, 247, 0.08)", gold = "#f1be32";
  hud.animate(reduce
    ? [{ borderColor: gold }, { borderColor: base }]
    : [{ transform: "scale(1)", borderColor: base, easing: EASE }, { transform: "scale(1.08)", borderColor: gold, offset: 0.3, easing: EASE }, { transform: "scale(1)", borderColor: base }],
  { duration: 700 });
  for (const c of hud.querySelectorAll("circle")) {
    if (c.getAttribute("stroke") === "#2a2a40") continue; // track, not progress
    const to = c.getAttribute("stroke-dasharray"), [dash, len] = to.split(" ").map(Number);
    const prev = prevDash[c.getAttribute("r")] ?? 0;
    if (prev !== dash) c.animate([{ strokeDasharray: `${prev < dash ? prev : 0} ${len}` }, { strokeDasharray: to }], { duration: 700, easing: EASE }); // level-up wraps: fill from empty
  }
  if (reduce) return;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min((t - t0) / 700, 1);
    xpEl.textContent = fmt(Math.round(from + (to - from) * (1 - (1 - p) ** 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// kind: "badge" | "plain". Badges get a medal and the badge name.
let burst = 0; // toasts fired in the same tick stagger in, bottom first
function toast(text, kind = "plain", icon = "check", badgeId) {
  const t = el("div", "gfcc-toast " + kind);
  const delay = 80 * burst++;
  if (burst === 1) queueMicrotask(() => (burst = 0));
  t.style.animationDelay = delay + "ms";
  if (kind === "badge") {
    const d = el("div", "", text);
    d.prepend(el("small", "", "Badge earned"));
    t.append(UI.medal(badgeId, 16, 32), d);
  } else {
    if (kind === "plain") t.append(UI.icon(icon));
    t.append(text);
  }
  toasts.append(t);
  setTimeout(() => t.remove(), 3500 + delay);
}

async function load() {
  return GAME.load((await browser.storage.local.get("state")).state);
}

let busy = false, state = null; // state: in-memory copy, kept fresh by load() and onChanged
async function check() {
  busy = false;
  const path = location.pathname.replace(/\/$/, "");
  if (!state || state.done[path]) return; // skip the DOM scan and storage read on already-rewarded pages
  const passed = [...document.querySelectorAll("button")].some((b) => DONE_TEXT.test(b.textContent));
  if (!passed) return;
  const r = GAME.award(await load(), path, today()); // re-read storage: another tab may have awarded
  if (!r) return;
  await browser.storage.local.set({ state: r.state });
  show(r.state);
  new Audio(browser.runtime.getURL("success.ogg")).play().catch(() => {}); // autoplay can be blocked; sound is optional
  toast(`+${r.gained} XP`, "xp");
  if (r.freezesUsed) toast(`Streak saved, ${r.freezesUsed} freeze${r.freezesUsed > 1 ? "s" : ""} used`, "plain", "snow");
  if (r.goalMet) toast("Daily goal complete");
  if (r.freezeEarned) toast("Streak freeze earned", "plain", "snow");
  if (r.leveledUp) toast(`Level ${GAME.levelOf(r.state.xp)} reached`, "plain", "trend");
  for (const [id, name] of r.newBadges) toast(name, "badge", "", id);
}

new MutationObserver(() => {
  if (!busy) { busy = true; setTimeout(check, 400); } // debounce DOM churn
}).observe(document.documentElement, { childList: true, subtree: true });

const show = (s) => render((state = s));
load().then(show);
browser.storage.onChanged.addListener((c) => c.state && show(GAME.load(c.state.newValue))); // sync across tabs
