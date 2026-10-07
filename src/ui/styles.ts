export const CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
.ats-root {
  --ats-bg: #14151a; --ats-panel: #1b1d24; --ats-raise: #23262f; --ats-border: #2f3342;
  --ats-text: #e8eaf1; --ats-muted: #9aa1b4; --ats-accent: #6ea8ff; --ats-accent-text: #0b1220;
  --ats-danger: #ff7a7a; --ats-ok: #54d394; --ats-warn: #ffc15a; --ats-mod: #ff9f43;
  font: 13px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif; color: var(--ats-text);
  color-scheme: dark; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;
}
.ats-root > * { pointer-events: auto; }
button, input, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; background: var(--ats-raise); border: 1px solid var(--ats-border); border-radius: 6px; padding: 4px 10px; }
button:hover:not(:disabled) { border-color: var(--ats-accent); }
button:disabled { opacity: .45; cursor: default; }
button.primary { background: var(--ats-accent); color: var(--ats-accent-text); border-color: var(--ats-accent); font-weight: 600; }
button.danger { color: var(--ats-danger); }
button.ghost { background: transparent; border-color: transparent; padding: 2px 6px; }
button.ghost:hover:not(:disabled) { background: var(--ats-raise); }
button[aria-pressed='true'] { background: var(--ats-accent); color: var(--ats-accent-text); border-color: var(--ats-accent); }
input[type=text], input[type=search], input[type=number], select, textarea {
  background: var(--ats-bg); border: 1px solid var(--ats-border); border-radius: 6px; padding: 4px 8px; min-width: 0; width: 100%;
}
input:focus, select:focus, textarea:focus, button:focus-visible { outline: 2px solid var(--ats-accent); outline-offset: 1px; }
input.invalid, textarea.invalid { border-color: var(--ats-danger); }
input[type=color] { width: 32px; height: 26px; padding: 0; border: 1px solid var(--ats-border); border-radius: 4px; background: none; flex: none; }
label { display: block; color: var(--ats-muted); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 2px; }

.launcher-wrap { position: fixed; }
.launcher-min { position: absolute; top: -7px; left: -7px; width: 16px; height: 16px; padding: 0; border-radius: 50%; font-size: 12px; line-height: 14px; opacity: 0; z-index: 1; }
.launcher-wrap:hover .launcher-min, .launcher-min:focus-visible { opacity: 1; }
.launcher { position: relative; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; padding: 0;
  background: var(--ats-panel); border: 1px solid var(--ats-border); box-shadow: 0 4px 16px rgba(0,0,0,.35); cursor: grab; user-select: none; touch-action: none; }
