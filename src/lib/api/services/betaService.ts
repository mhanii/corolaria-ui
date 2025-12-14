/**
 * Beta Testing Service
 * 
 * API service layer for beta testing endpoints.
 * Provides token refill surveys and feedback.
 */

import { buildApiUrl } from '../config';
import { get, post } from '../client';
import {
    TestModeStatusResponse,
    SurveyQuestionsResponse,
    SurveyRequest,
    SurveyResponse,
    FeedbackRequest,
    FeedbackResponse,
} from '../types';

/**
 * Get beta test mode status for current user
 * 
 * @returns Promise with test mode status
 */
export async function getBetaStatus(): Promise<TestModeStatusResponse> {
    const endpoint = buildApiUrl('beta/status');
    return await get<TestModeStatusResponse>(endpoint);
}

/**
 * Get survey questions for token refill
 * 
 * @returns Promise with list of questions
 */
export async function getSurveyQuestions(): Promise<SurveyQuestionsResponse> {
    const endpoint = buildApiUrl('beta/survey/questions');
    return await get<SurveyQuestionsResponse>(endpoint);
}

/**
 * Submit survey responses to refill tokens
 * 
 * @param responses - Array of response strings matching question order
 * @returns Promise with tokens granted and new balance
 */
export async function submitSurvey(
    responses: string[]
): Promise<SurveyResponse> {
    const endpoint = buildApiUrl('beta/survey');
    const request: SurveyRequest = { responses };
    return await post<SurveyResponse, SurveyRequest>(endpoint, request);
}

/**
 * Submit feedback on a message
 * 
 * @param messageId - ID of the message being rated
 * @param conversationId - Conversation ID
 * @param feedbackType - Type of feedback (like/dislike/report)
 * @param comment - Optional comment
 * @returns Promise with feedback confirmation
 */
export async function submitFeedback(
    messageId: number,
    conversationId: string,
    feedbackType: 'like' | 'dislike' | 'report',
    comment?: string
): Promise<FeedbackResponse> {
    const endpoint = buildApiUrl('beta/feedback');
    const request: FeedbackRequest = {
        message_id: messageId,
        conversation_id: conversationId,
        feedback_type: feedbackType,
        comment: comment || null,
    };
    return await post<FeedbackResponse, FeedbackRequest>(endpoint, request);
}
