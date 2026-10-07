import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';

interface Customer extends Record<string, unknown> {
  id: string;
  name: string;
  plan: string;
  region: string;
}

const CUSTOMERS: Customer[] = [
  { id: '1', name: 'Ada Lovelace', plan: 'Enterprise', region: 'EU' },
  { id: '2', name: 'Grace Hopper', plan: 'Team', region: 'US' },
  { id: '3', name: 'Alan Turing', plan: 'Team', region: 'UK' },
  { id: '4', name: 'Margaret Hamilton', plan: 'Starter', region: 'US' },
];

export default function Customers() {
  const [q, setQ] = useState('');
  const rows = CUSTOMERS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <VStack gap={4}>
      <Heading level={1}>Customers</Heading>
      <TextInput label="Search customers" value={q} onChange={setQ} hasClear placeholder="Name…" />
      <Card>
        <VStack gap={2}>
          <Text type="supporting">{rows.length} customers</Text>
          <Table
            data={rows}
            idKey="id"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'plan', header: 'Plan' },
              { key: 'region', header: 'Region' },
            ]}
          />
        </VStack>
      </Card>
      <div className="grid">
        {CUSTOMERS.slice(0, 3).map((c) => (
          <Card key={c.id} variant="muted">
            <VStack gap={1}>
              <Heading level={4}>{c.name}</Heading>
              <Badge label={c.plan} variant="blue" />
            </VStack>
          </Card>
        ))}
      </div>
    </VStack>
  );
}
