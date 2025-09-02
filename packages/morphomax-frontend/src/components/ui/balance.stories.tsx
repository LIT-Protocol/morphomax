import type { Meta, StoryObj } from '@storybook/react';
import { Balance } from './balance';

const meta: Meta<typeof Balance> = {
  title: 'UI/Balance',
  component: Balance,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    balanceFormatted: {
      control: 'text',
      description: 'Current balance formatted as a string',
    },
    minimumDeposit: {
      control: 'number',
      description: 'Minimum deposit required',
    },
    balanceLoading: {
      control: 'boolean',
      description: 'Whether balance is currently loading',
    },
    balanceError: {
      control: 'text',
      description: 'Balance error message if any',
    },
    depositComplete: {
      control: 'boolean',
      description: 'Whether deposit is complete (balance >= minimum)',
    },
    amountNeeded: {
      control: 'number',
      description: 'Amount needed to reach minimum deposit',
    },
    progressPercentage: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress percentage (0-100)',
    },
    onRefreshBalance: { action: 'refresh balance clicked' },
    onDepositClick: { action: 'deposit clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    balanceFormatted: '19.85',
    minimumDeposit: 100.0,
    balanceLoading: false,
    balanceError: null,
    depositComplete: false,
    amountNeeded: 80.15,
    progressPercentage: 19.85,
  },
};

export const Loading: Story = {
  args: {
    balanceFormatted: '19.85',
    minimumDeposit: 100.0,
    balanceLoading: true,
    balanceError: null,
    depositComplete: false,
    amountNeeded: 80.15,
    progressPercentage: 19.85,
  },
};

export const Error: Story = {
  args: {
    balanceFormatted: '0.00',
    minimumDeposit: 100.0,
    balanceLoading: false,
    balanceError: 'Failed to load balance',
    depositComplete: false,
    amountNeeded: 100.0,
    progressPercentage: 0,
  },
};

export const NearComplete: Story = {
  args: {
    balanceFormatted: '95.50',
    minimumDeposit: 100.0,
    balanceLoading: false,
    balanceError: null,
    depositComplete: false,
    amountNeeded: 4.5,
    progressPercentage: 95.5,
  },
};

export const Complete: Story = {
  args: {
    balanceFormatted: '150.00',
    minimumDeposit: 100.0,
    balanceLoading: false,
    balanceError: null,
    depositComplete: true,
    amountNeeded: 0,
    progressPercentage: 100,
  },
};

export const ZeroBalance: Story = {
  args: {
    balanceFormatted: '0.00',
    minimumDeposit: 100.0,
    balanceLoading: false,
    balanceError: null,
    depositComplete: false,
    amountNeeded: 100.0,
    progressPercentage: 0,
  },
};

export const DarkMode: Story = {
  args: {
    balanceFormatted: '19.85',
    minimumDeposit: 100.0,
    balanceLoading: false,
    balanceError: null,
    depositComplete: false,
    amountNeeded: 80.15,
    progressPercentage: 19.85,
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="min-h-[200px] p-4 bg-neutral-950">
          <Story />
        </div>
      </div>
    ),
  ],
};
