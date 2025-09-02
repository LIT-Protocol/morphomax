import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { Presentation } from '@/components/presentation';

const meta = {
  title: 'Components/Presentation',
  component: Presentation,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Presentation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const authenticateButton = canvas.getByText('Authenticate with Vincent', {
      selector: 'button',
    });
    await expect(authenticateButton).toBeInTheDocument();

    const litProtocolLink = canvas.getByText('LIT Protocol', { selector: 'a' });
    await expect(litProtocolLink).toHaveAttribute('href', 'https://litprotocol.com/');
  },
};
