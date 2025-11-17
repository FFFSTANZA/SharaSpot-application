# Data Scraping Preview System

## Overview

The SharaSpot data scraping system now includes a powerful **Preview and Metrics** feature that allows you to review scraped data before importing it into the database.

## How It Works

### Old Workflow (Direct Import)
```
Scrape Data → Process → Import to DB
```

### New Workflow (Preview & Confirm)
```
Scrape Data → Process → Generate Metrics → Review → Confirm → Import to DB
                                           ↓
                                        Cancel
```

## Features

### 📊 Comprehensive Metrics

Before importing data, you get detailed statistics:

1. **Overall Summary**
   - Total charging stations collected
   - Total ports and available ports
   - Average ports per station
   - Stations with photos/amenities
   - High uptime stations
   - Verified stations

2. **Geographic Distribution**
   - Breakdown by state
   - Top cities
   - Coverage analysis

3. **Data Sources**
   - Count from each source
   - Source reliability metrics

4. **Port Types Analysis**
   - Distribution of charging port types
   - Popular combinations (e.g., "Type 2, CCS")

5. **Amenities Breakdown**
   - Most common amenities
   - Stations with parking, cafes, restrooms, etc.

6. **Operator Information**
   - Top charging network operators
   - Market share analysis

7. **Data Quality Metrics**
   - Complete vs incomplete records
   - Stations with contact info
   - Stations with websites
   - Verification levels

## Usage

### Backend API

#### Start a Scraping Job

```bash
POST /api/scraping/start
Content-Type: application/json

{
  "scrape_sources": ["openstreetmap", "open_charge_map"],  // Optional
  "skip_processing": false
}
```

Response:
```json
{
  "job_id": "uuid-here",
  "status": "pending",
  "message": "Scraping job started...",
  "started_at": "2025-01-17T10:00:00Z"
}
```

#### Check Job Status

```bash
GET /api/scraping/jobs/{job_id}
```

Response:
```json
{
  "job_id": "uuid-here",
  "status": "ready_for_review",
  "progress": 100,
  "current_step": "Ready for review",
  "metrics_available": true,
  "data_imported": false,
  ...
}
```

#### Get Metrics Preview

```bash
GET /api/scraping/jobs/{job_id}/metrics
```

Response:
```json
{
  "summary": {
    "total_stations": 5000,
    "total_ports": 12000,
    "stations_with_photos": 3500,
    ...
  },
  "by_state": {
    "Maharashtra": 1200,
    "Karnataka": 800,
    ...
  },
  "port_types": {
    "Type 2": 4000,
    "CCS": 3500,
    ...
  },
  ...
}
```

#### Confirm Import

```bash
POST /api/scraping/jobs/{job_id}/import
Content-Type: application/json

{
  "job_id": "uuid-here",
  "confirm": true,  // or false to cancel
  "notes": "Optional notes"
}
```

Response:
```json
{
  "status": "completed",
  "imported_count": 4850,
  "skipped_count": 120,
  "error_count": 30,
  "message": "Successfully imported 4850 stations"
}
```

### Frontend UI

The frontend provides a comprehensive dashboard:

1. **Jobs List** - View all scraping jobs with status
2. **Progress Tracking** - Real-time progress updates
3. **Metrics Dashboard** - Visual representation of all metrics
4. **One-Click Import** - Confirm or cancel with a single click

#### Navigate to Dashboard

```typescript
import { ScrapingDashboard } from '@/features/data-scraping';

// In your navigation/routing
<ScrapingDashboard />
```

### Command Line

You can also use the metrics analyzer directly:

```bash
cd data
python metrics_analyzer.py processed/processed_chargers.json
```

This will:
1. Load the processed data
2. Generate comprehensive metrics
3. Print a detailed summary to console
4. Save metrics to `processed/metrics.json`

## Job States

| State | Description |
|-------|-------------|
| `pending` | Job created, waiting to start |
| `scraping` | Currently scraping data from sources |
| `processing` | Processing and deduplicating data |
| `analyzing` | Generating metrics |
| `ready_for_review` | Metrics ready, waiting for confirmation |
| `importing` | Importing data to database |
| `completed` | Successfully completed |
| `failed` | Job failed with error |
| `cancelled` | User cancelled the import |

## Data Pipeline

### 1. Scraping Phase

Runs the selected scrapers (or all 8 sources):

- OpenStreetMap
- Open Charge Map
- Google Places
- HERE Maps
- TomTom
- Charging Networks (Tata Power, Ather, etc.)
- Community Data (Wikidata, GitHub)
- Public/Government Data

