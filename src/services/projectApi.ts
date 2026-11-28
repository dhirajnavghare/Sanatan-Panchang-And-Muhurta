/**
 * Project Community, Feedback, Issues, Changelog, and Lead Generation API Service
 * Endpoint: https://dhirajnavghare.com/api/v1/public/*
 * Uses public publishable project key (overridable via EXPO_PUBLIC_SANATAN_PROJECT_KEY).
 */

const BASE_URL = 'https://dhirajnavghare.com/api/v1/public';
const PUBLIC_PROJECT_KEY =
  process.env.EXPO_PUBLIC_SANATAN_PROJECT_KEY || 'pk_live_7z3v2fjl8iwpxtn2';
const DEFAULT_TIMEOUT_MS = 10000;

export class ProjectApiError extends Error {
  public readonly code: 'OFFLINE_OR_TIMEOUT' | 'HTTP_ERROR' | 'INVALID_RESPONSE';
  public readonly status?: number;

  constructor(
    message: string,
    code: 'OFFLINE_OR_TIMEOUT' | 'HTTP_ERROR' | 'INVALID_RESPONSE',
    status?: number
  ) {
    super(message);
    this.name = 'ProjectApiError';
    this.code = code;
    this.status = status;
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => {
        controller.abort();
      }, timeoutMs)
    : null;

  try {
    return await fetch(url, {
      ...init,
      signal: controller ? controller.signal : init.signal,
    });
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    throw new ProjectApiError(
      isAbort
        ? 'Request timed out. Please check your internet connection and try again.'
        : 'Unable to connect. This screen requires an internet connection while core Panchang works 100% offline.',
      'OFFLINE_OR_TIMEOUT'
    );
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function parseJsonResponse<T>(response: Response, fallbackLabel: string): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Network error');
    throw new ProjectApiError(
      `${fallbackLabel} (${response.status}): ${errorText}`,
      'HTTP_ERROR',
      response.status
    );
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new ProjectApiError(`${fallbackLabel}: Invalid server response`, 'INVALID_RESPONSE');
  }
}

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

/**
 * 1. Submit User Feedback (POST /api/v1/public/feedback)
 */
export async function submitUserFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-project-key': PUBLIC_PROJECT_KEY,
    },
    body: JSON.stringify({
      ...payload,
      page_url: payload.page_url || 'android-app://cc.sanatan.app/feedback',
    }),
  });

  return parseJsonResponse<FeedbackResponse>(response, 'Feedback submission failed');
}

/**
 * 2. User-Reported Bug / Issue (POST /api/v1/public/issues)
 */
export async function submitReportedIssue(payload: IssuePayload): Promise<IssueResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-project-key': PUBLIC_PROJECT_KEY,
    },
    body: JSON.stringify({
      ...payload,
      page_url: payload.page_url || 'android-app://cc.sanatan.app/issues',
    }),
  });

  return parseJsonResponse<IssueResponse>(response, 'Issue submission failed');
}

/**
 * 3. Live Public Changelog (GET /api/v1/public/changelog)
 */
export async function fetchPublicChangelog(): Promise<ChangelogResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/changelog`, {
    method: 'GET',
    headers: {
      'x-project-key': PUBLIC_PROJECT_KEY,
    },
  });

  return parseJsonResponse<ChangelogResponse>(response, 'Failed to fetch changelog');
}

/**
 * 4. Project Contributors & Contributions (GET /api/v1/public/contributors)
 */
export async function fetchPublicContributors(): Promise<ContributorsResponse> {
  const response = await fetchWithTimeout(`${BASE_URL}/contributors`, {
    method: 'GET',
    headers: {
      'x-project-key': PUBLIC_PROJECT_KEY,
    },
  });

  return parseJsonResponse<ContributorsResponse>(response, 'Failed to fetch contributors');
}
