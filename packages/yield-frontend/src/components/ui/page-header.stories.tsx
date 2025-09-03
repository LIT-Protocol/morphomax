import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './page-header';

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A page header component with title, optional subtitle, and description using ITC Avant Garde Gothic font.',
      },
    },
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'The main title text',
    },
    subtitle: {
      control: { type: 'text' },
      description: 'Optional subtitle displayed below the title in uppercase',
    },
    description: {
      control: { type: 'text' },
      description: 'Optional description text displayed below the title',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size variant for the component',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Vincent Yield Agent',
    subtitle: 'Early Access',
    description:
      'This app uses the Vincent platform to securely and verifiably auto-rotate your Base USDC into top yield opportunities on Morpho.',
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Vincent Yield Agent',
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Vincent Yield Agent',
    subtitle: 'Early Access',
  },
};

export const WithDescription: Story = {
  args: {
    title: 'Vincent Yield Agent',
    description:
      'This app uses the Vincent platform to securely and verifiably auto-rotate your Base USDC into top yield opportunities on Morpho.',
  },
};

export const SmallSize: Story = {
  args: {
    title: 'Vincent Yield Agent',
    subtitle: 'Early Access',
    description:
      'This app uses the Vincent platform to securely and verifiably auto-rotate your Base USDC into top yield opportunities on Morpho.',
    size: 'sm',
  },
};

export const MediumSize: Story = {
  args: {
    title: 'Vincent Yield Agent',
    subtitle: 'Early Access',
    description:
      'This app uses the Vincent platform to securely and verifiably auto-rotate your Base USDC into top yield opportunities on Morpho.',
    size: 'md',
  },
};

export const WithLinks: Story = {
  args: {
    title: 'Vincent Yield Agent',
    subtitle: 'Early Access',
    description: (
      <>
        This app uses the Vincent platform to securely and verifiably auto-rotate your Base USDC
        into top yield opportunities on Morpho. Learn more about{' '}
        <a
          href="https://docs.heyvincent.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: '#FF4205' }}
        >
          Vincent
        </a>{' '}
        or checkout the{' '}
        <a
          href="https://github.com/LIT-Protocol/morphomax"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: '#FF4205' }}
        >
          code
        </a>
      </>
    ),
  },
};

export const DarkMode: Story = {
  args: {
    title: 'Vincent Yield Agent',
    subtitle: 'Early Access',
    description:
      'This app uses the Vincent platform to securely and verifiably auto-rotate your Base USDC into top yield opportunities on Morpho.',
  },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ backgroundColor: '#1a1a1a', padding: '2rem', minHeight: '300px' }}
      >
        <Story />
      </div>
    ),
  ],
};
