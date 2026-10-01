/* SKILL NOTE: copy to store/templates/page.js. Quiet site mocks behind the real UI; add bodies per site. */
/* A quiet mock of the site behind the overlay: header with the platform glyph, skeleton content.
 * Not a copy of the real site; just enough to read as "the overlay sits on this page". */
(function (root) {
  const SITES = {
    drive: { name: "Drive", glyph: "drive", body: "access" },
    gmail: { name: "Gmail", glyph: "gmail", body: "list" },
    youtube: { name: "YouTube", glyph: "youtube", body: "grid" },
    linkedin: { name: "LinkedIn", glyph: "linkedin", body: "feed" },
    x: { name: "X", glyph: "x", body: "feed" },
    instagram: { name: "Instagram", glyph: "instagram", body: "feed" },
    facebook: { name: "Facebook", glyph: "facebook", body: "feed" },
    figma: { name: "Figma", glyph: "figma", body: "grid" },
    notion: { name: "Notion", glyph: "notion", body: "doc" },
    github: { name: "GitHub", glyph: "github", body: "list" },
    docs: { name: "Q3 plan", glyph: "docs", body: "doc" },
  };
  const line = (w, h = 12, extra = "") => `<i class="sk" style="width:${w};height:${h}px;${extra}"></i>`;
  const BODIES = {
    access: () => `<div class="pg-access">
      <svg viewBox="0 0 24 24" class="pg-lock"><rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>
      <b>You need access</b>${line("62%", 11)}${line("44%", 11)}<span class="pg-btn"></span></div>`,
    list: () => `<div class="pg-list">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<div>${line("18px", 18, "border-radius:6px")}${line(["22%", "18%", "26%", "20%"][i % 4])}${line(["44%", "38%", "50%", "34%"][i % 4])}</div>`).join("")}</div>`,
    grid: () => `<div class="pg-grid">${[0, 1, 2, 3, 4, 5].map(() => `<div><i class="sk thumb"></i>${line("80%")}${line("52%", 10)}</div>`).join("")}</div>`,
    feed: () => `<div class="pg-feed"><div class="pg-side">${line("70%")}${line("55%")}${line("62%")}${line("48%")}</div><div class="pg-posts">${[0, 1].map(() => `<div class="pg-post"><div class="pg-who"><i class="sk av"></i>${line("30%")}</div>${line("92%", 11)}${line("78%", 11)}<i class="sk media"></i></div>`).join("")}</div></div>`,
    doc: () => `<div class="pg-doc">${line("46%", 26)}${line("90%")}${line("84%")}${line("88%")}${line("40%")}${line("86%")}${line("80%")}</div>`,
  };

  // opts.avatar: the signed-in account's photo in the header (the video swaps it after a switch).
  function page(id, opts = {}) {
    const s = SITES[id];
    const av = opts.avatar ? `<img class="av" src="${opts.avatar}" alt="">` : `<i class="sk av"></i>`;
    return `<div class="pg-top"><span class="pg-brand">${root.Brand(s.glyph)}<b>${s.name}</b></span><span class="pg-search"></span>${av}</div><div class="pg-body">${BODIES[s.body]()}</div>`;
  }

  const css = `
  .page { position: absolute; background: var(--surface); border-radius: 18px; box-shadow: 0 0 0 1px var(--border); overflow: hidden; }
  .sk { display: block; border-radius: 6px; background: var(--sunken); }
  .page .sk { background: color-mix(in srgb, var(--ink) 7%, transparent); }
  .pg-top { height: 58px; display: flex; align-items: center; gap: 18px; padding: 0 22px; border-bottom: 1px solid var(--border); }
  .pg-brand { display: flex; align-items: center; gap: 10px; font-size: 18px; color: var(--ink); }
  .pg-brand .glyph { width: 26px; height: 26px; }
  .pg-search { flex: 1; max-width: 340px; height: 34px; border-radius: 999px; margin-left: 24px; background: color-mix(in srgb, var(--ink) 6%, transparent); }
  .pg-top .av { width: 32px; height: 32px; border-radius: 50%; margin-left: auto; object-fit: cover; }
  .pg-body { padding: 24px; }
  .pg-body .sk + .sk { margin-top: 10px; }
  .pg-access { display: flex; flex-direction: column; align-items: center; padding-top: 34px; color: var(--ink); }
  .pg-access b { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; margin: 16px 0 18px; }
  .pg-access .sk { align-self: center; }
  .pg-lock { width: 44px; height: 44px; fill: none; stroke: var(--muted); stroke-width: 1.6; }
  .pg-btn { margin-top: 24px; width: 150px; height: 40px; border-radius: 999px; background: color-mix(in srgb, var(--ink) 9%, transparent); }
  .pg-list > div { display: flex; align-items: center; gap: 16px; height: 50px; border-bottom: 1px solid var(--border); }
  .pg-list > div .sk { margin: 0 !important; }
  .pg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .pg-grid .thumb { height: 120px; border-radius: 12px; margin-bottom: 12px; }
  .pg-feed { display: flex; gap: 24px; }
  .pg-side { width: 180px; flex: none; }
  .pg-posts { flex: 1; display: flex; flex-direction: column; gap: 20px; }
  .pg-post { border-radius: 14px; box-shadow: 0 0 0 1px var(--border); padding: 18px; }
  .pg-who { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .pg-who .sk { margin: 0 !important; }
  .pg-who .av { width: 36px; height: 36px; border-radius: 50%; flex: none; }
  .pg-post .media { height: 170px; border-radius: 10px; margin-top: 14px; }
  .pg-doc { padding: 20px 60px; }
  .pg-doc .sk:first-child { margin-bottom: 22px; }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  root.Page = page;
  root.SITES = SITES;
})(typeof self !== "undefined" ? self : this);
