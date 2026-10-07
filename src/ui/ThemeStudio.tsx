import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isDevEnvironment } from '../dev/env';
import { getSession, type StudioOptions } from '../dev/session';
import { SessionContext, useUi } from './hooks';
import { Launcher } from './Launcher';
import { Panel } from './Panel';
import { CSS } from './styles';

function StudioApp() {
  const ui = useUi();
  return (
    <div className="ats-root">
      <style>{CSS}</style>
      {!ui.open && <Launcher />}
      {ui.open && <Panel />}
    </div>
  );
}

function StudioHost(options: StudioOptions) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadow, setShadow] = useState<ShadowRoot | null>(null);
  const session = useMemo(() => getSession(options), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !session) return;
    setShadow(host.shadowRoot ?? host.attachShadow({ mode: 'open' }));
    session.start();
    return () => session.stop();
  }, [session]);

  return (
    <div ref={hostRef} data-ats-host="">
      {shadow && session
        ? createPortal(
            <SessionContext.Provider value={session}>
              <StudioApp />
            </SessionContext.Provider>,
            shadow as unknown as Element,
          )
        : null}
    </div>
  );
}

/**
 * The studio. Renders nothing (and registers nothing) unless running in development.
 * Mount it from a development-only dynamic import; see the README.
 */
export function AstryxThemeStudio(props: StudioOptions) {
  if (!isDevEnvironment()) return null;
  return <StudioHost {...props} />;
}
