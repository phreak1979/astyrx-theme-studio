import { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Dialog } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Popover } from '@astryxdesign/core/Popover';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import DcpDashboard from '../components/dcp/DcpDashboard';

interface Order extends Record<string, unknown> {
  id: string;
  customer: string;
  total: string;
  status: string;
}

const ORDERS: Order[] = [
  { id: 'A-1001', customer: 'Ada Lovelace', total: '$1,240', status: 'Paid' },
  { id: 'A-1002', customer: 'Grace Hopper', total: '$860', status: 'Pending' },
  { id: 'A-1003', customer: 'Alan Turing', total: '$2,310', status: 'Paid' },
];

export default function Dashboard() {
  const [open, setOpen] = useState(false);
  return (
    <VStack gap={4}>
      <DcpDashboard />
      <Card>
        <VStack gap={2}>
          <Heading level={3}>Recent orders</Heading>
          <Table
            data={ORDERS}
            idKey="id"
            columns={[
              { key: 'id', header: 'Order' },
              { key: 'customer', header: 'Customer' },
              { key: 'total', header: 'Total' },
              { key: 'status', header: 'Status' },
            ]}
          />
        </VStack>
      </Card>
      <HStack gap={2}>
        <Button label="New order" variant="primary" onClick={() => setOpen(true)} />
        <Popover label="Quick filters" content={<Text>Filters would live here.</Text>}>
          <Button label="Filters" />
        </Popover>
      </HStack>
      <Dialog isOpen={open} onOpenChange={setOpen}>
        <VStack gap={2}>
          <Heading level={3}>Create order</Heading>
          <Text>This dialog renders in a portal, which is useful for testing Inspect and Impact.</Text>
          <Button label="Close" onClick={() => setOpen(false)} />
        </VStack>
      </Dialog>
    </VStack>
  );
}
