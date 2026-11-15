const $ = (id) => document.getElementById(id);
const h = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls || "", textContent: text ?? "" });
const fmt = (n) => n.toLocaleString("en-US");

function caption(name, desc, got) {
  const b = h("b", "", name);
  $("cap").replaceChildren(b, `${desc} · ${got ? "earned" : "not earned yet"}`);
}

async function show() {
  const s = GAME.load((await browser.storage.local.get("state")).state);
  const today = new Date().toLocaleDateString("en-CA");
  const lvl = GAME.levelOf(s.xp);
  const lo = GAME.xpForLevel(lvl), hi = GAME.xpForLevel(lvl + 1);
  const goal = Math.min(GAME.todayXp(s, today), GAME.GOAL_XP);
  const streak = GAME.liveStreak(s, today);

  const key = (color, num, rest) => {
    const d = h("div"), i = h("i"), span = h("span"), b = h("b", "num", num);
    i.style.background = color;
    span.append(b, rest);
    d.append(i, span);
    return d;
  };
  const keys = h("div");
  keys.id = "keys";
  keys.append(key("#f1be32", fmt(hi - s.xp), ` XP to level ${lvl + 1}`), key("#d0d0d5", goal, ` of ${GAME.GOAL_XP} XP today`));
  $("top").replaceChildren(UI.ring(96, (s.xp - lo) / (hi - lo), goal / GAME.GOAL_XP, lvl, true), keys);

  const pips = h("span");
  pips.id = "pips";
  pips.role = "img";
  pips.title = pips.ariaLabel = `${s.freezes} of ${GAME.MAX_FREEZES} streak freezes`;
  for (let i = 0; i < GAME.MAX_FREEZES; i++) {
    const p = h("span", i < s.freezes ? "on" : "");
    p.append(UI.icon("snow"));
    pips.append(p);
  }
  $("streakrow").replaceChildren(UI.icon("flame", 18), `${streak}-day streak`, pips);

  // Last 7 days: done, frozen or missed.
  const active = new Set(Object.values(s.done));
  $("week").replaceChildren(...[6, 5, 4, 3, 2, 1, 0].map((n) => {
    const day = GAME.addDays(today, -n);
    const state = active.has(day) ? "done" : s.frozen.includes(day) ? "frozen" : "missed";
    const li = h("li", state + (n === 0 ? " today" : ""), new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" }));
    li.append(h("i"));
    li.role = "img";
    li.title = li.ariaLabel = `${day}: ${state}`;
    return li;
  }));

  $("stats").textContent = `${fmt(s.xp)} XP · ${fmt(s.count)} challenges · best streak ${s.bestStreak}`;
  $("count").textContent = `${s.badges.length} of ${GAME.BADGES.length}`;
  $("badges").replaceChildren(...GAME.BADGES.map(([id, name, desc]) => {
    const got = s.badges.includes(id);
    const li = h("li", got ? "" : "off");
    const m = UI.medal(id);
    if (!got) m.classList.add("off");
    li.append(m, name);
    li.tabIndex = 0;
    li.ariaLabel = `${name}, ${desc}, ${got ? "earned" : "not earned yet"}`;
    const showCap = () => caption(name, desc, got);
    li.onpointerover = li.onfocus = showCap;
    return li;
  }));
  const first = GAME.BADGES.find(([id]) => !s.badges.includes(id)) || GAME.BADGES[0];
  caption(first[1], first[2], s.badges.includes(first[0]));
}

// Firefox popups can't show confirm(), so require a second click.
$("reset").onclick = async (e) => {
  if (e.target.dataset.armed) {
    await browser.storage.local.remove("state");
    delete e.target.dataset.armed;
    e.target.textContent = "Reset progress";
    show();
  } else {
    e.target.dataset.armed = 1;
    e.target.textContent = "Click again to erase everything";
  }
};
show();
