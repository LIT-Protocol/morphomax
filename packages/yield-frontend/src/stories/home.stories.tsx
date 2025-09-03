import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { Home } from '@/pages/home';

const meta = {
  title: 'Pages/Home',
  component: Home,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const presentationComponent = canvas.getByTestId('presentation');
    await expect(presentationComponent).toBeInTheDocument();
  },
};
