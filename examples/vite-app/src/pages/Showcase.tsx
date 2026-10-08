import { useState } from 'react';
import { Search } from 'lucide-react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Heading } from '@astryxdesign/core/Heading';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Selector } from '@astryxdesign/core/Selector';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Theme } from '@astryxdesign/core/theme';
import { dcpOceanBlueRegionTheme } from '../theme/dcpOceanBlueTheme';
import { VStack } from '@astryxdesign/core/VStack';

const SWATCHES = [
  { hex: '#0E354F', name: 'Deep Space Blue', use: 'Primary / Navigation', text: 'Sidebar, brand, active navigation' },
  { hex: '#5490B8', name: 'Air Force Blue', use: 'Primary / Actions', text: 'Buttons, links, progress, highlights' },
  { hex: '#323949', name: 'Charcoal Blue', use: 'Surfaces / Dark mode', text: 'Cards, panels, menus, elevated surfaces' },
];

const ALERTS = [
  { status: 'info', title: 'Update available', description: 'This information may be useful.', action: 'View details' },
  { status: 'warning', title: 'Action may be required', description: 'This could affect your workflow.', action: 'Review now' },
  { status: 'success', title: 'Changes saved', description: 'Your update was successful.', action: 'View changes' },
  { status: 'error', title: 'Action failed', description: "That didn't work as expected.", action: 'Try again' },
] as const;

function Alerts() {
  return (
    <VStack gap={2}>
      {ALERTS.map((a) => (
        <Banner
          key={a.status}
          status={a.status}
          title={a.title}
          description={a.description}
          isDismissable
          endContent={<Button label={a.action} variant="ghost" size="sm" />}
        />
      ))}
    </VStack>
  );
}

function Forms() {
  const [on, setOn] = useState(true);
  const [check, setCheck] = useState(true);
  const [radio, setRadio] = useState('a');
  const [select, setSelect] = useState<string | undefined>(undefined);
  return (
    <div className="dcp-forms">
      <Button label="Primary button" variant="primary" />
      <Button label="Secondary" variant="secondary" />
      <Button label="Ghost" variant="ghost" />
      <TextInput label="Input field" placeholder="Enter text..." value="" onChange={() => {}} startIcon={<Search size={14} />} />
      <Selector label="Select field" placeholder="Select option..." value={select} onChange={setSelect} options={[{ value: 'one', label: 'Option one' }, { value: 'two', label: 'Option two' }]} />
      <Switch label="Toggle (off)" value={false} onChange={() => {}} />
      <Switch label="Toggle (on)" value={on} onChange={setOn} />
      <CheckboxInput label="Checkbox" value={check} onChange={setCheck} />
      <RadioList label="Radio" value={radio} onChange={setRadio}>
        <RadioListItem label="Selected" value="a" />
        <RadioListItem label="Other" value="b" />
      </RadioList>
    </div>
  );
}

export default function Showcase() {
  return (
    <VStack gap={4}>
      <Heading level={1}>Showcase</Heading>
      <Heading level={3}>Colour palette</Heading>
      <div className="dcp-swatches">
        {SWATCHES.map((s) => (
          <div className="dcp-swatch" key={s.hex}>
            <div className="dcp-swatch-color" style={{ background: s.hex }}>{s.hex}</div>
            <div className="dcp-swatch-text"><strong>{s.name}</strong><br />{s.use}<br />{s.text}</div>
          </div>
        ))}
      </div>
      <Heading level={3}>Alert / Notification components</Heading>
      {(
        <div className="dcp-showcase-cols">
          {(['light', 'dark'] as const).map((m) => (
            <Theme key={m} theme={dcpOceanBlueRegionTheme} mode={m}>
              <div className="dcp-showcase-mode" data-testid={`alerts-${m}`}>
                <Text weight="bold">{m === 'light' ? 'Light mode' : 'Dark mode'}</Text>
                <Alerts />
              </div>
            </Theme>
          ))}
        </div>
      )}
      <Heading level={3}>Buttons &amp; form elements</Heading>
      {(
        <div className="dcp-showcase-cols">
          {(['light', 'dark'] as const).map((m) => (
            <Theme key={m} theme={dcpOceanBlueRegionTheme} mode={m}>
              <div className="dcp-showcase-mode">
                <Text weight="bold">{m === 'light' ? 'Light mode' : 'Dark mode'}</Text>
                <Forms />
              </div>
            </Theme>
          ))}
        </div>
      )}
    </VStack>
  );
}
