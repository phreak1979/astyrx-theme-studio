import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { Dock, Tab } from '../dev/session';
import { Confirm, plural } from './common';
import { ExportPanel } from './ExportPanel';
import { ImpactPanel } from './ImpactPanel';
import { InspectPanel } from './InspectPanel';
import { ThemePanel } from './ThemePanel';
import { useSession, useTheme, useUi } from './hooks';

const TABS: { id: Tab; label: string }[] = [
  { id: 'theme', label: 'Theme' },
  { id: 'inspect', label: 'Inspect' },
  { id: 'impact', label: 'Impact' },
  { id: 'export', label: 'Export' },
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function drag(e: RPointerEvent, onMove: (ev: PointerEvent) => void): void {
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);
  const move = (ev: PointerEvent) => onMove(ev);
  const up = () => {
    target.removeEventListener('pointermove', move);
    target.removeEventListener('pointerup', up);
    target.removeEventListener('pointercancel', up);
  };
  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', up);
  target.addEventListener('pointercancel', up);
}

export function Panel() {
  const session = useSession();
  const { store, registry } = session;
  const ui = useUi();
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [confirm, setConfirm] = useState<{ kind: 'light' | 'dark' | 'all'; count: number } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  // Keep keystrokes typed into the studio away from the host app's own hotkeys.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('keydown', stop);
    el.addEventListener('keyup', stop);
    el.addEventListener('keypress', stop);
    return () => {
      el.removeEventListener('keydown', stop);
      el.removeEventListener('keyup', stop);
      el.removeEventListener('keypress', stop);
    };
  }, []);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = clamp(ui.width, 300, Math.max(300, vw - 40));
  const left = clamp(ui.x, 0, Math.max(0, vw - width));
  const top = clamp(ui.y, 0, Math.max(0, vh - 80));
  const style: React.CSSProperties =
    ui.dock === 'float'
      ? { left, top, width, height: ui.collapsed ? undefined : clamp(ui.height, 240, vh - 20) }
      : { width };

  const setDock = (dock: Dock) => {
    if (dock === 'float' && ui.dock !== 'float') session.ui.set({ dock, x: Math.max(0, vw - width - 24), y: 24 });
    else session.ui.set({ dock });
  };

  const requestReset = (kind: 'light' | 'dark' | 'all') => {
    setResetOpen(false);
    const count = store.countForReset(kind);
    if (count === 0) return;
    if (count === 1) return doReset(kind);
    setConfirm({ kind, count });
  };
  const doReset = (kind: 'light' | 'dark' | 'all') => {
    if (kind === 'all') store.resetAll();
    else store.resetMode(kind);
    setConfirm(null);
  };

  const saved = ui.restorePrompt;
  const versionMismatch = saved && saved.astryxVersion && session.astryxVersion && saved.astryxVersion !== session.astryxVersion;
  const compat = registry.compat;

  return (
    <div ref={ref} className={`panel ${ui.dock === 'float' ? 'float' : `dock-${ui.dock}`}${ui.collapsed ? ' collapsed' : ''}`} style={style} role="dialog" aria-label="Astryx Theme Studio">
      {!ui.collapsed && ui.dock !== 'float' && (
        <div
          className={`resize edge-${ui.dock === 'right' ? 'left' : 'right'}`}
          onPointerDown={(e) => drag(e, (ev) => session.ui.set({ width: Math.round(clamp(ui.dock === 'right' ? window.innerWidth - ev.clientX : ev.clientX, 300, window.innerWidth - 40)) }))}
        />
      )}
      {!ui.collapsed && ui.dock === 'float' && (
        <div
          className="resize corner"
          onPointerDown={(e) =>
            drag(e, (ev) => session.ui.set({ width: Math.round(clamp(ev.clientX - left, 300, window.innerWidth)), height: Math.round(clamp(ev.clientY - top, 240, window.innerHeight)) }))
          }
        />
      )}

      <div
        className="head"
        onPointerDown={(e) => {
          if (ui.dock !== 'float' || (e.target as HTMLElement).closest('button')) return;
          const ox = e.clientX - left;
          const oy = e.clientY - top;
          drag(e, (ev) => session.ui.set({ x: Math.round(ev.clientX - ox), y: Math.round(ev.clientY - oy) }));
        }}
      >
        <span className="title">ASTRYX THEME STUDIO</span>
        <span className={`chip ${compat.status === 'compatible' ? 'ok' : 'warn'}`} title={compat.message}>
          Astryx {compat.installed ?? '?'} {compat.status === 'compatible' ? '✓' : '⚠'}
        </span>
        <button className="ghost" aria-label="Dock left" title="Dock left" aria-pressed={ui.dock === 'left'} onClick={() => setDock('left')}>◧</button>
        <button className="ghost" aria-label="Float" title="Float" aria-pressed={ui.dock === 'float'} onClick={() => setDock('float')}>⧉</button>
        <button className="ghost" aria-label="Dock right" title="Dock right" aria-pressed={ui.dock === 'right'} onClick={() => setDock('right')}>◨</button>
        <button className="ghost" aria-label={ui.collapsed ? 'Expand' : 'Collapse'} title={ui.collapsed ? 'Expand' : 'Collapse'} onClick={() => session.ui.set({ collapsed: !ui.collapsed })}>
          {ui.collapsed ? '▢' : '–'}
        </button>
        <button className="ghost" aria-label="Close" title="Close" onClick={() => session.ui.set({ open: false })}>×</button>
      </div>

      {!ui.collapsed && (
        <>
          {compat.status !== 'compatible' && <div className="banner warn">{compat.message}</div>}
          {saved && (
            <div className="banner info" role="alert">
              <strong>Working theme found</strong>
              <div>
                {saved.theme.meta.name} · {plural(Object.keys(saved.theme.overrides).length, 'modified token')}
              </div>
              {versionMismatch && (
                <div className="muted small">
                  Saved with Astryx {saved.astryxVersion}; installed is {session.astryxVersion}. Unknown tokens will be dropped.
                </div>
              )}
              <div className="row">
                <button className="primary" onClick={() => session.acceptRestore()}>Continue Editing</button>
                <button onClick={() => session.discardRestore()}>Discard</button>
              </div>
            </div>
          )}

          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={ui.tab === t.id} onClick={() => session.setTab(t.id)}>
                {t.label}
                {t.id === 'inspect' && ui.inspecting ? ' ●' : ''}
                {t.id === 'impact' && ui.impactToken ? ' ●' : ''}
              </button>
            ))}
          </div>

          <div className="body" role="tabpanel">
            {ui.tab === 'theme' && <ThemePanel />}
            {ui.tab === 'inspect' && <InspectPanel />}
            {ui.tab === 'impact' && <ImpactPanel />}
            {ui.tab === 'export' && <ExportPanel />}
          </div>

          {confirm && (
            <Confirm
              message={`Reset ${plural(confirm.count, 'token')} (${confirm.kind === 'all' ? 'entire theme' : `${confirm.kind} values`})? You can undo this.`}
              confirmLabel="Reset"
              onConfirm={() => doReset(confirm.kind)}
              onCancel={() => setConfirm(null)}
            />
          )}

          <div className="foot">
            <div className="seg" role="group" aria-label="Preview mode">
              <button aria-pressed={theme.previewMode === 'auto'} title={`Follow the app (currently ${theme.appMode})`} onClick={() => store.setPreviewMode('auto')}>Auto</button>
              <button aria-pressed={theme.previewMode === 'light'} title="Preview light" onClick={() => store.setPreviewMode('light')}>☀ Light</button>
              <button aria-pressed={theme.previewMode === 'dark'} title="Preview dark" onClick={() => store.setPreviewMode('dark')}>🌙 Dark</button>
            </div>
            <button aria-label="Undo" title="Undo (Ctrl/Cmd+Z)" disabled={!theme.canUndo} onClick={() => store.undo()}>↶</button>
            <button aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)" disabled={!theme.canRedo} onClick={() => store.redo()}>↷</button>
            <div style={{ position: 'relative' }}>
              <button aria-haspopup="menu" aria-expanded={resetOpen} disabled={theme.modified.length === 0} onClick={() => setResetOpen((v) => !v)}>Reset ▾</button>
              {resetOpen && (
                <div role="menu" className="card" style={{ position: 'absolute', bottom: '110%', left: 0, minWidth: 160, zIndex: 5 }}>
                  <button role="menuitem" className="ghost" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => requestReset('light')}>Reset light theme</button>
                  <button role="menuitem" className="ghost" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => requestReset('dark')}>Reset dark theme</button>
                  <button role="menuitem" className="ghost danger" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => requestReset('all')}>Reset entire theme</button>
                </div>
              )}
            </div>
            <span className="grow" />
            <span className="chip" title="Modified tokens">{theme.modified.length} modified</span>
            <button className="primary" onClick={() => session.setTab('export')}>Export Theme</button>
          </div>
        </>
      )}
    </div>
  );
}
