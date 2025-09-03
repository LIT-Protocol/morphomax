import type { Meta, StoryObj } from '@storybook/react';
import { OptimalStrategyDisplay } from './optimal-strategy-display';

const meta: Meta<typeof OptimalStrategyDisplay> = {
  title: 'UI/OptimalStrategyDisplay',
  component: OptimalStrategyDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays the optimal yield strategy information with APY and strategy name.',
      },
    },
  },
  argTypes: {
    netApy: {
      control: { type: 'number', min: 0, max: 100, step: 0.1 },
      description: 'The net APY percentage',
    },
    strategyName: {
      control: { type: 'text' },
      description: 'The strategy name',
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Loading state',
    },
    error: {
      control: { type: 'text' },
      description: 'Error message to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof OptimalStrategyDisplay>;

export const Default: Story = {
  args: {
    netApy: 15.7,
    strategyName: 'Steakhouse USDC',
  },
};

export const HighYield: Story = {
  args: {
    netApy: 28.5,
    strategyName: 'Morpho Blue High Yield',
  },
};

export const LowYield: Story = {
  args: {
    netApy: 3.2,
    strategyName: 'Conservative USDC Vault',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Failed to fetch strategy data',
  },
};

export const NoData: Story = {
  args: {},
};

export const DarkMode: Story = {
  args: {
    netApy: 15.7,
    strategyName: 'Steakhouse USDC',
  },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ backgroundColor: '#1a1a1a', padding: '2rem', minWidth: '300px' }}
      >
        <Story />
      </div>
    ),
  ],
};
