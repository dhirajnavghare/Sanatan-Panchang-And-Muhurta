import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTour } from '../services/appTourContext';
import { useLanguage } from '../core/i18n/LanguageContext';
import { CONTEXTUAL_HELP_TOPICS } from '../constants/tourSteps';
import { Radius, Spacing } from '@/constants/Colors';
import { COMFORT_TOUCH_TARGET, getAppTheme, MIN_TOUCH_TARGET } from '../utils/theme';

export const ContextualHelpModal: React.FC = () => {
  const {
    isHelpModalVisible,
    activeHelpTopicId,
    closeHelp,
    startTour,
    startSectionTour,
  } = useTour();
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = getAppTheme(isDark);
  const { height: screenHeight } = useWindowDimensions();

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

  const handleLaunchSectionTour = () => {
    startSectionTour(activeHelpTopicId);
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
          <View style={[styles.sheetHeader, isDark && { borderBottomColor: theme.border }]}>
            <View style={styles.sheetHeaderTitleGroup}>
              <View style={styles.helpIconBox}>
                <Ionicons name="help-buoy" size={20} color="#d97706" />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.sheetTitle, isDark && styles.textDark]}>
                  {isHi ? topic.titleHi : topic.titleEn}
                </Text>
                <Text style={[styles.sheetSubtitle, isDark && styles.subTextDark]}>
                  {isHi ? topic.subtitleHi : topic.subtitleEn}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              testID="contextual-help-close-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'मदद विंडो बंद करें' : 'Close help modal'}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={[styles.closeBtn, isDark && { backgroundColor: theme.cardMuted }]}
              onPress={closeHelp}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={isDark ? '#e4e4e7' : '#52525b'} />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <ScrollView
            style={[styles.sheetScrollView, { maxHeight: Math.max(200, screenHeight * 0.52) }]}
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

            {/* Focused Walkthrough of THIS Screen */}
            <TouchableOpacity
              testID="contextual-help-section-tour-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'इस स्क्रीन का लाइव टूर देखें' : 'Walkthrough this screen'}
              style={[styles.fullTourPromptBtn, { marginBottom: 4 }, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}
              onPress={handleLaunchSectionTour}
              activeOpacity={0.8}
            >
              <Ionicons name="locate-outline" size={20} color={isDark ? theme.primary : '#b45309'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fullTourPromptTitle, isDark && { color: theme.primary }]}>
                  {isHi ? 'इस स्क्रीन का चरणबद्ध टूर देखें' : 'Walkthrough This Screen'}
                </Text>
                <Text style={[styles.fullTourPromptDesc, isDark && styles.subTextDark]}>
                  {isHi
                    ? 'केवल इसी टैब के मुख्य बटनों व सुविधाओं को लाइव समझें'
                    : 'Spotlights only the interactive elements on this screen'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? theme.primary : '#b45309'} />
            </TouchableOpacity>

            {/* Link to Full Guided App Tour */}
            <TouchableOpacity
              testID="contextual-help-full-tour-btn"
              accessibilityRole="button"
              accessibilityLabel={isHi ? 'संपूर्ण लाइव ऐप टूर देखें' : 'Take Complete Live Tour'}
              style={[styles.fullTourPromptBtn, isDark && { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}
              onPress={handleLaunchFullTour}
              activeOpacity={0.8}
            >
              <Ionicons name="compass-outline" size={20} color={isDark ? theme.primary : '#d97706'} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fullTourPromptTitle, isDark && { color: theme.primary }]}>
                  {isHi ? 'संपूर्ण लाइव ऐप टूर देखें' : 'Take Complete Live Tour'}
                </Text>
                <Text style={[styles.fullTourPromptDesc, isDark && styles.subTextDark]}>
                  {isHi
                    ? 'सभी ७ टैब्स, मुहूर्त प्लानर व बटन विस्तार से समझें'
                    : 'Walk through all 7 tabs, Day Planner & features step-by-step'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={isDark ? theme.primary : '#d97706'} />
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
    maxHeight: '80%',
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
    fontSize: 17,
    fontWeight: '800',
    color: '#18181b',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#52525b',
    marginTop: 2,
  },
  closeBtn: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: 22,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sheetScrollView: {
    maxHeight: '55%',
  },
  sheetScrollContent: {
    paddingVertical: 8,
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fbfbfb',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f4f4f5',
    gap: 12,
  },
  itemCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  itemEmojiBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  itemEmoji: {
    fontSize: 17,
  },
  itemTextCol: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18181b',
    marginBottom: 3,
  },
  itemDesc: {
    fontSize: 14,
    color: '#52525b',
    lineHeight: 20,
  },
  fullTourPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: COMFORT_TOUCH_TARGET,
    gap: 10,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    marginTop: 6,
  },
  fullTourPromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
  },
  fullTourPromptDesc: {
    fontSize: 13,
    color: '#52525b',
    marginTop: 2,
    lineHeight: 18,
  },
  footerRow: {
    marginTop: 10,
    paddingTop: 8,
  },
  footerCloseBtn: {
    minHeight: COMFORT_TOUCH_TARGET,
    backgroundColor: '#d97706',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCloseBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  textDark: {
    color: '#f4f4f5',
  },
  subTextDark: {
    color: '#a1a1aa',
  },
});
