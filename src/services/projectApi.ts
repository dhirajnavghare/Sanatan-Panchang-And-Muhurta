/**
 * Project Community, Feedback, Issues, Changelog, and Lead Generation API Service
 * Endpoint: https://dhirajnavghare.com/api/v1/public/*
 * Project Key: pk_live_7z3v2fjl8iwpxtn2
 */

const BASE_URL = 'https://dhirajnavghare.com/api/v1/public';
const PROJECT_KEY = 'pk_live_7z3v2fjl8iwpxtn2';

export interface ProjectInfo {
  id: number;
  name: string;
  slug: string;
  type?: string;
}

export interface ChangelogItem {
  id: number;
  title: string;
  description: string;
  completed_at: string;
}

export interface ChangelogResponse {
  success: boolean;
  project?: ProjectInfo;
  releases_count: number;
  changelog: ChangelogItem[];
}

export interface ContributorItem {
  id: number;
  user_id: number;
  name: string;
  role_in_project: string; // 'lead' | 'developer' | 'tester' | string
  avatar_url?: string;
  joined_at?: string;
  contributions: {
    stories_assigned: number;
    stories_completed: number;
    story_points_completed: number;
    issues_assigned: number;
    issues_resolved: number;
    issues_reported: number;
  };
}

export interface ContributorsResponse {
  success: boolean;
  project?: ProjectInfo;
  total_contributors: number;
  contributors: ContributorItem[];
}

export type FeedbackCategory = 'general' | 'bug_report' | 'feature_request' | 'praise' | 'ui_ux';

export interface FeedbackPayload {
  rating: number; // 1 to 5
  category: FeedbackCategory;
  message: string;
  user_name: string;
  user_email: string;
  page_url?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
  feedbackId?: number;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IssuePayload {
  title: string;
  description: string;
  steps_to_reproduce: string;
  severity: IssueSeverity;
  reporter_name: string;
  reporter_email: string;
  page_url?: string;
}

export interface IssueResponse {
  success: boolean;
  message?: string;
  issueId?: number;
}

export interface LeadPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service_needed?: string;
  estimated_budget?: string;
  message: string;
}

export interface LeadResponse {
  success: boolean;
  lead_id?: number;
  reference_no?: string;
  message?: string;
  project?: ProjectInfo;
}

/**
 * 1. Submit User Feedback (POST /api/v1/public/feedback)
 */
export async function submitUserFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  const response = await fetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-project-key': PROJECT_KEY,
    },
    body: JSON.stringify({
      ...payload,
      page_url: payload.page_url || 'android-app://cc.sanatan.app/feedback',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Network error');
    throw new Error(`Feedback submission failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * 2. User-Reported Bug / Issue (POST /api/v1/public/issues)
 */
export async function submitReportedIssue(payload: IssuePayload): Promise<IssueResponse> {
  const response = await fetch(`${BASE_URL}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-project-key': PROJECT_KEY,
    },
    body: JSON.stringify({
      ...payload,
      page_url: payload.page_url || 'android-app://cc.sanatan.app/issues',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Network error');
    throw new Error(`Issue submission failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * 3. Live Public Changelog (GET /api/v1/public/changelog)
 */
export async function fetchPublicChangelog(): Promise<ChangelogResponse> {
  const response = await fetch(`${BASE_URL}/changelog`, {
    method: 'GET',
    headers: {
      'x-project-key': PROJECT_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Network error');
    throw new Error(`Failed to fetch changelog (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * 4. Project Contributors & Contributions (GET /api/v1/public/contributors)
 */
export async function fetchPublicContributors(): Promise<ContributorsResponse> {
  const response = await fetch(`${BASE_URL}/contributors`, {
    method: 'GET',
    headers: {
      'x-project-key': PROJECT_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Network error');
    throw new Error(`Failed to fetch contributors (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * 5. Project Enquiry & Lead Generation (POST /api/v1/public/leads)
 */
export async function submitProjectLead(payload: LeadPayload): Promise<LeadResponse> {
  const response = await fetch(`${BASE_URL}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-project-key': PROJECT_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Network error');
    throw new Error(`Lead inquiry failed (${response.status}): ${errorText}`);
  }

  return response.json();
}
