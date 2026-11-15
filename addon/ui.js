// Shared drawing helpers for the popup and the in-page HUD.
const UI = (() => {
  const NS = "http://www.w3.org/2000/svg";
  // lucide paths, 1.5 stroke
  const PATHS = {
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    trend: '<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    snow: '<path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
  };
  const BADGE_ICON = { first: "flag", ten: "trend", fifty: "target", hundred: "shield", streak3: "flame", streak7: "cal", streak30: "zap", daily10: "code" };

  const icon = (name, size = 16) => {
    const doc = new DOMParser().parseFromString(
      `<svg xmlns="${NS}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`, "image/svg+xml");
    const n = document.importNode(doc.documentElement, true);
    n.setAttribute("width", size);
    n.setAttribute("height", size);
    return n;
  };

  // Outer ring: progress to the next level. Inner ring: today's goal.
  const ring = (size, levelP, goalP, lvl, showLabel) => {
    const el = document.createElement("div");
    el.className = size < 48 ? "gf-ring gf-ring-sm" : "gf-ring";
    el.style.width = el.style.height = size + "px";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("aria-hidden", "true");
    const c = size / 2;
    for (const [r, w, p, color] of [[size * 0.458, size / 16, levelP, "#f1be32"], [size * 0.354, size / 24, goalP, "#d0d0d5"]]) {
      const len = 2 * Math.PI * r;
      for (const [stroke, dash] of [["#2a2a40", len], [color, len * p]]) {
        if (!dash) continue; // a zero dash with round caps still draws a dot
        const ci = document.createElementNS(NS, "circle");
        for (const [k, v] of Object.entries({ cx: c, cy: c, r, stroke, "stroke-width": w, "stroke-dasharray": `${dash} ${len}` })) ci.setAttribute(k, v);
        svg.append(ci);
      }
    }
    const lv = document.createElement("div");
    lv.className = "gf-lv";
    const b = document.createElement("b");
    b.textContent = lvl;
    lv.append(b);
    if (showLabel) lv.append(Object.assign(document.createElement("span"), { textContent: "Level" }));
    el.append(svg, lv);
    return el;
  };

  const medal = (id, size = 20, box = 48) => {
    const el = document.createElement("span");
    el.className = "gf-medal";
    el.style.width = el.style.height = box + "px";
    el.append(icon(BADGE_ICON[id], size));
    return el;
  };

  return { icon, ring, medal, PATHS, BADGE_ICON };
})();
if (typeof module !== "undefined") module.exports = UI;
