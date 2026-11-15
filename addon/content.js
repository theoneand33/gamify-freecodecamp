// Detect a passed challenge by the "Submit and go to next challenge" button fCC shows after tests pass.
// shortcut: matches English UI text only, add other locales' strings if needed.
const DONE_TEXT = /go to next (challenge|step)|submit and continue/i;
const today = () => new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD

const el = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls || "", textContent: text ?? "" });
const hud = el("div", "gfcc-hud");
const toasts = el("div", "gfcc-toasts");
toasts.setAttribute("role", "status");
document.documentElement.append(hud, toasts);

function render(s) {
  const lvl = GAME.levelOf(s.xp);
  const lo = GAME.xpForLevel(lvl), hi = GAME.xpForLevel(lvl + 1);
  const goal = Math.min(GAME.todayXp(s, today()), GAME.GOAL_XP);
  const streak = el("span", "gfcc-num gfcc-streak", GAME.liveStreak(s, today()));
  streak.prepend(UI.icon("flame", 14));
  streak.title = `Day streak, ${s.freezes} freeze${s.freezes === 1 ? "" : "s"} left`;
  hud.replaceChildren(UI.ring(32, (s.xp - lo) / (hi - lo), goal / GAME.GOAL_XP, lvl), el("span", "gfcc-num", `${s.xp.toLocaleString("en-US")} XP`), el("span", "gfcc-sep"), streak);
  hud.title = `${hi - s.xp} XP to level ${lvl + 1}, ${goal}/${GAME.GOAL_XP} XP today`;
}

// kind: "xp" | "badge" | "plain". Badges get a medal and the badge name.
function toast(text, kind = "plain", icon = "check", badgeId) {
  const t = el("div", "gfcc-toast " + kind);
  if (kind === "badge") {
    const d = el("div", "", text);
    d.prepend(el("small", "", "Badge earned"));
    t.append(UI.medal(badgeId, 16, 32), d);
  } else {
    if (kind === "plain") t.append(UI.icon(icon));
    t.append(text);
  }
  toasts.append(t);
  setTimeout(() => t.remove(), 3500);
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
