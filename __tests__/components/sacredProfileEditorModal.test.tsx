import React from 'react';
import { Switch } from 'react-native';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react-native';
import { SacredProfileEditorModal } from '../../src/components/SacredProfileEditorModal';
import { DEFAULT_USER_PROFILE, UserSacredProfile } from '../../src/services/userProfile';

describe('SacredProfileEditorModal - Interactive Profile Editor UI Tests', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn().mockResolvedValue(undefined);

  it('should render profile editor modal with existing devotee details', async () => {
    await render(
      <SacredProfileEditorModal
        visible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        profile={DEFAULT_USER_PROFILE}
        isHi={true}
      />
    );

    expect(screen.getByText('मेरी धार्मिक प्रोफाइल एवं सङ्कल्प')).toBeTruthy();
    expect(screen.getByTestId('profile-name-input')).toBeTruthy();
    expect(screen.getByTestId('profile-gotra-input')).toBeTruthy();
    expect(screen.getByTestId('profile-save-btn')).toBeTruthy();
    expect(screen.getByTestId('profile-close-btn')).toBeTruthy();
  });

  it('should update devotee name and gotra when user types into inputs and clicks save', async () => {
    await render(
      <SacredProfileEditorModal
        visible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        profile={DEFAULT_USER_PROFILE}
        isHi={true}
      />
    );

    const nameInput = screen.getByTestId('profile-name-input');
    const gotraInput = screen.getByTestId('profile-gotra-input');
    const saveBtn = screen.getByTestId('profile-save-btn');

    // Change name
    await act(async () => {
      fireEvent.changeText(nameInput, 'आदित्य');
    });

    // Change gotra
    await act(async () => {
      fireEvent.changeText(gotraInput, 'भारद्वाज');
    });

    // Click Save
    await act(async () => {
      fireEvent.press(saveBtn);
    });

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedArg = mockOnSave.mock.calls[0][0] as UserSacredProfile;
    expect(savedArg.name).toBe('आदित्य');
    expect(savedArg.gotra).toBe('भारद्वाज');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when user clicks the close (✕) button', async () => {
    await render(
      <SacredProfileEditorModal
        visible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        profile={DEFAULT_USER_PROFILE}
        isHi={true}
      />
    );

    const closeBtn = screen.getByTestId('profile-close-btn');
    await act(async () => {
      fireEvent.press(closeBtn);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('allows tapping Gotra quick pills, Ishta Devata cards, Kuldevi input, and notification switches in English', async () => {
    const { container } = await render(
      <SacredProfileEditorModal
        visible={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        profile={DEFAULT_USER_PROFILE}
        isHi={false}
      />
    );

    const atriPill = screen.getByText(/Atri|अत्रि/i);
    await fireEvent.press(atriPill);

    const krishnaCard = screen.getByText('Lord Sri Krishna');
    await fireEvent.press(krishnaCard);

    const kuldeviInput = screen.getByPlaceholderText('e.g. Vindhyavasini');
    await fireEvent.changeText(kuldeviInput, 'Maa Bhavani');

    const switches: { props: { value?: boolean } }[] = [];
    const collectSwitches = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const inst = node as { type?: unknown; props?: { value?: boolean }; children?: unknown[] };
      if (inst.type === Switch || inst.type === 'RCTSwitch') {
        switches.push(inst as { props: { value?: boolean } });
      }
      if (Array.isArray(inst.children)) {
        for (const c of inst.children) collectSwitches(c);
      }
    };
    collectSwitches(container);

    expect(switches.length).toBeGreaterThanOrEqual(4);
    for (const sw of switches) {
      await fireEvent(sw as never, 'valueChange', !sw.props.value);
    }

    await fireEvent.press(screen.getByTestId('profile-save-btn'));
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const saved = mockOnSave.mock.calls[0][0] as UserSacredProfile;
    expect(saved.ishtaDevata).toBe('Lord Sri Krishna');
    expect(saved.kuldeviOrDevata).toBe('Maa Bhavani');
  });
});
