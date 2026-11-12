import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  UserSacredProfile,
  POPULAR_GOTRAS,
  POPULAR_ISHTA_DEVATAS,
} from '@/src/services/userProfile';
import { triggerHaptic, playTempleBell } from '@/src/services/sacredAudio';

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
  const [name, setName] = useState(profile.name);
  const [gotra, setGotra] = useState(profile.gotra);
  const [ishtaDevata, setIshtaDevata] = useState(profile.ishtaDevata);
  const [kuldevi, setKuldevi] = useState(profile.kuldeviOrDevata || '');
  const [audioEnabled, setAudioEnabled] = useState(profile.audioEnabled);
  const [hapticsEnabled, setHapticsEnabled] = useState(profile.hapticsEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled);
  const [notifs, setNotifs] = useState(profile.notifications);

  useEffect(() => {
    setName(profile.name);
    setGotra(profile.gotra);
    setIshtaDevata(profile.ishtaDevata);
    setKuldevi(profile.kuldeviOrDevata || '');
    setAudioEnabled(profile.audioEnabled);
    setHapticsEnabled(profile.hapticsEnabled);
    setNotificationsEnabled(profile.notificationsEnabled);
    setNotifs(profile.notifications);
  }, [profile, visible]);

  const handleSave = async () => {
    await triggerHaptic('tap', hapticsEnabled);
    if (audioEnabled) playTempleBell(0.6);
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
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isHi ? 'मेरी धार्मिक प्रोफाइल एवं सङ्कल्प' : 'Sacred Profile & Personalization'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {isHi ? 'दैनिक सङ्कल्प व पूजा हेतु आपकी जानकारी' : 'Used for personalized Sankalpa & alerts'}
              </Text>
            </View>
            <TouchableOpacity
              testID="profile-close-btn"
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* 1. Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {isHi ? 'आपका शुभ नाम (सङ्कल्प हेतु):' : 'Your Sacred Name (for Sankalpa):'}
              </Text>
              <TextInput
                testID="profile-name-input"
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder={isHi ? 'उदा. धीरज' : 'e.g. Dhiraj'}
                placeholderTextColor="#a1a1aa"
              />
            </View>

            {/* 2. Gotra Input with Quick Pills */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {isHi ? 'आपका गोत्र (ऋषि परम्परा):' : 'Your Gotra (Ancestral Lineage):'}
              </Text>
              <TextInput
                testID="profile-gotra-input"
                style={styles.textInput}
                value={gotra}
                onChangeText={setGotra}
                placeholder={isHi ? 'उदा. कश्यप / भारद्वाज' : 'e.g. Kashyapa / Bharadvaja'}
                placeholderTextColor="#a1a1aa"
              />
              <Text style={styles.pillsHelperText}>
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
                        style={[styles.quickPill, isSelected && styles.quickPillActive]}
                        onPress={() => setGotra(cleanG)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.quickPillText, isSelected && styles.quickPillTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* 3. Ishta Devata Selection */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {isHi ? 'आपके इष्ट देवता (उपासना):' : 'Your Ishta Devata (Primary Worship):'}
              </Text>
              <View style={styles.ishtaGrid}>
                {POPULAR_ISHTA_DEVATAS.map((dev) => {
                  const isSelected = ishtaDevata === dev.name || ishtaDevata === dev.nameHi;
                  return (
                    <TouchableOpacity
                      key={dev.id}
                      style={[styles.ishtaCard, isSelected && styles.ishtaCardActive]}
                      onPress={() => setIshtaDevata(isHi ? dev.nameHi : dev.name)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.ishtaIcon}>{dev.icon}</Text>
                      <Text style={[styles.ishtaName, isSelected && styles.ishtaNameActive]} numberOfLines={1}>
                        {isHi ? dev.nameHi : dev.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Kuldevi / Kuldevata */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>
                {isHi ? 'कुलदेवी / कुलदेवता (ऐच्छिक):' : 'Kuldevi / Family Deity (Optional):'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={kuldevi}
                onChangeText={setKuldevi}
                placeholder={isHi ? 'उदा. माँ विन्ध्यवासिनी / कुलदेव' : 'e.g. Vindhyavasini'}
                placeholderTextColor="#a1a1aa"
              />
            </View>

            {/* 5. Sound & Haptics Preferences */}
            <View style={styles.preferenceSection}>
              <Text style={styles.preferenceSectionTitle}>
                {isHi ? '🔔 ध्वनि एवं अनुभव प्राथमिकताएं' : '🔔 Audio & Sensory Preferences'}
              </Text>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>{isHi ? 'मन्दिर घंटी नाद (Bell Audio)' : 'Temple Bell Sound'}</Text>
                  <Text style={styles.toggleDesc}>
                    {isHi ? 'जप पूर्ण होने व पूजा पर पावन घंटी ध्वनि' : 'Resonant bell chime on mala completion'}
                  </Text>
                </View>
                <Switch
                  value={audioEnabled}
                  onValueChange={setAudioEnabled}
                  trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                  thumbColor={audioEnabled ? '#d97706' : '#f4f4f5'}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>{isHi ? 'स्पर्श कम्पन (Haptic Feedback)' : 'Tactile Haptics'}</Text>
                  <Text style={styles.toggleDesc}>
                    {isHi ? 'माला के प्रत्येक मनके पर वास्तविक माला जैसा कम्पन' : 'Gentle tactile pulse on every bead'}
                  </Text>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={setHapticsEnabled}
                  trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                  thumbColor={hapticsEnabled ? '#d97706' : '#f4f4f5'}
                />
              </View>
            </View>

            {/* 6. Sacred Reminders & Notifications */}
            <View style={styles.preferenceSection}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.preferenceSectionTitle}>
                  {isHi ? '⏰ दैनिक पावन स्मरण (Alerts)' : '⏰ Sacred Reminders'}
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                  thumbColor={notificationsEnabled ? '#d97706' : '#f4f4f5'}
                />
              </View>

              {notificationsEnabled && (
                <>
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>{isHi ? '🌟 अभिजित मुहूर्त (विजय काल)' : '🌟 Abhijit Muhurta Alert'}</Text>
                      <Text style={styles.toggleDesc}>{isHi ? 'भगवान विष्णु के विजय काल (11:48 AM - 12:32 PM) का अलर्ट' : 'Midday supreme victory hour notification'}</Text>
                    </View>
                    <Switch
                      value={notifs.abhijitAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, abhijitAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.abhijitAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>{isHi ? '🕊️ ब्रह्म मुहूर्त जागरण (Brahma Muhurta)' : '🕊️ Brahma Muhurta Wakeup'}</Text>
                      <Text style={styles.toggleDesc}>{isHi ? 'सूर्योदय से 96 मिनट पूर्व अमृत वेला सूचना' : '96 mins before sunrise'}</Text>
                    </View>
                    <Switch
                      value={notifs.brahmaMuhurtaAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, brahmaMuhurtaAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.brahmaMuhurtaAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>{isHi ? '⚠️ राहु काल पूर्व चेतावनी' : '⚠️ Rahu Kaal Pre-Warning'}</Text>
                      <Text style={styles.toggleDesc}>{isHi ? 'राहु काल शुरू होने से 10 मिनट पहले सतर्कता' : '10 mins before Rahu Kaal'}</Text>
                    </View>
                    <Switch
                      value={notifs.rahuKaalAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, rahuKaalAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.rahuKaalAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>{isHi ? '🪔 सायं दीप प्रज्वलन (Evening Deepam)' : '🪔 Evening Lamp Lighting'}</Text>
                      <Text style={styles.toggleDesc}>{isHi ? 'सूर्यास्त गोधूलि वेला में दीप जलाने की सूचना' : 'At sunset / Godhuli vela'}</Text>
                    </View>
                    <Switch
                      value={notifs.sandhyaDeepamAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, sandhyaDeepamAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.sandhyaDeepamAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>{isHi ? '✨ अमृत व शुभ चौघड़िया' : '✨ Auspicious Choghadiyas'}</Text>
                      <Text style={styles.toggleDesc}>{isHi ? 'दिन में अमृत व शुभ चौघड़िया आरम्भ होने पर अलर्ट' : 'Alert when Amrit/Shubh hours begin'}</Text>
                    </View>
                    <Switch
                      value={notifs.choghadiyaAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, choghadiyaAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.choghadiyaAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>{isHi ? '📝 नियोजित To-Do कार्य स्मरण' : '📝 Planned To-Do Reminders'}</Text>
                      <Text style={styles.toggleDesc}>{isHi ? 'मुहूर्त आरम्भ पर आपके द्वारा जोड़े गए कार्यों का अलर्ट' : 'Alert with tasks scheduled in that slot'}</Text>
                    </View>
                    <Switch
                      value={notifs.todoTasksAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, todoTasksAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.todoTasksAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>

                  <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>{isHi ? '🌸 एकादशी एवं व्रत पूर्व सूचना' : '🌸 Ekadashi & Vrat Reminder'}</Text>
                      <Text style={styles.toggleDesc}>{isHi ? 'दशमी की शाम को एकादशी व्रत स्मरण' : 'Evening before Ekadashi'}</Text>
                    </View>
                    <Switch
                      value={notifs.ekadashiAlert}
                      onValueChange={(v) => setNotifs({ ...notifs, ekadashiAlert: v })}
                      trackColor={{ false: '#e4e4e7', true: '#fcd34d' }}
                      thumbColor={notifs.ekadashiAlert ? '#d97706' : '#f4f4f5'}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              testID="profile-save-btn"
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.saveBtnText}>
                {isHi ? 'धार्मिक प्रोफाइल सहेजें' : 'Save Sacred Profile'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3f3f46',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  pillsHelperText: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 6,
    fontWeight: '500',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  quickPillActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  quickPillText: {
    fontSize: 11,
    color: '#52525b',
    fontWeight: '600',
  },
  quickPillTextActive: {
    color: '#b45309',
    fontWeight: '700',
  },
  ishtaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ishtaCard: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ishtaCardActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  ishtaIcon: {
    fontSize: 18,
  },
  ishtaName: {
    fontSize: 12,
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
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#f4f4f5',
  },
  preferenceSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18181b',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    gap: 8,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#27272a',
  },
  toggleDesc: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 2,
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
