const $ = (id) => document.getElementById(id);

async function show() {
  const s = (await browser.storage.local.get("state")).state || GAME.empty();
  const lvl = GAME.levelOf(s.xp);
  const lo = GAME.xpForLevel(lvl), hi = GAME.xpForLevel(lvl + 1);
  $("level").textContent = `Level ${lvl}`;
  $("bar").style.width = ((s.xp - lo) / (hi - lo)) * 100 + "%";
  $("next").textContent = `${hi - s.xp} XP to level ${lvl + 1}`;
  $("xp").textContent = s.xp;
  $("count").textContent = s.count;
  const streak = GAME.liveStreak(s, new Date().toLocaleDateString("en-CA"));
  $("streak").textContent = `${streak} day${streak === 1 ? "" : "s"}`;
  $("best").textContent = `${s.bestStreak} day${s.bestStreak === 1 ? "" : "s"}`;
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
