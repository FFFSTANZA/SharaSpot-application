# SharaSpot Data Collection System

Automated system for collecting EV charging station data across India from **legal sources only**.

## 🎯 Overview

This system collects charging station data from multiple legitimate sources:
- **Open Charge Map** - Open database with free API access
- **Google Places API** - Public charging station data
- **Government Open Data** - Public datasets from Indian government portals
- **Public operator websites** - With proper permissions and robots.txt compliance

**Target**: 10,000 - 50,000 charging stations across India

## 📁 Directory Structure

```
data/
├── raw/              # Raw scraped data (JSON)
├── processed/        # Cleaned and deduplicated data
├── logs/             # Execution logs
├── config.py         # Configuration settings
├── scraper_*.py      # Individual scrapers
├── data_processor.py # Data validation and deduplication
├── db_importer.py    # Database import pipeline
├── run_data_collection.py  # Main orchestrator
├── requirements.txt  # Python dependencies
└── README.md         # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd data
pip install -r requirements.txt
```

### 2. Configure API Keys (Optional but Recommended)

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```bash
# Free API key from https://openchargemap.org
OPEN_CHARGE_MAP_API_KEY=your_key_here

# Get from https://developers.google.com/maps/documentation/places/web-service/get-api-key
GOOGLE_PLACES_API_KEY=your_key_here

# Your database connection
DATABASE_URL=postgresql://user:password@localhost:5432/sharaspot
```

### 3. Run Data Collection

**Full Pipeline** (Scrape → Process → Import):
```bash
python run_data_collection.py
```

**Scrape Only**:
```bash
python run_data_collection.py --scrape-only
```

**Process Existing Data**:
```bash
python run_data_collection.py --process-only
```

**Import Existing Processed Data**:
```bash
python run_data_collection.py --import-only
```

## 🔧 Individual Scrapers

You can also run scrapers individually:

### Open Charge Map
```bash
python scraper_open_charge_map.py
```
- **Source**: https://openchargemap.org
- **Cost**: Free (3000 requests/day)
- **Coverage**: Global, includes India
- **Expected Data**: 2,000-5,000 stations in India

### Google Places
```bash
python scraper_google_places.py
```
- **Source**: Google Maps Platform
- **Cost**: Pay-per-request (free tier available)
- **Coverage**: Comprehensive Indian cities
- **Expected Data**: 5,000-15,000 stations
- **Note**: Requires API key

### Public Data
```bash
python scraper_public_data.py
```
- **Source**: Government portals, public datasets
- **Cost**: Free
- **Coverage**: Growing
- **Expected Data**: 500-2,000 stations

## 📊 Data Processing

### Validation
The system validates:
- Required fields (name, address, coordinates, port types)
- Coordinate validity (within India bounds)
- Port types and counts
- Data consistency

### Deduplication
Chargers are considered duplicates if:
- Within 50 meters of each other
- Similar names or addresses
- When found, data is merged intelligently

### Processing Pipeline
```bash
python data_processor.py
```

This will:
1. Load all raw data files
2. Validate each record
3. Remove invalid entries
4. Deduplicate across sources
5. Merge duplicate entries
6. Save to `processed/processed_chargers.json`

## 💾 Database Import

```bash
python db_importer.py [filepath]
```

Or specify the file:
```bash
python db_importer.py processed/processed_chargers.json
```

The importer:
- Connects to your PostgreSQL database
- Creates an admin user for imports
- Imports chargers (skips existing duplicates)
- Logs all operations
- Reports statistics

## 📈 Expected Results

### Data Volume
- **Open Charge Map**: 2,000-5,000 stations
- **Google Places**: 5,000-15,000 stations
- **Public Data**: 500-2,000 stations
- **After Deduplication**: 10,000-20,000 unique stations

### Data Quality
- **Verification Level**: 3-5 (scale of 1-5)
- **Source Type**: "official"
- **Completeness**: All required fields populated
- **Accuracy**: Validated coordinates, deduplicated

### Coverage
- All major Indian cities (50+ cities)
- Major highways and routes
- Urban and semi-urban areas
- Popular charging networks (Tata Power, Ather, IOCL, etc.)

## 🔐 Legal & Ethical Compliance

### ✅ Legal Sources Used
1. **Open Charge Map** - Open data, free API
2. **Google Places** - Licensed API with proper attribution
3. **Government Data** - Public open data portals
4. **Robots.txt Compliance** - All web scraping respects robots.txt

