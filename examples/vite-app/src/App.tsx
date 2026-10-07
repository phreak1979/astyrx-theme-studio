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

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/settings', label: 'Settings' },
];

function Nav({ dark, onDark }: { dark: boolean; onDark: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <nav className="app-nav" aria-label="Main">
      <Text weight="bold">Acme</Text>
      {LINKS.map((l) => (
        <Button key={l.to} label={l.label} variant={pathname === l.to ? 'primary' : 'ghost'} onClick={() => navigate(l.to)} />
      ))}
      <span style={{ flex: 1 }} />
      <Switch label="Dark mode" value={dark} onChange={onDark} />
    </nav>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  return (
    <Theme theme={neutralTheme} mode={dark ? 'dark' : 'light'}>
      <BrowserRouter>
        <Nav dark={dark} onDark={setDark} />
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
