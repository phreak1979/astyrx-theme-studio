import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Theme, defineTheme } from '@astryxdesign/core/theme';
import { VStack } from '@astryxdesign/core/VStack';

// A nested Theme region with its own accent, used to test whether root-level overrides reach it.
const promoTheme = defineTheme({
  name: 'promo',
  tokens: { '--color-accent': ['#C026D3', '#E879F9'] },
});

export default function Settings() {
  const [name, setName] = useState('Acme Inc.');
  const [email, setEmail] = useState(true);
  return (
    <VStack gap={4}>
      <Heading level={1}>Settings</Heading>
      <Card>
        <VStack gap={3}>
          <TextInput label="Company name" value={name} onChange={setName} />
          <Switch label="Email notifications" value={email} onChange={setEmail} />
          <Button label="Save changes" variant="primary" />
        </VStack>
      </Card>
      <Heading level={3}>Nested theme region</Heading>
      <Theme theme={promoTheme}>
        <div className="nested-region" data-testid="nested-region">
          <VStack gap={2}>
            <Text>This region uses its own accent token.</Text>
            <Button label="Promo action" variant="primary" />
          </VStack>
        </div>
      </Theme>
    </VStack>
  );
}
