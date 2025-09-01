import type { Meta, StoryObj } from '@storybook/react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const transactions = [
  {
    hash: '0x123456',
    status: 'Confirmed',
    amount: 250,
    token: 'USDC',
    chain: 'Base',
  },
  {
    hash: '0x456789',
    status: 'Confirmed',
    amount: 150,
    token: 'USDT',
    chain: 'Polygon',
  },
  {
    hash: '0x789123',
    status: 'Confirmed',
    amount: 3.14,
    token: 'ETH',
    chain: 'Ethereum',
  },
  {
    hash: '0x321654',
    status: 'Confirmed',
    amount: 4.50156,
    token: 'ETH',
    chain: 'Base',
  },
  {
    hash: '0x987321',
    status: 'Pending',
    amount: 200,
    token: 'LITKEY',
    chain: 'Yellowstone',
  },
  {
    hash: '0x654987',
    status: 'Confirmed',
    amount: 550,
    token: 'SPX',
    chain: 'PayPal',
  },
  {
    hash: '0x147258',
    status: 'Pending',
    amount: 300,
    token: 'LITKEY',
    chain: 'Yellowstone',
  },
];

const meta = {
  title: 'UI/Table',
  component: Table,
  render: () => (
    <Table>
      <TableCaption>A list of your recent transactions.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Chain</TableHead>
          <TableHead className="w-[100px]">Hash</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Token</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.hash}>
            <TableCell className="font-medium">{transaction.chain}</TableCell>
            <TableCell className="font-medium">{transaction.hash}</TableCell>
            <TableCell
              className={transaction.status === 'Confirmed' ? 'text-green-800' : 'text-blue-800'}
            >
              {transaction.status}
            </TableCell>
            <TableCell className="text-right">{transaction.amount}</TableCell>
            <TableCell>{transaction.token}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4} className="text-right">
            Total USD
          </TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
