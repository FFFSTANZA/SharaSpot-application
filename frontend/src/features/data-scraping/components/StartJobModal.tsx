/**
 * Start Job Modal Component
 * Modal for configuring and starting a new scraping job
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SCRAPER_SOURCES } from '../types';

interface StartJobModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: (selectedSources?: string[]) => void;
}

export const StartJobModal: React.FC<StartJobModalProps> = ({
  visible,
  onClose,
  onStart,
}) => {
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [scrapeAll, setScrapeAll] = useState(true);

  const toggleSource = (sourceId: string) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId);
    } else {
      newSelected.add(sourceId);
    }
    setSelectedSources(newSelected);
  };

  const handleStart = () => {
    if (scrapeAll) {
      onStart();
    } else {
      onStart(Array.from(selectedSources));
    }
  };

  const isStartDisabled = !scrapeAll && selectedSources.size === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Start New Scraping Job</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {/* Scrape All Toggle */}
            <View style={styles.option}>
              <View style={styles.optionHeader}>
                <Text style={styles.optionTitle}>Scrape All Sources</Text>
                <Switch
                  value={scrapeAll}
                  onValueChange={setScrapeAll}
                  trackColor={{ false: '#767577', true: '#81C784' }}
                  thumbColor={scrapeAll ? '#4CAF50' : '#f4f3f4'}
                />
              </View>
              <Text style={styles.optionDescription}>
                Enable to scrape data from all available sources. Disable to select specific sources.
              </Text>
            </View>

            {/* Source Selection */}
            {!scrapeAll && (
              <View style={styles.sourcesSection}>
                <Text style={styles.sourcesTitle}>Select Data Sources</Text>
                <Text style={styles.sourcesSubtitle}>
                  Choose which sources to scrape data from:
                </Text>

                {SCRAPER_SOURCES.map((source) => (
                  <TouchableOpacity
                    key={source.id}
                    style={[
                      styles.sourceItem,
                      selectedSources.has(source.id) && styles.sourceItemSelected,
                    ]}
                    onPress={() => toggleSource(source.id)}
                  >
                    <View style={styles.sourceInfo}>
                      <Text style={styles.sourceName}>{source.name}</Text>
                      <Text style={styles.sourceType}>
                        {source.free ? '✅ Free' : '💳 Paid API'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        selectedSources.has(source.id) && styles.checkboxChecked,
                      ]}
                    >
                      {selectedSources.has(source.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Info Panel */}
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelTitle}>ℹ️ What happens next?</Text>
              <Text style={styles.infoPanelText}>
                1. Data will be scraped from selected sources{'\n'}
                2. Data will be processed and deduplicated{'\n'}
                3. Comprehensive metrics will be generated{'\n'}
                4. You'll review the metrics before importing{'\n'}
                5. Confirm to push data to the database
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.startButton,
                isStartDisabled && styles.startButtonDisabled,
              ]}
              onPress={handleStart}
              disabled={isStartDisabled}
            >
              <Text style={styles.startButtonText}>Start Scraping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#999',
  },
  content: {
    padding: 20,
  },
  option: {
    marginBottom: 20,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  sourcesSection: {
    marginBottom: 20,
  },
  sourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  sourcesSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  sourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sourceItemSelected: {
    borderColor: '#00A86B',
    backgroundColor: '#E8F5E9',
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  sourceType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00A86B',
    borderColor: '#00A86B',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoPanel: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  infoPanelTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  infoPanelText: {
    fontSize: 14,
    color: '#0D47A1',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  startButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#00A86B',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
