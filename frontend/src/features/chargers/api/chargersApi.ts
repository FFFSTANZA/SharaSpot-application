/**
 * Chargers API
 *
 * API calls for charger management feature.
 */

import { apiClient, API_ENDPOINTS } from '../../../shared/api';

export const chargersApi = {
  async getNearby(lat: number, lng: number, radius: number = 5000) {
    return apiClient.get(API_ENDPOINTS.CHARGERS.NEARBY, {
      params: { lat, lng, radius }
    });
  },

  async getDetails(id: string) {
    return apiClient.get(API_ENDPOINTS.CHARGERS.DETAILS(id));
  },

  async create(data: any) {
    return apiClient.post(API_ENDPOINTS.CHARGERS.CREATE, data);
  },

  async verify(id: string, data: any) {
    return apiClient.post(API_ENDPOINTS.CHARGERS.VERIFY(id), data);
  },

  async uploadPhoto(id: string, photo: Blob) {
    return apiClient.upload(
      API_ENDPOINTS.CHARGERS.PHOTOS(id),
      photo,
      'photo'
    );
  },
};
