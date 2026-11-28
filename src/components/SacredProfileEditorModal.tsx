import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  UserSacredProfile,
  POPULAR_GOTRAS,
  POPULAR_ISHTA_DEVATAS,
} from '@/src/services/userProfile';
import { triggerHaptic, playTempleBell } from '@/src/services/sacredAudio';
import { COMFORT_TOUCH_TARGET, getAppTheme, MIN_TOUCH_TARGET } from '@/src/utils/theme';
import { AppButton } from './ui/AppButton';

interface SacredProfileEditorModalProps {
  visible: boolean;
  onClose: () => void;
  profile: UserSacredProfile;
  onSave: (updated: UserSacredProfile) => Promise<void>;
  isHi: boolean;
}

export function SacredProfileEditorModal({
  visible,
  onClose,
  profile,
  onSave,
  isHi,
}: SacredProfileEditorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {visible ? (
        <SacredProfileEditorContent
          profile={profile}
          onSave={onSave}
          onClose={onClose}
          isHi={isHi}
        />
      ) : null}
    </Modal>
  );
}

interface ContentProps {
  profile: UserSacredProfile;
  onSave: (updated: UserSacredProfile) => Promise<void>;
  onClose: () => void;
  isHi: boolean;
}

function SacredProfileEditorContent({
  profile,
  onSave,
  onClose,
  isHi,
}: ContentProps) {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const insets = useSafeAreaInsets();
  const gotraRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const kuldeviRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [name, setName] = useState(profile.name);
  const [gotra, setGotra] = useState(profile.gotra);
  const [ishtaDevata, setIshtaDevata] = useState(profile.ishtaDevata);
  const [kuldevi, setKuldevi] = useState(profile.kuldeviOrDevata || '');
  const [audioEnabled, setAudioEnabled] = useState(profile.audioEnabled);
  const [hapticsEnabled, setHapticsEnabled] = useState(profile.hapticsEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled);
  const [notifs, setNotifs] = useState(profile.notifications);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      triggerHaptic('tap', hapticsEnabled).catch(() => {});
      if (audioEnabled) playTempleBell(1.0);
      const updated: UserSacredProfile = {
        ...profile,
        name: name.trim() || (isHi ? 'साधक' : 'Sadhak'),
        gotra: gotra.trim() || 'कश्यप',
        ishtaDevata: ishtaDevata || 'Lord Shiva / Mahadeva',
        kuldeviOrDevata: kuldevi.trim(),
        audioEnabled,
        hapticsEnabled,
        notificationsEnabled,
        notifications: notifs,
      };
      await onSave(updated);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={[
          styles.sheetContainer,
          isDark && { backgroundColor: theme.surface, borderColor: theme.border, borderTopWidth: 1 },
          { paddingBottom: Math.max(20, insets.bottom + 12) },
        ]}
      >
        {/* Header */}
        <View style={[styles.modalHeader, isDark && { borderBottomColor: theme.border }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.modalTitle, isDark && { color: theme.text }]}>
              {isHi ? 'मेरी धार्मिक प्रोफाइल एवं सङ्कल्प' : 'Sacred Profile & Personalization'}
            </Text>
            <Text style={[styles.modalSubtitle, isDark && { color: theme.textMuted }]}>
              {isHi ? 'दैनिक सङ्कल्प व पूजा हेतु आपकी जानकारी' : 'Used for personalized Sankalpa & alerts'}
            </Text>
          </View>
          <TouchableOpacity
            testID="profile-close-btn"
            accessibilityRole="button"
            accessibilityLabel={isHi ? 'प्रोफाइल बंद करें' : 'Close profile editor'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onClose}
            style={[styles.closeBtn, isDark && { backgroundColor: theme.cardMuted }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={isDark ? theme.textSecondary : '#52525b'} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
            {/* Section 1: Identity & Lineage */}
            <View style={[styles.preferenceSection, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.preferenceSectionTitle, isDark && { color: theme.primary }]}>
                {isHi ? '🙏 १. व्यक्तिगत पहचान एवं परम्परा' : '🙏 1. Identity & Lineage'}
              </Text>

              {/* 1. Name Input */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, isDark && { color: theme.text }]}>
                  {isHi ? 'आपका शुभ नाम (सङ्कल्प हेतु)' : 'Your Sacred Name (for Sankalpa)'}
                </Text>
                <Text style={[styles.pillsHelperText, { marginTop: 0, marginBottom: 6 }, isDark && { color: theme.textSecondary }]}>
                  {isHi
                    ? 'खाली छोड़ने पर "साधक" नाम स्वतः प्रयुक्त होगा।'
                    : 'Optional. If left blank, "Sadhak" is used by default.'}
                </Text>
                <TextInput
                  testID="profile-name-input"
                  accessibilityLabel={isHi ? 'आपका शुभ नाम' : 'Your Sacred Name'}
                  style={[
                    styles.textInput,
                    isDark && { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  value={name}
                  onChangeText={setName}
                  maxLength={50}
                  returnKeyType="next"
                  onSubmitEditing={() => gotraRef.current?.focus()}
                  placeholder={isHi ? 'उदा. धीरज' : 'e.g. Dhiraj'}
                  placeholderTextColor={theme.textSubtle}
                />
              </View>

              {/* 2. Gotra Input with Quick Pills */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, isDark && { color: theme.text }]}>
                  {isHi ? 'आपका गोत्र (ऋषि परम्परा)' : 'Your Gotra (Ancestral Lineage)'}
                </Text>
                <TextInput
                  ref={gotraRef}
                  testID="profile-gotra-input"
                  accessibilityLabel={isHi ? 'आपका गोत्र' : 'Your Gotra'}
                  style={[
                    styles.textInput,
                    isDark && { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  value={gotra}
                  onChangeText={setGotra}
                  maxLength={40}
                  returnKeyType="next"
                  onSubmitEditing={() => kuldeviRef.current?.focus()}
                  placeholder={isHi ? 'उदा. कश्यप / भारद्वाज' : 'e.g. Kashyapa / Bharadvaja'}
                  placeholderTextColor={theme.textSubtle}
                />
                <Text style={[styles.pillsHelperText, isDark && { color: theme.textSecondary }]}>
                  {isHi ? 'प्रमुख वैदिक गोत्र में से चुनें:' : 'Or tap a Vedic Gotra:'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  <View style={styles.pillRow}>
                    {POPULAR_GOTRAS.map((g) => {
                      const cleanG = g.split(' ')[0];
                      const isSelected = gotra.includes(cleanG);
                      return (
                        <TouchableOpacity
                          key={g}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                          style={[
                            styles.quickPill,
                            isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
                            isSelected && [styles.quickPillActive, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primary }],
                          ]}
                          onPress={() => setGotra(cleanG)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.quickPillText,
                              isDark && { color: theme.textSecondary },
                              isSelected && [styles.quickPillTextActive, isDark && { color: theme.primary }],
                            ]}
                          >
                            {g}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* 4. Kuldevi / Kuldevata */}
              <View style={[styles.inputSection, { marginBottom: 0 }]}>
                <Text style={[styles.inputLabel, isDark && { color: theme.text }]}>
                  {isHi ? 'कुलदेवी / कुलदेवता (वैकल्पिक)' : 'Kuldevi / Family Deity (Optional)'}
                </Text>
                <TextInput
                  ref={kuldeviRef}
                  accessibilityLabel={isHi ? 'कुलदेवी अथवा कुलदेवता' : 'Family Deity Optional'}
                  style={[
                    styles.textInput,
                    isDark && { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text },
                  ]}
                  value={kuldevi}
                  onChangeText={setKuldevi}
                  maxLength={60}
                  returnKeyType="done"
                  placeholder={isHi ? 'उदा. माँ विन्ध्यवासिनी / कुलदेव' : 'e.g. Vindhyavasini'}
                  placeholderTextColor={theme.textSubtle}
                />
              </View>
            </View>

            {/* Section 2: Ishta Devata Selection */}
            <View style={[styles.preferenceSection, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.preferenceSectionTitle, isDark && { color: theme.primary }]}>
                {isHi ? '🕉️ २. आपके इष्ट देवता (मुख्य उपासना)' : '🕉️ 2. Your Ishta Devata (Primary Worship)'}
              </Text>
              <View style={styles.ishtaGrid}>
                {POPULAR_ISHTA_DEVATAS.map((dev) => {
                  const isSelected = ishtaDevata === dev.name || ishtaDevata === dev.nameHi;
                  return (
                    <TouchableOpacity
                      key={dev.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.ishtaCard,
                        isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
                        isSelected && [styles.ishtaCardActive, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primary }],
                      ]}
                      onPress={() => setIshtaDevata(isHi ? dev.nameHi : dev.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.ishtaIcon}>{dev.icon}</Text>
                      <Text
                        style={[
                          styles.ishtaName,
                          isDark && { color: theme.textSecondary },
                          isSelected && [styles.ishtaNameActive, isDark && { color: theme.primary }],
                        ]}
                      >
                        {isHi ? dev.nameHi : dev.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Sound & Haptics Preferences */}
            <View style={[styles.preferenceSection, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.preferenceSectionTitle, isDark && { color: theme.primary }]}>
                {isHi ? '🔔 ३. ध्वनि एवं स्पर्श प्राथमिकताएं' : '🔔 3. Audio & Touch Preferences'}
              </Text>

              <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                    {isHi ? 'मन्दिर घंटी नाद (Bell Audio)' : 'Temple Bell Sound'}
                  </Text>
                  <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                    {isHi ? 'जप पूर्ण होने व पूजा पर पावन घंटी ध्वनि' : 'Resonant bell chime on mala completion'}
                  </Text>
                </View>
                <Switch
                  accessibilityLabel={isHi ? 'मन्दिर घंटी नाद स्विच' : 'Temple Bell Sound'}
                  value={audioEnabled}
                  onValueChange={setAudioEnabled}
                  trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                  thumbColor={audioEnabled ? '#d97706' : '#f4f4f5'}
                />
              </View>

              <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                    {isHi ? 'स्पर्श कम्पन (Haptic Feedback)' : 'Tactile Haptics'}
                  </Text>
                  <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                    {isHi ? 'माला के प्रत्येक मनके पर हल्का स्पर्श कम्पन' : 'Gentle pulse on each mala bead'}
                  </Text>
                </View>
                <Switch
                  accessibilityLabel={isHi ? 'स्पर्श कम्पन स्विच' : 'Tactile Haptics'}
                  value={hapticsEnabled}
                  onValueChange={setHapticsEnabled}
                  trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                  thumbColor={hapticsEnabled ? '#d97706' : '#f4f4f5'}
                />
              </View>
            </View>

            {/* Section 4: Sacred Reminders & Notifications */}
            <View style={[styles.preferenceSection, isDark && { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={[styles.preferenceSectionTitle, { marginBottom: 0, flex: 1 }, isDark && { color: theme.primary }]}>
                  {isHi ? '⏰ ४. दैनिक पावन स्मरण (अलर्ट)' : '⏰ 4. Sacred Reminders'}
                </Text>
                <Switch
                  accessibilityLabel={isHi ? 'दैनिक पावन स्मरण मुख्य स्विच' : 'Sacred Reminders master switch'}
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                  thumbColor={notificationsEnabled ? '#d97706' : '#f4f4f5'}
                />
              </View>

              {notificationsEnabled && (
                <>
                  <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '🌟 अभिजित मुहूर्त (विजय काल)' : '🌟 Abhijit Muhurta Alert'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'दोपहर के महाशुभ विजय काल की सूचना' : 'Midday supreme victory hour alert'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'अभिजित मुहूर्त अलर्ट' : 'Abhijit Muhurta Alert'}
                      value={notifs.abhijitAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, abhijitAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.abhijitAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '🕊️ ब्रह्म मुहूर्त जागरण' : '🕊️ Brahma Muhurta Wakeup'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'सूर्योदय से 96 मिनट पूर्व अमृत वेला सूचना' : 'Pre-dawn japa reminder (96 mins before sunrise)'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'ब्रह्म मुहूर्त अलर्ट' : 'Brahma Muhurta Wakeup'}
                      value={notifs.brahmaMuhurtaAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, brahmaMuhurtaAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.brahmaMuhurtaAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '⚠️ राहु काल पूर्व चेतावनी' : '⚠️ Rahu Kaal Pre-Warning'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'राहु काल शुरू होने से 10 मिनट पहले सतर्कता' : '10 mins before Rahu Kaal starts'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'राहु काल अलर्ट' : 'Rahu Kaal Pre-Warning'}
                      value={notifs.rahuKaalAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, rahuKaalAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.rahuKaalAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '🪔 सायं दीप प्रज्वलन' : '🪔 Evening Lamp Lighting'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'सूर्यास्त गोधूलि वेला में दीप जलाने की सूचना' : 'Reminder at sunset / Godhuli time'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'सायं दीप अलर्ट' : 'Evening Lamp Lighting'}
                      value={notifs.sandhyaDeepamAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, sandhyaDeepamAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.sandhyaDeepamAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '✨ अमृत व शुभ चौघड़िया' : '✨ Auspicious Choghadiyas'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'दिन में अमृत व शुभ चौघड़िया आरम्भ होने पर अलर्ट' : 'Alert when Amrit or Shubh hours begin'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'शुभ चौघड़िया अलर्ट' : 'Auspicious Choghadiyas'}
                      value={notifs.choghadiyaAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, choghadiyaAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.choghadiyaAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '📝 नियोजित कार्य (To-Do) स्मरण' : '📝 Planned To-Do Reminders'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'मुहूर्त आरम्भ पर आपके जोड़े गए कार्यों का अलर्ट' : 'Alert with tasks planned in that time window'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'कार्य स्मरण अलर्ट' : 'Planned To-Do Reminders'}
                      value={notifs.todoTasksAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, todoTasksAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.todoTasksAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '🌸 एकादशी एवं व्रत सूचना' : '🌸 Ekadashi & Vrat Reminder'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'दशमी की शाम को एकादशी व्रत स्मरण' : 'Evening reminder before Ekadashi'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'एकादशी व्रत अलर्ट' : 'Ekadashi & Vrat Reminder'}
                      value={notifs.ekadashiAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, ekadashiAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.ekadashiAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>
                  <View style={[styles.toggleRow, isDark && { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '🙏 प्रदोष व मासिक व्रत' : '🙏 Pradosh Vrat Alert'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'त्रयोदशी प्रदोष व्रत से पूर्व स्मरण' : 'Reminder before Pradosh evening'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'प्रदोष व्रत अलर्ट' : 'Pradosh Vrat Alert'}
                      value={notifs.pradoshAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, pradoshAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.pradoshAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, isDark && { color: theme.text }]}>
                        {isHi ? '🌕 चन्द्रोदय व पूर्णिमा स्मरण' : '🌕 Moonrise & Purnima Alert'}
                      </Text>
                      <Text style={[styles.toggleDesc, isDark && { color: theme.textSecondary }]}>
                        {isHi ? 'संकष्टी व पूर्णिमा पर चन्द्र अर्घ्य सूचना' : 'Moonrise timing alert for fasts'}
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel={isHi ? 'चन्द्रोदय अलर्ट' : 'Moonrise & Purnima Alert'}
                      value={notifs.chandrodayaAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, chandrodayaAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.chandrodayaAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <AppButton
                testID="profile-cancel-btn"
                accessibilityLabel={isHi ? 'रद्द करें' : 'Cancel'}
                label={isHi ? 'रद्द करें' : 'Cancel'}
                variant="outline"
                onPress={onClose}
                style={{ minWidth: 110, borderRadius: 16 }}
              />
              <AppButton
                testID="profile-save-btn"
                accessibilityLabel={isHi ? 'धार्मिक प्रोफाइल सहेजें' : 'Save Sacred Profile'}
                label={isHi ? 'धार्मिक प्रोफाइल सहेजें' : 'Save Sacred Profile'}
                iconName="checkmark-circle"
                loading={isSaving}
                disabled={isSaving}
                onPress={handleSave}
                style={{ flex: 1, minWidth: 180, borderRadius: 16 }}
              />
            </View>
          </ScrollView>
        </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#18181b',
  },
  modalSubtitle: {
    fontSize: 13.5,
    color: '#52525b',
    marginTop: 3,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 22,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#27272a',
    marginBottom: 6,
  },
  textInput: {
    minHeight: COMFORT_TOUCH_TARGET,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15.5,
    color: '#0f172a',
    fontWeight: '600',
  },
  pillsHelperText: {
    fontSize: 13,
    color: '#52525b',
    marginTop: 8,
    fontWeight: '500',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickPill: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  quickPillActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  quickPillText: {
    fontSize: 13,
    color: '#3f3f46',
    fontWeight: '700',
  },
  quickPillTextActive: {
    color: '#b45309',
    fontWeight: '800',
  },
  ishtaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ishtaCard: {
    flex: 1,
    minWidth: '46%',
    minHeight: COMFORT_TOUCH_TARGET,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  ishtaCardActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  ishtaIcon: {
    fontSize: 20,
  },
  ishtaName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  ishtaNameActive: {
    color: '#b45309',
  },
  preferenceSection: {
    backgroundColor: '#fafaf9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  preferenceSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    gap: 10,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
    lineHeight: 20,
  },
  toggleDesc: {
    fontSize: 13,
    color: '#52525b',
    marginTop: 3,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: '#d97706',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
