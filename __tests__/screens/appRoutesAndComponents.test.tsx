import React from 'react';
import { AccessibilityInfo, Linking, Text, View } from 'react-native';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react-native';
import AboutModalScreen from '@/app/modal';
import NotFoundScreen from '@/app/+not-found';
import { VratDetailModal } from '@/src/components/VratDetailModal';
import { TourTarget } from '@/src/components/TourTarget';
import { TourProvider } from '@/src/services/appTourContext';
import { LanguageProvider } from '@/src/core/i18n/LanguageContext';
import { VratGuidance } from '@/src/services/vratGuidelines';
import { MonoText } from '@/components/StyledText';
import { ExternalLink } from '@/components/ExternalLink';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { AppButton } from '@/src/components/ui/AppButton';
import { InlineFeedbackBanner, ScreenStateView } from '@/src/components/ui/ScreenStateView';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { router } from 'expo-router';

const mockVrat: VratGuidance = {
  vratId: 'ekadashi',
  badgeHi: 'एकादशी व्रत',
  badgeEn: 'Ekadashi Vrat',
  titleHi: 'मोक्षदा एकादशी',
  titleEn: 'Mokshada Ekadashi',
  deityHi: 'भगवान श्री विष्णु',
  deityEn: 'Lord Vishnu',
  significanceHi: 'समस्त पापों का क्षय एवं मोक्ष प्रदान करने वाली पावन एकादशी।',
  significanceEn: 'Sacred Ekadashi for spiritual purification and devotion.',
  ekadashiParana: {
    isEkadashi: false,
    isDwadashi: true,
    paranaDate: new Date('2026-11-21T07:00:00Z'),
    startTime: new Date('2026-11-21T01:15:00Z'),
    endTime: new Date('2026-11-21T03:25:00Z'),
    startTimeFormatted: '06:45 AM',
    endTimeFormatted: '08:55 AM',
    hariVasaraEndTime: new Date('2026-11-21T01:00:00Z'),
    vratNameHi: 'मोक्षदा एकादशी',
    vratNameEn: 'Mokshada Ekadashi',
    guidanceHi: 'सूर्योदय के बाद हरी वासर समाप्त होने पर पारणा करें।',
    guidanceEn: 'Break fast cleanly after sunrise in Dwadashi.',
  },
  fastingRulesHi: ['प्रातः स्नान कर तुलसी अर्पण करें'],
  fastingRulesEn: ['Bathe early and offer Tulsi leaves'],
  permissibleFoodsHi: ['फल एवं दूध'],
  permissibleFoodsEn: ['Fruits and milk'],
  prohibitedFoodsHi: ['अन्न व तामसिक भोजन'],
  prohibitedFoodsEn: ['Grains and lentils'],
  arghyaMantraSanskrit: 'ॐ नमो भगवते वासुदेवाय',
};

