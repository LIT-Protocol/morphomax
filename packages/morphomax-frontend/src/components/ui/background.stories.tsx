import type { Meta, StoryObj } from '@storybook/react';
import { Background } from './background';

const meta: Meta<typeof Background> = {
  title: 'UI/Background',
  component: Background,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Background />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          fontFamily: '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif',
        }}
      >
        <h1 style={{ margin: 0, color: '#121212' }}>Background Animation</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#9C9C9C' }}>
          Animated particle system with flowing connections
        </p>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark" style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Background />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          backgroundColor: 'rgba(10, 10, 10, 0.9)',
          padding: '2rem',
          borderRadius: '1rem',
          textAlign: 'center',
          fontFamily: '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif',
        }}
      >
        <h1 style={{ margin: 0, color: '#FFFFFF' }}>Background Animation</h1>
        <p style={{ margin: '0.5rem 0 0 0', color: '#9C9C9C' }}>
          Dark mode with animated particles
        </p>
      </div>
    </div>
  ),
};
