/**
 * API service for data scraping operations
 */

import { apiClient } from '../../shared/api/client';
import {
  ScrapingJobRequest,
  ScrapingJobResponse,
  ScrapingJobStatus,
  ScrapingMetricsResponse,
  ImportConfirmationRequest,
  ImportConfirmationResponse,
} from './types';

const BASE_PATH = '/api/scraping';

/**
 * Start a new data scraping job
 */
export const startScrapingJob = async (
  request: ScrapingJobRequest = {}
): Promise<ScrapingJobResponse> => {
  return apiClient.post<ScrapingJobResponse>(`${BASE_PATH}/start`, request);
};

/**
 * Get list of scraping jobs
 */
export const getScrapingJobs = async (limit: number = 10): Promise<ScrapingJobStatus[]> => {
  return apiClient.get<ScrapingJobStatus[]>(`${BASE_PATH}/jobs?limit=${limit}`);
};

/**
 * Get status of a specific job
 */
export const getScrapingJobStatus = async (jobId: string): Promise<ScrapingJobStatus> => {
  return apiClient.get<ScrapingJobStatus>(`${BASE_PATH}/jobs/${jobId}`);
};

/**
 * Get metrics for a scraping job
 */
export const getScrapingMetrics = async (jobId: string): Promise<ScrapingMetricsResponse> => {
  return apiClient.get<ScrapingMetricsResponse>(`${BASE_PATH}/jobs/${jobId}/metrics`);
};

/**
 * Confirm and import scraped data
 */
export const confirmImport = async (
  request: ImportConfirmationRequest
): Promise<ImportConfirmationResponse> => {
  return apiClient.post<ImportConfirmationResponse>(
    `${BASE_PATH}/jobs/${request.job_id}/import`,
    request
  );
};

/**
 * Cancel a scraping job
 */
export const cancelScrapingJob = async (jobId: string): Promise<{ message: string }> => {
  return apiClient.delete<{ message: string }>(`${BASE_PATH}/jobs/${jobId}`);
};
