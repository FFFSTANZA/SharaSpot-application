/**
 * Routing API
 *
 * API calls for route planning feature.
 */

import { apiClient, API_ENDPOINTS } from '../../../shared/api';

export const routingApi = {
  async calculateRoute(origin: any, destination: any, options?: any) {
    return apiClient.post(API_ENDPOINTS.ROUTING.CALCULATE, {
      origin,
      destination,
      ...options,
    });
  },

  async getAlternatives(routeId: string) {
    return apiClient.get(API_ENDPOINTS.ROUTING.ALTERNATIVES, {
      params: { route_id: routeId }
    });
  },
};
