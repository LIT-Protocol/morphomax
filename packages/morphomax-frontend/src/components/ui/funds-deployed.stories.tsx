import type { Meta, StoryObj } from '@storybook/react';
import { FundsDeployed } from './funds-deployed';

const meta: Meta<typeof FundsDeployed> = {
  title: 'UI/FundsDeployed',
  component: FundsDeployed,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    deployedAmount: {
      control: 'text',
      description: 'Amount of funds deployed in USD (without $ symbol)',
    },
    status: {
      control: 'select',
      options: ['Active', 'Inactive', 'Pending'],
      description: 'Current status of the deployment',
    },
    walletAddress: {
      control: 'text',
      description: 'Full wallet address (will be automatically truncated)',
    },
    baseScanUrl: {
      control: 'text',
      description: 'Custom BaseScan URL (optional, auto-generated if not provided)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    deployedAmount: '0.00',
    status: 'Active',
    walletAddress: '0xeFBC923F6621B396438a78E0fe81d535898cd604',
  },
};

export const WithFunds: Story = {
  args: {
    deployedAmount: '1,250.75',
    status: 'Active',
    walletAddress: '0xeFBC923F6621B396438a78E0fe81d535898cd604',
  },
};

export const LargeFunds: Story = {
  args: {
    deployedAmount: '125,000.00',
    status: 'Active',
    walletAddress: '0xeFBC923F6621B396438a78E0fe81d535898cd604',
  },
};

export const InactiveStatus: Story = {
  args: {
    deployedAmount: '500.25',
    status: 'Inactive',
    walletAddress: '0xeFBC923F6621B396438a78E0fe81d535898cd604',
  },
};

export const PendingStatus: Story = {
  args: {
    deployedAmount: '750.50',
    status: 'Pending',
    walletAddress: '0xeFBC923F6621B396438a78E0fe81d535898cd604',
  },
};

export const DifferentWallet: Story = {
  args: {
    deployedAmount: '2,500.00',
    status: 'Active',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
  },
};

export const CustomBaseScanUrl: Story = {
  args: {
    deployedAmount: '1,000.00',
    status: 'Active',
    walletAddress: '0xeFBC923F6621B396438a78E0fe81d535898cd604',
    baseScanUrl:
      'https://custom-basescan.example.com/address/0xeFBC923F6621B396438a78E0fe81d535898cd604',
  },
};

export const DarkMode: Story = {
  args: {
    deployedAmount: '3,750.25',
    status: 'Active',
    walletAddress: '0xeFBC923F6621B396438a78E0fe81d535898cd604',
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="min-h-[300px] p-4 bg-neutral-950">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const MultipleCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <FundsDeployed
        deployedAmount="0.00"
        status="Active"
        walletAddress="0xeFBC923F6621B396438a78E0fe81d535898cd604"
      />
      <FundsDeployed
        deployedAmount="1,250.75"
        status="Active"
        walletAddress="0x1234567890abcdef1234567890abcdef12345678"
      />
      <FundsDeployed
        deployedAmount="500.25"
        status="Inactive"
        walletAddress="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
      />
    </div>
  ),
};