describe('Standalone Routes, VratDetailModal & TourTarget Tests', () => {
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });

  it('renders About Modal Screen with bilingual info and external links', async () => {
    const openSpy = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValueOnce(undefined as never)
      .mockResolvedValueOnce(undefined as never);
    await render(
      <LanguageProvider>
        <AboutModalScreen />
      </LanguageProvider>
    );

    expect(screen.getByTestId('about-modal-scroll')).toBeTruthy();
    const ghLink = screen.getByTestId('about-github-link');
    const webLink = screen.getByTestId('about-website-link');
    expect(ghLink).toBeTruthy();
    expect(webLink).toBeTruthy();

    await fireEvent.press(ghLink);
    await fireEvent.press(webLink);
    expect(openSpy).toHaveBeenCalledWith('https://github.com/dhirajnavghare/sanatan.cc');
    expect(openSpy).toHaveBeenCalledWith('https://sanatan.cc');
  });

  it('renders 404 Not Found screen and navigates home when tapped', async () => {
    const replaceSpy = jest.spyOn(router, 'replace');
    await render(
      <LanguageProvider>
        <NotFoundScreen />
      </LanguageProvider>
    );

    const homeBtn = screen.getByTestId('not-found-home-btn');
    expect(homeBtn).toBeTruthy();
    await fireEvent.press(homeBtn);
    expect(replaceSpy).toHaveBeenCalledWith('/(tabs)');
  });

  it('renders VratDetailModal with parana window, allowed/prohibited rules, and closes cleanly', async () => {
    const onClose = jest.fn();
    await render(<VratDetailModal visible={true} onClose={onClose} vrat={mockVrat} isHi={false} />);

    expect(screen.getByText('Mokshada Ekadashi')).toBeTruthy();
    expect(screen.getByText('06:45 AM — 08:55 AM')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('vrat-modal-close-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);

    const emptyTree = await render(<VratDetailModal visible={true} onClose={onClose} vrat={null} isHi={true} />);
    expect(emptyTree.toJSON()).toBeNull();
  });

  it('renders TourTarget children cleanly without collapsing layout', async () => {
    await render(
      <LanguageProvider>
        <TourProvider>
          <TourTarget targetId="custom-target">
            <View testID="inner-child">
              <Text>Target Content</Text>
            </View>
          </TourTarget>
        </TourProvider>
      </LanguageProvider>
    );

    await fireEvent.layout(screen.getByTestId('inner-child'), { x: 10, y: 20, width: 200, height: 50 });

    expect(screen.getByText('Target Content')).toBeTruthy();
  });

  it('renders MonoText, ExternalLink, and useClientOnlyValue cleanly', async () => {
    function SampleHelper() {
      const clientVal = useClientOnlyValue('server', 'client');
      return (
        <View>
          <MonoText>{clientVal}</MonoText>
          <ExternalLink href="https://sanatan.cc">
            <Text>Portal</Text>
          </ExternalLink>
        </View>
      );
    }
    await render(<SampleHelper />);
    expect(screen.getByText('client')).toBeTruthy();
    await fireEvent.press(screen.getByText('Portal'), { preventDefault: jest.fn() });
  });

  it('renders AppButton variants cleanly and guards disabled/loading states', async () => {
    const onPrimary = jest.fn();
    const onBlocked = jest.fn();
    const isReducedSpy = jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await render(
      <View>
        <AppButton testID="btn-primary" label="Primary" iconName="checkmark" onPress={onPrimary} />
        <AppButton testID="btn-secondary" label="Secondary" variant="secondary" onPress={onPrimary} />
        <AppButton testID="btn-outline" label="Outline" variant="outline" onPress={onPrimary} />
        <AppButton testID="btn-danger" label="Danger" variant="danger" onPress={onPrimary} />
        <AppButton testID="btn-ghost" label="Ghost" variant="ghost" onPress={onPrimary} />
        <AppButton testID="btn-disabled" label="Disabled" disabled onPress={onBlocked} />
        <AppButton testID="btn-loading" label="Loading" loading onPress={onBlocked} />
      </View>
    );

    const primary = screen.getByTestId('btn-primary');
    await fireEvent(primary, 'pressIn');
    await fireEvent(primary, 'pressOut');
    await fireEvent.press(primary);
    await fireEvent.press(screen.getByTestId('btn-secondary'));
    await fireEvent.press(screen.getByTestId('btn-outline'));
    await fireEvent.press(screen.getByTestId('btn-danger'));
    await fireEvent.press(screen.getByTestId('btn-ghost'));
    expect(onPrimary).toHaveBeenCalledTimes(5);

    await fireEvent.press(screen.getByTestId('btn-disabled'));
    await fireEvent.press(screen.getByTestId('btn-loading'));
    expect(onBlocked).not.toHaveBeenCalled();

    isReducedSpy.mockRestore();
  });

  it('renders ScreenStateView, InlineFeedbackBanner, SectionHeader, and tracks useReducedMotion', async () => {
    const onAction = jest.fn();
    let changeListener: ((enabled: boolean) => void) | undefined;
    const removeSpy = jest.fn();
    const isReduceSpy = jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(true);
    const addListenerSpy = jest
      .spyOn(AccessibilityInfo, 'addEventListener')
      .mockImplementation((_event, cb) => {
        changeListener = cb as (enabled: boolean) => void;
        return { remove: removeSpy } as unknown as ReturnType<typeof AccessibilityInfo.addEventListener>;
      });

    function MotionProbe() {
      const reduced = useReducedMotion();
      return (
        <View>
          <SectionHeader
            title="Daily Guidance"
            subtitle="Panchang & Muhurta"
            rightSlot={<Text testID="motion-flag">{reduced ? 'reduced' : 'normal'}</Text>}
          />
          <ScreenStateView
            testID="empty-view"
            tone="empty"
            iconEmoji="🕉️"
            title="Nothing Listed"
            description="Adjust filters to see entries."
            actionLabel="Reset"
            actionTestID="empty-reset-btn"
            onAction={onAction}
          />
          <ScreenStateView
            testID="error-view"
            tone="error"
            title="Network Error"
            description="Unable to load feed."
          />
          <InlineFeedbackBanner testID="banner-success" tone="success" message="Saved" />
          <InlineFeedbackBanner testID="banner-error" tone="error" message="Failed" />
          <InlineFeedbackBanner testID="banner-warning" tone="warning" message="Caution" />
          <InlineFeedbackBanner testID="banner-info" tone="info" message="Updated" />
        </View>
      );
    }

    await render(<MotionProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('motion-flag')).toHaveTextContent('reduced');
    });

    await act(async () => {
      changeListener?.(false);
    });
    expect(screen.getByTestId('motion-flag')).toHaveTextContent('normal');

    expect(screen.getByText('Daily Guidance')).toBeTruthy();
    expect(screen.getByText('Panchang & Muhurta')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('empty-reset-btn'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('error-view')).toBeTruthy();
    expect(screen.getByTestId('banner-success')).toBeTruthy();
    expect(screen.getByTestId('banner-error')).toBeTruthy();
    expect(screen.getByTestId('banner-warning')).toBeTruthy();
    expect(screen.getByTestId('banner-info')).toBeTruthy();

    await cleanup();
    expect(removeSpy).toHaveBeenCalled();

    isReduceSpy.mockRestore();
    addListenerSpy.mockRestore();
  });
});
