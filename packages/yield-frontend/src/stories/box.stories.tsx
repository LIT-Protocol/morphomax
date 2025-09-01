import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { Button } from '@/components/ui/button';
import {
  Box,
  BoxContent,
  BoxDescription,
  BoxFooter,
  BoxHeader,
  BoxTitle,
} from '@/components/ui/box';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const meta = {
  title: 'UI/Box',
  component: Box,
  render: () => (
    <Box className="w-[350px]">
      <BoxHeader>
        <BoxTitle>Create App</BoxTitle>
        <BoxDescription>Register a new Vincent App.</BoxDescription>
      </BoxHeader>
      <BoxContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Name of your project" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Network</Label>
              <Select>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="next">Ethereum</SelectItem>
                  <SelectItem value="sveltekit">Base</SelectItem>
                  <SelectItem value="astro">Polygon</SelectItem>
                  <SelectItem value="nuxt">Solana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </BoxContent>
      <BoxFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Register</Button>
      </BoxFooter>
    </Box>
  ),
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: { onClick: fn() },
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
