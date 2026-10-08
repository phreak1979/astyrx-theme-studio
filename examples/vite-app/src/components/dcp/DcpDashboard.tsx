import {
  Bell, BookOpen, Calendar, ChevronDown, ClipboardCheck, CalendarClock, FileText, Layers, LayoutDashboard,
  LayoutList, MoreHorizontal, Search, Settings as SettingsIcon, ShieldCheck, Upload, Plus, TriangleAlert, Check,
  type LucideIcon,
} from 'lucide-react';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Table, pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Theme } from '@astryxdesign/core/theme';
import { BarChart, CHART_LEGEND } from './BarChart';
import { Donut } from './Donut';
import { dcpOceanBlueRegionTheme } from '../../theme/dcpOceanBlueTheme';

const NAV: [string, LucideIcon][] = [
  ['Dashboard', LayoutDashboard],
  ['Programmes', FileText],
  ['Blueprinting', Layers],
  ['Content Production', ClipboardCheck],
  ['Scheduling', CalendarClock],
  ['Validation', ShieldCheck],
  ['Reports', LayoutList],
];

const KPIS: { label: string; value: number; icon: LucideIcon; note: string; up?: boolean; ring?: number; ringLabel?: string }[] = [
  { label: 'Programmes', value: 6, icon: LayoutDashboard, note: '↑ +2 this semester', up: true },
  { label: 'Courses', value: 32, icon: FileText, note: '↑ +4 in progress', up: true },
  { label: 'Modules', value: 186, icon: BookOpen, note: '68% completed', ring: 68 },
  { label: 'Lessons', value: 542, icon: FileText, note: '42% completed', ring: 42 },
];

const ACTIVITY: { title: string; when: string; icon: LucideIcon; tone: 'green' | 'blue' | 'yellow' | 'accent' | 'gray' }[] = [
  { title: 'Lesson content validated', when: '2 minutes ago', icon: Check, tone: 'green' },
  { title: 'Module updated', when: '15 minutes ago', icon: FileText, tone: 'blue' },
  { title: 'Content flag for review', when: '1 hour ago', icon: TriangleAlert, tone: 'yellow' },
  { title: 'New lesson created', when: '3 hours ago', icon: Plus, tone: 'accent' },
  { title: 'Publish to LMS completed', when: '5 hours ago', icon: Upload, tone: 'gray' },
];

const TONE: Record<string, { bg: string; fg: string }> = {
  green: { bg: 'var(--color-success)', fg: '#fff' },
  blue: { bg: 'var(--color-background-blue)', fg: 'var(--color-text-blue)' },
  yellow: { bg: 'var(--color-warning)', fg: '#fff' },
  accent: { bg: 'var(--color-accent)', fg: '#fff' },
  gray: { bg: 'var(--color-border-emphasized)', fg: 'var(--color-text-primary)' },
};

interface Programme extends Record<string, unknown> {
  name: string;
  code: string;
  courses: number;
  modules: number;
  lessons: number;
  progress: number;
  status: 'On track' | 'In progress' | 'Needs attention' | 'At risk';
}

const PROGRAMMES: Programme[] = [
  { name: 'Web Development', code: 'WD01', courses: 8, modules: 48, lessons: 142, progress: 72, status: 'On track' },
  { name: 'Cloud Operations', code: 'CO01', courses: 6, modules: 36, lessons: 98, progress: 58, status: 'In progress' },
  { name: 'Data & AI', code: 'DA01', courses: 7, modules: 41, lessons: 121, progress: 46, status: 'In progress' },
  { name: 'Cyber Security', code: 'CS01', courses: 6, modules: 34, lessons: 96, progress: 39, status: 'Needs attention' },
  { name: 'Business Applications', code: 'BA01', courses: 5, modules: 27, lessons: 68, progress: 62, status: 'On track' },
  { name: 'Design & UX', code: 'DX01', courses: 4, modules: 20, lessons: 42, progress: 28, status: 'At risk' },
];

const STATUS_VARIANT = { 'On track': 'green', 'In progress': 'blue', 'Needs attention': 'yellow', 'At risk': 'red' } as const;

function Sidebar() {
  return (
    <div className="dcp-sidebar">
      <div className="dcp-brand">
        <Layers size={22} color="var(--color-accent)" />
        DCP Studio
      </div>
      {NAV.map(([label, Icon], i) => (
        <Button key={label} label={label} icon={<Icon size={16} />} variant={i === 0 ? 'secondary' : 'ghost'} width="100%" />
      ))}
      <span className="dcp-sidebar-spacer" />
      <Button label="Settings" icon={<SettingsIcon size={16} />} variant="ghost" width="100%" />
    </div>
  );
}

