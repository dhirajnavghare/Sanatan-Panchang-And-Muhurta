export type TourTabRoute =
  | '/(tabs)'
  | '/(tabs)/muhurta'
  | '/(tabs)/festivals'
  | '/(tabs)/prayers'
  | '/(tabs)/more'
  | '/(tabs)/settings'
  | '/(tabs)/community';

export type TourViewMode = 'daily' | 'planner' | 'monthly';

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
  viewMode?: TourViewMode;
  plannerSubTab?: 'core' | 'all' | 'planned';
}

export interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

export interface TourSection {
  id: string;
  nameHi: string;
  nameEn: string;
  emoji: string;
  startStep: number;
  endStep: number;
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
