import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TEMPLES_DATABASE } from '@/src/core/temples/data';
import { TempleRecord } from '@/src/core/temples/types';
import { DEITIES_DATABASE } from '@/src/core/devatas/data';
import { DeityRecord, DeityTradition } from '@/src/core/devatas/types';
import { VRAT_KATHAS_DATABASE, VratKathaRecord } from '@/src/core/vrat-katha/data';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanBilingualTitle } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import {
  loadUserProfile,
  saveUserProfile,
  UserSacredProfile,
  DEFAULT_USER_PROFILE,
} from '@/src/services/userProfile';
import { SacredProfileEditorModal } from '@/src/components/SacredProfileEditorModal';
import { triggerHaptic } from '@/src/services/sacredAudio';
import { scheduleDailySacredReminders } from '@/src/services/sacredNotifications';
import { calculatePanchang, PRESET_CITIES } from '@/src/core/panchang';
import { getDayPlans } from '@/src/services/dayplanner';
import { getDateKey } from '@/src/services/sadhana';

type MoreSection = 'temples' | 'devatas' | 'vrat_katha';

export default function MoreScreen() {
  const { language, calendarSystem } = useLanguage();
  const isHi = language === 'hi';

  const [userProfile, setUserProfile] = useState<UserSacredProfile>(DEFAULT_USER_PROFILE);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    loadUserProfile().then(setUserProfile);
  }, []);

  const handleSaveProfile = async (updated: UserSacredProfile) => {
    setUserProfile(updated);
    await saveUserProfile(updated);
    const panchang = calculatePanchang(new Date(), PRESET_CITIES[0]);
    const plans = await getDayPlans(getDateKey(new Date()));
    await scheduleDailySacredReminders(panchang, updated, plans, undefined, 7, undefined, language);
  };

  const [activeSection, setActiveSection] = useState<MoreSection>('temples');
  const [isCalculating, setIsCalculating] = useState(false);

  // Temples state
  const [circuitFilter, setCircuitFilter] = useState<'jyotirlinga' | 'char_dham' | 'pancha_bhoota'>('jyotirlinga');
  const filteredTemples = TEMPLES_DATABASE.filter(
    (t) => t.circuitCategory === circuitFilter || t.secondaryCircuits?.includes(circuitFilter)
  );

  // Devatas state
  const [devataTradition, setDevataTradition] = useState<string>('all');
  const [selectedDeityModal, setSelectedDeityModal] = useState<DeityRecord | null>(null);

  const filteredDeities = DEITIES_DATABASE.filter((d) => {
    if (devataTradition === 'all') return true;
    if (devataTradition === 'pancha_deva') return d.isPanchaDeva;
    return d.tradition.toLowerCase() === devataTradition.toLowerCase();
  });

  // Vrat Katha state
  const [selectedVratId, setSelectedVratId] = useState<string>(VRAT_KATHAS_DATABASE[0].id);
  const activeVrat = VRAT_KATHAS_DATABASE.find((v) => v.id === selectedVratId) || VRAT_KATHAS_DATABASE[0];

  const handleSectionSelect = (s: MoreSection) => {
    if (s === activeSection) return;
    setIsCalculating(true);
    setTimeout(() => {
      setActiveSection(s);
      setIsCalculating(false);
    }, 120);
  };

  const handleCircuitSelect = (c: 'jyotirlinga' | 'char_dham' | 'pancha_bhoota') => {
    if (c === circuitFilter) return;
    setIsCalculating(true);
    setTimeout(() => {
      setCircuitFilter(c);
      setIsCalculating(false);
    }, 120);
  };

  const handleDevataTraditionSelect = (t: string) => {
    if (t === devataTradition) return;
    setIsCalculating(true);
    setTimeout(() => {
      setDevataTradition(t);
      setIsCalculating(false);
    }, 120);
  };

  const handleVratSelect = (id: string) => {
    if (id === selectedVratId) return;
    setIsCalculating(true);
    setTimeout(() => {
      setSelectedVratId(id);
      setIsCalculating(false);
    }, 120);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Sacred Devotee Profile Banner */}
      <View style={styles.profileBanner}>
        <View style={styles.profileAvatarBox}>
          <Text style={styles.profileAvatarEmoji}>🕉️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileGreeting}>
            {isHi ? 'श्री' : 'Sri'} {userProfile.name} {isHi ? 'जी' : ''}
          </Text>
          <Text style={styles.profileGotraText}>
            {userProfile.gotra ? `${isHi ? 'गोत्र:' : 'Gotra:'} ${userProfile.gotra}` : ''} • {userProfile.ishtaDevata}
          </Text>
          {userProfile.kuldeviOrDevata ? (
            <Text style={styles.profileKuldeviText}>
              {isHi ? 'कुलदेवी:' : 'Family Deity:'} {userProfile.kuldeviOrDevata}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          testID="more-edit-profile-btn"
          style={styles.editProfilePill}
          onPress={async () => {
            await triggerHaptic('tap', userProfile.hapticsEnabled);
            setIsProfileModalOpen(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={15} color="#b45309" />
          <Text style={styles.editProfilePillText}>{isHi ? 'बदलें' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Navigation to Settings Tab */}
      <TouchableOpacity
        testID="more-to-settings-btn"
        style={styles.settingsNavPill}
        onPress={() => {
          triggerHaptic('tap', userProfile.hapticsEnabled).catch(() => {});
          router.push('/(tabs)/settings');
        }}
        activeOpacity={0.8}
      >
        <View style={styles.settingsNavPillLeft}>
          <View style={styles.settingsNavIconBox}>
            <Ionicons name="settings-sharp" size={17} color="#d97706" />
          </View>
          <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <Text style={styles.settingsNavTitle}>
              {isHi ? 'ऍप सेटिंग्स एवं अलर्ट प्राथमिकताएं' : 'App Settings & Muhurta Alerts'}
            </Text>
            <Text style={styles.settingsNavSubtitle}>
              {isHi
                ? 'भाषा, चान्द्र पद्धति, फोन पैनल सूचनाएं व गोत्र प्रोफाइल'
                : 'Configure language, notifications, audio & profile'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#b45309" />
      </TouchableOpacity>

      {/* Main Feature Switcher */}
      <View style={styles.featureSwitcher}>
        {[
          { id: 'temples' as const, labelHi: '🛕 तीर्थ-मन्दिर', labelEn: '🛕 Temples' },
          { id: 'devatas' as const, labelHi: '🔱 देवी-देवता', labelEn: '🔱 Deities' },
          { id: 'vrat_katha' as const, labelHi: '📖 व्रत कथा', labelEn: '📖 Vrat Katha' },
        ].map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              testID={`more-tab-${tab.id}`}
              style={[styles.featureTab, isActive && styles.featureTabActive]}
              onPress={() => handleSectionSelect(tab.id)}
            >
              <Text style={[styles.featureTabText, isActive && styles.featureTabTextActive]}>
                {isHi ? tab.labelHi : tab.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isCalculating ? (
        <LoadingIndicator
          message={
            isHi
              ? 'जानकारी लोड हो रही है...'
              : 'Loading details...'
          }
        />
      ) : (
        <>
          {/* SECTION 1: TEMPLES */}
          {activeSection === 'temples' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {isHi ? '🛕 पवित्र तीर्थ एवं मन्दिर दर्शन' : '🛕 Sacred Pilgrimage Sanctuaries'}
              </Text>

              {/* Circuit Filter Pills */}
              <View style={styles.circuitRow}>
                {[
                  { id: 'jyotirlinga', labelHi: '१२ ज्योतिर्लिंग', labelEn: '12 Jyotirlingas' },
                  { id: 'char_dham', labelHi: 'चार धाम', labelEn: 'Char Dham' },
                  { id: 'pancha_bhoota', labelHi: 'पंचभूत', labelEn: 'Pancha Bhoota' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    testID={`circuit-pill-${c.id}`}
                    style={[styles.circuitPill, circuitFilter === c.id && styles.circuitPillActive]}
                    onPress={() => handleCircuitSelect(c.id as typeof circuitFilter)}
                  >
                <Text
                  style={[
                    styles.circuitText,
                    circuitFilter === c.id && styles.circuitTextActive,
                  ]}
                >
                  {isHi ? c.labelHi : c.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredTemples.map((temple: TempleRecord) => (
            <View key={temple.id} style={styles.card}>
              <View style={styles.templeHeader}>
                <Text style={styles.templeTitle}>
                  {isHi ? temple.nameDevanagari : temple.name}
                </Text>
                <View style={styles.templeLocationRow}>
                  <Text style={styles.cardLocation}>
                    📍 {temple.location.city}, {temple.location.state}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardSubText}>
                {isHi ? 'प्रधान आराध्य:' : 'Primary Deity:'}{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {isHi ? (temple.primaryDeityDevanagari || temple.primaryDeity) : temple.primaryDeity}
                </Text>
              </Text>

              {temple.sacredRiver && (
                <Text style={styles.cardSubText}>
                  🌊 {isHi ? 'पवित्र नदी:' : 'Sacred River:'}{' '}
                  {cleanBilingualTitle(temple.sacredRiver, isHi)}
                </Text>
              )}

              <Text style={styles.cardDesc} numberOfLines={2}>
                {temple.significance}
              </Text>

              <View style={styles.darshanBox}>
                <Ionicons name="time" size={13} color="#d97706" />
                <Text style={styles.darshanText}>
                  {isHi ? 'दर्शन समय:' : 'Darshan:'} {temple.darshanTimings}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* SECTION 2: DEVI DEVATAS */}
      {activeSection === 'devatas' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {isHi ? '🔱 सनातन देवी-देवता दर्शन एवं महामन्त्र' : '🔱 Sacred Hindu Deities & Mantras'}
          </Text>

          {/* Tradition Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {[
              { id: 'all', labelHi: 'सभी देवता', labelEn: 'All Deities' },
              { id: 'pancha_deva', labelHi: 'पञ्चदेव', labelEn: 'Pancha Devas' },
              { id: 'shaiva', labelHi: 'शैव', labelEn: 'Shaiva' },
              { id: 'vaishnava', labelHi: 'वैष्णव', labelEn: 'Vaishnava' },
              { id: 'shakta', labelHi: 'शाक्त', labelEn: 'Shakta' },
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                testID={`tradition-pill-${t.id}`}
                style={[styles.circuitPill, devataTradition === t.id && styles.circuitPillActive]}
                onPress={() => handleDevataTraditionSelect(t.id)}
              >
                <Text style={[styles.circuitText, devataTradition === t.id && styles.circuitTextActive]}>
                  {isHi ? t.labelHi : t.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredDeities.map((deity: DeityRecord) => (
            <TouchableOpacity
              key={deity.id}
              testID={`deity-card-${deity.id}`}
              style={styles.card}
              onPress={() => setSelectedDeityModal(deity)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>
                  {isHi ? deity.nameDevanagari : deity.name}
                </Text>
                <View style={styles.badgeTradition}>
                  <Text style={styles.badgeTraditionText}>{deity.tradition}</Text>
                </View>
              </View>

              <Text style={styles.deitySubtitle}>
                {isHi ? deity.subtitleDevanagari : deity.subtitle}
              </Text>

              {deity.consort && (
                <Text style={styles.cardSubText}>
                  {isHi ? 'शक्ति / सहचरी:' : 'Consort:'}{' '}
                  <Text style={{ fontWeight: '600' }}>{deity.consort}</Text>
                </Text>
              )}

              {deity.vahana && (
                <Text style={styles.cardSubText}>
                  {isHi ? 'दिव्य वाहन:' : 'Vahana:'}{' '}
                  <Text style={{ fontWeight: '600' }}>{deity.vahana}</Text>
                </Text>
              )}

              {deity.tatva && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {deity.tatva}
                </Text>
              )}

              {deity.keyMantras.length > 0 && (
                <View style={styles.mantraBox}>
                  <Text style={styles.mantraTitle}>
                    {deity.keyMantras[0].title}
                  </Text>
                  <Text style={styles.mantraDevanagari}>
                    {deity.keyMantras[0].devanagari}
                  </Text>
                </View>
              )}

              <View style={styles.cardFooterAction}>
                <Text style={styles.cardFooterActionText}>
                  {isHi ? 'सम्पूर्ण दर्शन, मन्त्र एवं विवरण देखें →' : 'View Full Philosophy, Mantras & Temples →'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* SECTION 3: VRAT KATHA */}
      {activeSection === 'vrat_katha' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {isHi ? '📖 पावन व्रत कथाएँ एवं पारण विधि' : '📖 Sacred Vrat Kathas & Fasting Guides'}
          </Text>

          {/* Vrat Selector Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {VRAT_KATHAS_DATABASE.map((vrat) => {
              const isSelected = vrat.id === selectedVratId;
              return (
                <TouchableOpacity
                  key={vrat.id}
                  testID={`vrat-pill-${vrat.id}`}
                  style={[styles.circuitPill, isSelected && styles.circuitPillActive]}
                  onPress={() => handleVratSelect(vrat.id)}
                >
                  <Text style={[styles.circuitText, isSelected && styles.circuitTextActive]}>
                    {isHi ? vrat.titleDevanagari : vrat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {isHi ? activeVrat.titleDevanagari : activeVrat.title}
            </Text>
            <Text style={styles.cardSubText}>
              {isHi ? 'आराध्य देव:' : 'Deity:'}{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {isHi ? activeVrat.deityDevanagari : activeVrat.deity}
              </Text>
              {' • '}
              {isHi ? activeVrat.tithiDevanagari : activeVrat.tithi}
            </Text>

            <Text style={styles.cardDesc}>{activeVrat.significance}</Text>

            {/* Puja Steps */}
            <Text style={styles.subHeading}>
              {isHi ? '🙏 प्रामाणिक पूजा विधि (Vidhi Steps)' : '🙏 Sacred Puja Vidhi'}
            </Text>
            {activeVrat.pujaVidhiSteps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <Text style={styles.stepNum}>{idx + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            {/* Fasting Rules (Allowed & Prohibited) */}
            <View style={styles.rulesGrid}>
              <View style={styles.rulesColumnAllowed}>
                <Text style={styles.rulesHeadingAllowed}>
                  {isHi ? '✅ फलाहार में ग्राह्य' : '✅ Allowed Foods'}
                </Text>
                {activeVrat.fastingRules.allowed.map((item, idx) => (
                  <Text key={idx} style={styles.ruleItem}>• {item}</Text>
                ))}
              </View>

              <View style={styles.rulesColumnProhibited}>
                <Text style={styles.rulesHeadingProhibited}>
                  {isHi ? '⛔ पूर्णतः वर्जित' : '⛔ Prohibited'}
                </Text>
                {activeVrat.fastingRules.prohibited.map((item, idx) => (
                  <Text key={idx} style={styles.ruleItem}>• {item}</Text>
                ))}
              </View>
            </View>

            {/* Parana Timing Guidance */}
            <View style={styles.paranaBox}>
              <Text style={styles.paranaHeading}>
                {isHi ? '⏳ पारण समय व शास्त्र सम्मत विधि' : '⏳ Auspicious Parana Timing & Guidance'}
              </Text>
              <Text style={styles.paranaText}>{activeVrat.paranaTimingGuidance}</Text>
            </View>

            {/* Sacred Story */}
            <Text style={styles.subHeading}>
              {isHi ? '📜 पावन व्रत कथा' : '📜 Sacred Katha'}
            </Text>
            <View style={styles.kathaBox}>
              <Text style={styles.kathaText}>{activeVrat.sacredKathaText}</Text>
            </View>

            {/* Aarti */}
            {activeVrat.sacredAartiText ? (
              <>
                <Text style={styles.subHeading}>
                  {isHi ? '🪔 पावन आरती' : '🪔 Sacred Aarti'}
                </Text>
                <View style={styles.aartiBox}>
                  <Text style={styles.aartiText}>{activeVrat.sacredAartiText}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      )}
        </>
      )}

      {/* About & Shastra Foundation */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>sanatan.cc</Text>
        <Text style={styles.aboutSubtitle}>
          {isHi
            ? '१००% निःशुल्क शास्त्रीय वैदिक खगोल विज्ञान'
            : '100% Free Vedic Ephemeris'}
        </Text>
        <Text style={styles.aboutDesc}>
          {isHi
            ? 'नासा JPL VSOP87 एवं Chapront ELP-2000 खगोलीय सिद्धांतों तथा मुहूर्तचिन्तामणि व निर्णयसिन्धु शास्त्रीय ग्रन्थों पर आधारित पूर्णतः ऑफलाइन गणना।'
            : 'Powered by NASA JPL VSOP87, Chapront ELP-2000 theories, and classical Muhurta Chintamani scriptures. Operates 100% offline with zero tabular approximations.'}
        </Text>

        <View style={styles.aboutActionRow}>
          <TouchableOpacity
            style={styles.modalBtn}
            onPress={() => router.push('/modal')}
          >
            <Ionicons name="information-circle" size={16} color="#ffffff" />
            <Text style={styles.modalBtnText}>
              {isHi ? 'विस्तृत परिचय' : 'About'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.githubBtn}
            onPress={() => Linking.openURL('https://github.com/dhirajnavghare/sanatan.cc')}
          >
            <Ionicons name="logo-github" size={16} color="#ffffff" />
            <Text style={styles.githubBtnText}>GitHub</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Deity Details Modal */}
      <Modal visible={!!selectedDeityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedDeityModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                    <Text style={styles.modalDeityName}>
                      {isHi ? selectedDeityModal.nameDevanagari : selectedDeityModal.name}
                    </Text>
                    <Text style={styles.modalDeitySubtitle}>
                      {isHi ? selectedDeityModal.subtitleDevanagari : selectedDeityModal.subtitle}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID="deity-modal-close-btn"
                    onPress={() => setSelectedDeityModal(null)}
                  >
                    <Ionicons name="close-circle" size={26} color="#71717a" />
                  </TouchableOpacity>
                </View>

                {/* Attributes */}
                <View style={styles.deityAttrGrid}>
                  {selectedDeityModal.consort && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'शक्ति:' : 'Consort:'} </Text>
                      {selectedDeityModal.consort}
                    </Text>
                  )}
                  {selectedDeityModal.vahana && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'वाहन:' : 'Vahana:'} </Text>
                      {selectedDeityModal.vahana}
                    </Text>
                  )}
                  {selectedDeityModal.abode && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'धाम:' : 'Abode:'} </Text>
                      {selectedDeityModal.abode}
                    </Text>
                  )}
                  {selectedDeityModal.sacredDay && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'प्रिय वार:' : 'Sacred Day:'} </Text>
                      {selectedDeityModal.sacredDay}
                    </Text>
                  )}
                  {selectedDeityModal.ayudhas && (
                    <Text style={styles.attrRow}>
                      <Text style={styles.attrLabel}>{isHi ? 'आयुध:' : 'Weapons:'} </Text>
                      {selectedDeityModal.ayudhas.join(', ')}
                    </Text>
                  )}
                </View>

                {/* Tatva */}
                <Text style={styles.subHeading}>{isHi ? 'दार्शनिक स्वरूप (Tatva)' : 'Spiritual Tatva'}</Text>
                <Text style={styles.tatvaText}>{selectedDeityModal.tatva}</Text>

                {/* Key Mantras */}
                <Text style={styles.subHeading}>{isHi ? 'महामन्त्र' : 'Sacred Mantras'}</Text>
                {selectedDeityModal.keyMantras.map((m, idx) => (
                  <View key={idx} style={styles.mantraCardFull}>
                    <Text style={styles.mantraTitle}>{m.title}</Text>
                    <Text style={styles.mantraDevanagariLarge}>{m.devanagari}</Text>
                    <Text style={styles.mantraTranslit}>{m.transliteration}</Text>
                    <Text style={styles.mantraMeaning}>
                      <Text style={{ fontWeight: 'bold' }}>{isHi ? 'अर्थ:' : 'Meaning:'} </Text>
                      {m.meaning}
                    </Text>
                  </View>
                ))}

                {/* Major Temples */}
                {selectedDeityModal.majorTemples.length > 0 && (
                  <>
                    <Text style={styles.subHeading}>{isHi ? 'प्रमुख तीर्थ व मन्दिर' : 'Major Temples'}</Text>
                    {selectedDeityModal.majorTemples.map((temple, idx) => (
                      <View key={idx} style={styles.templeItemMini}>
                        <Text style={styles.templeMiniName}>{temple.name}</Text>
                        <Text style={styles.templeMiniLoc}>📍 {temple.location}</Text>
                        <Text style={styles.templeMiniSig}>{temple.significance}</Text>
                      </View>
                    ))}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <SacredProfileEditorModal
        visible={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSave={handleSaveProfile}
        isHi={isHi}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8fa',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.dockClearance,
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffdf5',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    marginBottom: Spacing.md,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  profileAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  profileAvatarEmoji: {
    fontSize: 22,
  },
  profileGreeting: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
  },
  profileGotraText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
    marginTop: 2,
  },
  profileKuldeviText: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 1,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  editProfilePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  settingsNavPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  settingsNavPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    backgroundColor: 'transparent',
  },
  settingsNavIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsNavTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18181b',
  },
  settingsNavSubtitle: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  featureSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  featureTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radius.md,
  },
  featureTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  featureTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  featureTabTextActive: {
    color: '#18181b',
    fontWeight: '800',
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: Spacing.md,
  },
  circuitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
    backgroundColor: 'transparent',
  },
  horizontalScroll: {
    marginBottom: Spacing.md,
  },
  circuitPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.xl,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginRight: 8,
  },
  circuitPillActive: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
  },
  circuitText: {
    fontSize: 12,
    color: '#71717a',
    fontWeight: '600',
  },
  circuitTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181b',
    flexShrink: 1,
    marginRight: 8,
  },
  templeHeader: {
    marginBottom: 8,
  },
  templeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181b',
    lineHeight: 22,
    marginBottom: 4,
  },
  templeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 16,
    flexShrink: 1,
  },
  cardSubText: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#52525b',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 10,
  },
  deitySubtitle: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
    marginBottom: 8,
  },
  badgeTradition: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeTraditionText: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: 'bold',
  },
  darshanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  darshanText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '500',
  },
  mantraBox: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
  },
  mantraTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b45309',
    marginBottom: 4,
  },
  mantraDevanagari: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181b',
    lineHeight: 20,
  },
  mantraDevanagariLarge: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#18181b',
    lineHeight: 24,
    marginVertical: 6,
  },
  mantraTranslit: {
    fontSize: 12,
    color: '#71717a',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  mantraMeaning: {
    fontSize: 12,
    color: '#27272a',
    lineHeight: 18,
  },
  mantraCardFull: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  cardFooterAction: {
    marginTop: 6,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  cardFooterActionText: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: 'bold',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#18181b',
    marginTop: 14,
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 6,
    backgroundColor: 'transparent',
    gap: 6,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
  },
  stepText: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 18,
    flex: 1,
  },
  rulesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
    backgroundColor: 'transparent',
  },
  rulesColumnAllowed: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    padding: 10,
  },
  rulesColumnProhibited: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
  },
  rulesHeadingAllowed: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 6,
  },
  rulesHeadingProhibited: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 6,
  },
  ruleItem: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 16,
    marginBottom: 2,
  },
  paranaBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  paranaHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  paranaText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 18,
  },
  kathaBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f4f4f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  kathaText: {
    fontSize: 12,
    color: '#27272a',
    lineHeight: 20,
  },
  aartiBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  aartiText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  aboutCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d97706',
  },
  aboutSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18181b',
    marginTop: 4,
    textAlign: 'center',
  },
  aboutDesc: {
    fontSize: 11,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  aboutActionRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  modalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modalBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  githubBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  modalDeityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18181b',
  },
  modalDeitySubtitle: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '500',
    marginTop: 2,
  },
  deityAttrGrid: {
    backgroundColor: '#f4f4f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  attrRow: {
    fontSize: 12,
    color: '#27272a',
  },
  attrLabel: {
    fontWeight: 'bold',
    color: '#71717a',
  },
  tatvaText: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 18,
    marginBottom: 12,
  },
  templeItemMini: {
    backgroundColor: '#f4f4f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  templeMiniName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18181b',
  },
  templeMiniLoc: {
    fontSize: 11,
    color: '#71717a',
    marginVertical: 2,
  },
  templeMiniSig: {
    fontSize: 11,
    color: '#52525b',
  },
});
