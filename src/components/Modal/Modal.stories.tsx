import Modal from './Modal';
import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Example/Modal',
  component: Modal,
  argTypes: {
    onClose: { action: 'onClose', table: { disable: true } },
    onOpen: { action: 'onOpen' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  args: {
    title: 'This is the title',
    children: 'This is the content',
    visible: true,
  },
};
