import type { Meta, StoryObj } from '@storybook/react';
import { Dashboard } from './dashboard';
import { JwtContext } from '@/contexts/jwt';

const meta: Meta<typeof Dashboard> = {
  title: 'Components/Dashboard',
  component: Dashboard,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <JwtContext.Provider
        value={{
          authInfo: {
            jwt: 'mock-jwt-token',
            pkp: {
              ethAddress: '0x1234567890abcdef1234567890abcdef12345678',
              publicKey: 'mock-public-key',
              tokenId: 'mock-token-id',
            },
          },
          logWithJwt: () => console.log('Mock logWithJwt'),
          logOut: () => console.log('Mock logout'),
        }}
      >
        <div className="min-h-screen flex items-center justify-center p-4">
          <Story />
        </div>
      </JwtContext.Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Dashboard />,
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <Dashboard />
    </div>
  ),
};
