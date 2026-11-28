import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette, Radius, Spacing } from '@/constants/Colors';
import {
  fetchPublicChangelog,
  fetchPublicContributors,
  submitUserFeedback,
  submitReportedIssue,
  ChangelogItem,
  ContributorItem,
  FeedbackCategory,
  IssueSeverity,
  ProjectApiError,
} from '@/src/services/projectApi';
import { loadUserProfile } from '@/src/services/userProfile';
import { triggerHaptic } from '@/src/services/sacredAudio';
import { useTour } from '@/src/services/appTourContext';
import { TourTarget } from '@/src/components/TourTarget';
import { useTourScroll, useTourHorizontalScroll } from '@/src/hooks/useTourScroll';
import { COMFORT_TOUCH_TARGET, getAppTheme, MIN_TOUCH_TARGET } from '@/src/utils/theme';
import { AppButton } from '@/src/components/ui/AppButton';
import { FormField } from '@/src/components/ui/FormField';
import { InlineFeedbackBanner, ScreenStateView } from '@/src/components/ui/ScreenStateView';

const COMMUNITY_HORIZONTAL_TOUR_TARGETS = ['community-segment-feedback'] as const;

type TabSegment = 'changelog' | 'contributors' | 'feedback' | 'issues';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CommunityScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = getAppTheme(isDark);
  const { openHelp, isInteractiveTourActive, isTryModeActive, currentTourStep, updateTourRuntimeContext } = useTour();
  const scrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const segmentScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const feedbackEmailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const feedbackMessageRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const issueDescRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const issueStepsRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const issueNameRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const issueEmailRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const {
    onScroll: onTourScroll,
    onMomentumScrollEnd: onTourMomentumScrollEnd,
    onScrollEndDrag: onTourScrollEndDrag,
  } = useTourScroll('/(tabs)/community', scrollRef);
  const {
    onHorizontalScroll,
    onHorizontalMomentumScrollEnd,
    onHorizontalScrollEndDrag,
  } = useTourHorizontalScroll(
    '/(tabs)/community',
    segmentScrollRef,
    COMMUNITY_HORIZONTAL_TOUR_TARGETS
  );

  const [activeSegment, setActiveSegment] = useState<TabSegment>('changelog');
  const [manualSegmentStepId, setManualSegmentStepId] = useState<string | null>(null);
  const effectiveSegment: TabSegment =
    isInteractiveTourActive &&
    currentTourStep?.tab === '/(tabs)/community' &&
    currentTourStep.communitySegment &&
    manualSegmentStepId !== currentTourStep.id
      ? currentTourStep.communitySegment
      : activeSegment;
  const [refreshing, setRefreshing] = useState(false);

  // Changelog State
  const [changelog, setChangelog] = useState<ChangelogItem[]>([]);
  const [releaseCount, setReleaseCount] = useState<number>(0);
  const [isChangelogLoading, setIsChangelogLoading] = useState(true);
  const [changelogError, setChangelogError] = useState<string | null>(null);

  // Contributors State
  const [contributors, setContributors] = useState<ContributorItem[]>([]);
  const [totalContributors, setTotalContributors] = useState<number>(0);
  const [isContributorsLoading, setIsContributorsLoading] = useState(true);
  const [contributorsError, setContributorsError] = useState<string | null>(null);


  // 1. Feedback Form State
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('feature_request');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackValidationError, setFeedbackValidationError] = useState<string | null>(null);

  // 2. Issue / Bug Form State
  const [issueTitle, setIssueTitle] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<IssueSeverity>('medium');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSteps, setIssueSteps] = useState('');
  const [issueName, setIssueName] = useState('');
  const [issueEmail, setIssueEmail] = useState('');
  const [isIssueSubmitting, setIsIssueSubmitting] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);
  const [issueValidationError, setIssueValidationError] = useState<string | null>(null);

  const formatApiError = useCallback(
    (err: unknown, fallbackEn: string, fallbackHi: string) => {
      if (err instanceof ProjectApiError && err.code === 'OFFLINE_OR_TIMEOUT') {
        return isHi
          ? 'इंटरनेट से सम्पर्क नहीं हो पाया या अनुरोध समय समाप्त हुआ। कृपया नेटवर्क जाँचकर पुनः प्रयास करें।'
          : 'Unable to reach server or request timed out. Check your internet connection and tap Retry.';
      }
      if (err instanceof Error && err.message) {
        return err.message;
      }
      return isHi ? fallbackHi : fallbackEn;
    },
    [isHi]
  );

  // Load User Profile for auto-filling name
  useEffect(() => {
    let mounted = true;
    loadUserProfile()
      .then((prof) => {
        if (!mounted) return;
        if (prof?.name && prof.name !== 'साधक' && prof.name !== 'Sadhak' && prof.name !== 'Sadhaka') {
          setFeedbackName(prof.name);
          setIssueName(prof.name);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Changelog (user-triggered refresh)
  const loadChangelog = useCallback(async () => {
    try {
      setIsChangelogLoading(true);
      setChangelogError(null);
      const res = await fetchPublicChangelog();
      setChangelog(res.changelog || []);
      setReleaseCount(res.releases_count || (res.changelog ? res.changelog.length : 0));
      updateTourRuntimeContext({ hasNetworkErrorOnCommunity: false });
    } catch (err: unknown) {
      setChangelogError(
        formatApiError(err, 'Failed to load releases', 'रिलीज़ इतिहास लोड नहीं हो सका।')
      );
      updateTourRuntimeContext({ hasNetworkErrorOnCommunity: true });
    } finally {
      setIsChangelogLoading(false);
    }
  }, [formatApiError, updateTourRuntimeContext]);

  // Fetch Contributors (user-triggered refresh)
  const loadContributors = useCallback(async () => {
    try {
      setIsContributorsLoading(true);
      setContributorsError(null);
      const res = await fetchPublicContributors();
      setContributors(res.contributors || []);
      setTotalContributors(res.total_contributors || (res.contributors ? res.contributors.length : 0));
      updateTourRuntimeContext({ hasNetworkErrorOnCommunity: false });
    } catch (err: unknown) {
      setContributorsError(
        formatApiError(err, 'Failed to load contributors', 'योगदानकर्ता विवरण लोड नहीं हो सका।')
      );
      updateTourRuntimeContext({ hasNetworkErrorOnCommunity: true });
    } finally {
      setIsContributorsLoading(false);
    }
  }, [formatApiError, updateTourRuntimeContext]);

  useEffect(() => {
    let mounted = true;
    fetchPublicChangelog()
      .then((res) => {
        if (!mounted) return;
        setChangelog(res.changelog || []);
        setReleaseCount(res.releases_count || (res.changelog ? res.changelog.length : 0));
        setChangelogError(null);
        updateTourRuntimeContext({ hasNetworkErrorOnCommunity: false });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setChangelogError(
          formatApiError(err, 'Failed to load releases', 'रिलीज़ इतिहास लोड नहीं हो सका।')
        );
        updateTourRuntimeContext({ hasNetworkErrorOnCommunity: true });
      })
      .finally(() => {
        if (mounted) setIsChangelogLoading(false);
      });

    fetchPublicContributors()
      .then((res) => {
        if (!mounted) return;
        setContributors(res.contributors || []);
        setTotalContributors(res.total_contributors || (res.contributors ? res.contributors.length : 0));
        setContributorsError(null);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setContributorsError(
          formatApiError(err, 'Failed to load contributors', 'योगदानकर्ता विवरण लोड नहीं हो सका।')
        );
      })
      .finally(() => {
        if (mounted) setIsContributorsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [formatApiError, updateTourRuntimeContext]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadChangelog(), loadContributors()]);
    setRefreshing(false);
  };

  const handleTabChange = (seg: TabSegment) => {
    triggerHaptic('tap', true).catch(() => {});
    if (isInteractiveTourActive && currentTourStep?.id) {
      setManualSegmentStepId(currentTourStep.id);
    }
    setActiveSegment(seg);
  };

  // Submit Feedback Handler
  const handleSubmitFeedback = async () => {
    if (isFeedbackSubmitting) return;
    setFeedbackValidationError(null);
    if (!feedbackMessage.trim()) {
      const msg = isHi ? 'कृपया अपना सन्देश दर्ज करें।' : 'Please enter your feedback message.';
      setFeedbackValidationError(msg);
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Information', msg);
      return;
    }
    if (!feedbackEmail.trim()) {
      const msg = isHi ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your email address.';
      setFeedbackValidationError(msg);
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Email', msg);
      return;
    }
    if (!EMAIL_REGEX.test(feedbackEmail.trim())) {
      const msg = isHi ? 'कृपया वैध ईमेल पता दर्ज करें।' : 'Please enter a valid email address.';
      setFeedbackValidationError(msg);
      Alert.alert(isHi ? 'अवैध ईमेल' : 'Invalid Email', msg);
      return;
    }

    try {
      setIsFeedbackSubmitting(true);
      await triggerHaptic('tap', true).catch(() => {});
      const res = await submitUserFeedback({
        rating: feedbackRating,
        category: feedbackCategory,
        message: feedbackMessage.trim(),
        user_name: feedbackName.trim() || 'App User',
        user_email: feedbackEmail.trim(),
        page_url: 'android-app://cc.sanatan.app/community',
      });

      setFeedbackSuccess(
        isHi
          ? `आपकी प्रतिक्रिया प्राप्त हो गई है! (आईडी #${res.feedbackId ?? 'OK'}) धन्यवाद!`
          : `Feedback received! (ID #${res.feedbackId ?? 'OK'}). Thank you for your support!`
      );
      setFeedbackMessage('');
      Alert.alert(
        isHi ? 'सफलता' : 'Thank You',
        isHi ? 'आपकी प्रतिक्रिया सफलतापूर्वक दर्ज कर ली गई है।' : 'Your feedback has been submitted successfully.'
      );
    } catch (err: unknown) {
      const msg = formatApiError(err, 'Failed to submit feedback.', 'प्रतिक्रिया भेजने में त्रुटि हुई।');
      setFeedbackValidationError(msg);
      Alert.alert(isHi ? 'विफल' : 'Submission Failed', msg);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  // Submit Issue Handler
  const handleSubmitIssue = async () => {
    if (isIssueSubmitting) return;
    setIssueValidationError(null);
    if (!issueTitle.trim()) {
      const msg = isHi ? 'कृपया समस्या का शीर्षक दर्ज करें।' : 'Please enter an issue title.';
      setIssueValidationError(msg);
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Title', msg);
      return;
    }
    if (!issueDescription.trim()) {
      const msg = isHi ? 'कृपया समस्या का विस्तृत विवरण दर्ज करें।' : 'Please describe the issue.';
      setIssueValidationError(msg);
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Description', msg);
      return;
    }
    if (!issueEmail.trim()) {
      const msg = isHi ? 'कृपया ईमेल दर्ज करें।' : 'Please provide your email for updates.';
      setIssueValidationError(msg);
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Email', msg);
      return;
    }
    if (!EMAIL_REGEX.test(issueEmail.trim())) {
      const msg = isHi ? 'कृपया वैध ईमेल पता दर्ज करें।' : 'Please enter a valid email address.';
      setIssueValidationError(msg);
      Alert.alert(isHi ? 'अवैध ईमेल' : 'Invalid Email', msg);
      return;
    }

    try {
      setIsIssueSubmitting(true);
      await triggerHaptic('tap', true).catch(() => {});
      const res = await submitReportedIssue({
        title: issueTitle.trim(),
        description: issueDescription.trim(),
        steps_to_reproduce: issueSteps.trim() || 'N/A',
        severity: issueSeverity,
        reporter_name: issueName.trim() || 'App User',
        reporter_email: issueEmail.trim(),
        page_url: 'android-app://cc.sanatan.app/community',
      });

      setIssueSuccess(
        isHi
          ? `समस्या रिपोर्ट सफलतापूर्वक दर्ज! (इश्यू आईडी #${res.issueId ?? 'NEW'})`
          : `Issue report logged successfully! (Issue ID #${res.issueId ?? 'NEW'})`
      );
      setIssueTitle('');
      setIssueDescription('');
      setIssueSteps('');
      Alert.alert(
        isHi ? 'समस्या दर्ज' : 'Issue Reported',
        isHi
          ? `समस्या आईडी #${res.issueId ?? ''} दर्ज कर ली गई है। हमारी टीम इसका शीघ्र समाधान करेगी।`
          : `Issue #${res.issueId ?? ''} logged. Our development team has been notified.`
      );
    } catch (err: unknown) {
      const msg = formatApiError(err, 'Failed to submit issue report.', 'समस्या रिपोर्ट दर्ज नहीं हो सकी।');
      setIssueValidationError(msg);
      Alert.alert(isHi ? 'विफल' : 'Submission Failed', msg);
    } finally {
      setIsIssueSubmitting(false);
    }
  };

  // Helper date formatter
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return new Intl.DateTimeFormat(isHi ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return isoStr;
    }
  };

  const dynamicStyles = {
    container: {
      backgroundColor: theme.bg,
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
    },
    subCard: {
      backgroundColor: theme.cardMuted,
    },
    textPrimary: {
      color: theme.text,
    },
    textSecondary: {
      color: theme.textMuted,
    },
    input: {
      backgroundColor: theme.cardMuted,
      borderColor: theme.border,
      color: theme.text,
    },
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        style={[styles.container, dynamicStyles.container]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onTourScroll}
        onMomentumScrollEnd={onTourMomentumScrollEnd}
        onScrollEndDrag={onTourScrollEndDrag}
        scrollEventThrottle={16}
        scrollEnabled={!isInteractiveTourActive || isTryModeActive}
      >
        {/* Header Hero Banner */}
        <TourTarget targetId="community-hero-card" borderRadius={18}>
          <View testID="community-hero-card" style={[styles.heroCard, dynamicStyles.card]}>
            <View style={styles.heroTopRow}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>
                  {isHi ? 'सार्वजनिक प्रोजेक्ट हब' : 'Live Community & Project Hub'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.freeBadgePill}>
                  <Text style={styles.freeBadgeText}>{isHi ? '१००% निःशुल्क' : '100% Free'}</Text>
                </View>
                <TouchableOpacity
                  testID="community-help-btn"
                  accessibilityRole="button"
                  accessibilityLabel={isHi ? 'सहायता और मार्गदर्शन' : 'Help & Guide'}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={() => openHelp('community')}
                  style={[
                    styles.helpBtn,
                    isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
                  ]}
                >
                  <Ionicons
                    name="help-circle-outline"
                    size={22}
                    color={isDark ? '#d4d4d8' : Palette.textSecondaryLight}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.heroTitle, dynamicStyles.textPrimary]}>
              {isHi ? 'सनातन पञ्चाङ्ग एवं मुहूर्त ऍप' : 'Sanatan Panchang & Muhurta'}
            </Text>
            <Text style={[styles.heroSubtitle, dynamicStyles.textSecondary]}>
              {isHi
                ? '१००% गणितीय शुद्धता, सार्वजनिक विकास, योगदानकर्ता एवं प्रत्यक्ष समर्थन'
                : 'Mathematical Vedic ephemeris, public development, team contributors & active support'}
            </Text>
          </View>
        </TourTarget>

        {/* Horizontal Navigation Segment Switcher */}
        <ScrollView
          ref={segmentScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentScroll}
          onScroll={onHorizontalScroll}
          onMomentumScrollEnd={onHorizontalMomentumScrollEnd}
          onScrollEndDrag={onHorizontalScrollEndDrag}
          scrollEventThrottle={16}
        >
          {[
            { id: 'changelog', icon: 'git-commit-outline', labelHi: 'अपडेट्स', labelEn: 'Changelog', badge: releaseCount },
            { id: 'contributors', icon: 'people-outline', labelHi: 'टीम', labelEn: 'Contributors', badge: totalContributors },
            { id: 'feedback', icon: 'chatbubbles-outline', labelHi: 'प्रतिक्रिया', labelEn: 'Feedback' },
            { id: 'issues', icon: 'bug-outline', labelHi: 'समस्या', labelEn: 'Report Bug' },
          ].map((tab) => {
            const isActive = effectiveSegment === tab.id;
            const chipNode = (
              <TouchableOpacity
                key={tab.id}
                testID={`community-segment-${tab.id}`}
                accessibilityRole="tab"
                accessibilityLabel={isHi ? tab.labelHi : tab.labelEn}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.segmentChip,
                  { minHeight: MIN_TOUCH_TARGET },
                  isDark ? styles.segmentChipDark : styles.segmentChipLight,
                  isActive && styles.segmentChipActive,
                ]}
                onPress={() => handleTabChange(tab.id as TabSegment)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={17}
                  color={isActive ? '#ffffff' : (isDark ? theme.textSecondary : '#52525b')}
                />
                <Text
                  style={[
                    styles.segmentChipText,
                    isDark && { color: theme.textSecondary },
                    isActive && styles.segmentChipTextActive,
                  ]}
                >
                  {isHi ? tab.labelHi : tab.labelEn}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={[styles.badgeCount, isDark && !isActive && { backgroundColor: theme.cardMuted }, isActive && styles.badgeCountActive]}>
                    <Text style={[styles.badgeCountText, isDark && !isActive && { color: theme.text }, isActive && styles.badgeCountTextActive]}>
                      {tab.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );

            return tab.id === 'feedback' ? (
              <TourTarget key={tab.id} targetId="community-segment-feedback" borderRadius={20}>
                {chipNode}
              </TourTarget>
            ) : (
              chipNode
            );
          })}
        </ScrollView>

        {/* =========================================================================
            SEGMENT 1: CHANGELOG (GET /api/v1/public/changelog)
           ========================================================================= */}
        {effectiveSegment === 'changelog' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text style={[styles.sectionHeading, dynamicStyles.textPrimary]}>
                  {isHi ? 'सार्वजनिक रिलीज़ व अपडेट्स' : 'Releases & Public Changelog'}
                </Text>
                <Text style={[styles.sectionSub, dynamicStyles.textSecondary]}>
                  {isHi ? `कुल ${releaseCount} पूर्ण संस्करण उपलब्ध` : `${releaseCount} recorded milestones & releases`}
                </Text>
              </View>
              <TouchableOpacity
                testID="changelog-refresh-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'रिलीज़ इतिहास रीफ्रेश करें' : 'Refresh releases'}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={loadChangelog}
                style={[
                  styles.iconRefreshBtn,
                  isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
                ]}
              >
                <Ionicons name="refresh" size={17} color={theme.primary} />
                <Text style={[styles.refreshBtnText, { color: theme.primary }]}>
                  {isHi ? 'रीफ्रेश' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>

            {isChangelogLoading && !refreshing ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="small" color={Palette.primary} />
                <Text style={[styles.loaderText, dynamicStyles.textSecondary]}>
                  {isHi ? 'नवीनतम रिलीज़ प्राप्त हो रहे हैं...' : 'Fetching release history...'}
                </Text>
              </View>
            ) : changelogError ? (
              <ScreenStateView
                testID="changelog-error-card"
                tone="error"
                iconName="cloud-offline-outline"
                title={isHi ? 'रिलीज़ इतिहास लोड नहीं हो सका' : 'Unable to Load Release History'}
                description={changelogError}
                actionLabel={isHi ? 'पुनः प्रयास करें' : 'Retry'}
                actionTestID="changelog-retry-btn"
                onAction={loadChangelog}
              />
            ) : changelog.length === 0 ? (
              <ScreenStateView
                tone="empty"
                iconName="cube-outline"
                title={isHi ? 'कोई रिलीज़ विवरण उपलब्ध नहीं' : 'No Release History Yet'}
                description={isHi ? 'कोई रिलीज़ विवरण उपलब्ध नहीं है।' : 'No changelog records found.'}
              />
            ) : (
              changelog.map((item, idx) => (
                <View key={item.id} style={[styles.releaseCard, dynamicStyles.card]}>
                  <View style={styles.releaseCardHeader}>
                    <View style={styles.releaseTag}>
                      <Ionicons name="cube-outline" size={12} color="#ffffff" />
                      <Text style={styles.releaseTagText}>#{item.id}</Text>
                    </View>
                    <View style={styles.releaseDateRow}>
                      <Ionicons name="calendar-outline" size={12} color={isDark ? '#a1a1aa' : '#71717a'} />
                      <Text style={[styles.releaseDateText, dynamicStyles.textSecondary]}>
                        {formatDate(item.completed_at)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.releaseTitle, dynamicStyles.textPrimary]}>
                    {item.title}
                  </Text>
                  {item.description && item.description !== item.title && (
                    <Text style={[styles.releaseDesc, dynamicStyles.textSecondary]}>
                      {item.description}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* =========================================================================
            SEGMENT 2: CONTRIBUTORS (GET /api/v1/public/contributors)
           ========================================================================= */}
        {effectiveSegment === 'contributors' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Text style={[styles.sectionHeading, dynamicStyles.textPrimary]}>
                  {isHi ? 'प्रोजेक्ट टीम एवं योगदानकर्ता' : 'Contributors & Development Team'}
                </Text>
                <Text style={[styles.sectionSub, dynamicStyles.textSecondary]}>
                  {isHi
                    ? `कुल ${totalContributors} सक्रिय डेवलपर, परीक्षक व टीम सदस्य`
                    : `${totalContributors} core members, testers & engineers`}
                </Text>
              </View>
              <TouchableOpacity
                testID="contributors-refresh-btn"
                accessibilityRole="button"
                accessibilityLabel={isHi ? 'योगदानकर्ता रीफ्रेश करें' : 'Refresh contributors'}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={loadContributors}
                style={[
                  styles.iconRefreshBtn,
                  isDark && { backgroundColor: theme.cardMuted, borderColor: theme.border },
                ]}
              >
                <Ionicons name="refresh" size={17} color={theme.primary} />
                <Text style={[styles.refreshBtnText, { color: theme.primary }]}>
                  {isHi ? 'रीफ्रेश' : 'Refresh'}
                </Text>
              </TouchableOpacity>
            </View>

            {isContributorsLoading && !refreshing ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="small" color={Palette.primary} />
                <Text style={[styles.loaderText, dynamicStyles.textSecondary]}>
                  {isHi ? 'योगदानकर्ता लोड हो रहे हैं...' : 'Loading contributors...'}
                </Text>
              </View>
            ) : contributorsError ? (
              <ScreenStateView
                testID="contributors-error-card"
                tone="error"
                iconName="people-outline"
                title={isHi ? 'योगदानकर्ता सूची लोड नहीं हो सकी' : 'Unable to Load Contributors'}
                description={contributorsError}
                actionLabel={isHi ? 'पुनः प्रयास करें' : 'Retry'}
                actionTestID="contributors-retry-btn"
                onAction={loadContributors}
              />
            ) : (
              contributors.map((c) => {
                const roleLower = (c.role_in_project || 'contributor').toLowerCase();
                const isLead = roleLower.includes('lead');
                const isDev = roleLower.includes('developer');
                const isTester = roleLower.includes('tester');

                const roleBadgeStyle = isLead
                  ? styles.roleLead
                  : isDev
                  ? styles.roleDev
                  : isTester
                  ? styles.roleTester
                  : styles.roleDefault;

                const initials = (c.name || 'User')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <View key={c.id} style={[styles.contributorCard, dynamicStyles.card]}>
                    <View style={styles.contributorHeader}>
                      {c.avatar_url ? (
                        <Image source={{ uri: c.avatar_url }} style={styles.avatarImg} />
                      ) : (
                        <View style={[styles.avatarInitials, isLead ? { backgroundColor: Palette.primary } : { backgroundColor: '#6366f1' }]}>
                          <Text style={styles.avatarInitialsText}>{initials}</Text>
                        </View>
                      )}

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.contributorNameRow}>
                          <Text style={[styles.contributorName, dynamicStyles.textPrimary]}>
                            {c.name}
                          </Text>
                          <View style={[styles.roleBadge, roleBadgeStyle]}>
                            <Text style={styles.roleBadgeText}>
                              {c.role_in_project.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.contributorJoined, dynamicStyles.textSecondary]}>
                          {isHi ? 'सदस्यता:' : 'Joined:'} {formatDate(c.joined_at || '')}
                        </Text>
                      </View>
                    </View>

                    {/* Contributions Stats Grid */}
                    <View style={[styles.contribStatsGrid, dynamicStyles.subCard]}>
                      <View style={styles.contribStatItem}>
                        <Text style={styles.contribStatNumber}>
                          {c.contributions?.stories_completed ?? 0}
                        </Text>
                        <Text style={[styles.contribStatLabel, dynamicStyles.textSecondary]}>
                          {isHi ? 'कहानियां पूर्ण' : 'Stories Done'}
                        </Text>
                      </View>
                      <View style={styles.contribStatItem}>
                        <Text style={[styles.contribStatNumber, { color: Palette.accent }]}>
                          {c.contributions?.story_points_completed ?? 0}
                        </Text>
                        <Text style={[styles.contribStatLabel, dynamicStyles.textSecondary]}>
                          {isHi ? 'स्टोरी पॉइंट्स' : 'Story Pts'}
                        </Text>
                      </View>
                      <View style={styles.contribStatItem}>
                        <Text style={[styles.contribStatNumber, { color: Palette.success }]}>
                          {c.contributions?.issues_resolved ?? 0}
                        </Text>
                        <Text style={[styles.contribStatLabel, dynamicStyles.textSecondary]}>
                          {isHi ? 'समस्या हल' : 'Resolved'}
                        </Text>
                      </View>
                      <View style={styles.contribStatItem}>
                        <Text style={[styles.contribStatNumber, { color: '#8b5cf6' }]}>
                          {c.contributions?.issues_reported ?? 0}
                        </Text>
                        <Text style={[styles.contribStatLabel, dynamicStyles.textSecondary]}>
                          {isHi ? 'रिपोर्ट' : 'Reported'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* =========================================================================
            SEGMENT 3: SUBMIT USER FEEDBACK (POST /api/v1/public/feedback)
           ========================================================================= */}
        {effectiveSegment === 'feedback' && (
          <View style={styles.sectionWrap}>
            <View style={[styles.formCard, dynamicStyles.card]}>
              <View style={styles.formHeaderRow}>
                <Ionicons name="chatbubbles" size={20} color={Palette.primary} />
                <Text style={[styles.formTitle, dynamicStyles.textPrimary]}>
                  {isHi ? 'उपयोगकर्ता प्रतिक्रिया साझा करें' : 'Submit User Feedback'}
                </Text>
              </View>
              <Text style={[styles.formSub, dynamicStyles.textSecondary]}>
                {isHi
                  ? 'आपके विचार और सुझाव हमारे लिए अत्यंत महत्वपूर्ण हैं। कृपया अपना अनुभव साझा करें।'
                  : 'Your ratings and suggestions directly shape future releases. Let us know how we can improve.'}
              </Text>

              {feedbackSuccess ? (
                <InlineFeedbackBanner tone="success" message={feedbackSuccess} />
              ) : null}

              {/* 5-Star Rating Selector */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '१. ऍप रेटिंग (१ से ५ सितारे)' : '1. App Rating (1 to 5 Stars)'}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      testID={`feedback-star-${star}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${star} star rating`}
                      accessibilityState={{ selected: feedbackRating >= star }}
                      style={styles.starTouch}
                      onPress={() => {
                        triggerHaptic('tap', true).catch(() => {});
                        setFeedbackRating(star);
                      }}
                    >
                      <Ionicons
                        name={star <= feedbackRating ? 'star' : 'star-outline'}
                        size={32}
                        color={star <= feedbackRating ? '#f59e0b' : (isDark ? '#4b5563' : '#d1d5db')}
                      />
                    </TouchableOpacity>
                  ))}
                  <Text style={[styles.starDescText, dynamicStyles.textSecondary]}>
                    {feedbackRating === 5
                      ? (isHi ? 'उत्कृष्ट (5/5)' : 'Excellent (5/5)')
                      : feedbackRating === 4
                      ? (isHi ? 'बहुत अच्छा (4/5)' : 'Very Good (4/5)')
                      : feedbackRating === 3
                      ? (isHi ? 'अच्छा (3/5)' : 'Good (3/5)')
                      : feedbackRating === 2
                      ? (isHi ? 'साधारण (2/5)' : 'Fair (2/5)')
                      : (isHi ? 'सुधार आवश्यक (1/5)' : 'Needs Improvement (1/5)')}
                  </Text>
                </View>
              </View>

              {/* Category Selector Chips */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '२. श्रेणी' : '2. Category'}
                </Text>
                <View style={styles.chipsRow}>
                  {[
                    { id: 'praise', labelHi: '❤️ प्रशंसा', labelEn: '❤️ Praise' },
                    { id: 'feature_request', labelHi: '✨ नई सुविधा', labelEn: '✨ Feature' },
                    { id: 'ui_ux', labelHi: '🎨 डिज़ाइन', labelEn: '🎨 UI/UX' },
                    { id: 'bug_report', labelHi: '🐞 बग रिपोर्ट', labelEn: '🐞 Bug' },
                    { id: 'general', labelHi: '💬 सामान्य', labelEn: '💬 General' },
                  ].map((c) => {
                    const isSelected = feedbackCategory === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        testID={`feedback-category-${c.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={isHi ? c.labelHi : c.labelEn}
                        accessibilityState={{ selected: isSelected }}
                        style={[
                          styles.chipOption,
                          dynamicStyles.subCard,
                          isSelected && styles.chipOptionActive,
                        ]}
                        onPress={() => setFeedbackCategory(c.id as FeedbackCategory)}
                      >
                        <Text
                          style={[
                            styles.chipOptionText,
                            isDark && !isSelected && { color: theme.textSecondary },
                            isSelected && styles.chipOptionTextActive,
                          ]}
                        >
                          {isHi ? c.labelHi : c.labelEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Name & Email */}
              <FormField
                testID="feedback-name-input"
                label={isHi ? '३. आपका नाम' : '3. Your Name'}
                optionalLabel={isHi ? 'वैकल्पिक' : 'Optional'}
                accessibilityLabel={isHi ? 'आपका नाम' : 'Your Name'}
                value={feedbackName}
                onChangeText={setFeedbackName}
                maxLength={80}
                returnKeyType="next"
                onSubmitEditing={() => feedbackEmailRef.current?.focus()}
                placeholder={isHi ? 'उदा. राहुल शर्मा' : 'e.g. John Doe'}
              />

              <FormField
                inputRef={feedbackEmailRef}
                testID="feedback-email-input"
                label={isHi ? '४. आपका ईमेल पता' : '4. Your Email Address'}
                optionalLabel={isHi ? 'वैकल्पिक' : 'Optional'}
                helperText={
                  isHi
                    ? 'केवल तभी लिखें यदि आप हमारी टीम से उत्तर चाहते हैं।'
                    : 'Only needed if you would like a reply from our team.'
                }
                accessibilityLabel={isHi ? 'आपका ईमेल पता' : 'Your Email Address'}
                value={feedbackEmail}
                onChangeText={(text) => {
                  setFeedbackEmail(text);
                  if (feedbackValidationError) setFeedbackValidationError(null);
                }}
                maxLength={120}
                returnKeyType="next"
                onSubmitEditing={() => feedbackMessageRef.current?.focus()}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="your.email@example.com"
              />

              {/* Message */}
              <FormField
                inputRef={feedbackMessageRef}
                testID="feedback-message-input"
                label={isHi ? '५. प्रतिक्रिया सन्देश' : '5. Feedback Message'}
                requiredLabel={isHi ? 'आवश्यक' : 'Required'}
                charCount={{ current: feedbackMessage.length, max: 500 }}
                helperText={
                  isHi
                    ? 'अपना अनुभव, प्रशंसा या कोई सुधार सुझाव सरल शब्दों में लिखें।'
                    : 'Write what you liked or what we can make easier for you.'
                }
                accessibilityLabel={isHi ? 'प्रतिक्रिया सन्देश' : 'Feedback Message'}
                value={feedbackMessage}
                onChangeText={(text) => {
                  setFeedbackMessage(text);
                  if (feedbackValidationError) setFeedbackValidationError(null);
                }}
                maxLength={500}
                multiline
                numberOfLines={4}
                placeholder={
                  isHi
                    ? 'अपने अनुभव, सुधार हेतु सुझाव या प्रशंसा लिखें...'
                    : 'Share your thoughts, suggestions or encouragement...'
                }
              />

              {feedbackValidationError ? (
                <InlineFeedbackBanner
                  testID="feedback-validation-error"
                  tone="error"
                  message={feedbackValidationError}
                />
              ) : null}

              {/* Submit Button */}
              <AppButton
                testID="feedback-submit-btn"
                accessibilityLabel={isHi ? 'प्रतिक्रिया भेजें' : 'Submit Feedback'}
                label={isHi ? 'प्रतिक्रिया भेजें' : 'Submit Feedback'}
                iconName="paper-plane"
                loading={isFeedbackSubmitting}
                disabled={isFeedbackSubmitting}
                onPress={handleSubmitFeedback}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        )}

        {/* =========================================================================
            SEGMENT 4: REPORT BUG / ISSUE (POST /api/v1/public/issues)
           ========================================================================= */}
        {effectiveSegment === 'issues' && (
          <View style={styles.sectionWrap}>
            <View style={[styles.formCard, dynamicStyles.card]}>
              <View style={styles.formHeaderRow}>
                <Ionicons name="bug" size={20} color={Palette.danger} />
                <Text style={[styles.formTitle, dynamicStyles.textPrimary]}>
                  {isHi ? 'समस्या या बग रिपोर्ट करें' : 'Report a Bug or Issue'}
                </Text>
              </View>
              <Text style={[styles.formSub, dynamicStyles.textSecondary]}>
                {isHi
                  ? 'यदि आपको कोई गणना, स्क्रीन या बटन में त्रुटि दिखे तो विवरण भेजें। हमारी टीम प्राथमिकता से समाधान करेगी।'
                  : 'Report functional or calculation issues directly to our engineering repository.'}
              </Text>

              {issueSuccess ? (
                <InlineFeedbackBanner tone="success" message={issueSuccess} />
              ) : null}

              {/* Title */}
              <FormField
                testID="issue-title-input"
                label={isHi ? '१. समस्या का संक्षिप्त शीर्षक' : '1. Issue Title'}
                requiredLabel={isHi ? 'आवश्यक' : 'Required'}
                helperText={
                  isHi
                    ? 'एक छोटे वाक्य में बताएं कि क्या समस्या दिखी।'
                    : 'Summarize what went wrong in a short sentence.'
                }
                accessibilityLabel={isHi ? 'समस्या का शीर्षक' : 'Issue Title'}
                value={issueTitle}
                onChangeText={(text) => {
                  setIssueTitle(text);
                  if (issueValidationError) setIssueValidationError(null);
                }}
                maxLength={120}
                returnKeyType="next"
                onSubmitEditing={() => issueDescRef.current?.focus()}
                placeholder={
                  isHi
                    ? 'उदा. सूर्योदय समय गणना में ५ मिनट का अन्तर'
                    : 'e.g. Sunrise time looks off for custom city'
                }
              />

              {/* Severity Chips */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '२. गम्भीरता स्तर' : '2. How serious is it?'}
                </Text>
                <View style={styles.chipsRow}>
                  {[
                    { id: 'low', labelHi: '🟢 निम्न (Low)', labelEn: '🟢 Low', color: '#10b981' },
                    { id: 'medium', labelHi: '🔵 मध्यम (Medium)', labelEn: '🔵 Medium', color: '#0284c7' },
                    { id: 'high', labelHi: '🟠 उच्च (High)', labelEn: '🟠 High', color: '#f59e0b' },
                    { id: 'critical', labelHi: '🔴 गम्भीर (Critical)', labelEn: '🔴 Critical', color: '#ef4444' },
                  ].map((s) => {
                    const isSelected = issueSeverity === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        testID={`issue-severity-${s.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={isHi ? s.labelHi : s.labelEn}
                        accessibilityState={{ selected: isSelected }}
                        style={[
                          styles.chipOption,
                          dynamicStyles.subCard,
                          isSelected && { backgroundColor: s.color, borderColor: s.color },
                        ]}
                        onPress={() => setIssueSeverity(s.id as IssueSeverity)}
                      >
                        <Text
                          style={[
                            styles.chipOptionText,
                            isDark && !isSelected && { color: theme.textSecondary },
                            isSelected && { color: '#ffffff' },
                          ]}
                        >
                          {isHi ? s.labelHi : s.labelEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <FormField
                inputRef={issueDescRef}
                testID="issue-description-input"
                label={isHi ? '३. समस्या का विस्तृत विवरण' : '3. Issue Description'}
                requiredLabel={isHi ? 'आवश्यक' : 'Required'}
                charCount={{ current: issueDescription.length, max: 600 }}
                helperText={
                  isHi
                    ? 'बताएं कि आपने क्या देखा और वास्तव में क्या होना चाहिए था।'
                    : 'Tell us what you expected to see and what happened instead.'
                }
                accessibilityLabel={isHi ? 'समस्या का विवरण' : 'Issue Description'}
                value={issueDescription}
                onChangeText={(text) => {
                  setIssueDescription(text);
                  if (issueValidationError) setIssueValidationError(null);
                }}
                maxLength={600}
                multiline
                numberOfLines={4}
                placeholder={
                  isHi
                    ? 'समस्या कब और कैसे उत्पन्न हुई? विस्तृत जानकारी लिखें...'
                    : 'Describe what happened, expected behavior vs observed behavior...'
                }
              />

              {/* Steps to Reproduce */}
              <FormField
                inputRef={issueStepsRef}
                testID="issue-steps-input"
                label={isHi ? '४. समस्या कैसे दिखी (चरण)' : '4. Steps to Reproduce'}
                optionalLabel={isHi ? 'वैकल्पिक' : 'Optional'}
                accessibilityLabel={isHi ? 'दोहराने के चरण' : 'Steps to Reproduce'}
                value={issueSteps}
                onChangeText={setIssueSteps}
                maxLength={400}
                multiline
                numberOfLines={3}
                placeholder={
                  isHi
                    ? '१. पञ्चाङ्ग टैब खोलें\n२. जीपीएस बटन दबाएं...'
                    : '1. Open Dinacharya tab\n2. Tap city button...'
                }
              />

              {/* Reporter Name & Email */}
              <FormField
                inputRef={issueNameRef}
                testID="issue-name-input"
                label={isHi ? '५. आपका नाम' : '5. Your Name'}
                optionalLabel={isHi ? 'वैकल्पिक' : 'Optional'}
                accessibilityLabel={isHi ? 'आपका नाम' : 'Your Name'}
                value={issueName}
                onChangeText={setIssueName}
                maxLength={80}
                returnKeyType="next"
                onSubmitEditing={() => issueEmailRef.current?.focus()}
                placeholder={isHi ? 'नाम' : 'Your Name'}
              />

              <FormField
                inputRef={issueEmailRef}
                testID="issue-email-input"
                label={isHi ? '६. आपका ईमेल पता' : '6. Your Email'}
                requiredLabel={isHi ? 'आवश्यक' : 'Required'}
                helperText={
                  isHi
                    ? 'ताकि समस्या ठीक होने पर हम आपको सूचित कर सकें।'
                    : 'Used only so we can follow up once fixed.'
                }
                accessibilityLabel={isHi ? 'आपका ईमेल पता' : 'Your Email'}
                value={issueEmail}
                onChangeText={(text) => {
                  setIssueEmail(text);
                  if (issueValidationError) setIssueValidationError(null);
                }}
                maxLength={120}
                returnKeyType="done"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="developer@example.com"
              />

              {issueValidationError ? (
                <InlineFeedbackBanner
                  testID="issue-validation-error"
                  tone="error"
                  message={issueValidationError}
                />
              ) : null}

              {/* Submit Button */}
              <AppButton
                testID="issue-submit-btn"
                variant="danger"
                accessibilityLabel={isHi ? 'बग रिपोर्ट दर्ज करें' : 'Submit Issue Report'}
                label={isHi ? 'बग रिपोर्ट दर्ज करें' : 'Submit Issue Report'}
                iconName="alert-circle"
                loading={isIssueSubmitting}
                disabled={isIssueSubmitting}
                onPress={handleSubmitIssue}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.dockHeight + Spacing.dockClearance + 30,
  },
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  freeBadgePill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  helpBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: Radius.pill,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 5,
    lineHeight: 21,
  },
  segmentScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: Spacing.md,
  },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    gap: 6,
    borderWidth: 1,
  },
  segmentChipLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e4e4e7',
  },
  segmentChipDark: {
    backgroundColor: '#16161c',
    borderColor: '#27272a',
  },
  segmentChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  segmentChipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  segmentChipTextActive: {
    color: '#ffffff',
  },
  badgeCount: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgeCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3f3f46',
  },
  badgeCountTextActive: {
    color: '#ffffff',
  },
  sectionWrap: {
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 13.5,
    marginTop: 2,
  },
  iconRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: Palette.primaryBorder,
  },
  refreshBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  loaderText: {
    fontSize: 14,
  },
  errorCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  errorCardText: {
    fontSize: 12,
    color: Palette.danger,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: Radius.lg,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 12,
    color: '#71717a',
  },
  releaseCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: 6,
  },
  releaseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  releaseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    gap: 5,
  },
  releaseTagText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  releaseDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  releaseDateText: {
    fontSize: 12.5,
  },
  releaseTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
    marginTop: 4,
  },
  releaseDesc: {
    fontSize: 14,
    lineHeight: 21,
  },
  contributorCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: 12,
  },
  contributorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  contributorNameRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  roleLead: {
    backgroundColor: '#fef3c7',
  },
  roleDev: {
    backgroundColor: '#ede9fe',
  },
  roleTester: {
    backgroundColor: '#ecfdf5',
  },
  roleDefault: {
    backgroundColor: '#f4f4f5',
  },
  roleBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#18181b',
  },
  contributorJoined: {
    fontSize: 13,
    marginTop: 3,
  },
  contribStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderRadius: Radius.md,
    padding: 12,
    justifyContent: 'space-around',
  },
  contribStatItem: {
    alignItems: 'center',
    minWidth: 72,
  },
  contribStatNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
  },
  contribStatLabel: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  formSub: {
    fontSize: 14,
    lineHeight: 21,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: Radius.md,
    gap: 8,
  },
  successBannerText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    flex: 1,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  charCounter: {
    fontSize: 11,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  inputField: {
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: COMFORT_TOUCH_TARGET,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  starRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  starTouch: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starDescText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipOption: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipOptionActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  chipOptionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#3f3f46',
  },
  chipOptionTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    gap: 8,
    marginTop: 8,
    elevation: 2,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorInlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.dangerText,
    backgroundColor: Palette.dangerBg,
    borderColor: Palette.dangerBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
