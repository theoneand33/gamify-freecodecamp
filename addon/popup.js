const $ = (id) => document.getElementById(id);

async function show() {
  const s = GAME.load((await browser.storage.local.get("state")).state);
  const today = new Date().toLocaleDateString("en-CA");
  const lvl = GAME.levelOf(s.xp);
  const lo = GAME.xpForLevel(lvl), hi = GAME.xpForLevel(lvl + 1);
  $("level").textContent = `Level ${lvl}`;
  $("bar").style.width = ((s.xp - lo) / (hi - lo)) * 100 + "%";
  $("next").textContent = `${hi - s.xp} XP to level ${lvl + 1}`;
  $("xp").textContent = s.xp;
  $("count").textContent = s.count;
  const streak = GAME.liveStreak(s, today);
  $("streak").textContent = `${streak} day${streak === 1 ? "" : "s"}`;
  $("best").textContent = `${s.bestStreak} day${s.bestStreak === 1 ? "" : "s"}`;
  $("freezes").textContent = `${s.freezes} of ${GAME.MAX_FREEZES}`;
  const goal = Math.min(GAME.todayXp(s, today), GAME.GOAL_XP);
  $("goal").textContent = `${goal}/${GAME.GOAL_XP} XP`;
  $("goalbar").style.width = (goal / GAME.GOAL_XP) * 100 + "%";
  // Last 7 days: done, frozen or missed.
  const active = new Set(Object.values(s.done));
  $("week").replaceChildren(...[6, 5, 4, 3, 2, 1, 0].map((n) => {
    const day = GAME.addDays(today, -n), li = document.createElement("li");
    const state = active.has(day) ? "done" : s.frozen.includes(day) ? "frozen" : "missed";
    li.className = state + (n === 0 ? " today" : "");
    li.textContent = new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" });
    li.title = `${day}: ${state}`;
    li.setAttribute("aria-label", li.title);
    return li;
  }));
  $("badges").replaceChildren(...GAME.BADGES.map(([id, name, desc]) => {
    const li = document.createElement("li");
    const got = s.badges.includes(id);
    li.className = got ? "" : "locked";
    const dot = document.createElement("span"), small = document.createElement("small");
    dot.className = "dot";
    small.textContent = desc;
    li.append(dot, name, small);
    li.title = got ? "Earned" : "Not earned yet";
    return li;
  }));
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
