import { useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router';
import { Button } from '@astryxdesign/core/Button';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { Theme, defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

// A second app theme, so the example can switch the whole <Theme> at runtime (as real apps do).
const oceanTheme = defineTheme({
  name: 'ocean',
  tokens: {
    '--color-accent': ['#0077B6', '#48CAE4'],
    '--color-background-body': ['#EAF6FB', '#0A1628'],
    '--radius-element': '999px',
  },
});

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/settings', label: 'Settings' },
];

function Nav({ dark, onDark, ocean, onOcean }: { dark: boolean; onDark: (v: boolean) => void; ocean: boolean; onOcean: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <nav className="app-nav" aria-label="Main">
      <Text weight="bold">Acme</Text>
      {LINKS.map((l) => (
        <Button key={l.to} label={l.label} variant={pathname === l.to ? 'primary' : 'ghost'} onClick={() => navigate(l.to)} />
      ))}
      <span style={{ flex: 1 }} />
      <Switch label="Ocean theme" value={ocean} onChange={onOcean} />
      <Switch label="Dark mode" value={dark} onChange={onDark} />
    </nav>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [ocean, setOcean] = useState(false);
  return (
    <Theme theme={ocean ? oceanTheme : neutralTheme} mode={dark ? 'dark' : 'light'}>
      <BrowserRouter>
        <Nav dark={dark} onDark={setDark} ocean={ocean} onOcean={setOcean} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </BrowserRouter>
    </Theme>
  );
}
