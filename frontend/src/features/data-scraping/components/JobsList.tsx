/**
 * Jobs List Component
 * Displays list of scraping jobs with status
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { ScrapingJobStatus, ScrapingJobStatusType } from '../types';

interface JobsListProps {
  jobs: ScrapingJobStatus[];
  selectedJob: ScrapingJobStatus | null;
  onSelectJob: (job: ScrapingJobStatus) => void;
  getStatusColor: (status: ScrapingJobStatusType) => string;
}

export const JobsList: React.FC<JobsListProps> = ({
  jobs,
  selectedJob,
  onSelectJob,
  getStatusColor,
}) => {
  const renderJob = ({ item }: { item: ScrapingJobStatus }) => {
    const isSelected = selectedJob?.job_id === item.job_id;

    return (
      <TouchableOpacity
        style={[styles.jobItem, isSelected && styles.jobItemSelected]}
        onPress={() => onSelectJob(item)}
      >
        <View style={styles.jobInfo}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobIdText}>
              {item.job_id.substring(0, 8)}...
            </Text>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
          </View>

          <Text style={styles.jobStatus}>
            {item.status.replace(/_/g, ' ').toUpperCase()}
          </Text>

          <Text style={styles.jobDate}>
            {new Date(item.started_at).toLocaleDateString()} at{' '}
            {new Date(item.started_at).toLocaleTimeString()}
          </Text>

          {/* Progress indicator for active jobs */}
          {['pending', 'scraping', 'processing', 'analyzing', 'importing'].includes(item.status) && (
            <View style={styles.miniProgressContainer}>
              <View style={styles.miniProgressBar}>
                <View
                  style={[
                    styles.miniProgressFill,
                    { width: `${item.progress}%` },
                  ]}
                />
              </View>
              <Text style={styles.miniProgressText}>
                {Math.round(item.progress)}%
              </Text>
            </View>
          )}

          {/* Completion info */}
          {item.data_imported && (
            <Text style={styles.importedLabel}>✅ Data Imported</Text>
          )}

          {item.error && (
            <Text style={styles.errorLabel} numberOfLines={1}>
              ❌ {item.error}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (jobs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No jobs yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      renderItem={renderJob}
      keyExtractor={(item) => item.job_id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: 8,
  },
  jobItem: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  jobItemSelected: {
    borderColor: '#00A86B',
    backgroundColor: '#E8F5E9',
  },
  jobInfo: {
    gap: 6,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'monospace',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  jobStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  jobDate: {
    fontSize: 12,
    color: '#888',
  },
  miniProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  miniProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#00A86B',
  },
  miniProgressText: {
    fontSize: 11,
    color: '#666',
    minWidth: 35,
  },
  importedLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  errorLabel: {
    fontSize: 12,
    color: '#F44336',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
