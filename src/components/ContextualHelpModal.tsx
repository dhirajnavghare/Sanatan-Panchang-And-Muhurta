import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTour } from '../services/appTourContext';
import { useLanguage } from '../core/i18n/LanguageContext';
import { CONTEXTUAL_HELP_TOPICS } from '../constants/tourSteps';
import { Radius, Spacing } from '@/constants/Colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ContextualHelpModal: React.FC = () => {
  const { isHelpModalVisible, activeHelpTopicId, closeHelp, startTour } = useTour();
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!isHelpModalVisible || !activeHelpTopicId) {
    return null;
  }

  const topic = CONTEXTUAL_HELP_TOPICS[activeHelpTopicId];
  if (!topic) return null;

  const handleLaunchFullTour = () => {
    closeHelp();
    // Launch interactive tour
    startTour(0);
  };

  return (
    <Modal
      visible={isHelpModalVisible}
      transparent
      animationType="slide"
      onRequestClose={closeHelp}
      testID="contextual-help-modal"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, isDark && styles.sheetContainerDark]}>
          {/* Header Row */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderTitleGroup}>
              <View style={styles.helpIconBox}>
                <Ionicons name="help-buoy" size={18} color="#d97706" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.sheetTitle, isDark && styles.textDark]}>
                  {isHi ? topic.titleHi : topic.titleEn}
                </Text>
                <Text style={styles.sheetSubtitle}>
                  {isHi ? topic.subtitleHi : topic.subtitleEn}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              testID="contextual-help-close-btn"
              style={styles.closeBtn}
              onPress={closeHelp}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={isDark ? '#e4e4e7' : '#52525b'} />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <ScrollView
            style={styles.sheetScrollView}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {topic.items.map((item, idx) => (
              <View key={idx} style={[styles.itemCard, isDark && styles.itemCardDark]}>
                <View style={styles.itemEmojiBox}>
                  <Text style={styles.itemEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.itemTextCol}>
                  <Text style={[styles.itemLabel, isDark && styles.textDark]}>
                    {isHi ? item.labelHi : item.labelEn}
                  </Text>
                  <Text style={[styles.itemDesc, isDark && styles.subTextDark]}>
                    {isHi ? item.descriptionHi : item.descriptionEn}
                  </Text>
                </View>
              </View>
            ))}

            {/* Link to Full Guided App Tour */}
            <TouchableOpacity
              testID="contextual-help-full-tour-btn"
              style={styles.fullTourPromptBtn}
              onPress={handleLaunchFullTour}
              activeOpacity={0.8}
            >
              <Ionicons name="compass-outline" size={18} color="#d97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.fullTourPromptTitle}>
                  {isHi ? 'संपूर्ण लाइव ऐप टूर देखें' : 'Take Complete Live Tour'}
                </Text>
                <Text style={styles.fullTourPromptDesc}>
                  {isHi
                    ? 'सभी ६ टैब्स, मुहूर्त प्लानर व बटन विस्तार से समझें'
                    : 'Walk through all 6 tabs, Day Planner & features step-by-step'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#d97706" />
            </TouchableOpacity>
          </ScrollView>

          {/* Bottom Close Button */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.footerCloseBtn}
              onPress={closeHelp}
              activeOpacity={0.8}
            >
              <Text style={styles.footerCloseBtnText}>
                {isHi ? 'समझ गया (Got it)' : 'Understood'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: SCREEN_HEIGHT * 0.75,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetContainerDark: {
    backgroundColor: '#18181b',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    marginBottom: 8,
  },
  sheetHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  helpIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18181b',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sheetScrollView: {
    maxHeight: SCREEN_HEIGHT * 0.52,
  },
  sheetScrollContent: {
    paddingVertical: 6,
    gap: 8,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fbfbfb',
    borderRadius: Radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f4f4f5',
    gap: 10,
  },
  itemCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  itemEmojiBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  itemEmoji: {
    fontSize: 16,
  },
  itemTextCol: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: '#52525b',
    lineHeight: 17,
  },
  fullTourPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    marginTop: 6,
  },
  fullTourPromptTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#b45309',
  },
  fullTourPromptDesc: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 1,
  },
  footerRow: {
    marginTop: 10,
    paddingTop: 8,
  },
  footerCloseBtn: {
    backgroundColor: '#d97706',
    borderRadius: Radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  textDark: {
    color: '#f4f4f5',
  },
  subTextDark: {
    color: '#a1a1aa',
  },
});
