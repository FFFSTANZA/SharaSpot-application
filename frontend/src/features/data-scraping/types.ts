/**
 * Types for Data Scraping feature
 */

export interface ScrapingJobRequest {
  scrape_sources?: string[];
  skip_processing?: boolean;
}

export interface ScrapingJobResponse {
  job_id: string;
  status: string;
  message: string;
  started_at: string;
}

export interface ScrapingMetricsSummary {
  total_stations: number;
  total_ports: number;
  total_available_ports: number;
  average_ports_per_station: number;
  stations_with_photos: number;
  stations_with_amenities: number;
  high_uptime_stations: number;
  verified_stations: number;
  coverage_percentage: {
    with_photos: number;
    with_amenities: number;
    high_uptime: number;
    verified: number;
  };
}

export interface ScrapingMetricsResponse {
  job_id: string;
  summary: ScrapingMetricsSummary;
  by_state: Record<string, number>;
  by_source: Record<string, number>;
  port_types: Record<string, number>;
  port_combinations: Record<string, number>;
  amenities: Record<string, number>;
  operators: Record<string, number>;
  verification_distribution: Record<string, number>;
  data_quality: Record<string, number>;
  top_states: Array<[string, number]>;
  top_operators: Array<[string, number]>;
  analysis_timestamp: string;
}

export interface ImportConfirmationRequest {
  job_id: string;
  confirm: boolean;
  notes?: string;
}

export interface ImportConfirmationResponse {
  job_id: string;
  status: string;
  imported_count: number;
  skipped_count: number;
  error_count: number;
  message: string;
  completed_at: string;
}

export type ScrapingJobStatusType =
  | 'pending'
  | 'scraping'
  | 'processing'
  | 'analyzing'
  | 'ready_for_review'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ScrapingJobStatus {
  job_id: string;
  user_id: string;
  user_email: string;
  status: ScrapingJobStatusType;
  progress: number;
  current_step: string;
  started_at: string;
  completed_at?: string;
  error?: string;
  metrics_available: boolean;
  data_imported: boolean;
}

export const SCRAPER_SOURCES = [
  { id: 'openstreetmap', name: 'OpenStreetMap', free: true },
  { id: 'open_charge_map', name: 'Open Charge Map', free: true },
  { id: 'google_places', name: 'Google Places', free: false },
  { id: 'here_maps', name: 'HERE Maps', free: true },
  { id: 'tomtom', name: 'TomTom', free: true },
  { id: 'charging_networks', name: 'Charging Networks', free: true },
  { id: 'community_data', name: 'Community Data', free: true },
  { id: 'public_data', name: 'Public/Government Data', free: true },
] as const;
