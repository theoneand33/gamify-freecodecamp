// Pure game rules, shared by content script, popup and test.
const GAME = {
  BASE_XP: 10,
  levelOf: (xp) => Math.floor(Math.sqrt(xp / 50)) + 1, // Lv2 at 50 XP, Lv3 at 200, Lv4 at 450...
  xpForLevel: (lvl) => 50 * (lvl - 1) ** 2,
  BADGES: [
    ["first", "First Step", "Complete 1 challenge", (s) => s.count >= 1],
    ["ten", "Warming Up", "Complete 10 challenges", (s) => s.count >= 10],
    ["fifty", "Committed", "Complete 50 challenges", (s) => s.count >= 50],
    ["hundred", "Centurion", "Complete 100 challenges", (s) => s.count >= 100],
    ["streak3", "On Fire", "3-day streak", (s) => s.streak >= 3],
    ["streak7", "Week Warrior", "7-day streak", (s) => s.streak >= 7],
    ["streak30", "Unstoppable", "30-day streak", (s) => s.streak >= 30],
    ["daily10", "Binge Coder", "10 challenges in one day", (s) => s.todayCount >= 10],
  ],
  empty: () => ({ xp: 0, count: 0, streak: 0, bestStreak: 0, lastDay: null, todayCount: 0, done: {}, badges: [] }),

  yesterday: (today) => new Date(Date.parse(today + "T00:00:00Z") - 864e5).toISOString().slice(0, 10),
  // Streak as of today: 0 once a full day was missed.
  liveStreak: (s, today) => (s.lastDay === today || s.lastDay === GAME.yesterday(today) ? s.streak : 0),

  // today: "YYYY-MM-DD". Returns null if this challenge was already rewarded.
  award(prev, path, today) {
    if (prev.done[path]) return null;
    const s = { ...prev, done: { ...prev.done, [path]: today }, badges: [...prev.badges] };
    if (s.lastDay !== today) {
      s.streak = s.lastDay === GAME.yesterday(today) ? s.streak + 1 : 1;
      s.todayCount = 0;
      s.lastDay = today;
    }
    s.todayCount++;
    s.count++;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    const gained = GAME.BASE_XP + 2 * Math.min(s.streak - 1, 5); // streak bonus, capped at +10
    const oldLevel = GAME.levelOf(s.xp);
    s.xp += gained;
    const newBadges = GAME.BADGES.filter(([id, , , test]) => !s.badges.includes(id) && test(s));
    s.badges.push(...newBadges.map(([id]) => id));
    return { state: s, gained, leveledUp: GAME.levelOf(s.xp) > oldLevel, newBadges };
  },
};
if (typeof module !== "undefined") module.exports = GAME;