### 2. Processing Phase

- **Validation**: Checks required fields
- **Cleaning**: Normalizes names, addresses
- **Deduplication**: Removes duplicates within 50m radius
- **Merging**: Combines data from multiple sources

### 3. Analysis Phase

Runs the `metrics_analyzer.py` to generate comprehensive statistics.

### 4. Review Phase

User reviews metrics via:
- Web UI dashboard
- API endpoints
- CLI output

### 5. Confirmation Phase

User decides:
- ✅ **Confirm**: Import all data to database
- ❌ **Cancel**: Discard scraped data

### 6. Import Phase (if confirmed)

Data is imported using `db_importer.py` with:
- Duplicate detection by external_id
- Transaction safety
- Error handling

## File Structure

```
data/
├── metrics_analyzer.py              # NEW: Metrics generator
├── run_data_collection.py           # Orchestrator
├── data_processor.py                # Data processing
├── db_importer.py                   # Database import
├── processed/
│   ├── processed_chargers.json      # Processed data
│   ├── metrics.json                 # Generated metrics
│   └── jobs/                        # NEW: Job tracking
│       └── {job_id}.json            # Job state files

backend/app/
├── api/
│   └── scraping.py                  # NEW: Scraping API routes
├── services/
│   └── scraping_service.py          # NEW: Scraping job manager
└── schemas/
    └── scraping.py                  # NEW: Request/response schemas

frontend/src/features/
└── data-scraping/                   # NEW: Frontend feature
    ├── screens/
    │   └── scraping-dashboard.tsx   # Main dashboard
    ├── components/
    │   ├── MetricsPreview.tsx       # Metrics visualization
    │   ├── JobsList.tsx             # Jobs list
    │   └── StartJobModal.tsx        # Start job modal
    ├── api.ts                       # API client
    └── types.ts                     # TypeScript types
```

## Example Workflow

### Scenario: Import Fresh Data

1. **User starts a scraping job**
   ```
   Click "Start New Job" → Select sources → Start
   ```

2. **System scrapes data**
   ```
   Status: "scraping" → "processing" → "analyzing"
   Progress: 0% → 50% → 100%
   ```

3. **Metrics are generated**
   ```
   Total Stations: 5,234
   By State:
     Maharashtra: 1,245
     Karnataka: 892
     Tamil Nadu: 678
     ...

   Port Types:
     Type 2: 4,123
     CCS: 3,456
     CHAdeMO: 1,234

   Amenities:
     Parking: 3,456
     Cafe: 1,234
     ...
   ```

4. **User reviews metrics**
   - Checks total count
   - Verifies state distribution
   - Reviews data quality metrics

5. **User confirms or cancels**
   - ✅ Looks good → Click "Confirm & Import"
   - ❌ Issues found → Click "Cancel Import"

6. **System imports data** (if confirmed)
   ```
   Importing... 100%

   Results:
   ✅ Imported: 4,850 stations
   ⏭️ Skipped: 320 (duplicates)
   ❌ Errors: 64
   ```

## Benefits

1. **Data Validation** - Review before import prevents bad data
2. **Transparency** - See exactly what you're getting
3. **Quality Control** - Identify issues early
4. **Confidence** - Make informed decisions
5. **Flexibility** - Choose specific sources
6. **Audit Trail** - Track all imports

## Monitoring

The system automatically:
- Saves job states to disk
- Preserves metrics for future reference
- Tracks which jobs imported data
- Maintains audit logs

## Error Handling

If a job fails:
1. Status changes to "failed"
2. Error message is captured
3. Partial data is preserved
4. User can retry or start a new job

## Performance

- **Scraping**: 10-30 minutes (depends on sources)
- **Processing**: 2-5 minutes
- **Metrics**: < 1 minute
- **Import**: 5-10 minutes

## Best Practices

1. **Start small** - Test with 1-2 sources first
2. **Review carefully** - Check state distribution and data quality
3. **Cancel if unsure** - Better safe than importing bad data
4. **Monitor progress** - Dashboard auto-refreshes
5. **Save metrics** - Keep for comparison with future imports

## Future Enhancements

- [ ] Scheduled scraping jobs
- [ ] Comparison between jobs
- [ ] Incremental imports (only new data)
- [ ] Export metrics to PDF/CSV
- [ ] Email notifications
- [ ] Webhook support
- [ ] Advanced filtering before import

---

**Happy Scraping! 🚀**
