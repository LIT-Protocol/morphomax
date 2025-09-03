import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A versatile button component using ITC Avant Garde Gothic font with multiple variants and sizes.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'primary',
        'primary-outline',
        'secondary',
        'secondary-outline',
        'destructive',
        'destructive-outline',
      ],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
};

export const PrimaryOutline: Story = {
  args: {
    children: 'Button',
    variant: 'primary-outline',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Button',
    variant: 'secondary',
    size: 'md',
  },
};

export const SecondaryOutline: Story = {
  args: {
    children: 'Button',
    variant: 'secondary-outline',
    size: 'md',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Button',
    variant: 'destructive',
    size: 'md',
  },
};

export const DestructiveOutline: Story = {
  args: {
    children: 'Button',
    variant: 'destructive-outline',
    size: 'md',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4 items-center flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="primary-outline">Primary Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="secondary-outline">Secondary Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="destructive-outline">Destructive Outline</Button>
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark" style={{ backgroundColor: '#1a1a1a', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex gap-4 items-center flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="primary-outline">Primary Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="secondary-outline">Secondary Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="destructive-outline">Destructive Outline</Button>
    </div>
  ),
};
