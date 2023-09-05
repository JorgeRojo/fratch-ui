import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Modal from './Modal';
import { ModalTypes } from './ModalConstants';
import { type ModalProps } from './ModalProps';

vi.mock('lodash', () => ({ debounce: (fn: () => void) => fn }));

describe('Modal', () => {
  const modalId = 'crypto-mock-random-UUID-1234';
  const initialProps: Omit<ModalProps, 'children'> = {};

  const getComponent = (props = initialProps) => (
    <Modal {...props}>
      <p>Modal contents</p>
    </Modal>
  );

  const setup = (props = initialProps) => render(getComponent(props));

  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(modalId);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render properly', () => {
    const { baseElement } = setup();
    expect(baseElement).toMatchSnapshot();
  });

  it('should render as visible', () => {
    const { baseElement } = setup({
      visible: true,
      title: 'Modal title',
    });
    expect(baseElement).toMatchSnapshot();
  });

  it('should render for type ACCEPT', () => {
    const { baseElement } = setup({
      visible: true,
      type: ModalTypes.ACCEPT,
    });
    expect(baseElement).toMatchSnapshot();
  });

  it('should render for type CONFIRM with custom button labels', () => {
    const { baseElement } = setup({
      visible: true,
      type: ModalTypes.CONFIRM,
      acceptButtonLabel: 'mock-custom-label-OK',
      cancelButtonLabel: 'mock-custom-label-CANCEL',
    });
    expect(baseElement).toMatchSnapshot();
  });

  it('should perform onOpen on rerender as visible', async () => {
    const onOpen = vi.fn();
    const { rerender } = setup();

    await rerender(getComponent({ visible: true, onOpen }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith();
  });

  it('should perform onClose with accept for type CONFIRM', async () => {
    const onClose = vi.fn();
    setup({
      visible: true,
      onClose,
      type: ModalTypes.CONFIRM,
    });

    const closeButton = screen.getByRole('button', { name: /OK/i });
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('accept');
  });

  it('should perform onClose with cancel for type CONFIRM', async () => {
    const onClose = vi.fn();
    setup({
      visible: true,
      onClose,
      type: ModalTypes.CONFIRM,
    });

    const closeButton = screen.getByRole('button', { name: /Cancel/i });
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('cancel');
  });

  it('should perform onClose from closer button', async () => {
    const onClose = vi.fn();
    const { baseElement } = setup({
      visible: true,
      onClose,
    });

    const closeButton = screen.getByRole('button', { name: /Close/i });
    await userEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('close');

    expect(baseElement).toMatchSnapshot();
  });

  it('should perform onClose from overflow', async () => {
    const onClose = vi.fn();
    const { baseElement } = setup({
      visible: true,
      onClose,
    });

    const overflow = screen.getByLabelText('Close');
    await userEvent.click(overflow);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith('close');

    expect(baseElement).toMatchSnapshot();
  });
});
