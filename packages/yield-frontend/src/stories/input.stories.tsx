import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '@/components/ui/input';

const meta = {
  title: 'UI/Input',
  component: Input,
  render: (args) => <Input {...args} />,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      control: { type: 'radio' },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Type your text here...',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Type your email here...',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Type your password here...',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    placeholder: 'Type your number here...',
  },
};

export const Tel: Story = {
  args: {
    type: 'tel',
    placeholder: 'Type your phone number here...',
  },
};

export const Url: Story = {
  args: {
    type: 'url',
    placeholder: 'Type your url here...',
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Type your search here...',
  },
};
