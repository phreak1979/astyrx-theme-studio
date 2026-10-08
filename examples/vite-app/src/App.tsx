import { useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router';
import { Button } from '@astryxdesign/core/Button';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Showcase from './pages/Showcase';
import { dcpOceanBlueRegionTheme, dcpOceanBlueTheme } from './theme/dcpOceanBlueTheme';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/settings', label: 'Settings' },
  { to: '/showcase', label: 'Showcase' },
];

function Nav({ dark, onDark, dcp, onDcp }: { dark: boolean; onDark: (v: boolean) => void; dcp: boolean; onDcp: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const content = (
    <>
      <Text weight="bold">Acme</Text>
      {LINKS.map((l) => (
        <Button key={l.to} label={l.label} variant={pathname === l.to ? 'primary' : 'ghost'} onClick={() => navigate(l.to)} />
      ))}
      <span style={{ flex: 1 }} />
      <Switch label="DCP Ocean Blue" value={dcp} onChange={onDcp} />
      <Switch label="Dark mode" value={dark} onChange={onDark} />
    </>
  );
  // With DCP Ocean Blue the bar uses the theme's chrome colour (same as the dashboard sidebar); the
  // nested dark Theme gives it light text. Neutral keeps the plain bar.
  return dcp ? (
    <nav className="app-nav app-nav-dcp" aria-label="Main">
      <Theme theme={dcpOceanBlueRegionTheme} mode="dark">
        <div className="app-nav-inner">{content}</div>
      </Theme>
    </nav>
  ) : (
    <nav className="app-nav" aria-label="Main">
      {content}
    </nav>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [dcp, setDcp] = useState(false);
  return (
    <Theme theme={dcp ? dcpOceanBlueTheme : neutralTheme} mode={dark ? 'dark' : 'light'}>
      <BrowserRouter>
        <Nav dark={dark} onDark={setDark} dcp={dcp} onDcp={setDcp} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/showcase" element={<Showcase />} />
          </Routes>
        </main>
      </BrowserRouter>
    </Theme>
  );
}
