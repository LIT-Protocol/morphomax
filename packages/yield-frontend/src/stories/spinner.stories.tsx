import type { Meta, StoryObj } from '@storybook/react';

import { Spinner } from '@/components/ui/spinner';

const meta = {
  title: 'UI/Spinner',
  component: Spinner,
  render: (args) => <Spinner {...args} />,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      options: ['default', 'secondary', 'destructive', 'outline'],
      control: { type: 'radio' },
    },
    size: {
      options: ['sm', 'md', 'lg', 'xl'],
      control: { type: 'radio' },
    },
    thickness: {
      options: ['thin', 'regular', 'thick'],
      control: { type: 'radio' },
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
    thickness: 'regular',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    size: 'md',
    thickness: 'regular',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    size: 'md',
    thickness: 'regular',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    size: 'md',
    thickness: 'regular',
  },
};