export default function DcpDashboard() {
  return (
    <div className="dcp-frame" data-testid="dcp-frame">
      {/* The sidebar is dark in both modes: the background comes from the theme's chrome token (resolved
          against the app mode, outside the nested region); the nested dark Theme gives light text/icons. */}
      <aside className="dcp-chrome" aria-label="DCP Studio navigation">
        <Theme theme={dcpOceanBlueRegionTheme} mode="dark">
          <Sidebar />
        </Theme>
      </aside>
      <div className="dcp-content">
        <header className="dcp-header">
          <div className="dcp-search">
            <TextInput label="Search" isLabelHidden placeholder="Search programmes, courses, lessons..." value="" onChange={() => {}} startIcon={<Search size={14} />} />
          </div>
          <Bell size={18} aria-label="Notifications" />
          <div className="dcp-userchip">
            <Avatar name="Louwmari B" size="sm" />
            <Text>Louwmari</Text>
            <ChevronDown size={14} />
          </div>
        </header>
        <div className="dcp-titlebar">
          <div>
            <Heading level={1}>Dashboard</Heading>
            <Text type="supporting">Overview of your programme content production</Text>
          </div>
          <Button label="Oct 2026 – Dec 2026" icon={<Calendar size={14} />} variant="secondary" />
        </div>
        <div className="dcp-kpis">
          {KPIS.map((k) => (
            <div className="dcp-kpi" key={k.label}>
              <div className="dcp-kpi-icon"><k.icon size={18} /></div>
              <div className="dcp-kpi-body">
                <Text type="supporting">{k.label}</Text>
                <div className="dcp-kpi-value">{k.value}</div>
                <div className={`dcp-kpi-note${k.up ? ' up' : ''}`}>{k.note}</div>
              </div>
              {k.ring !== undefined && <Donut percent={k.ring} />}
            </div>
          ))}
        </div>
        <div className="dcp-row">
          <section className="dcp-panel" aria-label="Production progress per programme">
            <div className="dcp-panel-head"><Heading level={4}>Production progress per programme</Heading></div>
            <div className="dcp-legend">
              {CHART_LEGEND.map((l) => (
                <span key={l.label}><i style={{ background: l.color }} />{l.label}</span>
              ))}
            </div>
            <BarChart />
          </section>
          <section className="dcp-panel" aria-label="Recent activity">
            <div className="dcp-panel-head">
              <Heading level={4}>Recent activity</Heading>
              <Button label="View all" variant="ghost" size="sm" />
            </div>
            <div className="dcp-activity">
              {ACTIVITY.map((a) => (
                <div className="dcp-activity-item" key={a.title}>
                  <span className="dcp-activity-dot" style={{ background: TONE[a.tone].bg, color: TONE[a.tone].fg }}><a.icon size={14} /></span>
                  <div>
                    <Text>{a.title}</Text>
                    <Text type="supporting">{a.when}</Text>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <section className="dcp-panel" aria-label="Programmes">
          <div className="dcp-panel-head">
            <Heading level={4}>Programmes</Heading>
            <Button label="View all" variant="ghost" size="sm" />
          </div>
          <Table
            data={PROGRAMMES}
            idKey="code"
            columns={[
              { key: 'name', header: 'Programme', width: proportional(2), renderCell: (p: Programme) => <span className="dcp-proj"><span className="dcp-proj-icon"><FileText size={13} /></span>{p.name}</span> },
              { key: 'code', header: 'Code' },
              { key: 'courses', header: 'Courses' },
              { key: 'modules', header: 'Modules' },
              { key: 'lessons', header: 'Lessons' },
              {
                key: 'progress',
                header: 'Progress',
                width: proportional(2),
                renderCell: (p: Programme) => (
                  <span className="dcp-prog">
                    <ProgressBar label={`${p.name} progress`} isLabelHidden value={p.progress} max={100} />
                    <span className="dcp-proglabel">{p.progress}%</span>
                  </span>
                ),
              },
              { key: 'status', header: 'Status', width: pixel(140), renderCell: (p: Programme) => <Badge label={p.status} variant={STATUS_VARIANT[p.status]} /> },
              { key: 'menu', header: '', width: pixel(48), renderCell: () => <MoreHorizontal size={16} aria-label="Row actions" /> },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
