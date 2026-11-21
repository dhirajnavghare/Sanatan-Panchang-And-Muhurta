import React, { useState, useEffect, useCallback } from 'react';
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
} from '@/src/services/projectApi';
import { loadUserProfile } from '@/src/services/userProfile';
import { triggerHaptic } from '@/src/services/sacredAudio';

type TabSegment = 'changelog' | 'contributors' | 'feedback' | 'issues';

export default function CommunityScreen() {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeSegment, setActiveSegment] = useState<TabSegment>('changelog');
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

  // 2. Issue / Bug Form State
  const [issueTitle, setIssueTitle] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<IssueSeverity>('medium');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSteps, setIssueSteps] = useState('');
  const [issueName, setIssueName] = useState('');
  const [issueEmail, setIssueEmail] = useState('');
  const [isIssueSubmitting, setIsIssueSubmitting] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState<string | null>(null);

  // Load User Profile for auto-filling name
  useEffect(() => {
    loadUserProfile().then((prof) => {
      if (prof?.name && prof.name !== 'साधक' && prof.name !== 'Sadhaka') {
        setFeedbackName(prof.name);
        setIssueName(prof.name);
      }
    });
  }, []);

  // Fetch Changelog
  const loadChangelog = useCallback(async () => {
    try {
      setIsChangelogLoading(true);
      setChangelogError(null);
      const res = await fetchPublicChangelog();
      setChangelog(res.changelog || []);
      setReleaseCount(res.releases_count || (res.changelog ? res.changelog.length : 0));
    } catch (err: any) {
      setChangelogError(err.message || 'Failed to load releases');
    } finally {
      setIsChangelogLoading(false);
    }
  }, []);

  // Fetch Contributors
  const loadContributors = useCallback(async () => {
    try {
      setIsContributorsLoading(true);
      setContributorsError(null);
      const res = await fetchPublicContributors();
      setContributors(res.contributors || []);
      setTotalContributors(res.total_contributors || (res.contributors ? res.contributors.length : 0));
    } catch (err: any) {
      setContributorsError(err.message || 'Failed to load contributors');
    } finally {
      setIsContributorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChangelog();
    loadContributors();
  }, [loadChangelog, loadContributors]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadChangelog(), loadContributors()]);
    setRefreshing(false);
  };

  const handleTabChange = async (seg: TabSegment) => {
    await triggerHaptic('tap', true).catch(() => {});
    setActiveSegment(seg);
  };

  // Submit Feedback Handler
  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Information', isHi ? 'कृपया अपना सन्देश दर्ज करें।' : 'Please enter your feedback message.');
      return;
    }
    if (!feedbackEmail.trim()) {
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Email', isHi ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your email address.');
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
    } catch (err: any) {
      Alert.alert(isHi ? 'विफल' : 'Submission Failed', err.message || 'Failed to submit feedback.');
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  // Submit Issue Handler
  const handleSubmitIssue = async () => {
    if (!issueTitle.trim()) {
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Title', isHi ? 'कृपया समस्या का शीर्षक दर्ज करें।' : 'Please enter an issue title.');
      return;
    }
    if (!issueDescription.trim()) {
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Description', isHi ? 'कृपया समस्या का विस्तृत विवरण दर्ज करें।' : 'Please describe the issue.');
      return;
    }
    if (!issueEmail.trim()) {
      Alert.alert(isHi ? 'त्रुटि' : 'Missing Email', isHi ? 'कृपया ईमेल दर्ज करें।' : 'Please provide your email for updates.');
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
    } catch (err: any) {
      Alert.alert(isHi ? 'विफल' : 'Submission Failed', err.message || 'Failed to submit issue report.');
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
      backgroundColor: isDark ? '#0e0e12' : '#f8f8fa',
    },
    card: {
      backgroundColor: isDark ? '#16161c' : '#ffffff',
      borderColor: isDark ? '#27272a' : '#e4e4e7',
    },
    subCard: {
      backgroundColor: isDark ? '#1e1e26' : '#f4f4f5',
    },
    textPrimary: {
      color: isDark ? '#fafafa' : '#18181b',
    },
    textSecondary: {
      color: isDark ? '#a1a1aa' : '#71717a',
    },
    input: {
      backgroundColor: isDark ? '#1a1a24' : '#f4f4f5',
      borderColor: isDark ? '#2d2d38' : '#e4e4e7',
      color: isDark ? '#ffffff' : '#18181b',
    },
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, dynamicStyles.container]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Palette.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Banner */}
        <View style={[styles.heroCard, dynamicStyles.card]}>
          <View style={styles.heroTopRow}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>
                {isHi ? 'सार्वजनिक प्रोजेक्ट हब' : 'Live Community & Project Hub'}
              </Text>
            </View>
            <View style={styles.freeBadgePill}>
              <Text style={styles.freeBadgeText}>{isHi ? '१००% निःशुल्क' : '100% Free'}</Text>
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

        {/* Horizontal Navigation Segment Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentScroll}
        >
          {[
            { id: 'changelog', icon: 'git-commit-outline', labelHi: 'अपडेट्स', labelEn: 'Changelog', badge: releaseCount },
            { id: 'contributors', icon: 'people-outline', labelHi: 'टीम', labelEn: 'Contributors', badge: totalContributors },
            { id: 'feedback', icon: 'chatbubbles-outline', labelHi: 'प्रतिक्रिया', labelEn: 'Feedback' },
            { id: 'issues', icon: 'bug-outline', labelHi: 'समस्या', labelEn: 'Report Bug' },
          ].map((tab) => {
            const isActive = activeSegment === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.segmentChip,
                  isDark ? styles.segmentChipDark : styles.segmentChipLight,
                  isActive && styles.segmentChipActive,
                ]}
                onPress={() => handleTabChange(tab.id as TabSegment)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={15}
                  color={isActive ? '#ffffff' : (isDark ? '#a1a1aa' : '#71717a')}
                />
                <Text style={[styles.segmentChipText, isActive && styles.segmentChipTextActive]}>
                  {isHi ? tab.labelHi : tab.labelEn}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={[styles.badgeCount, isActive && styles.badgeCountActive]}>
                    <Text style={[styles.badgeCountText, isActive && styles.badgeCountTextActive]}>
                      {tab.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* =========================================================================
            SEGMENT 1: CHANGELOG (GET /api/v1/public/changelog)
           ========================================================================= */}
        {activeSegment === 'changelog' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionHeading, dynamicStyles.textPrimary]}>
                  {isHi ? 'सार्वजनिक रिलीज़ व अपडेट्स' : 'Releases & Public Changelog'}
                </Text>
                <Text style={[styles.sectionSub, dynamicStyles.textSecondary]}>
                  {isHi ? `कुल ${releaseCount} पूर्ण संस्करण उपलब्ध` : `${releaseCount} recorded milestones & releases`}
                </Text>
              </View>
              <TouchableOpacity onPress={loadChangelog} style={styles.iconRefreshBtn}>
                <Ionicons name="refresh" size={16} color={Palette.primary} />
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
              <View style={[styles.errorCard, dynamicStyles.card]}>
                <Ionicons name="alert-circle" size={24} color={Palette.danger} />
                <Text style={styles.errorCardText}>{changelogError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadChangelog}>
                  <Text style={styles.retryBtnText}>{isHi ? 'पुनः प्रयास करें' : 'Retry'}</Text>
                </TouchableOpacity>
              </View>
            ) : changelog.length === 0 ? (
              <View style={[styles.emptyCard, dynamicStyles.card]}>
                <Text style={styles.emptyCardText}>
                  {isHi ? 'कोई रिलीज़ विवरण उपलब्ध नहीं है।' : 'No changelog records found.'}
                </Text>
              </View>
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
        {activeSegment === 'contributors' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionHeading, dynamicStyles.textPrimary]}>
                  {isHi ? 'प्रोजेक्ट टीम एवं योगदानकर्ता' : 'Contributors & Development Team'}
                </Text>
                <Text style={[styles.sectionSub, dynamicStyles.textSecondary]}>
                  {isHi
                    ? `कुल ${totalContributors} सक्रिय डेवलपर, परीक्षक व टीम सदस्य`
                    : `${totalContributors} core members, testers & engineers`}
                </Text>
              </View>
              <TouchableOpacity onPress={loadContributors} style={styles.iconRefreshBtn}>
                <Ionicons name="refresh" size={16} color={Palette.primary} />
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
              <View style={[styles.errorCard, dynamicStyles.card]}>
                <Ionicons name="alert-circle" size={24} color={Palette.danger} />
                <Text style={styles.errorCardText}>{contributorsError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadContributors}>
                  <Text style={styles.retryBtnText}>{isHi ? 'पुनः प्रयास करें' : 'Retry'}</Text>
                </TouchableOpacity>
              </View>
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
                          <Text style={[styles.contributorName, dynamicStyles.textPrimary]} numberOfLines={1}>
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
        {activeSegment === 'feedback' && (
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

              {feedbackSuccess && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#047857" />
                  <Text style={styles.successBannerText}>{feedbackSuccess}</Text>
                </View>
              )}

              {/* 5-Star Rating Selector */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '१. ऍप रेटिंग (१ से ५ सितारे)' : '1. App Rating (1 to 5 Stars)'}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
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
                        style={[
                          styles.chipOption,
                          dynamicStyles.subCard,
                          isSelected && styles.chipOptionActive,
                        ]}
                        onPress={() => setFeedbackCategory(c.id as FeedbackCategory)}
                      >
                        <Text style={[styles.chipOptionText, isSelected && styles.chipOptionTextActive]}>
                          {isHi ? c.labelHi : c.labelEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Name & Email */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '३. आपका नाम' : '3. Your Name'}
                </Text>
                <TextInput
                  style={[styles.inputField, dynamicStyles.input]}
                  value={feedbackName}
                  onChangeText={setFeedbackName}
                  placeholder={isHi ? 'उदा. राहुल शर्मा' : 'e.g. John Doe'}
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '४. आपका ईमेल पता' : '4. Your Email Address'}
                </Text>
                <TextInput
                  style={[styles.inputField, dynamicStyles.input]}
                  value={feedbackEmail}
                  onChangeText={setFeedbackEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="your.email@example.com"
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              {/* Message */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '५. प्रतिक्रिया सन्देश' : '5. Feedback Message'}
                </Text>
                <TextInput
                  style={[styles.inputField, styles.textArea, dynamicStyles.input]}
                  value={feedbackMessage}
                  onChangeText={setFeedbackMessage}
                  multiline
                  numberOfLines={4}
                  placeholder={
                    isHi
                      ? 'अपने अनुभव, सुधार हेतु सुझाव या प्रशंसा लिखें...'
                      : 'Share your thoughts, suggestions or encouragement...'
                  }
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isFeedbackSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitFeedback}
                disabled={isFeedbackSubmitting}
              >
                {isFeedbackSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#ffffff" />
                    <Text style={styles.submitButtonText}>
                      {isHi ? 'प्रतिक्रिया भेजें' : 'Submit Feedback'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* =========================================================================
            SEGMENT 4: REPORT BUG / ISSUE (POST /api/v1/public/issues)
           ========================================================================= */}
        {activeSegment === 'issues' && (
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

              {issueSuccess && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#047857" />
                  <Text style={styles.successBannerText}>{issueSuccess}</Text>
                </View>
              )}

              {/* Title */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '१. समस्या का संक्षिप्त शीर्षक *' : '1. Issue Title *'}
                </Text>
                <TextInput
                  style={[styles.inputField, dynamicStyles.input]}
                  value={issueTitle}
                  onChangeText={setIssueTitle}
                  placeholder={
                    isHi
                      ? 'उदा. सूर्योदय समय गणना में ५ मिनट का अन्तर'
                      : 'e.g. Sunrise calculation mismatch on custom GPS'
                  }
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              {/* Severity Chips */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '२. गम्भीरता स्तर (Severity)' : '2. Severity Level'}
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
                        style={[
                          styles.chipOption,
                          dynamicStyles.subCard,
                          isSelected && { backgroundColor: s.color, borderColor: s.color },
                        ]}
                        onPress={() => setIssueSeverity(s.id as IssueSeverity)}
                      >
                        <Text style={[styles.chipOptionText, isSelected && { color: '#ffffff' }]}>
                          {isHi ? s.labelHi : s.labelEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '३. समस्या का विस्तृत विवरण *' : '3. Issue Description *'}
                </Text>
                <TextInput
                  style={[styles.inputField, styles.textArea, dynamicStyles.input]}
                  value={issueDescription}
                  onChangeText={setIssueDescription}
                  multiline
                  numberOfLines={4}
                  placeholder={
                    isHi
                      ? 'समस्या कब और कैसे उत्पन्न हुई? विस्तृत जानकारी लिखें...'
                      : 'Describe what happened, expected behavior vs observed behavior...'
                  }
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              {/* Steps to Reproduce */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '४. दोहराने के चरण (Steps to Reproduce)' : '4. Steps to Reproduce'}
                </Text>
                <TextInput
                  style={[styles.inputField, styles.textArea, dynamicStyles.input]}
                  value={issueSteps}
                  onChangeText={setIssueSteps}
                  multiline
                  numberOfLines={3}
                  placeholder={
                    isHi
                      ? '१. पञ्चाङ्ग टैब खोलें\n२. जीपीएस बटन दबाएं...'
                      : '1. Open Dinacharya tab\n2. Click GPS detect...'
                  }
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              {/* Reporter Name & Email */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '५. आपका नाम' : '5. Your Name'}
                </Text>
                <TextInput
                  style={[styles.inputField, dynamicStyles.input]}
                  value={issueName}
                  onChangeText={setIssueName}
                  placeholder={isHi ? 'नाम' : 'Your Name'}
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, dynamicStyles.textPrimary]}>
                  {isHi ? '६. आपका ईमेल पता *' : '6. Your Email *'}
                </Text>
                <TextInput
                  style={[styles.inputField, dynamicStyles.input]}
                  value={issueEmail}
                  onChangeText={setIssueEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="developer@example.com"
                  placeholderTextColor={isDark ? '#71717a' : '#a1a1aa'}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: Palette.danger }, isIssueSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitIssue}
                disabled={isIssueSubmitting}
              >
                {isIssueSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="alert-circle" size={16} color="#ffffff" />
                    <Text style={styles.submitButtonText}>
                      {isHi ? 'बग रिपोर्ट दर्ज करें' : 'Submit Issue Report'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  freeBadgePill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  segmentScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: Spacing.md,
  },
  segmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#71717a',
  },
  segmentChipTextActive: {
    color: '#ffffff',
  },
  badgeCount: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  badgeCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#71717a',
  },
  badgeCountTextActive: {
    color: '#ffffff',
  },
  sectionWrap: {
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  iconRefreshBtn: {
    padding: 6,
    borderRadius: Radius.pill,
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  loaderText: {
    fontSize: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    gap: 4,
  },
  releaseTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  releaseDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  releaseDateText: {
    fontSize: 11,
  },
  releaseTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 2,
  },
  releaseDesc: {
    fontSize: 12,
    lineHeight: 18,
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
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  contributorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    fontSize: 9,
    fontWeight: '800',
    color: '#18181b',
  },
  contributorJoined: {
    fontSize: 11,
    marginTop: 2,
  },
  contribStatsGrid: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: 10,
    justifyContent: 'space-around',
  },
  contribStatItem: {
    alignItems: 'center',
  },
  contribStatNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.primary,
  },
  contribStatLabel: {
    fontSize: 9,
    marginTop: 2,
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
    fontSize: 17,
    fontWeight: '800',
  },
  formSub: {
    fontSize: 12,
    lineHeight: 18,
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputField: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  starTouch: {
    padding: 2,
  },
  starDescText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipOptionActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  chipOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
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
});
