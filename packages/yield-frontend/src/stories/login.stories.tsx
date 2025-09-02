import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { Login } from '@/pages/login';

const meta = {
  title: 'Pages/Login',
  component: Login,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Login>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const presentationComponent = canvas.getByTestId('presentation');
    await expect(presentationComponent).toBeInTheDocument();
  },
};
