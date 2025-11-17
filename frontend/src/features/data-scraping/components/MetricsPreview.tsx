/**
 * Metrics Preview Component
 * Displays comprehensive metrics from scraped data
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScrapingMetricsResponse } from '../types';

interface MetricsPreviewProps {
  metrics: ScrapingMetricsResponse;
}

export const MetricsPreview: React.FC<MetricsPreviewProps> = ({ metrics }) => {
  const { summary, by_state, by_source, port_types, amenities, top_operators, data_quality } =
    metrics;

  const renderMetricCard = (title: string, value: string | number, subtitle?: string) => (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value.toLocaleString()}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderDataList = (title: string, data: Record<string, number> | Array<[string, number]>, limit: number = 10) => {
    const entries = Array.isArray(data) ? data : Object.entries(data);
    const sortedEntries = entries.slice(0, limit);

    return (
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>{title}</Text>
        {sortedEntries.map(([key, value], index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listItemLabel}>{key}</Text>
            <Text style={styles.listItemValue}>{value.toLocaleString()}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        {renderMetricCard('Total Stations', summary.total_stations)}
        {renderMetricCard('Total Ports', summary.total_ports)}
        {renderMetricCard('Available Ports', summary.total_available_ports)}
        {renderMetricCard('Avg Ports/Station', summary.average_ports_per_station.toFixed(1))}
      </View>

      {/* Data Richness */}
      <View style={styles.richnessSection}>
        <Text style={styles.sectionHeader}>📸 Data Richness</Text>
        <View style={styles.richnessGrid}>
          {renderMetricCard(
            'With Photos',
            summary.stations_with_photos,
            `${summary.coverage_percentage.with_photos.toFixed(1)}%`
          )}
          {renderMetricCard(
            'With Amenities',
            summary.stations_with_amenities,
            `${summary.coverage_percentage.with_amenities.toFixed(1)}%`
          )}
          {renderMetricCard(
            'High Uptime (>90%)',
            summary.high_uptime_stations,
            `${summary.coverage_percentage.high_uptime.toFixed(1)}%`
          )}
          {renderMetricCard(
            'Verified',
            summary.verified_stations,
            `${summary.coverage_percentage.verified.toFixed(1)}%`
          )}
        </View>
      </View>

      {/* State Distribution */}
      {renderDataList('🗺️ Top States', by_state, 15)}

      {/* Data Sources */}
      {renderDataList('📡 Data Sources', by_source)}

      {/* Port Types */}
      {renderDataList('🔌 Port Types', port_types)}

      {/* Top Operators */}
      {renderDataList('🏢 Top Operators', top_operators, 10)}

      {/* Amenities */}
      {renderDataList('🎁 Top Amenities', amenities, 10)}

      {/* Data Quality */}
      <View style={styles.qualitySection}>
        <Text style={styles.sectionHeader}>✅ Data Quality</Text>
        <View style={styles.qualityGrid}>
          {Object.entries(data_quality).map(([key, value], index) => (
            <View key={index} style={styles.qualityItem}>
              <Text style={styles.qualityValue}>{value.toLocaleString()}</Text>
              <Text style={styles.qualityLabel}>
                {key
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        Analysis generated at: {new Date(metrics.analysis_timestamp).toLocaleString()}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  metricTitle: {
    fontSize: 14,
    color: '#1B5E20',
    marginTop: 4,
    textAlign: 'center',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  richnessSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  richnessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listSection: {
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    marginBottom: 6,
  },
  listItemLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A86B',
  },
  qualitySection: {
    marginBottom: 20,
  },
  qualityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  qualityItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#E3F2FD',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  qualityValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  qualityLabel: {
    fontSize: 12,
    color: '#0D47A1',
    marginTop: 4,
    textAlign: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
});
