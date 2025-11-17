/**
 * Data Scraping Dashboard Screen
 * Shows metrics preview and allows data import confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  getScrapingJobs,
  startScrapingJob,
  getScrapingJobStatus,
  getScrapingMetrics,
  confirmImport,
} from '../api';
import {
  ScrapingJobStatus,
  ScrapingMetricsResponse,
  SCRAPER_SOURCES,
  ScrapingJobStatusType,
} from '../types';
import { MetricsPreview } from '../components/MetricsPreview';
import { JobsList } from '../components/JobsList';
import { StartJobModal } from '../components/StartJobModal';

export const ScrapingDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<ScrapingJobStatus[]>([]);
  const [selectedJob, setSelectedJob] = useState<ScrapingJobStatus | null>(null);
  const [metrics, setMetrics] = useState<ScrapingMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadJobs();
    // Poll for updates every 5 seconds if there's an active job
    const interval = setInterval(() => {
      if (jobs.some((j) => ['pending', 'scraping', 'processing', 'analyzing', 'importing'].includes(j.status))) {
        loadJobs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-select the most recent job
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs]);

  useEffect(() => {
    // Load metrics when a ready job is selected
    if (selectedJob && selectedJob.metrics_available && selectedJob.status === 'ready_for_review') {
      loadMetrics(selectedJob.job_id);
    } else {
      setMetrics(null);
    }
  }, [selectedJob]);

  const loadJobs = async () => {
    try {
      const jobsList = await getScrapingJobs(20);
      setJobs(jobsList);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMetrics = async (jobId: string) => {
    try {
      const metricsData = await getScrapingMetrics(jobId);
      setMetrics(metricsData);
    } catch (error: any) {
      console.error('Error loading metrics:', error);
      Alert.alert('Error', error.message || 'Failed to load metrics');
    }
  };

  const handleStartJob = async (selectedSources?: string[]) => {
    try {
      setShowStartModal(false);
      const response = await startScrapingJob({
        scrape_sources: selectedSources,
      });

      Alert.alert('Success', response.message);
      loadJobs();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start scraping job');
    }
  };

  const handleConfirmImport = async (confirm: boolean) => {
    if (!selectedJob) return;

    if (confirm) {
      Alert.alert(
        'Confirm Import',
        `This will import ${metrics?.summary.total_stations || 0} charging stations into the database. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'default',
            onPress: async () => {
              try {
                setImporting(true);
                const result = await confirmImport({
                  job_id: selectedJob.job_id,
                  confirm: true,
                });

                Alert.alert(
                  'Import Complete',
                  `Successfully imported ${result.imported_count} stations!\n` +
                    `Skipped: ${result.skipped_count}\n` +
                    `Errors: ${result.error_count}`
                );

                loadJobs();
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to import data');
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Cancel Import', 'Are you sure you want to discard this scraped data?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Discard',
          style: 'destructive',
          onPress: async () => {
            try {
              setImporting(true);
              await confirmImport({
                job_id: selectedJob.job_id,
                confirm: false,
              });

              Alert.alert('Cancelled', 'Import cancelled and data discarded');
              loadJobs();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel import');
            } finally {
              setImporting(false);
            }
          },
        },
      ]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const getStatusColor = (status: ScrapingJobStatusType): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'cancelled':
        return '#9E9E9E';
      case 'ready_for_review':
        return '#2196F3';
      case 'importing':
      case 'scraping':
      case 'processing':
      case 'analyzing':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
        <Text style={styles.loadingText}>Loading scraping dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Data Scraping Dashboard</Text>
        <TouchableOpacity style={styles.startButton} onPress={() => setShowStartModal(true)}>
          <Text style={styles.startButtonText}>+ Start New Job</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Jobs List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          <JobsList
            jobs={jobs}
            selectedJob={selectedJob}
            onSelectJob={setSelectedJob}
            getStatusColor={getStatusColor}
          />
        </View>

        {/* Selected Job Details */}
        {selectedJob && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Details</Text>

            <View style={styles.jobDetail}>
              <View style={styles.jobHeader}>
                <View>
                  <Text style={styles.jobId}>Job ID: {selectedJob.job_id.substring(0, 8)}...</Text>
                  <Text style={styles.jobDate}>
                    Started: {new Date(selectedJob.started_at).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(selectedJob.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{selectedJob.status.toUpperCase()}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              {['pending', 'scraping', 'processing', 'analyzing', 'importing'].includes(
                selectedJob.status
              ) && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${selectedJob.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {selectedJob.current_step} - {Math.round(selectedJob.progress)}%
                  </Text>
                </View>
              )}

              {selectedJob.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Error: {selectedJob.error}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Metrics Preview */}
        {metrics && selectedJob?.status === 'ready_for_review' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Scraping Metrics Preview</Text>
            <MetricsPreview metrics={metrics} />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => handleConfirmImport(false)}
                disabled={importing}
              >
                <Text style={styles.buttonText}>❌ Cancel Import</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={() => handleConfirmImport(true)}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>✅ Confirm & Import</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {jobs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No scraping jobs yet</Text>
            <Text style={styles.emptySubtext}>
              Start a new job to begin scraping charging station data
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Start Job Modal */}
      {showStartModal && (
        <StartJobModal
          visible={showStartModal}
          onClose={() => setShowStartModal(false)}
          onStart={handleStartJob}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  startButton: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  jobDetail: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  jobDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00A86B',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