.launcher.mini { width: 14px; height: 40px; border-radius: 7px 0 0 7px; font-size: 0; }
.launcher .badge { position: absolute; top: -4px; right: -4px; background: var(--ats-mod); color: #1a1000; border-radius: 9px; font: 700 10px/16px system-ui; min-width: 16px; padding: 0 4px; text-align: center; }

.panel { position: fixed; display: flex; flex-direction: column; background: var(--ats-panel); border: 1px solid var(--ats-border);
  box-shadow: 0 8px 32px rgba(0,0,0,.45); min-width: 300px; min-height: 40px; overflow: hidden; }
.panel.dock-right { top: 0; bottom: 0; right: 0; border-width: 0 0 0 1px; }
.panel.dock-left { top: 0; bottom: 0; left: 0; border-width: 0 1px 0 0; }
.panel.float { border-radius: 10px; }
.panel.collapsed { height: auto !important; bottom: auto; }
.resize { position: absolute; z-index: 2; touch-action: none; }
.resize.edge-left { left: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.resize.edge-right { right: 0; top: 0; bottom: 0; width: 6px; cursor: ew-resize; }
.resize.corner { right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize; }
.head { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--ats-border); cursor: default; user-select: none; }
.panel.float .head { cursor: move; }
.head .title { font-weight: 700; letter-spacing: .06em; font-size: 11px; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.head button { flex: none; }
.subhead { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-bottom: 1px solid var(--ats-border); }
.chip { white-space: nowrap; display: inline-block; padding: 0 6px; border-radius: 9px; background: var(--ats-raise); border: 1px solid var(--ats-border); font-size: 11px; color: var(--ats-muted); }
.chip.ok { color: var(--ats-ok); } .chip.warn { color: var(--ats-warn); } .chip.bad { color: var(--ats-danger); }
.banner { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid var(--ats-border); }
.banner.warn { background: rgba(255,193,90,.1); color: var(--ats-warn); }
.banner.info { background: rgba(110,168,255,.1); }
.banner .row { margin-top: 6px; display: flex; gap: 6px; }
.tabs { display: flex; border-bottom: 1px solid var(--ats-border); }
.tabs button { flex: 1; border: 0; border-radius: 0; background: transparent; padding: 8px 4px; border-bottom: 2px solid transparent; color: var(--ats-muted); }
.tabs button[aria-selected='true'] { color: var(--ats-text); border-bottom-color: var(--ats-accent); }
.body { flex: 1; min-height: 0; overflow: auto; padding: 10px; }
.foot { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-top: 1px solid var(--ats-border); flex-wrap: wrap; }
.seg { display: inline-flex; border: 1px solid var(--ats-border); border-radius: 6px; overflow: hidden; }
.seg button { border: 0; border-radius: 0; padding: 3px 8px; background: transparent; }
.seg button + button { border-left: 1px solid var(--ats-border); }
.seg button[aria-pressed='true'] { background: var(--ats-accent); color: var(--ats-accent-text); }
.grow { flex: 1; }
.muted { color: var(--ats-muted); }
.small { font-size: 11px; }
.stack > * + * { margin-top: 8px; }
.row { display: flex; align-items: center; gap: 6px; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chips button { padding: 1px 8px; border-radius: 12px; font-size: 12px; }
.cat { margin-top: 10px; }
.cat-head { display: flex; align-items: center; gap: 6px; width: 100%; background: none; border: 0; padding: 4px 0; text-align: left; font-weight: 600; }
.cat-head .count { color: var(--ats-muted); font-weight: 400; }
.tok { border: 1px solid transparent; border-radius: 6px; }
.tok.open { background: var(--ats-bg); border-color: var(--ats-border); margin: 4px 0; }
.tok-row { display: flex; align-items: center; gap: 8px; width: 100%; background: none; border: 0; padding: 4px 6px; text-align: left; border-radius: 6px; }
.tok-row:hover { background: var(--ats-raise); }
.tok-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
.tok-val { color: var(--ats-muted); max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, Menlo, monospace; font-size: 11px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: transparent; flex: none; }
.dot.on { background: var(--ats-mod); }
.swatch { width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--ats-border); flex: none; background-image: linear-gradient(45deg,#8883 25%,transparent 25%,transparent 75%,#8883 75%),linear-gradient(45deg,#8883 25%,transparent 25%,transparent 75%,#8883 75%); background-size: 8px 8px; background-position: 0 0, 4px 4px; position: relative; overflow: hidden; }
.swatch > i { position: absolute; inset: 0; }
.editor { padding: 8px; border-top: 1px solid var(--ats-border); }
.side { margin-bottom: 8px; }
.err { color: var(--ats-danger); font-size: 11px; margin-top: 2px; }
.kv { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; font-size: 12px; }
.kv dt { color: var(--ats-muted); } .kv dd { margin: 0; font-family: ui-monospace, Menlo, monospace; word-break: break-all; }
.card { background: var(--ats-bg); border: 1px solid var(--ats-border); border-radius: 8px; padding: 10px; }
.card h4 { margin: 0 0 6px; font-size: 13px; }
.badge { display: inline-block; font-size: 10px; padding: 0 6px; border-radius: 8px; border: 1px solid var(--ats-border); color: var(--ats-muted); text-transform: uppercase; letter-spacing: .04em; }
.badge.token { color: var(--ats-ok); border-color: var(--ats-ok); }
.badge.internal { color: var(--ats-warn); border-color: var(--ats-warn); }
.badge.app { color: var(--ats-accent); border-color: var(--ats-accent); }
pre.code { margin: 0; padding: 8px; background: #0d0e12; border: 1px solid var(--ats-border); border-radius: 6px; overflow: auto; max-height: 220px; font: 11px/1.5 ui-monospace, Menlo, monospace; white-space: pre; }
.issue { display: flex; gap: 6px; font-size: 12px; padding: 2px 0; }
.issue.error { color: var(--ats-danger); } .issue.warning { color: var(--ats-warn); }
table { border-collapse: collapse; width: 100%; font-size: 12px; }
th, td { text-align: left; padding: 2px 6px; border-bottom: 1px solid var(--ats-border); }
th { color: var(--ats-muted); font-weight: 500; }
.group-btn { display: flex; justify-content: space-between; width: 100%; text-align: left; margin-top: 4px; }
.el-btn { display: block; width: 100%; text-align: left; font-family: ui-monospace, Menlo, monospace; font-size: 11px; background: transparent; border-color: transparent; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;