### ❌ NOT Used
- Unauthorized API scraping
- Terms of service violations
- Copyrighted databases without permission
- Private/restricted data sources

### Rate Limiting
- Default: 1 second between requests
- Configurable in `config.py`
- Respects API rate limits
- Prevents server overload

## 📝 Data Schema

Each charger includes:

```json
{
  "external_id": "ocm_12345",
  "name": "Tata Power EZ Charge - Location",
  "address": "Full address with city, state, pincode",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "port_types": ["Type 2", "CCS"],
  "total_ports": 4,
  "available_ports": 4,
  "source_type": "official",
  "verification_level": 4,
  "amenities": ["parking", "cafe", "restroom"],
  "nearby_amenities": ["shopping"],
  "photos": [],
  "notes": "Operator: Tata Power | Additional info",
  "uptime_percentage": 95.0,
  "data_source": "OpenChargeMap"
}
```

## 🛠️ Configuration

Edit `config.py` to customize:

- **Geographic bounds** - Define scraping area
- **Cities list** - Add/remove cities
- **Charging operators** - Track specific networks
- **Port type mapping** - Normalize port names
- **Rate limits** - Adjust delays
- **File paths** - Change output directories

## 📋 Logs

All operations are logged to `logs/` directory:
- `open_charge_map.log` - OCM scraper logs
- `google_places.log` - Google Places logs
- `public_data.log` - Public data logs
- `data_processor.log` - Processing logs
- `db_importer.log` - Import logs
- `data_collection_*.log` - Main orchestrator logs

## 🔍 Monitoring

Check progress:
```bash
tail -f logs/data_collection_*.log
```

View statistics:
```bash
cat logs/report_*.json
```

## ❓ Troubleshooting

### No Data Scraped
- Check API keys in `.env`
- Verify internet connection
- Check logs for errors

### Import Fails
- Verify database connection in `.env`
- Check PostgreSQL is running
- Ensure backend migrations are run

### Duplicates
- Normal! The system deduplicates across sources
- Check processing logs for deduplication stats

### API Rate Limits
- Increase `RATE_LIMIT_DELAY` in config.py
- Spread scraping over multiple runs
- Consider paid API tiers for higher limits

## 🚀 Advanced Usage

### Custom Cities
Edit `config.py` and modify `INDIAN_CITIES` list:

```python
INDIAN_CITIES.append({
    "name": "Your City",
    "lat": 12.34,
    "lon": 56.78,
    "radius": 25  # km
})
```

### Grid Search (Comprehensive)
For complete coverage, enable grid search in scrapers:

```python
# In scraper_open_charge_map.py
chargers = scraper.scrape_grid()  # Instead of scrape_by_cities()
```

⚠️ **Warning**: Grid search makes many more API calls!

### Scheduled Runs
Set up cron job for regular updates:

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/data && python run_data_collection.py >> logs/cron.log 2>&1
```

## 📊 API Key Setup

### Open Charge Map (Recommended)
1. Visit https://openchargemap.org
2. Create free account
3. Get API key from account settings
4. Free tier: 3000 requests/day

### Google Places (Optional, for better coverage)
1. Visit https://console.cloud.google.com
2. Create project
3. Enable "Places API"
4. Create credentials (API key)
5. Free tier: $200 credit/month
6. Cost: ~$0.032 per request after free tier

## 🤝 Contributing

To add new data sources:
1. Create `scraper_newsource.py`
2. Follow the template from existing scrapers
3. Ensure legal compliance
4. Add to `run_data_collection.py`

## 📜 License

This data collection system is for the SharaSpot application. Scraped data is subject to the terms and licenses of the respective sources.

## ⚠️ Important Notes

1. **API Costs**: Google Places API has costs. Monitor usage!
2. **Data Freshness**: Run regularly to keep data updated
3. **Verification**: Collected data should be verified by users
4. **Privacy**: Ensure compliance with data protection laws
5. **Attribution**: Credit data sources where required

## 📞 Support

For issues or questions:
- Check logs in `logs/` directory
- Review configuration in `config.py`
- Ensure all dependencies are installed
- Verify database connectivity

## 🎯 Next Steps

After collecting data:
1. **Verify**: Use the app's verification system
2. **Enrich**: Users contribute photos and reviews
3. **Update**: Run collection regularly for new stations
4. **Monitor**: Track data quality metrics
5. **Expand**: Add more legal data sources

---

**Last Updated**: November 2024
**Version**: 1.0.0
