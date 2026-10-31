/*
 * Glass Task Board card for Home Assistant
 * A frosted-glass board for recurring household tasks: tap a tile, pick who did it,
 * and it resets on its own schedule. Overdue tasks glow and remind people's phones.
 * No build step, no dependencies. Served automatically by the glass_tasks integration.
 */
(() => {
  const VERSION = "0.1.0";
  const TAG = "glass-task-board";
  if (customElements.get(TAG)) return;

  const TINTS = {
    clear: "255,255,255",
    rose: "255,128,170",
    amber: "255,196,92",
    mint: "96,232,176",
    sky: "110,182,255",
    violet: "176,138,255",
  };
  const DONE_TINT = "96,232,176";
  const OVERDUE_TINT = "255,96,128";
  const AVATAR_HUES = [200, 280, 330, 20, 150, 50, 240, 100];
  const MEMBER_EMOJI = ["🙂", "😎", "🥰", "🤓", "🦊", "🐱", "🐶", "🐼", "🦄", "🐸", "🌻", "🌙", "⭐", "🚀", "🎸", "⚽", "🍩", "👵", "👴", "👶"];
  const HUES = [210, 260, 300, 340, 15, 40, 140, 175];
  const TASK_ICONS = ["✅", "🐶", "🐱", "🐟", "🐾", "💊", "🪴", "🗑️", "♻️", "🍽️", "🧺", "🧹", "🛏️", "🚿", "🦷", "🍳", "🥣", "🧃", "📚", "🎒", "🚗", "📬", "💡", "🔒", "🔋", "🌙", "☀️", "🏃", "💧", "🧼"];
  // Ready-made tasks for a quick start. Times are "HH:MM".
  const PRESETS = [
    { icon: "🐶", title: "Feed the dog", repeat: "daily", times: ["08:00", "18:00"] },
    { icon: "🐱", title: "Feed the cat", repeat: "daily", times: ["08:00", "18:00"] },
    { icon: "💊", title: "Morning pills", repeat: "daily", times: ["09:00"] },
    { icon: "🗑️", title: "Take out the bins", repeat: "weekly", days: [1], times: ["20:00"] },
    { icon: "🪴", title: "Water the plants", repeat: "every", every_days: 3, times: [] },
    { icon: "🍽️", title: "Empty the dishwasher", repeat: "daily", times: [] },
    { icon: "🦷", title: "Brush teeth", repeat: "daily", times: ["08:00", "20:00"] },
    { icon: "🛏️", title: "Make the bed", repeat: "daily", times: ["10:00"] },
  ];
  const QUICK_TIMES = [
    { t: "08:00", label: "Morning" },
    { t: "12:00", label: "Noon" },
    { t: "18:00", label: "Evening" },
    { t: "21:00", label: "Bedtime" },
  ];

  // Background themes: base colour plus three glow colours. Aurora is the default.
  const BACKGROUNDS = {
    aurora: { name: "Aurora", base: "#070b1c", colors: ["#5b6cff", "#ff5fa2", "#22d3c5"] },
    black: { name: "Black", base: "#000000", colors: ["#2c2c30", "#1f1f24", "#3a3a40"] },
    sunset: { name: "Sunset", base: "#1a0a10", colors: ["#ff7a45", "#ff3d77", "#ffc15e"] },
    ocean: { name: "Ocean", base: "#021321", colors: ["#1e88e5", "#00bcd4", "#5c6bc0"] },
    forest: { name: "Forest", base: "#06130c", colors: ["#43a047", "#9ccc65", "#00897b"] },
    lavender: { name: "Lavender", base: "#110c1d", colors: ["#9575cd", "#f48fb1", "#7986cb"] },
    ember: { name: "Ember", base: "#150806", colors: ["#ff5722", "#ffa000", "#d81b60"] },
    graphite: { name: "Graphite", base: "#0b0d10", colors: ["#78909c", "#b0bec5", "#455a64"] },
    midnight: { name: "Midnight", base: "#04050b", colors: ["#283593", "#1565c0", "#4a148c"] },
    halloween: { name: "Halloween", base: "#0c0610", colors: ["#ff6d00", "#8e24aa", "#43a047"] },
    festive: { name: "Festive", base: "#0a1210", colors: ["#e53935", "#43a047", "#fdd835"] },
  };
  const DEFAULT_BACKGROUND = "aurora";
  const darkBase = (hex) => {
    const n = parseInt(String(hex).slice(1), 16);
    if (Number.isNaN(n)) return BACKGROUNDS.aurora.base;
    const mix = (c) => Math.round(c * 0.1 + 6);
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  };
  const LAST_DOER_KEY = "glass-task-board:last-doer";
  const storage = {
    get(k) {
      try {
        return window.localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        window.localStorage.setItem(k, v);
      } catch (e) {
        /* storage unavailable */
      }
    },
  };

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const hash = (s) => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const initials = (name) =>
    String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "?";

  const ICON = {
    pin: '<svg viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M12.5 8c-2.6 0-5 1-6.9 2.6L2 7v9h9l-3.6-3.6A8 8 0 0 1 20.1 16l2.4-.8A10.5 10.5 0 0 0 12.5 8z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
    reply: '<svg viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
    people: '<svg viewBox="0 0 24 24"><path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1a4.2 4.2 0 0 1 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z"/></svg>',
    palette: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18 1.5 1.5 0 0 0 1.1-2.5 1.5 1.5 0 0 1 1.1-2.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8zm-5.5 9A1.5 1.5 0 1 1 8 10.5 1.5 1.5 0 0 1 6.5 12zm3-4A1.5 1.5 0 1 1 11 6.5 1.5 1.5 0 0 1 9.5 8zm5 0A1.5 1.5 0 1 1 16 6.5 1.5 1.5 0 0 1 14.5 8zm3 4a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M3 17.3V21h3.8l11-11.1-3.7-3.7zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="M8.6 16.6 13.2 12 8.6 7.4 10 6l6 6-6 6z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>',
    dots: '<svg viewBox="0 0 24 24"><path d="M12 8a2 2 0 1 0-2-2 2 2 0 0 0 2 2zm0 2a2 2 0 1 0 2 2 2 2 0 0 0-2-2zm0 6a2 2 0 1 0 2 2 2 2 0 0 0-2-2z"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7z"/></svg>',
  };

  const STYLE = `
  :host { display:block; --gm-radius: 26px; --gm-text: #f4f7ff; --gm-dim: rgba(244,247,255,.66);
    font-family: var(--paper-font-body1_-_font-family, "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif); }
  * { box-sizing:border-box; }
  button { font:inherit; color:inherit; cursor:pointer; border:0; background:none; -webkit-tap-highlight-color:transparent; }
  svg { width:1em; height:1em; fill:currentColor; flex:none; }
  .root { position:relative; overflow:hidden; border-radius: var(--ha-card-border-radius, 18px);
    color: var(--gm-text); background: var(--gm-base, #070b1c); transition: background-color 1s ease; min-height: var(--gm-height); height: var(--gm-height); isolation:isolate; }

  /* aurora */
  .aurora { position:absolute; inset:-20%; z-index:-1; filter: blur(70px) saturate(140%); }
  .aurora i { position:absolute; border-radius:50%; opacity:.75; mix-blend-mode:screen; animation: drift 28s ease-in-out infinite alternate; }
  .aurora .b1 { width:60%; height:60%; left:5%; top:5%; background: radial-gradient(circle, var(--gm-c1, #5b6cff) 0%, transparent 65%); }
  .aurora .b2 { width:55%; height:65%; right:0; top:20%; background: radial-gradient(circle, var(--gm-c2, #ff5fa2) 0%, transparent 65%); animation-duration: 34s; animation-delay:-8s; }
  .aurora .b3 { width:70%; height:55%; left:20%; bottom:-5%; background: radial-gradient(circle, var(--gm-c3, #22d3c5) 0%, transparent 65%); animation-duration: 40s; animation-delay:-16s; }
  .bgimg { position:absolute; inset:0; z-index:-1; background-size:cover; background-position:center; opacity:.85; }
  .grain { position:absolute; inset:0; z-index:-1; opacity:.06; pointer-events:none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  @keyframes drift { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(8%, -6%) scale(1.12); } 100% { transform: translate(-6%, 7%) scale(.95); } }

  /* glass */
  .glass { position:relative; border-radius: var(--gm-radius);
    background: linear-gradient(140deg, rgba(var(--tint, 255,255,255), .20), rgba(var(--tint,255,255,255), .06) 60%, rgba(var(--tint,255,255,255), .10));
    -webkit-backdrop-filter: blur(24px) saturate(170%); backdrop-filter: blur(24px) saturate(170%);
    border: 1px solid rgba(255,255,255,.22);
    box-shadow: 0 18px 50px -18px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.38), inset 0 -1px 0 rgba(255,255,255,.06); }
  .glass::before { content:""; position:absolute; inset:0; border-radius:inherit; pointer-events:none;
    background: linear-gradient(115deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 32%); mix-blend-mode: overlay; }

  .ui { position:absolute; inset:0; display:flex; flex-direction:column; padding: clamp(14px, 2.2vw, 28px); gap: clamp(14px, 2vw, 22px);
    transition: opacity .8s ease, filter .8s ease, transform .8s ease; }
  .ambient-on .ui { opacity:0; filter: blur(12px); transform: scale(.98); pointer-events:none; }

  header { display:flex; align-items:center; gap:18px; padding: 14px 18px 14px 24px; flex-wrap:wrap; }
  .clock { display:flex; flex-direction:column; line-height:1; min-width: 7ch; }
  .time { font-size: clamp(30px, 4.2vw, 50px); font-weight:250; letter-spacing:-.02em; font-variant-numeric: tabular-nums; }
  .date { font-size: 13px; color: var(--gm-dim); margin-top:6px; letter-spacing:.04em; text-transform: uppercase; }
  .title { font-size: 15px; color: var(--gm-dim); font-weight:500; padding-left:18px; border-left: 1px solid rgba(255,255,255,.18); align-self:stretch; display:flex; align-items:center; }
  .filters { display:flex; gap:8px; flex:1; justify-content:flex-end; flex-wrap:wrap; align-items:center; }
  .chip { display:inline-flex; align-items:center; gap:8px; padding: 7px 14px 7px 8px; border-radius: 999px; font-size: 14px; min-height:40px;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14); transition: background .2s, border-color .2s, transform .15s; }
  .chip.text { padding: 7px 16px; }
  .chip:active { transform: scale(.96); }
  .chip.on { background: rgba(255,255,255,.26); border-color: rgba(255,255,255,.55); box-shadow: inset 0 1px 0 rgba(255,255,255,.4); }
  .chip .n { font-size: 11px; background: rgba(255,255,255,.22); border-radius: 999px; padding: 1px 7px; }
  .new { display:inline-flex; align-items:center; gap:8px; padding: 12px 22px; border-radius:999px; font-weight:600; font-size:15px;
    background: linear-gradient(135deg, rgba(255,255,255,.95), rgba(225,232,255,.85)); color:#121735; box-shadow: 0 10px 30px -8px rgba(120,140,255,.7); }
  .new svg { font-size:20px; }

  .avatar { width:32px; height:32px; border-radius:50%; flex:none; display:grid; place-items:center; font-size:13px; font-weight:600; overflow:hidden;
    background: linear-gradient(135deg, hsl(var(--h) 80% 65%), hsl(calc(var(--h) + 40) 80% 50%)); color:#fff; border: 1.5px solid rgba(255,255,255,.55); }
  .avatar img { width:100%; height:100%; object-fit:cover; }
  .avatar.lg { width:44px; height:44px; font-size:16px; }
  .avatar.home { --h: 210; }

  main { flex:1; overflow-y:auto; overflow-x:hidden; margin: 0 -8px; padding: 8px 8px 40px; scrollbar-width: none;
    -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 40px), transparent); mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 40px), transparent); }
  main::-webkit-scrollbar { display:none; }
  .empty, .problem { max-width: 520px; margin: 8vh auto 0; padding: 36px; text-align:center; }
  .empty h2, .problem h2 { margin: 0 0 8px; font-weight:500; font-size: 24px; }
  .empty p, .problem p { margin:0; color: var(--gm-dim); line-height:1.5; }
  .empty .big { font-size: 46px; margin-bottom: 10px; }

  /* overlays */
  .scrim { position:absolute; inset:0; z-index:5; display:grid; place-items:center; padding: 16px; background: rgba(5,8,24,.35);
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: fade .25s ease both; }
  .scrim[hidden] { display:none; }
  @keyframes fade { from { opacity:0; } }
  .sheet { width: min(760px, 100%); max-height: 100%; overflow:auto; padding: 22px 26px 24px; animation: pop .35s cubic-bezier(.2,.9,.25,1.1) both; scrollbar-width:none; }
  @keyframes pop { from { opacity:0; transform: translateY(24px) scale(.97); } }
  .sheet-head { display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px; }
  .sheet-head h2 { margin:0; font-weight:500; font-size: 24px; }
  .icon-btn { width:44px; height:44px; border-radius:50%; display:grid; place-items:center; font-size:22px; background: rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.16); }
  .icon-btn.on { background: #ff4f7b; border-color: transparent; animation: pulse 1.4s ease infinite; }
  @keyframes pulse { 50% { box-shadow: 0 0 0 10px rgba(255,79,123,0); } 0% { box-shadow: 0 0 0 0 rgba(255,79,123,.6); } }
  .row { display:flex; align-items:center; gap:12px; margin: 12px 0; flex-wrap:wrap; }
  .row > label { width: 54px; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color: var(--gm-dim); }
  .row .chips { display:flex; gap:8px; flex-wrap:wrap; flex:1; }
  .tabs { display:inline-flex; padding:4px; border-radius:999px; background: rgba(0,0,0,.2); margin: 8px 0 12px; }
  .tabs button { padding: 9px 20px; border-radius:999px; font-size:14px; color: var(--gm-dim); }
  .tabs button.on { background: rgba(255,255,255,.22); color: var(--gm-text); }
  .emoji { font-size: 22px; width:40px; height:40px; border-radius:12px; display:grid; place-items:center; }
  .emoji:hover, .emoji:active { background: rgba(255,255,255,.14); }
  .tint-dot { width:34px; height:34px; border-radius:50%; border:2px solid rgba(255,255,255,.3);
    background: linear-gradient(135deg, rgba(var(--tint),.9), rgba(var(--tint),.35)); }
  .tint-dot.on { border-color:#fff; box-shadow: 0 0 0 3px rgba(255,255,255,.25); }
  .sheet-foot { display:flex; align-items:center; gap:12px; margin-top: 18px; }
  .editor-scrim .sheet-foot { position: sticky; bottom: -24px; margin: 12px -26px -24px; padding: 14px 26px 20px;
    background: linear-gradient(to top, rgba(14,18,44,.92) 55%, rgba(14,18,44,0));
    background: linear-gradient(to top, color-mix(in srgb, var(--gm-base, #070b1c) 88%, transparent) 55%, transparent); border-radius: 0 0 var(--gm-radius) var(--gm-radius); }
  .err { color: #ffb3c4; font-size:14px; flex:1; }
  .primary { display:inline-flex; align-items:center; gap:10px; padding: 14px 28px; border-radius:999px; font-weight:600; font-size:16px;
    background: linear-gradient(135deg, #fff, #dfe5ff); color:#121735; box-shadow: 0 10px 30px -8px rgba(120,140,255,.8); }
  .primary[disabled] { opacity:.45; box-shadow:none; }
  .detail { width: min(640px, 100%); padding: 26px 28px; animation: pop .35s cubic-bezier(.2,.9,.25,1.1) both; max-height:100%; overflow:auto; }
  .detail .text { font-size: 26px; }
  .detail .text.xl { font-size: 40px; }
  .actions { display:flex; gap:10px; margin-top: 18px; flex-wrap:wrap; }
  .actions button { display:inline-flex; align-items:center; gap:8px; padding: 11px 18px; border-radius:999px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.18); font-size:15px; }
  .actions button.danger { color:#ffc2d1; }
  .actions svg { font-size:18px; }

  /* ambient */
  .ambient { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 6vh 6vw; text-align:center;
    opacity:0; pointer-events:none; transition: opacity 1.2s ease; }
  .ambient-on .ambient { opacity:1; pointer-events:auto; cursor:pointer; }
  .a-time { font-size: clamp(80px, 15vw, 190px); font-weight: 200; letter-spacing:-.04em; line-height:.9; font-variant-numeric: tabular-nums; text-shadow: 0 10px 60px rgba(0,0,0,.25); }
  .a-date { font-size: clamp(16px, 2vw, 24px); color: var(--gm-dim); margin-top: 10px; letter-spacing:.08em; text-transform: uppercase; }
  .a-spot { margin-top: 6vh; width: min(680px, 90%); padding: 24px 30px; text-align:left; transition: opacity .8s ease, transform .8s ease; }
  .a-spot.out { opacity:0; transform: translateY(12px); }
  .a-spot .text { font-size: clamp(22px, 2.6vw, 32px); }
  .a-hint { position:absolute; bottom: 24px; font-size:13px; color: rgba(255,255,255,.4); letter-spacing:.1em; text-transform: uppercase; }

  .ghost-btn { display:inline-flex; align-items:center; gap:8px; padding: 12px 18px; border-radius:999px; font-size:15px; font-weight:500;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); }
  .ghost-btn svg { font-size:20px; }
  .empty .cta { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top: 20px; }
  /* steps + tiles */
  .step { margin: 18px 0 6px; }
  .step-h { display:flex; align-items:center; gap:10px; margin: 0 0 10px; font-size: 15px; font-weight:600; }
  .step-h i { font-style:normal; width:26px; height:26px; border-radius:50%; display:grid; place-items:center; font-size:13px;
    background: rgba(255,255,255,.9); color:#121735; }
  .step-h small { font-weight:400; color: var(--gm-dim); font-size: 13px; }
  .tiles { display:grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap:10px; }
  .tile { display:flex; flex-direction:column; align-items:center; gap:8px; padding: 12px 6px 10px; border-radius: 20px; min-width:0;
    background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); font-size:14px; transition: background .2s, border-color .2s, transform .15s; }
  .tile span:last-child { max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .tile:active { transform: scale(.96); }
  .tile.on { background: rgba(255,255,255,.26); border-color: rgba(255,255,255,.65); box-shadow: inset 0 1px 0 rgba(255,255,255,.4); }
  .tile .avatar { width:54px; height:54px; font-size: 26px; }
  .tile.add { color: var(--gm-dim); }
  .tile.add .ring { width:54px; height:54px; border-radius:50%; display:grid; place-items:center; font-size:24px; border: 1.5px dashed rgba(255,255,255,.5); }
  .everyone-av { width:54px; height:54px; border-radius:50%; display:grid; place-items:center; font-size:26px;
    background: linear-gradient(135deg, rgba(255,255,255,.35), rgba(255,255,255,.1)); border: 1.5px solid rgba(255,255,255,.55); }
  .quick-add { grid-column: 1 / -1; display:flex; gap:8px; align-items:center; padding: 8px; border-radius: 20px; background: rgba(0,0,0,.2); border:1px solid rgba(255,255,255,.2); }
  .field { flex:1; min-width:0; height: 52px; border-radius: 16px; padding: 0 16px; font: inherit; font-size: 18px; color: var(--gm-text);
    background: rgba(0,0,0,.2); border: 1px solid rgba(255,255,255,.18); outline:none; }
  .field:focus { border-color: rgba(255,255,255,.55); }
  .field::placeholder { color: rgba(255,255,255,.4); }
  select.field { appearance:none; -webkit-appearance:none; font-size:16px; cursor:pointer;
    background-image: linear-gradient(45deg, transparent 50%, rgba(255,255,255,.7) 50%), linear-gradient(135deg, rgba(255,255,255,.7) 50%, transparent 50%);
    background-position: calc(100% - 22px) 23px, calc(100% - 16px) 23px; background-size: 6px 6px; background-repeat:no-repeat; padding-right: 40px; }
  select.field option { color:#121735; }
  .small-btn { padding: 0 18px; height: 44px; border-radius: 999px; font-weight:600; background:#fff; color:#121735; }
  .more { display:inline-flex; align-items:center; gap:6px; margin-top: 16px; font-size:14px; color: var(--gm-dim); padding: 6px 0; }
  .more svg { transition: transform .2s; font-size:18px; }
  .more.open svg { transform: rotate(90deg); }

  /* people panel */
  .lead { margin: -4px 0 16px; color: var(--gm-dim); line-height:1.5; }
  .card-inset { padding: 18px; border-radius: 22px; background: rgba(0,0,0,.18); border: 1px solid rgba(255,255,255,.12); }
  .card-inset h3, .people-sec h3 { margin: 0 0 12px; font-size: 13px; letter-spacing:.08em; text-transform:uppercase; color: var(--gm-dim); font-weight:600; }
  .pform-top { display:flex; gap:14px; align-items:center; }
  .avatar.xl { width:64px; height:64px; font-size:32px; }
  .label { margin: 16px 0 8px; font-size:13px; color: var(--gm-dim); }
  .label .opt { opacity:.7; font-style: italic; }
  .emoji-grid { display:flex; flex-wrap:wrap; gap:4px; }
  .emoji.on { background: rgba(255,255,255,.26); box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.7); }
  .hues { display:flex; gap:10px; flex-wrap:wrap; }
  .hue { width:36px; height:36px; border-radius:50%; border:2px solid rgba(255,255,255,.3);
    background: linear-gradient(135deg, hsl(var(--h) 80% 65%), hsl(calc(var(--h) + 40) 80% 50%)); }
  .hue.on { border-color:#fff; box-shadow: 0 0 0 3px rgba(255,255,255,.25); }
  .pform-foot { display:flex; align-items:center; gap:10px; margin-top: 18px; flex-wrap:wrap; }
  .people-sec { margin-top: 22px; }
  .person-row { display:flex; align-items:center; gap:12px; padding: 10px 6px; border-top: 1px solid rgba(255,255,255,.1); }
  .person-row .pinfo { flex:1; min-width:0; }
  .person-row b { display:block; font-weight:500; font-size:16px; }
  .person-row small { color: var(--gm-dim); font-size: 13px; }
  .person-row .ghost-btn { padding: 8px 14px; font-size:14px; }
  .person-row .ghost-btn.danger, .ghost-btn.danger { color:#ffc2d1; }
  .muted { color: var(--gm-dim); margin: 4px 0 0; }
  .switch { position:relative; width:52px; height:30px; border-radius:999px; background: rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.25); flex:none; }
  .switch::after { content:""; position:absolute; top:3px; left:3px; width:22px; height:22px; border-radius:50%; background:#fff; transition: transform .2s; }
  .switch.on { background: #6e7cff; }
  .switch.on::after { transform: translateX(22px); }
  .sec-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
  .sec-head h3 { margin:0; }

  /* background picker */
  .icon-only { width:44px; height:44px; padding:0; justify-content:center; }
  .bg-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap:12px; }
  .bg-opt { display:flex; flex-direction:column; gap:8px; padding:8px 8px 10px; border-radius:20px; text-align:left; font-size:14px;
    background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); transition: border-color .2s, background .2s; }
  .bg-opt.on { background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.7); }
  .bg-opt .bg-name { display:flex; align-items:center; justify-content:space-between; gap:6px; padding: 0 4px; }
  .bg-opt .bg-name small { color: var(--gm-dim); font-size: 11px; }
  .bg-opt svg { font-size:18px; }
  .bg-prev { position:relative; height:72px; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.12);
    background: radial-gradient(circle at 22% 30%, var(--p1) 0, transparent 58%), radial-gradient(circle at 82% 40%, var(--p2) 0, transparent 58%),
      radial-gradient(circle at 50% 100%, var(--p3) 0, transparent 62%), var(--pb); }
  .bg-prev i { position:absolute; left:12px; right:30px; top:18px; height:12px; border-radius:6px; background: rgba(255,255,255,.28); }
  .bg-prev i + i { top:38px; right:52px; background: rgba(255,255,255,.18); }
  .custom-row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; }
  .color-field { display:flex; flex-direction:column; gap:6px; font-size:13px; color: var(--gm-dim); }
  .color-field input { width:64px; height:48px; padding:3px; border-radius:14px; border:1px solid rgba(255,255,255,.25); background: rgba(0,0,0,.2); cursor:pointer; }
  .color-field input::-webkit-color-swatch-wrapper { padding:0; }
  .color-field input::-webkit-color-swatch { border:none; border-radius:10px; }
  .color-field input::-moz-color-swatch { border:none; border-radius:10px; }

  @media (max-width: 600px) { .title { display:none; } header { padding: 12px 14px; } .row > label { width:100%; } .new span, .people-btn span { display:none; }
    .sheet { padding: 18px 18px 20px; } .editor-scrim .sheet-foot { margin: 12px -18px -20px; padding: 12px 18px 16px; bottom: -20px; }
    .avatar.xl { width:48px; height:48px; font-size:24px; } .pform-top { gap:10px; } .card-inset { padding: 14px; } }

  /* task tiles */
  .board { display:grid; grid-template-columns: repeat(auto-fill, minmax(var(--gm-col, 260px), 1fr)); gap: 18px; align-content:start; }
  .board > .empty, .board > .problem { grid-column: 1 / -1; }
  .task { display:flex; flex-direction:column; animation: rise .6s cubic-bezier(.2,.8,.2,1) both; transition: transform .25s ease, box-shadow .4s ease, opacity .4s ease; }
  @keyframes rise { from { opacity:0; transform: translateY(18px) scale(.97); } to { opacity:1; transform:none; } }
  .t-main { display:flex; align-items:center; gap:14px; padding: 18px 18px 10px 18px; text-align:left; width:100%; border-radius: var(--gm-radius) var(--gm-radius) 0 0; }
  .t-main:active { transform: scale(.98); }
  .t-icon { font-size: 38px; width:58px; height:58px; display:grid; place-items:center; border-radius: 18px; background: rgba(255,255,255,.12); flex:none; }
  .t-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:4px; }
  .t-title { font-size: 20px; font-weight:600; line-height:1.2; letter-spacing:-.01em; }
  .t-status { font-size: 14px; color: var(--gm-dim); }
  .t-status b { color: var(--gm-text); font-weight:600; }
  .t-check { width:46px; height:46px; border-radius:50%; flex:none; display:grid; place-items:center; font-size:26px;
    border: 2px solid rgba(255,255,255,.55); transition: background .3s, border-color .3s, transform .3s; }
  .t-foot { display:flex; align-items:center; gap:8px; padding: 6px 10px 12px 18px; font-size:13px; color: var(--gm-dim); min-height: 44px; }
  .t-foot .avatar { width:24px; height:24px; font-size:11px; }
  .t-foot .everyone-sm { font-size:16px; }
  .t-who { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .t-dots { display:flex; gap:4px; }
  .t-dots i { width:8px; height:8px; border-radius:50%; border:1.5px solid rgba(255,255,255,.6); }
  .t-dots i.on { background: rgb(${DONE_TINT}); border-color: rgb(${DONE_TINT}); }
  .t-more { width:36px; height:36px; border-radius:50%; display:grid; place-items:center; font-size:20px; background: rgba(255,255,255,.08); }
  .task.st-done { --tint: ${DONE_TINT}; }
  .task.st-done .t-check { background: rgb(${DONE_TINT}); border-color: transparent; color:#06311f; }
  .task.st-done .t-title { opacity:.85; }
  .task.st-overdue { --tint: ${OVERDUE_TINT}; box-shadow: 0 0 0 1.5px rgba(${OVERDUE_TINT}, .75), 0 0 46px -8px rgba(${OVERDUE_TINT}, .85), 0 18px 50px -18px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.38); animation: rise .6s cubic-bezier(.2,.8,.2,1) both, glow 2.6s ease-in-out infinite; }
  .task.st-overdue .t-status { color: #ffd0da; }
  .task.st-overdue .t-check { border-color: rgba(${OVERDUE_TINT}, .95); }
  @keyframes glow { 50% { box-shadow: 0 0 0 1.5px rgba(${OVERDUE_TINT}, .45), 0 0 26px -10px rgba(${OVERDUE_TINT}, .5), 0 18px 50px -18px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.38); } }
  .task.st-upcoming { opacity:.62; }
  .task.st-upcoming .t-check { border-style: dashed; border-color: rgba(255,255,255,.35); }
  .task.just-done .t-check { animation: tick .7s cubic-bezier(.2,.9,.25,1.4); }
  @keyframes tick { 0% { transform: scale(.4); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
  .task.just-done::after { content:""; position:absolute; inset:-2px; border-radius: inherit; pointer-events:none; animation: flash .9s ease-out both;
    box-shadow: 0 0 0 2px rgba(${DONE_TINT}, .9), 0 0 60px rgba(${DONE_TINT}, .8); }
  @keyframes flash { to { opacity:0; transform: scale(1.04); } }
  .sec-title { grid-column: 1 / -1; margin: 6px 4px -6px; font-size: 13px; letter-spacing:.08em; text-transform:uppercase; color: var(--gm-dim); font-weight:600; }
  .chip.alert .n { background: rgba(${OVERDUE_TINT}, .85); }

  /* who did it / detail / editor */
  .pick-title { display:flex; align-items:center; gap:14px; margin: 0 0 18px; }
  .pick-title .t-icon { width:64px; height:64px; font-size:40px; }
  .pick-title h2 { margin:0; font-size: 26px; font-weight:600; }
  .pick-title p { margin: 4px 0 0; color: var(--gm-dim); }
  .tiles.big { grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap:14px; }
  .tiles.big .tile { padding: 18px 8px 14px; font-size:16px; }
  .tiles.big .tile .avatar, .tiles.big .everyone-av { width:72px; height:72px; font-size:34px; }
  .history { margin: 18px 0 0; padding:0; list-style:none; }
  .history li { display:flex; align-items:center; gap:12px; padding: 10px 4px; border-top: 1px solid rgba(255,255,255,.1); font-size:15px; }
  .history li span:nth-child(2) { flex:1; }
  .history small { color: var(--gm-dim); }
  .facts { display:flex; flex-wrap:wrap; gap:8px; margin-top: 4px; }
  .fact { display:inline-flex; align-items:center; gap:6px; padding: 6px 12px; border-radius:999px; font-size:14px; background: rgba(255,255,255,.1); }
  .fact svg { font-size:16px; }
  .presets { display:flex; flex-wrap:wrap; gap:8px; margin-top: 10px; }
  .days { display:flex; flex-wrap:wrap; gap:8px; }
  .days .chip { min-width: 58px; justify-content:center; }
  .stepper { display:inline-flex; align-items:center; gap:14px; font-size:18px; }
  .stepper b { min-width: 7ch; text-align:center; font-weight:500; }
  .time-list { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .time-chip { display:inline-flex; align-items:center; gap:6px; padding: 8px 8px 8px 16px; border-radius:999px; font-size:16px; background: rgba(255,255,255,.22); border:1px solid rgba(255,255,255,.4); }
  .time-chip button { width:28px; height:28px; border-radius:50%; display:grid; place-items:center; font-size:16px; background: rgba(0,0,0,.2); }
  input[type=time].field { max-width: 170px; color-scheme: dark; }
  .toggle-row { display:flex; align-items:center; gap:14px; margin-top: 16px; }
  .toggle-row span { flex:1; }
  .a-spot .t-title { font-size: clamp(24px, 2.8vw, 34px); }
  .a-spot .spot-row { display:flex; align-items:center; gap:18px; }
  .a-spot .t-icon { width:76px; height:76px; font-size:46px; }
  .a-spot .t-status { font-size: 17px; margin-top:4px; }
  @media (max-width: 600px) { .filters { order:5; flex: 1 1 100%; flex-wrap:nowrap; overflow-x:auto; justify-content:flex-start; scrollbar-width:none; } .filters::-webkit-scrollbar { display:none; } .chip { flex:none; } .t-icon { width:48px; height:48px; font-size:30px; } .t-title { font-size:18px; } .board { gap:14px; } }
  @media (prefers-reduced-motion: reduce) { .task, .task.st-overdue, .task.just-done .t-check, .task.just-done::after { animation: none !important; } }
  `;

  const DAY_INDEX = [0, 1, 2, 3, 4, 5, 6]; // 0 = Monday, like Python

  class GlassTaskBoard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._tasks = new Map();
      this._filter = "all";
      this._built = false;
      this._ambient = false;
      this._spotIndex = 0;
      this._members = [];
      this._settings = { include_ha_people: true, background: { preset: DEFAULT_BACKGROUND, colors: [] } };
      this._peopleUi = null;
      this._lookUi = null;
      this._editor = null;
      this._pickId = null;
      this._openId = null;
      this._justDone = new Set();
    }

    static getStubConfig() {
      return { title: "Household tasks" };
    }

    static getConfigForm() {
      return {
        schema: [
          { name: "title", selector: { text: {} } },
          { name: "height", selector: { text: {} } },
          { name: "ambient_after", selector: { number: { min: 0, max: 900, step: 5, unit_of_measurement: "s", mode: "box" } } },
          { name: "column_width", selector: { number: { min: 180, max: 600, step: 10, unit_of_measurement: "px", mode: "box" } } },
          { name: "background_image", selector: { text: {} } },
          { name: "show_clock", selector: { boolean: {} } },
          { name: "group_by_status", selector: { boolean: {} } },
        ],
        computeLabel: (s) =>
          ({
            title: "Title",
            height: "Height (CSS, e.g. 100vh or 720px)",
            ambient_after: "Ambient mode after (0 = off)",
            column_width: "Tile width",
            background_image: "Background image URL (optional)",
            show_clock: "Show clock",
            group_by_status: "Group tiles: to do first, done last",
          })[s.name],
      };
    }

    setConfig(config) {
      this._config = {
        title: "Tasks",
        height: "calc(100vh - var(--header-height, 56px) - 16px)",
        ambient_after: 120,
        column_width: 260,
        show_clock: true,
        group_by_status: false,
        background_image: "",
        ...config,
      };
      if (this._built) {
        this._applyConfig();
        this._renderBoard();
      }
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (!this._built) this._build();
      const sig = this._people()
        .map((p) => p.id + p.name + p.pic)
        .join("|");
      if (sig !== this._peopleSig) {
        this._peopleSig = sig;
        this._renderFilters();
        this._renderBoard();
      }
      if (first && this.isConnected) this._subscribe();
    }

    connectedCallback() {
      if (this._hass && !this._unsub) this._subscribe();
      this._tick();
      this._clockTimer = setInterval(() => this._tick(), 15000);
      this._relTimer = setInterval(() => this._renderBoard(), 60000);
      this._resetIdle();
    }

    disconnectedCallback() {
      clearInterval(this._clockTimer);
      clearInterval(this._relTimer);
      clearInterval(this._spotTimer);
      clearTimeout(this._idleTimer);
      if (this._unsub) {
        Promise.resolve(this._unsub).then((u) => typeof u === "function" && u()).catch(() => {});
        this._unsub = null;
      }
    }

    getCardSize() {
      return 12;
    }

    getGridOptions() {
      return { columns: "full", rows: 10, min_rows: 6 };
    }

    // ---------------------------------------------------------------- data
    async _subscribe() {
      if (this._unsub || this._subscribing || !this._hass) return;
      this._subscribing = true;
      try {
        this._unsub = await this._hass.connection.subscribeMessage((ev) => this._onEvent(ev), {
          type: "glass_tasks/subscribe",
        });
        this._problem = null;
      } catch (err) {
        this._problem = err && (err.code === "unknown_command" || err.code === "not_loaded") ? "setup" : (err && err.message) || String(err);
        this._renderBoard();
      }
      this._subscribing = false;
    }

    _onEvent(ev) {
      if (ev.action === "snapshot") {
        this._tasks = new Map(ev.tasks.map((t) => [t.id, t]));
        this._members = ev.members || [];
        this._settings = ev.settings || { include_ha_people: true };
        this._loaded = true;
      } else if (ev.action === "people") {
        this._members = ev.task.members || [];
        this._settings = ev.task.settings || this._settings;
      } else if (ev.action === "removed") {
        this._tasks.delete(ev.task.id);
        if (this._openId === ev.task.id) this._closeDetail();
        if (this._pickId === ev.task.id) this._closePick();
        if (this._editor && this._editor.id === ev.task.id) this._closeEditor();
      } else if (ev.task) {
        const before = this._tasks.get(ev.task.id);
        this._tasks.set(ev.task.id, ev.task);
        if (before && before.status !== "done" && ev.task.status === "done") this._flash(ev.task.id);
        if (this._openId === ev.task.id) this._renderDetail();
      }
      this._renderFilters();
      this._renderBoard();
      if (this._ambient) this._renderSpot(true);
      if (ev.action === "snapshot" || ev.action === "people") {
        this._applyBackground();
        if (this._lookUi) this._renderLook();
        if (this._editor) this._renderEditor();
        if (this._pickId) this._renderPick();
        if (this._peopleUi) this._renderPeople();
      }
    }

    _flash(id) {
      this._justDone.add(id);
      setTimeout(() => {
        this._justDone.delete(id);
        const el = this.shadowRoot.querySelector(`.task[data-id="${CSS.escape(id)}"]`);
        if (el) el.classList.remove("just-done");
      }, 1200);
    }

    _sorted() {
      return [...this._tasks.values()].sort((a, b) => (a.order || 0) - (b.order || 0) || (a.created < b.created ? -1 : 1));
    }

    _haPeople() {
      const states = (this._hass && this._hass.states) || {};
      return Object.keys(states)
        .filter((id) => id.startsWith("person."))
        .map((id) => ({
          id,
          name: states[id].attributes.friendly_name || id.slice(7),
          pic: states[id].attributes.entity_picture || "",
          user: states[id].attributes.user_id,
          ha: true,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    _people() {
      const members = (this._members || []).map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, hue: m.hue, notify: m.notify || [], member: true }));
      const ha = this._settings && this._settings.include_ha_people === false ? [] : this._haPeople();
      return [...members, ...ha].sort((a, b) => a.name.localeCompare(b.name));
    }

    _notifyServices() {
      const svcs = Object.keys((this._hass && this._hass.services && this._hass.services.notify) || {}).filter(
        (s) => !["send_message", "persistent_notification"].includes(s)
      );
      const pretty = (s) => {
        const mobile = s.startsWith("mobile_app_");
        const base = (mobile ? s.slice(11) : s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return mobile ? `${base} (phone app)` : base;
      };
      return svcs
        .sort((a, b) => (b.startsWith("mobile_app_") - a.startsWith("mobile_app_")) || a.localeCompare(b))
        .map((s) => ({ value: `notify.${s}`, label: pretty(s) }));
    }

    _me() {
      const uid = this._hass && this._hass.user && this._hass.user.id;
      return this._people().find((p) => p.user && p.user === uid) || null;
    }

    _myReactKey() {
      const me = this._me();
      return me ? me.id : `user:${this._hass && this._hass.user ? this._hass.user.id : ""}`;
    }

    _person(id, fallbackName) {
      const p = id && [...this._people(), ...this._haPeople()].find((x) => x.id === id);
      if (p) return p;
      return { id: id || "home", name: fallbackName || "Home", pic: "", home: !id };
    }

    _visible() {
      const f = this._filter;
      const all = this._sorted();
      if (f === "all") return all;
      if (f === "todo") return all.filter((t) => t.status === "due" || t.status === "overdue");
      return all.filter((t) => t.assignee === f || t.assignee === "everyone");
    }

    _anySheet() {
      return !!(this._editor || this._pickId || this._openId || this._peopleUi || this._lookUi);
    }

    // ------------------------------------------------------------- render
    _build() {
      this._built = true;
      this.shadowRoot.innerHTML = `
        <style>${STYLE}</style>
        <div class="root">
          <div class="aurora"><i class="b1"></i><i class="b2"></i><i class="b3"></i></div>
          <div class="bgimg"></div>
          <div class="grain"></div>
          <div class="ui">
            <header class="glass">
              <div class="clock"><div class="time"></div><div class="date"></div></div>
              <div class="title"></div>
              <nav class="filters"></nav>
              <button class="ghost-btn icon-only" data-action="look" aria-label="Background colours" title="Background colours">${ICON.palette}</button>
              <button class="ghost-btn people-btn" data-action="people" aria-label="People">${ICON.people}<span>People</span></button>
              <button class="new" data-action="new-task">${ICON.plus}<span>New task</span></button>
            </header>
            <main><div class="board"></div></main>
          </div>
          <div class="ambient" data-action="wake">
            <div class="a-time"></div><div class="a-date"></div>
            <div class="a-spot glass"></div>
            <div class="a-hint">Tap anywhere to wake</div>
          </div>
          <div class="scrim pick-scrim" hidden></div>
          <div class="scrim detail-scrim" hidden></div>
          <div class="scrim editor-scrim" hidden></div>
          <div class="scrim people-scrim" hidden></div>
          <div class="scrim look-scrim" hidden></div>
        </div>`;
      const root = this.shadowRoot.querySelector(".root");
      root.addEventListener("click", (e) => this._onClick(e));
      root.addEventListener("pointerdown", () => this._resetIdle(), { passive: true });
      root.addEventListener("keydown", () => this._resetIdle(), { passive: true });
      this._applyConfig();
    }

    _applyConfig() {
      const c = this._config || {};
      const root = this.shadowRoot.querySelector(".root");
      root.style.setProperty("--gm-height", c.height);
      root.style.setProperty("--gm-col", `${Number(c.column_width) || 260}px`);
      this.shadowRoot.querySelector(".title").textContent = c.title || "";
      this.shadowRoot.querySelector(".title").style.display = c.title ? "" : "none";
      this.shadowRoot.querySelector(".clock").style.display = c.show_clock === false ? "none" : "";
      const bg = this.shadowRoot.querySelector(".bgimg");
      bg.style.backgroundImage = c.background_image ? `url("${String(c.background_image).replace(/["\\]/g, "")}")` : "";
      this._tick();
      this._resetIdle();
    }

    _avatar(p, cls = "") {
      const hue = p.hue ?? AVATAR_HUES[hash(p.id) % AVATAR_HUES.length];
      const inner = p.home ? "🏠" : p.emoji ? esc(p.emoji) : p.pic ? `<img src="${esc(p.pic)}" alt="">` : esc(initials(p.name));
      return `<span class="avatar ${cls} ${p.home ? "home" : ""}" style="--h:${hue}">${inner}</span>`;
    }

    _renderFilters() {
      if (!this._built) return;
      const nav = this.shadowRoot.querySelector(".filters");
      const all = this._sorted();
      const todo = all.filter((t) => t.status === "due" || t.status === "overdue").length;
      const late = all.some((t) => t.status === "overdue");
      let html = `<button class="chip text ${this._filter === "all" ? "on" : ""}" data-action="filter" data-f="all">All <span class="n">${all.length}</span></button>`;
      html += `<button class="chip text ${this._filter === "todo" ? "on" : ""} ${late ? "alert" : ""}" data-action="filter" data-f="todo">To do <span class="n">${todo}</span></button>`;
      for (const p of this._people()) {
        html += `<button class="chip ${this._filter === p.id ? "on" : ""}" data-action="filter" data-f="${esc(p.id)}" title="${esc(p.name)}">${this._avatar(p)}<span>${esc(p.name.split(" ")[0])}</span></button>`;
      }
      nav.innerHTML = html;
    }

    // ------------------------------------------------------------- time text
    _lang() {
      return (this._hass && this._hass.locale && this._hass.locale.language) || navigator.language;
    }

    _clock(iso) {
      const d = typeof iso === "string" ? new Date(iso) : iso;
      if (!d || Number.isNaN(d.getTime())) return "";
      return d.toLocaleTimeString(this._lang(), { hour: "numeric", minute: "2-digit" });
    }

    _hhmm(t) {
      const [h, m] = String(t).split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return this._clock(d);
    }

    _day(iso) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
      const diff = Math.round((startOf(d) - startOf(new Date())) / 86400e3);
      if (diff === 0) return "today";
      if (diff === 1) return "tomorrow";
      if (diff === -1) return "yesterday";
      if (diff > 1 && diff < 7) return d.toLocaleDateString(this._lang(), { weekday: "long" });
      return d.toLocaleDateString(this._lang(), { month: "short", day: "numeric" });
    }

    _when(iso, withDay = true) {
      const day = this._day(iso);
      return withDay && day !== "today" ? `${day} ${this._clock(iso)}` : this._clock(iso);
    }

    _dayName(i, style = "short") {
      // 2 November 2026 is a Monday, so day 0 = Monday like the integration.
      return new Date(2026, 10, 2 + i).toLocaleDateString(this._lang(), { weekday: style });
    }

    _scheduleText(t) {
      const times = (t.times || []).slice().sort();
      const at = times.length ? ` by ${times.map((x) => this._hhmm(x)).join(" & ")}` : "";
      if (t.repeat === "weekly") {
        const days = (t.days || []).slice().sort();
        let label;
        if (days.length === 7) label = "Every day";
        else if (days.join() === "0,1,2,3,4") label = "Weekdays";
        else if (days.join() === "5,6") label = "Weekends";
        else label = `Every ${days.map((d) => this._dayName(d)).join(", ")}`;
        return label + at;
      }
      if (t.repeat === "every") {
        const n = Number(t.every_days) || 1;
        return (n > 1 ? `Every ${n} days` : "Every day") + at;
      }
      if (times.length === 2) return `Twice a day${at}`;
      if (times.length > 2) return `${times.length} times a day${at}`;
      return `Every day${at}`;
    }

    _statusText(t) {
      switch (t.status) {
        case "done": {
          const who = t.done_by_name ? `<b>${esc(t.done_by_name)}</b> · ` : "";
          return `Done · ${who}${esc(this._when(t.done_at))}`;
        }
        case "overdue":
          return t.due_at ? `Overdue · was due ${esc(this._when(t.due_at))}` : `Overdue · was due ${esc(this._day(t.period_start))}`;
        case "due":
          if (t.due_at) return `Due by <b>${esc(this._clock(t.due_at))}</b>`;
          return t.repeat === "every" ? "Due today" : "Any time today";
        default:
          return t.next_due ? `Next: ${esc(this._when(t.next_due))}` : "Not due today";
      }
    }

    _nextLine(t) {
      // For a done task that comes back later today, say when.
      if (t.status !== "done" || !t.next_due) return "";
      return this._day(t.next_due) === "today" ? ` · next by ${esc(this._clock(t.next_due))}` : "";
    }

    // ------------------------------------------------------------- tiles
    _assigneeHTML(t) {
      if (!t.assignee || t.assignee === "everyone") return `<span class="everyone-sm">🏡</span><span class="t-who">Everyone</span>`;
      const p = this._person(t.assignee, "Someone");
      return `${this._avatar(p)}<span class="t-who">${esc(p.name)}'s job</span>`;
    }

    _taskHTML(t, opts = {}) {
      const tint = TINTS[t.tint] || TINTS.clear;
      const slots = Number(t.slots_today) || 0;
      const dots = slots > 1 && t.status !== "upcoming"
        ? `<span class="t-dots" aria-label="${t.done_today} of ${slots} done today">${Array.from({ length: slots }, (_, i) => `<i class="${i < t.done_today ? "on" : ""}"></i>`).join("")}</span>`
        : "";
      return `
        <div class="task glass st-${esc(t.status)} ${this._justDone.has(t.id) ? "just-done" : ""}" data-id="${esc(t.id)}" style="--tint:${tint}; ${opts.delay ? `animation-delay:${opts.delay}ms` : ""}">
          <button class="t-main" data-action="t-tap" data-id="${esc(t.id)}" aria-label="${esc(t.title)}: ${esc(t.status)}">
            <span class="t-icon">${esc(t.icon || "✅")}</span>
            <span class="t-body"><span class="t-title">${esc(t.title)}</span><span class="t-status">${this._statusText(t)}${this._nextLine(t)}</span></span>
            <span class="t-check">${t.status === "done" ? ICON.check : ""}</span>
          </button>
          <div class="t-foot">${this._assigneeHTML(t)}${dots}
            <button class="t-more" data-action="t-open" data-id="${esc(t.id)}" aria-label="Details for ${esc(t.title)}">${ICON.dots}</button>
          </div>
        </div>`;
    }

    _renderBoard() {
      if (!this._built) return;
      const board = this.shadowRoot.querySelector(".board");
      if (this._problem === "setup") {
        board.innerHTML = `<div class="problem glass"><div class="big">🧩</div><h2>Almost there</h2>
          <p>Add the <b>Glass Task Board</b> integration in <b>Settings → Devices &amp; services → Add integration</b>, then reload this page.</p></div>`;
        return;
      }
      if (this._problem) {
        board.innerHTML = `<div class="problem glass"><h2>Couldn't load tasks</h2><p>${esc(this._problem)}</p></div>`;
        return;
      }
      if (!this._loaded) {
        board.innerHTML = "";
        return;
      }
      const list = this._visible();
      if (!list.length) {
        const fresh = !this._tasks.size;
        const noPeople = !this._people().length;
        const allDone = this._filter === "todo" && this._tasks.size;
        board.innerHTML = `<div class="empty glass"><div class="big">${fresh ? "👋" : allDone ? "🎉" : "✨"}</div>
          <h2>${fresh ? "Welcome to your task board" : allDone ? "All done for now" : "Nothing here"}</h2>
          <p>${fresh ? "Add the jobs your home repeats: feeding the pets, pills, bins night. Tap a tile when it's done and it resets on its own." : allDone ? "Nothing is due right now. Nice work." : "No tasks match this filter."}</p>
          ${fresh ? `<div class="cta">${noPeople ? `<button class="ghost-btn" data-action="people">${ICON.people}<span>Add people</span></button>` : ""}
            <button class="new" data-action="new-task">${ICON.plus}<span>Add your first task</span></button></div>` : ""}</div>`;
        return;
      }
      const animate = !this._renderedOnce;
      let i = 0;
      const tile = (t) => this._taskHTML(t, { delay: animate ? i++ * 50 : 0 });
      if (this._config && this._config.group_by_status) {
        const groups = [
          ["To do", list.filter((t) => t.status === "overdue" || t.status === "due")],
          ["Done", list.filter((t) => t.status === "done")],
          ["Coming up", list.filter((t) => t.status === "upcoming")],
        ].filter(([, items]) => items.length);
        board.innerHTML = groups.map(([name, items]) => `<div class="sec-title">${name}</div>${items.map(tile).join("")}`).join("");
      } else {
        board.innerHTML = list.map(tile).join("");
      }
      if (!animate) board.querySelectorAll(".task").forEach((n) => (n.style.animation = n.classList.contains("st-overdue") ? "glow 2.6s ease-in-out infinite" : "none"));
      this._renderedOnce = true;
    }

    _tick() {
      if (!this._built) return;
      const now = new Date();
      const lang = (this._hass && this._hass.locale && this._hass.locale.language) || navigator.language;
      const time = now.toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" });
      const date = now.toLocaleDateString(lang, { weekday: "long", month: "long", day: "numeric" });
      this.shadowRoot.querySelector(".time").textContent = time;
      this.shadowRoot.querySelector(".date").textContent = date;
      this.shadowRoot.querySelector(".a-time").textContent = time;
      this.shadowRoot.querySelector(".a-date").textContent = date;
    }

    // ------------------------------------------------------------- events
    _onClick(e) {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const a = el.dataset.action;
      const id = el.dataset.id;
      switch (a) {
        case "wake":
          this._setAmbient(false);
          break;
        case "filter":
          this._filter = el.dataset.f;
          this._renderedOnce = false;
          this._renderFilters();
          this._renderBoard();
          break;
        case "new-task":
          this._openEditor(null);
          break;
        case "people":
          this._openPeople();
          break;
        case "look":
          this._openLook();
          break;
        case "t-tap": {
          const t = this._tasks.get(id);
          if (t && (t.status === "due" || t.status === "overdue")) this._openPick(id);
          else this._openDetail(id);
          break;
        }
        case "t-open":
          this._openDetail(id);
          break;
        default:
          if (a.startsWith("p-")) this._onPeopleClick(el, a);
          else if (a.startsWith("l-")) this._onLookClick(el, a);
          else if (a.startsWith("k-")) this._onPickClick(el, a);
          else if (a.startsWith("d-")) this._onDetailClick(el, a);
          else if (a.startsWith("e-")) this._onEditorClick(el, a);
      }
    }

    async _call(msg) {
      try {
        await this._hass.callWS(msg);
        return true;
      } catch (err) {
        this._toastError((err && err.message) || String(err));
        return false;
      }
    }

    _toastError(text) {
      const target = this.shadowRoot.querySelector(".scrim:not([hidden]) .err");
      if (target) target.textContent = text;
      else console.warn("[glass-task-board]", text);
    }

    _openScrim(cls, close) {
      const scrim = this.shadowRoot.querySelector(`.${cls}`);
      scrim.hidden = false;
      scrim.onclick = (e) => {
        if (e.target === scrim) close();
      };
      return scrim;
    }

    _hideScrim(cls) {
      const s = this.shadowRoot.querySelector(`.${cls}`);
      s.hidden = true;
      s.innerHTML = "";
      s.oninput = s.onchange = s.onkeydown = null;
      this._resetIdle();
    }

    _taskHead(t, sub) {
      return `<div class="pick-title"><span class="t-icon">${esc(t.icon || "✅")}</span><div><h2>${esc(t.title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div></div>`;
    }

    // --------------------------------------------------------- who did it?
    _openPick(id) {
      const people = this._people();
      if (!people.length) {
        // Nobody set up yet: just mark it done.
        this._complete(id, null);
        return;
      }
      this._pickId = id;
      this._openScrim("pick-scrim", () => this._closePick());
      this._renderPick();
    }

    _closePick() {
      this._pickId = null;
      this._hideScrim("pick-scrim");
    }

    _suggestedDoer(t) {
      const me = this._me();
      if (me) return me.id;
      if (t.assignee && t.assignee !== "everyone") return t.assignee;
      const last = storage.get(LAST_DOER_KEY);
      return last && this._people().some((p) => p.id === last) ? last : null;
    }

    _renderPick() {
      const t = this._tasks.get(this._pickId);
      const scrim = this.shadowRoot.querySelector(".pick-scrim");
      if (!t) return this._closePick();
      const hint = this._suggestedDoer(t);
      const people = this._people().slice().sort((a, b) => (b.id === hint) - (a.id === hint));
      scrim.innerHTML = `
        <div class="sheet glass" style="--tint:${TINTS[t.tint] || TINTS.clear}">
          <div class="sheet-head"><h2>Who did it?</h2><button class="icon-btn" data-action="k-close" aria-label="Close">${ICON.close}</button></div>
          ${this._taskHead(t, this._statusText(t))}
          <div class="tiles big">
            ${people.map((p) => `<button class="tile ${p.id === hint ? "on" : ""}" data-action="k-who" data-id="${esc(p.id)}">${this._avatar(p)}<span>${esc(p.name)}</span></button>`).join("")}
            <button class="tile" data-action="k-who" data-id=""><span class="everyone-av">🙂</span><span>Someone</span></button>
          </div>
          <div class="sheet-foot"><span class="err"></span><button class="ghost-btn" data-action="k-details">${ICON.clock}<span>History &amp; settings</span></button></div>
        </div>`;
    }

    async _complete(id, by) {
      const payload = { type: "glass_tasks/task/complete", task_id: id };
      if (by) {
        payload.by = by;
        storage.set(LAST_DOER_KEY, by);
      }
      return this._call(payload);
    }

    async _onPickClick(el, a) {
      switch (a) {
        case "k-close":
          return this._closePick();
        case "k-details": {
          const id = this._pickId;
          this._closePick();
          return this._openDetail(id);
        }
        case "k-who": {
          if (el.disabled) return;
          el.disabled = true;
          const ok = await this._complete(this._pickId, el.dataset.id || null);
          if (ok) this._closePick();
          else el.disabled = false;
        }
      }
    }

    // --------------------------------------------------------------- detail
    _openDetail(id) {
      this._openId = id;
      this._openScrim("detail-scrim", () => this._closeDetail());
      this._renderDetail();
    }

    _closeDetail() {
      this._openId = null;
      this._hideScrim("detail-scrim");
    }

    _renderDetail() {
      const t = this._tasks.get(this._openId);
      const scrim = this.shadowRoot.querySelector(".detail-scrim");
      if (!t) return this._closeDetail();
      const assignee = !t.assignee || t.assignee === "everyone" ? "Everyone's job" : `${this._person(t.assignee, "Someone").name}'s job`;
      const history = (t.history || [])
        .map((h) => {
          const p = h.by ? this._person(h.by, h.by_name || "Someone") : { id: "someone", name: "Someone", emoji: "🙂", hue: 210 };
          return `<li>${this._avatar(p)}<span>${esc(p.name)}</span><small>${esc(this._when(h.at))}</small></li>`;
        })
        .join("");
      const todo = t.status === "due" || t.status === "overdue";
      scrim.innerHTML = `
        <div class="detail glass" style="--tint:${t.status === "overdue" ? OVERDUE_TINT : t.status === "done" ? DONE_TINT : TINTS[t.tint] || TINTS.clear}">
          ${this._taskHead(t, this._statusText(t) + this._nextLine(t))}
          <div class="facts">
            <span class="fact">${ICON.clock}${esc(this._scheduleText(t))}</span>
            <span class="fact">${esc(assignee)}</span>
            ${t.notify === false ? `<span class="fact">No reminders</span>` : ""}
          </div>
          ${history ? `<ul class="history">${history}</ul>` : `<p class="muted" style="margin-top:18px">Not done yet.</p>`}
          <div class="actions">
            <button data-action="d-done">${ICON.check}<span>${todo ? "Mark done" : "Mark done again"}</span></button>
            ${(t.history || []).length ? `<button data-action="d-undo">${ICON.undo}<span>Undo last</span></button>` : ""}
            <button data-action="d-edit">${ICON.edit}<span>Edit</span></button>
            <span style="flex:1"></span>
            <button data-action="d-close">${ICON.close}<span>Close</span></button>
          </div>
          <div class="err" style="margin-top:10px"></div>
        </div>`;
    }

    _onDetailClick(el, a) {
      const id = this._openId;
      switch (a) {
        case "d-close":
          return this._closeDetail();
        case "d-done":
          this._closeDetail();
          return this._openPick(id);
        case "d-undo":
          return this._call({ type: "glass_tasks/task/undo", task_id: id });
        case "d-edit":
          this._closeDetail();
          return this._openEditor(id);
      }
    }

    // --------------------------------------------------------------- editor
    _openEditor(id) {
      const t = id ? this._tasks.get(id) : null;
      this._editor = {
        id: t ? t.id : null,
        title: t ? t.title : "",
        icon: t ? t.icon || "✅" : "✅",
        tint: t ? t.tint || "clear" : "clear",
        assignee: t ? t.assignee || "everyone" : "everyone",
        repeat: t ? t.repeat || "daily" : "daily",
        days: t ? [...(t.days || [])] : [],
        every_days: t ? Number(t.every_days) || 1 : 3,
        times: t ? [...(t.times || [])] : [],
        notify: t ? t.notify !== false : true,
        newTime: "",
        more: false,
        confirm: false,
        saving: false,
        error: "",
      };
      const scrim = this._openScrim("editor-scrim", () => this._closeEditor());
      scrim.oninput = (e) => {
        if (!this._editor) return;
        if (e.target.id === "gt-e-title") {
          this._editor.title = e.target.value;
          this._syncSave();
        }
        if (e.target.id === "gt-e-time") this._editor.newTime = e.target.value;
      };
      scrim.onkeydown = (e) => {
        if (e.key !== "Enter" || !this._editor) return;
        if (e.target.id === "gt-e-time") {
          e.preventDefault();
          this._addTime(e.target.value);
        } else if (e.target.id === "gt-e-title") {
          e.preventDefault();
          this._saveTask();
        }
      };
      this._renderEditor();
      if (!t) setTimeout(() => scrim.querySelector("#gt-e-title") && scrim.querySelector("#gt-e-title").focus(), 60);
    }

    _closeEditor() {
      this._editor = null;
      this._hideScrim("editor-scrim");
    }

    _addTime(value) {
      const ed = this._editor;
      if (!ed || !/^\d{1,2}:\d{2}/.test(value || "")) return;
      const t = value.slice(0, 5).padStart(5, "0");
      if (!ed.times.includes(t) && ed.times.length < 6) ed.times = [...ed.times, t].sort();
      ed.newTime = "";
      this._renderEditor();
    }

    _syncSave() {
      const ed = this._editor;
      const btn = this.shadowRoot.querySelector(".editor-scrim [data-action=e-save]");
      if (!ed || !btn) return;
      const ok = ed.title.trim() && (ed.repeat !== "weekly" || ed.days.length);
      btn.disabled = !ok || ed.saving;
    }

    _renderEditor() {
      const ed = this._editor;
      const scrim = this.shadowRoot.querySelector(".editor-scrim");
      if (!ed || !scrim) return;
      const scrollTop = scrim.querySelector(".sheet") ? scrim.querySelector(".sheet").scrollTop : 0;
      const people = this._people();
      const tab = (k, label) => `<button class="${ed.repeat === k ? "on" : ""}" data-action="e-repeat" data-repeat="${k}">${label}</button>`;
      scrim.innerHTML = `
        <div class="sheet glass" style="--tint:${TINTS[ed.tint] || TINTS.clear}">
          <div class="sheet-head"><h2>${ed.id ? "Edit task" : "New task"}</h2><button class="icon-btn" data-action="e-close" aria-label="Close">${ICON.close}</button></div>
          <section class="step">
            <h3 class="step-h"><i>1</i>What needs doing?</h3>
            <div class="pform-top">
              <span class="t-icon">${esc(ed.icon)}</span>
              <input id="gt-e-title" class="field" maxlength="60" placeholder="For example: Feed the dog" value="${esc(ed.title)}" autocomplete="off">
            </div>
            ${ed.id ? "" : `<div class="presets">${PRESETS.map((p, i) => `<button class="chip text" data-action="e-preset" data-i="${i}">${esc(p.icon)} ${esc(p.title)}</button>`).join("")}</div>`}
            <div class="label">Icon</div>
            <div class="emoji-grid">${TASK_ICONS.map((e) => `<button class="emoji ${e === ed.icon ? "on" : ""}" data-action="e-icon" data-emoji="${e}" aria-label="Icon ${e}">${e}</button>`).join("")}</div>
          </section>
          <section class="step">
            <h3 class="step-h"><i>2</i>How often?</h3>
            <div class="tabs">${tab("daily", "Every day")}${tab("weekly", "Certain days")}${tab("every", "Every few days")}</div>
            ${
              ed.repeat === "weekly"
                ? `<div class="days">${DAY_INDEX.map((d) => `<button class="chip text ${ed.days.includes(d) ? "on" : ""}" data-action="e-day" data-d="${d}" aria-pressed="${ed.days.includes(d)}">${esc(this._dayName(d))}</button>`).join("")}</div>`
                : ed.repeat === "every"
                  ? `<div class="stepper"><button class="icon-btn" data-action="e-every" data-step="-1" aria-label="Fewer days">−</button><b>Every ${ed.every_days} day${ed.every_days > 1 ? "s" : ""}</b><button class="icon-btn" data-action="e-every" data-step="1" aria-label="More days">${ICON.plus}</button></div>
                     <p class="muted">Counted from the last time it was done.</p>`
                  : `<p class="muted">${ed.times.length > 1 ? `${ed.times.length} times a day — once for each time below.` : "Once a day. Add a second time below for twice a day."}</p>`
            }
          </section>
          <section class="step">
            <h3 class="step-h"><i>3</i>Done by <small>(optional)</small></h3>
            <div class="time-list">
              ${ed.times.map((t) => `<span class="time-chip">${esc(this._hhmm(t))}<button data-action="e-untime" data-t="${t}" aria-label="Remove ${esc(this._hhmm(t))}">${ICON.close}</button></span>`).join("") || `<span class="muted">Any time that day.</span>`}
            </div>
            <div class="row">
              ${QUICK_TIMES.filter((q) => !ed.times.includes(q.t)).map((q) => `<button class="chip text" data-action="e-time" data-t="${q.t}">${q.label} · ${esc(this._hhmm(q.t))}</button>`).join("")}
            </div>
            <div class="row"><input id="gt-e-time" class="field" type="time" value="${esc(ed.newTime)}" aria-label="Another time"><button class="small-btn" data-action="e-time-add">Add time</button></div>
          </section>
          <section class="step">
            <h3 class="step-h"><i>4</i>Whose job?</h3>
            <div class="tiles">
              <button class="tile ${ed.assignee === "everyone" ? "on" : ""}" data-action="e-who" data-id="everyone"><span class="everyone-av">🏡</span><span>Everyone</span></button>
              ${people.map((p) => this._tile(p, "e-who", ed.assignee === p.id)).join("")}
            </div>
            ${people.length ? "" : `<p class="muted">Add people with the <b>People</b> button to give someone a task.</p>`}
          </section>
          <button class="more ${ed.more ? "open" : ""}" data-action="e-more">${ICON.chevron}<span>More options: colour, reminders</span></button>
          <div ${ed.more ? "" : "hidden"}>
            <div class="row"><label>Colour</label><div class="chips">${Object.keys(TINTS)
              .map((k) => `<button class="tint-dot ${ed.tint === k ? "on" : ""}" data-action="e-tint" data-tint="${k}" style="--tint:${TINTS[k]}" aria-label="${k}" title="${k}"></button>`)
              .join("")}</div></div>
            <div class="toggle-row"><span>Remind on phones when it's overdue</span><button class="switch ${ed.notify ? "on" : ""}" data-action="e-notify" role="switch" aria-checked="${ed.notify}" aria-label="Remind when overdue"></button></div>
          </div>
          <div class="sheet-foot">
            <span class="err">${esc(ed.error)}</span>
            ${ed.id ? `<button class="ghost-btn danger" data-action="e-delete">${ICON.trash}<span>${ed.confirm ? "Tap again to delete" : "Delete"}</span></button>` : ""}
            <button class="primary" data-action="e-save">${ICON.check}<span>${ed.id ? "Save" : "Add task"}</span></button>
          </div>
        </div>`;
      const sheet = scrim.querySelector(".sheet");
      if (sheet) sheet.scrollTop = scrollTop;
      this._syncSave();
    }

    _tile(p, action, on) {
      return `<button class="tile ${on ? "on" : ""}" data-action="${action}" data-id="${esc(p.id)}" aria-pressed="${on}">${this._avatar(p)}<span>${esc(p.name)}</span></button>`;
    }

    async _saveTask() {
      const ed = this._editor;
      if (!ed || ed.saving) return;
      if (!ed.title.trim()) {
        ed.error = "Give the task a name.";
        return this._renderEditor();
      }
      if (ed.repeat === "weekly" && !ed.days.length) {
        ed.error = "Pick at least one day.";
        return this._renderEditor();
      }
      const payload = {
        type: "glass_tasks/task/save",
        title: ed.title.trim(),
        icon: ed.icon,
        tint: ed.tint,
        assignee: ed.assignee,
        repeat: ed.repeat,
        days: ed.repeat === "weekly" ? ed.days : [],
        every_days: ed.repeat === "every" ? ed.every_days : 1,
        times: ed.times,
        notify: ed.notify,
      };
      if (ed.id) payload.task_id = ed.id;
      ed.saving = true;
      ed.error = "";
      this._syncSave();
      try {
        await this._hass.callWS(payload);
        this._closeEditor();
      } catch (err) {
        if (!this._editor) return;
        this._editor.saving = false;
        this._editor.error = (err && err.message) || String(err);
        this._renderEditor();
      }
    }

    _onEditorClick(el, a) {
      const ed = this._editor;
      if (!ed) return;
      if (a !== "e-delete") ed.confirm = false;
      switch (a) {
        case "e-close":
          return this._closeEditor();
        case "e-save":
          return this._saveTask();
        case "e-preset": {
          const p = PRESETS[Number(el.dataset.i)];
          Object.assign(ed, { title: p.title, icon: p.icon, repeat: p.repeat, days: [...(p.days || [])], every_days: p.every_days || ed.every_days, times: [...p.times] });
          break;
        }
        case "e-icon":
          ed.icon = el.dataset.emoji;
          break;
        case "e-repeat":
          ed.repeat = el.dataset.repeat;
          if (ed.repeat === "weekly" && !ed.days.length) ed.days = [(new Date().getDay() + 6) % 7];
          break;
        case "e-day": {
          const d = Number(el.dataset.d);
          ed.days = ed.days.includes(d) ? ed.days.filter((x) => x !== d) : [...ed.days, d].sort();
          break;
        }
        case "e-every":
          ed.every_days = Math.min(365, Math.max(1, ed.every_days + Number(el.dataset.step)));
          break;
        case "e-time":
          return this._addTime(el.dataset.t);
        case "e-time-add":
          return this._addTime(this.shadowRoot.querySelector("#gt-e-time").value);
        case "e-untime":
          ed.times = ed.times.filter((t) => t !== el.dataset.t);
          break;
        case "e-who":
          ed.assignee = el.dataset.id;
          break;
        case "e-more":
          ed.more = !ed.more;
          break;
        case "e-tint":
          ed.tint = el.dataset.tint;
          break;
        case "e-notify":
          ed.notify = !ed.notify;
          break;
        case "e-delete":
          if (ed.confirm) {
            this._call({ type: "glass_tasks/task/delete", task_id: ed.id }).then((ok) => ok && this._closeEditor());
            return;
          }
          ed.confirm = true;
          break;
      }
      this._renderEditor();
    }

    _usedLook() {
      const used = new Set((this._members || []).map((m) => m.emoji));
      const emoji = MEMBER_EMOJI.find((e) => !used.has(e)) || MEMBER_EMOJI[hash(String(Date.now())) % MEMBER_EMOJI.length];
      const hue = HUES[(this._members || []).length % HUES.length];
      return { emoji, hue };
    }

    _resolveBackground(choice) {
      const bg = choice || (this._settings && this._settings.background) || {};
      if (bg.preset === "custom" && Array.isArray(bg.colors) && bg.colors.length === 3) {
        return { base: darkBase(bg.colors[0]), colors: bg.colors };
      }
      return BACKGROUNDS[bg.preset] || BACKGROUNDS[DEFAULT_BACKGROUND];
    }

    _applyBackground(choice) {
      if (!this._built) return;
      const t = this._resolveBackground(choice);
      const root = this.shadowRoot.querySelector(".root");
      root.style.setProperty("--gm-base", t.base);
      t.colors.forEach((c, i) => root.style.setProperty(`--gm-c${i + 1}`, c));
    }

    _openLook() {
      const bg = (this._settings && this._settings.background) || { preset: DEFAULT_BACKGROUND, colors: [] };
      const start = bg.preset === "custom" && bg.colors && bg.colors.length === 3 ? bg.colors : this._resolveBackground().colors;
      this._lookUi = { custom: [...start], error: "" };
      const scrim = this.shadowRoot.querySelector(".look-scrim");
      scrim.hidden = false;
      scrim.onclick = (e) => {
        if (e.target === scrim) this._closeLook();
      };
      scrim.oninput = (e) => {
        const i = e.target.dataset && e.target.dataset.ci;
        if (i === undefined || !this._lookUi) return;
        this._lookUi.custom[Number(i)] = e.target.value;
        this._applyBackground({ preset: "custom", colors: this._lookUi.custom });
        const prev = scrim.querySelector(".custom-prev");
        if (prev) prev.setAttribute("style", this._prevStyle(this._resolveBackground({ preset: "custom", colors: this._lookUi.custom })));
      };
      this._renderLook();
    }

    _closeLook() {
      this._lookUi = null;
      const s = this.shadowRoot.querySelector(".look-scrim");
      s.hidden = true;
      s.innerHTML = "";
      this._applyBackground();
      this._resetIdle();
    }

    _prevStyle(t) {
      return `--pb:${t.base};--p1:${t.colors[0]};--p2:${t.colors[1]};--p3:${t.colors[2]}`;
    }

    _renderLook() {
      const ui = this._lookUi;
      const scrim = this.shadowRoot.querySelector(".look-scrim");
      if (!ui || !scrim) return;
      const current = ((this._settings && this._settings.background) || {}).preset || DEFAULT_BACKGROUND;
      const scrollTop = scrim.querySelector(".sheet") ? scrim.querySelector(".sheet").scrollTop : 0;
      const option = (key, t) => `
        <button class="bg-opt ${current === key ? "on" : ""}" data-action="l-preset" data-preset="${key}" aria-pressed="${current === key}">
          <span class="bg-prev" style="${this._prevStyle(t)}"><i></i><i></i></span>
          <span class="bg-name"><span>${esc(t.name)}${key === DEFAULT_BACKGROUND ? " <small>Default</small>" : ""}</span>${current === key ? ICON.check : ""}</span>
        </button>`;
      scrim.innerHTML = `
        <div class="sheet glass">
          <div class="sheet-head"><h2>Background</h2><button class="icon-btn" data-action="l-close" aria-label="Close">${ICON.close}</button></div>
          <p class="lead">Pick a colour theme for the board. It changes on every screen showing this board.</p>
          <div class="bg-grid">${Object.entries(BACKGROUNDS).map(([k, t]) => option(k, t)).join("")}</div>
          <section class="people-sec card-inset">
            <h3>Your own colours</h3>
            <div class="custom-row">
              ${ui.custom
                .map((c, i) => `<label class="color-field">Colour ${i + 1}<input id="gm-l-c${i}" type="color" value="${esc(c)}" data-ci="${i}"></label>`)
                .join("")}
              <span class="bg-prev custom-prev" style="${this._prevStyle(this._resolveBackground({ preset: "custom", colors: ui.custom }))};flex:1;min-width:120px;height:48px"><i></i></span>
            </div>
            <p class="muted">Changing a colour previews it right away. Select <b>Use my colours</b> to keep it.</p>
            <div class="pform-foot">
              <span class="err">${esc(ui.error)}</span>
              ${current === "custom" ? `<span class="muted">${ICON.check} In use</span>` : ""}
              <button class="primary" data-action="l-custom">Use my colours</button>
            </div>
          </section>
        </div>`;
      const sheet = scrim.querySelector(".sheet");
      if (sheet) sheet.scrollTop = scrollTop;
    }

    async _saveBackground(background) {
      const prev = this._settings.background;
      this._settings = { ...this._settings, background };
      this._applyBackground();
      try {
        await this._hass.callWS({ type: "glass_tasks/settings", background });
      } catch (err) {
        this._settings = { ...this._settings, background: prev };
        this._applyBackground();
        if (this._lookUi) this._lookUi.error = (err && err.message) || String(err);
      }
      this._renderLook();
    }

    _onLookClick(el, a) {
      if (!this._lookUi) return;
      switch (a) {
        case "l-close":
          return this._closeLook();
        case "l-preset":
          this._lookUi.error = "";
          return this._saveBackground({ preset: el.dataset.preset, colors: [] });
        case "l-custom":
          this._lookUi.error = "";
          return this._saveBackground({ preset: "custom", colors: [...this._lookUi.custom] });
      }
    }

    // --------------------------------------------------------------- people
    _openPeople() {
      this._peopleUi = this._blankPerson();
      const scrim = this.shadowRoot.querySelector(".people-scrim");
      scrim.hidden = false;
      scrim.onclick = (e) => {
        if (e.target === scrim) this._closePeople();
      };
      scrim.oninput = (e) => {
        if (e.target.id === "gm-p-name" && this._peopleUi) this._peopleUi.name = e.target.value;
      };
      scrim.onchange = (e) => {
        if (e.target.id === "gm-p-notify" && this._peopleUi) this._peopleUi.notify = e.target.value;
      };
      scrim.onkeydown = (e) => {
        if (e.key === "Enter" && e.target.id === "gm-p-name") {
          e.preventDefault();
          this._savePerson();
        }
      };
      this._renderPeople();
      setTimeout(() => {
        const input = scrim.querySelector("#gm-p-name");
        if (input && !this._people().length) input.focus();
      }, 60);
    }

    _blankPerson() {
      return { editId: null, name: "", notify: "", confirm: null, error: "", ...this._usedLook() };
    }

    _closePeople() {
      this._peopleUi = null;
      const s = this.shadowRoot.querySelector(".people-scrim");
      s.hidden = true;
      s.innerHTML = "";
      this._resetIdle();
    }

    _renderPeople() {
      const ui = this._peopleUi;
      const scrim = this.shadowRoot.querySelector(".people-scrim");
      if (!ui || !scrim) return;
      const services = this._notifyServices();
      const label = (v) => (services.find((s) => s.value === v) || { label: String(v).replace(/^notify\./, "") }).label;
      const members = this._members || [];
      const ha = this._haPeople();
      const haOn = !(this._settings && this._settings.include_ha_people === false);
      const scrollTop = scrim.querySelector(".sheet") ? scrim.querySelector(".sheet").scrollTop : 0;
      scrim.innerHTML = `
        <div class="sheet glass">
          <div class="sheet-head"><h2>People</h2><button class="icon-btn" data-action="p-close" aria-label="Close">${ICON.close}</button></div>
          <p class="lead">Add everyone who helps out. Tap their face to say who did a task, or give them tasks of their own.</p>
          <section class="card-inset">
            <h3>${ui.editId ? "Edit person" : "Add a person"}</h3>
            <div class="pform-top">
              ${this._avatar({ id: "preview", name: ui.name || "?", emoji: ui.emoji, hue: ui.hue }, "xl")}
              <input id="gm-p-name" class="field" maxlength="40" placeholder="Name, for example Maya" value="${esc(ui.name)}" autocomplete="off">
            </div>
            <div class="label">Picture</div>
            <div class="emoji-grid">${MEMBER_EMOJI.map((e) => `<button class="emoji ${e === ui.emoji ? "on" : ""}" data-action="p-emoji" data-emoji="${e}" aria-label="Picture ${e}">${e}</button>`).join("")}</div>
            <div class="label">Colour</div>
            <div class="hues">${HUES.map((h) => `<button class="hue ${h === ui.hue ? "on" : ""}" data-action="p-hue" data-hue="${h}" style="--h:${h}" aria-label="Colour"></button>`).join("")}</div>
            <div class="label">Remind them on their phone when their task is overdue <span class="opt">(optional)</span></div>
            <select id="gm-p-notify" class="field">
              <option value="">Don't notify</option>
              ${services.map((s) => `<option value="${esc(s.value)}" ${s.value === ui.notify ? "selected" : ""}>${esc(s.label)}</option>`).join("")}
            </select>
            ${services.length ? "" : `<p class="muted">Install the Home Assistant app on a phone to enable notifications.</p>`}
            <div class="pform-foot">
              <span class="err">${esc(ui.error)}</span>
              ${ui.editId ? `<button class="ghost-btn" data-action="p-cancel">Cancel</button>` : ""}
              <button class="primary" data-action="p-save">${ui.editId ? "Save changes" : `${ICON.plus}<span>Add person</span>`}</button>
            </div>
          </section>
          <section class="people-sec">
            <h3>On the board</h3>
            ${
              members.length
                ? members
                    .map(
                      (m) => `<div class="person-row">${this._avatar({ id: m.id, name: m.name, emoji: m.emoji, hue: m.hue })}
                  <div class="pinfo"><b>${esc(m.name)}</b><small>${m.notify && m.notify.length ? `Notifies ${esc(label(m.notify[0]))}` : "No notifications"}</small></div>
                  <button class="ghost-btn" data-action="p-edit" data-id="${esc(m.id)}">${ICON.edit}<span>Edit</span></button>
                  <button class="ghost-btn danger" data-action="p-remove" data-id="${esc(m.id)}">${ui.confirm === m.id ? "Tap again to remove" : "Remove"}</button></div>`
                    )
                    .join("")
                : `<p class="muted">No one yet. Add the first person above.</p>`
            }
          </section>
          ${
            ha.length
              ? `<section class="people-sec">
            <div class="sec-head"><h3>Home Assistant users</h3><button class="switch ${haOn ? "on" : ""}" data-action="p-ha" role="switch" aria-checked="${haOn}" aria-label="Show Home Assistant users"></button></div>
            <p class="muted">${haOn ? "These people from Home Assistant are also on the board." : "Hidden. Turn on to also show people from Home Assistant."}</p>
            ${haOn ? ha.map((p) => `<div class="person-row">${this._avatar(p)}<div class="pinfo"><b>${esc(p.name)}</b><small>From Home Assistant</small></div></div>`).join("") : ""}
          </section>`
              : ""
          }
        </div>`;
      const sheet = scrim.querySelector(".sheet");
      if (sheet) sheet.scrollTop = scrollTop;
    }

    async _savePerson() {
      const ui = this._peopleUi;
      if (!ui) return;
      const name = (ui.name || "").trim();
      if (!name) {
        ui.error = "Please type a name.";
        return this._renderPeople();
      }
      const payload = { type: "glass_tasks/member/save", name, emoji: ui.emoji, hue: ui.hue, notify: ui.notify ? [ui.notify] : [] };
      if (ui.editId) payload.member_id = ui.editId;
      try {
        const member = await this._hass.callWS(payload);
        this._members = [...this._members.filter((m) => m.id !== member.id), member].sort((a, b) => a.name.localeCompare(b.name));
        if (!this._peopleUi) return;
        this._peopleUi = this._blankPerson();
        this._renderPeople();
        this._renderFilters();
        this._renderBoard();
        const input = this.shadowRoot.querySelector("#gm-p-name");
        if (input) input.focus();
      } catch (err) {
        ui.error = (err && err.message) || String(err);
        this._renderPeople();
      }
    }

    _onPeopleClick(el, a) {
      const ui = this._peopleUi;
      if (!ui) return;
      switch (a) {
        case "p-close":
          return this._closePeople();
        case "p-emoji":
          ui.emoji = el.dataset.emoji;
          break;
        case "p-hue":
          ui.hue = Number(el.dataset.hue);
          break;
        case "p-save":
          return this._savePerson();
        case "p-cancel":
          this._peopleUi = this._blankPerson();
          break;
        case "p-edit": {
          const m = this._members.find((x) => x.id === el.dataset.id);
          if (m) this._peopleUi = { editId: m.id, name: m.name, emoji: m.emoji, hue: m.hue, notify: (m.notify || [])[0] || "", confirm: null, error: "" };
          const sheet = this.shadowRoot.querySelector(".people-scrim .sheet");
          if (sheet) sheet.scrollTo({ top: 0, behavior: "smooth" });
          break;
        }
        case "p-remove":
          if (ui.confirm === el.dataset.id) {
            this._call({ type: "glass_tasks/member/remove", member_id: el.dataset.id });
            ui.confirm = null;
            if (ui.editId === el.dataset.id) this._peopleUi = this._blankPerson();
          } else {
            ui.confirm = el.dataset.id;
          }
          break;
        case "p-ha":
          this._call({ type: "glass_tasks/settings", include_ha_people: this._settings.include_ha_people === false });
          break;
      }
      this._renderPeople();
    }

    // ------------------------------------------------------------ ambient
    _resetIdle() {
      clearTimeout(this._idleTimer);
      const after = Number(this._config && this._config.ambient_after) || 0;
      if (this._ambient) this._setAmbient(false);
      if (after > 0 && this.isConnected) {
        this._idleTimer = setTimeout(() => {
          if (!this._anySheet()) this._setAmbient(true);
          else this._resetIdle();
        }, after * 1000);
      }
    }

    _setAmbient(on) {
      if (on === this._ambient || !this._built) return;
      this._ambient = on;
      this.shadowRoot.querySelector(".root").classList.toggle("ambient-on", on);
      clearInterval(this._spotTimer);
      if (on) {
        this._spotIndex = 0;
        this._renderSpot(true);
        this._spotTimer = setInterval(() => {
          this._spotIndex++;
          this._renderSpot();
        }, 9000);
      } else {
        this._resetIdle();
      }
    }

    _spotlightList() {
      const rank = { overdue: 0, due: 1 };
      return this._sorted()
        .filter((t) => t.status in rank)
        .sort((a, b) => rank[a.status] - rank[b.status] || String(a.due_at || "~").localeCompare(String(b.due_at || "~")))
        .slice(0, 12);
    }

    _renderSpot(immediate = false) {
      const spot = this.shadowRoot.querySelector(".a-spot");
      if (!this._loaded || !this._tasks.size) {
        spot.style.display = "none";
        return;
      }
      spot.style.display = "";
      const list = this._spotlightList();
      const paint = () => {
        if (!list.length) {
          spot.style.setProperty("--tint", DONE_TINT);
          spot.innerHTML = `<div class="spot-row"><span class="t-icon">🎉</span><div><div class="t-title">All done for now</div><div class="t-status">Nothing is due right now.</div></div></div>`;
        } else {
          const t = list[this._spotIndex % list.length];
          spot.style.setProperty("--tint", t.status === "overdue" ? OVERDUE_TINT : TINTS[t.tint] || TINTS.clear);
          spot.innerHTML = `<div class="spot-row"><span class="t-icon">${esc(t.icon || "✅")}</span><div><div class="t-title">${esc(t.title)}</div><div class="t-status">${this._statusText(t)}</div></div></div>`;
        }
        spot.classList.remove("out");
      };
      if (immediate) return paint();
      spot.classList.add("out");
      setTimeout(paint, 700);
    }
  }

  customElements.define(TAG, GlassTaskBoard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: TAG,
    name: "Glass Task Board",
    description: "A frosted-glass board for recurring household tasks: tap when done, it resets on its own.",
    preview: false,
    documentationURL: "https://github.com/Degederon/GlassTaskBoard",
  });
  console.info(`%c GLASS TASK BOARD %c ${VERSION} `, "background:#22c58b;color:#fff;border-radius:4px 0 0 4px;padding:2px 6px", "background:#5b6cff;color:#fff;border-radius:0 4px 4px 0;padding:2px 6px");
})();
