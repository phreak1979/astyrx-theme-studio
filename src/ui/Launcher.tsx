import { useRef } from 'react';
import { useSession, useTheme, useUi } from './hooks';

export function Launcher() {
  const session = useSession();
  const ui = useUi();
  const theme = useTheme();
  const moved = useRef(false);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = ui.launcherMini ? 14 : 40;
  const pos = ui.launcher ?? { x: vw - 56, y: vh - 56 };
  const x = Math.min(Math.max(0, pos.x), vw - w);
  const y = Math.min(Math.max(0, pos.y), vh - 40);

  return (
    <div className="launcher-wrap" style={{ left: x, top: y }}>
      {!ui.launcherMini && (
        <button className="launcher-min" aria-label="Minimise launcher" title="Minimise" onClick={() => session.ui.set({ launcherMini: true })}>
          –
        </button>
      )}
      <button
        className={`launcher${ui.launcherMini ? ' mini' : ''}`}
        title="Astryx Theme Studio"
        aria-label="Astryx Theme Studio"
        onPointerDown={(e) => {
          moved.current = false;
          const el = e.currentTarget;
          el.setPointerCapture(e.pointerId);
          const sx = e.clientX;
          const sy = e.clientY;
          const ox = x;
          const oy = y;
          const move = (ev: PointerEvent) => {
            if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 4) moved.current = true;
            if (moved.current) session.ui.set({ launcher: { x: Math.round(ox + ev.clientX - sx), y: Math.round(oy + ev.clientY - sy) } });
          };
          const up = () => {
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerup', up);
            el.removeEventListener('pointercancel', up);
          };
          el.addEventListener('pointermove', move);
          el.addEventListener('pointerup', up);
          el.addEventListener('pointercancel', up);
        }}
        onClick={() => {
          if (moved.current) return;
          if (ui.launcherMini) session.ui.set({ launcherMini: false });
          else session.ui.set({ open: true, collapsed: false });
        }}
      >
        {!ui.launcherMini && '🎨'}
        {!ui.launcherMini && theme.modified.length > 0 && <span className="badge">{theme.modified.length}</span>}
      </button>
    </div>
  );
}
