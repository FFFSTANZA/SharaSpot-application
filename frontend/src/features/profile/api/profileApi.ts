/**
 * Profile API
 *
 * API calls for profile management feature.
 */

import { apiClient, API_ENDPOINTS } from '../../../shared/api';

export const profileApi = {
  async getProfile() {
    return apiClient.get(API_ENDPOINTS.PROFILE.GET);
  },

  async updateProfile(data: any) {
    return apiClient.put(API_ENDPOINTS.PROFILE.UPDATE, data);
  },

  async getStats() {
    return apiClient.get(API_ENDPOINTS.PROFILE.STATS);
  },
};
