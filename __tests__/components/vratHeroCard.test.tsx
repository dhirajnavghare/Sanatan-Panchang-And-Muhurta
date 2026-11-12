import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { VratHeroCard } from '../../src/components/VratHeroCard';
import { VratGuidance } from '../../src/services/vratGuidelines';

describe('VratHeroCard Component', () => {
  const mockSankashti: VratGuidance = {
    vratId: 'sankashti',
    titleHi: 'संकष्टी चतुर्थी (श्री गणेश संकट हरण व्रत)',
    titleEn: 'Sankashti Chaturthi',
    badgeHi: '🌕 चन्द्र दर्शन व्रत',
    badgeEn: '🌕 Moon Sight Fasting',
    deityHi: 'भगवान श्री गणेश एवं चन्द्र देव',
    deityEn: 'Lord Sri Ganesha & Chandra Deva',
    significanceHi: 'विघ्न हरण व ऋण मुक्ति हेतु परम फलदायी।',
    significanceEn: 'Removes obstacles and debts.',
    moonriseTime: '09:18 PM',
    moonriseCountdown: 'लगभग 2 घण्टे शेष',
    hasMoonRisen: false,
    arghyaMantraSanskrit: 'क्षीरोदार्णव सम्भूत अत्रिनेत्र समुद्भव।',
    arghyaMantraMeaningHi: 'हे चन्द्रमा! अर्घ्य स्वीकार करें।',
    arghyaMantraMeaningEn: 'O Moon! Accept my offering.',
    arghyaVidhiHi: ['जल व दूध से अर्घ्य दें।'],
    arghyaVidhiEn: ['Offer water & milk.'],
    permissibleFoodsHi: ['साबूदाना', 'फल'],
    permissibleFoodsEn: ['Sabudana', 'Fruits'],
    prohibitedFoodsHi: ['चावल', 'गेहूँ'],
    prohibitedFoodsEn: ['Rice', 'Wheat'],
    fastingRulesHi: ['चन्द्र दर्शन उपरान्त ही भोजन करें।'],
    fastingRulesEn: ['Break fast after moonrise.'],
  };

  it('should render Vrat title, badge, and moonrise timing', async () => {
    await render(<VratHeroCard vrat={mockSankashti} isHi={true} />);

    expect(screen.getByTestId('vrat-hero-card')).toBeTruthy();
    expect(screen.getByText(/संकष्टी चतुर्थी/i)).toBeTruthy();
    expect(screen.getByText(/09:18 PM/i)).toBeTruthy();
  });

  it('should open VratDetailModal with Arghya mantra and dietary rules when tapped', async () => {
    await render(<VratHeroCard vrat={mockSankashti} isHi={true} />);

    const card = screen.getByTestId('vrat-hero-card');
    await act(async () => {
      fireEvent.press(card);
    });

    // Modal elements are now visible
    expect(screen.getByText(/क्षीरोदार्णव सम्भूत/i)).toBeTruthy();
    expect(screen.getAllByText(/ग्राह्य फलाहार/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/वर्जित अन्न/i)).toBeTruthy();
  });
});
