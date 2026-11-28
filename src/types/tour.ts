export type TourTabRoute =
  | '/(tabs)'
  | '/(tabs)/muhurta'
  | '/(tabs)/festivals'
  | '/(tabs)/prayers'
  | '/(tabs)/more'
  | '/(tabs)/settings'
  | '/(tabs)/community';

export type TourViewMode = 'daily' | 'planner' | 'monthly';

export type SpotlightShape = 'rounded-rect' | 'circle' | 'rect';
export type TooltipPlacementPreference = 'auto' | 'top' | 'bottom' | 'left' | 'right';

export type TourStepConditionType =
  | 'location_permission'
  | 'notification_permission'
  | 'planner_empty'
  | 'sadhana_empty'
  | 'network_required'
  | 'abhijit_status';

export interface TourStep {
  id: string;
  tab: TourTabRoute;
  tabNameHi: string;
  tabNameEn: string;
  badgeHi: string;
  badgeEn: string;
  emoji: string;
  titleHi: string;
  titleEn: string;
  subtitleHi: string;
  subtitleEn: string;
  descriptionHi: string;
  descriptionEn: string;
  howToUseHi: string;
  howToUseEn: string;
  targetTestID?: string;
  shape?: SpotlightShape;
  tooltipPlacement?: TooltipPlacementPreference;
  viewMode?: TourViewMode;
  plannerSubTab?: 'core' | 'all' | 'planned';
  moreSection?: 'temples' | 'devatas' | 'vrat_katha';
  communitySegment?: 'changelog' | 'contributors' | 'feedback' | 'issues';
  muhurtaExpandAvoid?: boolean;
  sectionId?: string;
  conditionType?: TourStepConditionType;
  addedInVersion?: number;
}

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  shape?: SpotlightShape;
  padding?: number;
  isMeasured?: boolean;
  targetId?: string;
}

export interface TourTargetRegistration {
  targetId: string;
  tab?: TourTabRoute;
  measureNow: (allowScrollAdjust?: boolean) => void;
  shape?: SpotlightShape;
  borderRadius?: number;
  tooltipPlacement?: TooltipPlacementPreference;
  isVisible?: boolean;
}

export interface TourSection {
  id: string;
  nameHi: string;
  nameEn: string;
  emoji: string;
  startStep: number;
  endStep: number;
  addedInVersion?: number;
}

export interface ContextualHelpTopic {
  id: string;
  titleHi: string;
  titleEn: string;
  subtitleHi: string;
  subtitleEn: string;
  items: {
    emoji: string;
    labelHi: string;
    labelEn: string;
    descriptionHi: string;
    descriptionEn: string;
  }[];
}

export interface TourRuntimeContext {
  plannedTaskCount: number;
  completedSadhanaCount: number;
  isAbhijitAvailableToday: boolean;
  locationPermission: 'unknown' | 'granted' | 'denied';
  notificationPermission: 'unknown' | 'granted' | 'denied';
  hasNetworkErrorOnCommunity: boolean;
}
