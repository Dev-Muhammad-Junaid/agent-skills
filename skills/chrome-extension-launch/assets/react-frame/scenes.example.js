/* SKILL NOTE: copy to store/fixtures/scenes.js. Fixture accounts only (example.com, stock portraits in store/fixtures/avatars/). Options model the product's states: reveal (discovery), checked/pending (access probes), activeId, query, edit-mode fields. */
/* Fixture accounts for store art and the promo video. Example names, example.com addresses and
 * stock portraits only: no real inboxes ever appear in the listing.
 * Needs store/brands.js. Usage: Scene("drive", { theme: "dark", highlightedIndex: 4 }) returns the
 * props for window.__pose() in app/store-shots/frame. */
(function (root) {
  const AV = (file) => `/store/fixtures/avatars/${file}.jpg`;
  // Company / workspace marks: a monogram on a rounded square.
  const mono = (letter, bg) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${bg}"/>` +
        `<text x="32" y="43" text-anchor="middle" font-family="DM Sans, Helvetica, Arial, sans-serif" font-size="32" font-weight="700" fill="#fff">${letter}</text></svg>`
    );

  const P = {
    alex: { name: "Alex Rivera", avatar: AV("men-32") },
    jordan: { name: "Jordan Lee", avatar: AV("women-44") },
    sam: { name: "Sam Patel", avatar: AV("men-75") },
    morgan: { name: "Morgan Chen", avatar: AV("women-68") },
    casey: { name: "Casey Nguyen", avatar: AV("men-11") },
    riley: { name: "Riley Brooks", avatar: AV("women-21") },
    quinn: { name: "Quinn Adams", avatar: AV("men-52") },
    taylor: { name: "Taylor Kim", avatar: AV("women-12") },
  };
  const NORTHWIND = mono("N", "#0e7490");
  const STUDIO = mono("S", "#7c3aed");
  const ACME = mono("A", "#ea580c");

  // Google numbers sessions from 0 (authuser), every other site from 1.
  const google = [
    { id: "0", ...P.alex, email: "alex@example.com", isActive: true },
    { id: "1", ...P.jordan, email: "jordan@company.com" },
    { id: "2", ...P.sam, email: "sam@school.edu" },
    { id: "3", ...P.casey, email: "casey@studio.io" },
    { id: "4", ...P.morgan, email: "morgan@example.com" },
  ];
  const access = { "0": "NO_ACCESS", "1": "NO_ACCESS", "2": "NO_ACCESS", "3": "ACCESS", "4": "NO_ACCESS" };

  const SCENES = {
    drive: {
      hostName: "drive.google.com", glyph: "drive", providerId: "google", showAccessState: true,
      currentUrl: "https://drive.google.com/drive/folders/q3-plan",
      accounts: google.map((a) => ({ ...a, hasAccess: access[a.id] })),
    },
    gmail: {
      hostName: "mail.google.com", glyph: "gmail", providerId: "google",
      currentUrl: "https://mail.google.com/mail/u/0/", accounts: google,
    },
    youtube: {
      hostName: "www.youtube.com", glyph: "youtube", providerId: "google",
      currentUrl: "https://www.youtube.com/", accounts: google.slice(0, 4),
      // google-provider.ts: YouTube adds a shortcut to Google's own account chooser
      headerActions: [{ id: "choose", label: "Choose", icon: "external-link", tooltip: "Open Google Account Chooser",
        styles: "bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200 dark:border-red-900" }],
    },
    linkedin: {
      hostName: "www.linkedin.com", glyph: "linkedin", providerId: "linkedin",
      currentUrl: "https://www.linkedin.com/feed/",
      accounts: [
        { id: "1", ...P.alex, email: "Personal profile", isActive: true },
        { id: "2", name: "Northwind Labs", email: "Company page", avatar: NORTHWIND },
        { id: "3", name: "Acme Studio", email: "Company page", avatar: ACME },
      ],
    },
    x: {
      hostName: "x.com", glyph: "x", providerId: "x", currentUrl: "https://x.com/home",
      accounts: [
        { id: "1", ...P.alex, email: "@alexbuilds", isActive: true },
        { id: "2", name: "Northwind Labs", email: "@northwindlabs", avatar: NORTHWIND },
        { id: "3", ...P.riley, email: "@rileywrites" },
      ],
    },
    instagram: {
      hostName: "www.instagram.com", glyph: "instagram", providerId: "instagram",
      currentUrl: "https://www.instagram.com/",
      accounts: [
        { id: "1", ...P.riley, email: "@riley.makes", isActive: true },
        { id: "2", name: "Acme Studio", email: "@acme.studio", avatar: ACME },
        { id: "3", ...P.quinn, email: "@quinn.outdoors" },
      ],
    },
    facebook: {
      hostName: "www.facebook.com", glyph: "facebook", providerId: "facebook",
      currentUrl: "https://www.facebook.com/",
      accounts: [
        { id: "1", ...P.jordan, email: "Personal profile", isActive: true },
        { id: "2", name: "Northwind Labs", email: "Page", avatar: NORTHWIND },
        { id: "3", name: "Jordan Lee Photography", email: "Page", avatar: AV("women-44") },
      ],
    },
    figmaFile: {
      // figma-provider.ts probes access on file URLs, like Google Drive
      hostName: "www.figma.com", glyph: "figma", providerId: "figma", showAccessState: true,
      currentUrl: "https://www.figma.com/design/k3y/launch-deck",
      accounts: [
        { id: "1", ...P.alex, email: "alex@example.com", isActive: true, hasAccess: "NO_ACCESS" },
        { id: "2", ...P.casey, email: "casey@studio.io", hasAccess: "ACCESS" },
      ],
    },
    figma: {
      hostName: "www.figma.com", glyph: "figma", providerId: "figma", currentUrl: "https://www.figma.com/files",
      accounts: [
        { id: "1", ...P.alex, email: "alex@example.com", isActive: true },
        { id: "2", ...P.casey, email: "casey@studio.io" },
      ],
    },
    notion: {
      hostName: "www.notion.so", glyph: "notion", providerId: "notion", currentUrl: "https://www.notion.so/",
      headerActions: [{ id: "add", label: "Add account", icon: "external-link", styles: "bg-muted text-foreground border border-border" }],
      accounts: [
        { id: "1", name: "Studio", email: "alex@example.com", avatar: STUDIO, isActive: true },
        { id: "2", name: "Personal", email: "alex@example.com", avatar: P.alex.avatar },
        { id: "3", name: "Northwind", email: "jordan@company.com", avatar: NORTHWIND },
      ],
    },
    github: {
      hostName: "github.com", glyph: "github", providerId: "github", currentUrl: "https://github.com/",
      accounts: [
        { id: "1", ...P.alex, email: "alexrivera", isActive: true },
        { id: "2", name: "Alex at Northwind", email: "alex-northwind", avatar: NORTHWIND },
      ],
    },
  };

  // Props for __pose(). Options mirror the real switcher's states:
  //   query      filters by name or email (as profile-switcher.tsx does)
  //   activeId   which account is Active          reveal   only the first n accounts (discovery in progress)
  //   checked    access known for the first n rows; the rest show the spinner (checking)
  //   pending    every row checking                mode     "list" | "loading" | "finding" | "edit"
  //   spin       spinner angle in degrees          edit:    themePref, showAvatar, showEmail, focus, pressed, rename, hidden, order
  function Scene(id, o = {}) {
    const s = SCENES[id];
    const theme = o.theme || "light";
    let accounts = s.accounts;
    if (o.order) accounts = o.order.map((i) => accounts[i]);
    if (o.activeId) accounts = accounts.map((a) => ({ ...a, isActive: a.id === o.activeId }));
    if (o.rename) accounts = accounts.map((a) => (o.rename[a.id] != null ? { ...a, name: o.rename[a.id] } : a));
    if (o.hidden) accounts = accounts.map((a) => ({ ...a, isVisible: !o.hidden.includes(a.id) }));
    if (o.pending) accounts = accounts.map((a) => ({ ...a, hasAccess: undefined }));
    if (o.checked != null) accounts = accounts.map((a, i) => (i < o.checked ? a : { ...a, hasAccess: undefined }));
    if (o.mode !== "edit" && o.hidden) accounts = accounts.filter((a) => a.isVisible !== false);
    if (o.showAvatar === false || o.showEmail === false) accounts = accounts.map((a) => ({ ...a, showAvatar: o.showAvatar, showEmail: o.showEmail }));
    const q = (o.query || "").trim().toLowerCase();
    if (q) accounts = accounts.filter((a) => `${a.name} ${a.email}`.toLowerCase().includes(q));
    if (o.reveal != null) accounts = accounts.slice(0, o.reveal);
    if (o.limit) accounts = accounts.slice(0, o.limit);
    return {
      theme,
      mode: o.mode || "list",
      spin: o.spin || 0,
      hostName: s.hostName,
      favicon: root.BrandUrl(s.glyph, theme === "dark" ? "#fafafa" : "#18181b"),
      currentUrl: s.currentUrl,
      providerId: s.providerId,
      showAccessState: !!s.showAccessState,
      headerActions: s.headerActions || [],
      query: o.query || "",
      accounts,
      highlightedIndex: o.highlightedIndex ?? -1,
      copiedLink: !!o.copiedLink,
      themePref: o.themePref || "system",
      showAvatar: o.showAvatar,
      showEmail: o.showEmail,
      focus: o.focus || null,
      pressed: o.pressed || null,
    };
  }

  root.SCENES = SCENES;
  root.Scene = Scene;
})(typeof self !== "undefined" ? self : this);
