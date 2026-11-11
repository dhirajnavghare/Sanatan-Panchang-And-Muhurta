import React from 'react';
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
});
