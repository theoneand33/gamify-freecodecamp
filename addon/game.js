// Pure game rules, shared by content script, popup and test.
const GAME = {
  BASE_XP: 10,
  GOAL_XP: 30, // daily goal, like Duolingo's "Regular"
  MAX_FREEZES: 2, // streak freezes held at once
  levelOf: (xp) => Math.floor(Math.sqrt(xp / 50)) + 1, // Lv2 at 50 XP, Lv3 at 200, Lv4 at 450...
  xpForLevel: (lvl) => 50 * (lvl - 1) ** 2,
  BADGES: [
    ["first", "First step", "Complete 1 challenge", (s) => s.count >= 1],
    ["ten", "Warming up", "Complete 10 challenges", (s) => s.count >= 10],
    ["fifty", "Committed", "Complete 50 challenges", (s) => s.count >= 50],
    ["hundred", "Centurion", "Complete 100 challenges", (s) => s.count >= 100],
    ["streak3", "On fire", "3-day streak", (s) => s.streak >= 3],
    ["streak7", "Week warrior", "7-day streak", (s) => s.streak >= 7],
    ["streak30", "Unstoppable", "30-day streak", (s) => s.streak >= 30],
    ["daily10", "Binge coder", "10 challenges in one day", (s) => s.todayCount >= 10],
  ],
  empty: () => ({ xp: 0, count: 0, streak: 0, bestStreak: 0, lastDay: null, todayCount: 0, todayXp: 0, freezes: 0, frozen: [], done: {}, badges: [] }),
  // Fills fields added after a state was first saved.
  // Saves from before the daily goal have no todayXp, so estimate it from todayCount.
  load: (raw) => ({ ...GAME.empty(), todayXp: (raw?.todayCount || 0) * GAME.BASE_XP, ...raw }),

  addDays: (day, n) => new Date(Date.parse(day + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10),
  daysBetween: (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5),
  // Streak as of today: 0 once more days were missed than freezes can cover.
  liveStreak: (s, today) => (s.lastDay && GAME.daysBetween(s.lastDay, today) - 1 <= s.freezes ? s.streak : 0),
  todayXp: (s, today) => (s.lastDay === today ? s.todayXp : 0),

  // today: "YYYY-MM-DD". Returns null if this challenge was already rewarded.
  award(prev, path, today) {
    if (prev.done[path]) return null;
    const s = { ...prev, done: { ...prev.done, [path]: today }, badges: [...prev.badges], frozen: [...prev.frozen] };
    let freezesUsed = 0, freezeEarned = false;
    if (s.lastDay !== today) {
      const missed = s.lastDay ? GAME.daysBetween(s.lastDay, today) - 1 : -1;
      if (missed >= 0 && missed <= s.freezes) {
        for (let i = 1; i <= missed; i++) s.frozen.push(GAME.addDays(s.lastDay, i));
        s.freezes -= freezesUsed = missed;
        s.streak++;
      } else s.streak = 1;
      // Every 7 streak days earns a freeze.
      if (s.streak % 7 === 0 && s.freezes < GAME.MAX_FREEZES) { s.freezes++; freezeEarned = true; }
      s.todayCount = 0;
      s.todayXp = 0;
      s.lastDay = today;
    }
    s.todayCount++;
    s.count++;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    const gained = GAME.BASE_XP + 2 * Math.min(s.streak - 1, 5); // streak bonus, capped at +10
    const oldLevel = GAME.levelOf(s.xp);
    s.xp += gained;
    const goalMet = s.todayXp < GAME.GOAL_XP && s.todayXp + gained >= GAME.GOAL_XP;
    s.todayXp += gained;
    const newBadges = GAME.BADGES.filter(([id, , , test]) => !s.badges.includes(id) && test(s));
    s.badges.push(...newBadges.map(([id]) => id));
    return { state: s, gained, leveledUp: GAME.levelOf(s.xp) > oldLevel, newBadges, goalMet, freezesUsed, freezeEarned };
  },
};
if (typeof module !== "undefined") module.exports = GAME;
