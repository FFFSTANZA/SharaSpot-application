# 🚀 Quick Start Guide

## Get 25,000-50,000 EV Charging Stations in 3 Steps!

### 🌟 Comprehensive Multi-Source Data Collection
**8 Data Sources** • **50+ Cities** • **All Major Networks** • **100% Legal**

## Step 1: Install Dependencies ⚙️

```bash
cd data
pip install -r requirements.txt
```

## Step 2: Configure (Optional) 🔑

For better results, get free API keys:

**Open Charge Map** (Recommended - Free):
1. Go to https://openchargemap.org
2. Sign up (free)
3. Get API key from settings

**Google Places** (Optional - Better coverage):
1. Go to https://console.cloud.google.com
2. Create project
3. Enable Places API
4. Get API key

Then configure:
```bash
cp .env.example .env
nano .env  # Add your API keys
```

## Step 3: Run! 🎯

```bash
python run_data_collection.py
```

That's it! The system will scrape from **8 comprehensive sources**:
1. ✅ OpenStreetMap Overpass API (FREE - No key needed!)
2. ✅ Open Charge Map (FREE API - 3000 req/day)
3. ✅ Google Places (if API key provided)
4. ✅ HERE Maps (if API key provided - 250k req/month FREE)
5. ✅ TomTom (if API key provided - 2500 req/day FREE)
6. ✅ Indian Charging Networks (Tata, Ather, Statiq, IOCL, BPCL...)
7. ✅ Community Data (Wikidata, GitHub datasets)
8. ✅ Government Data (data.gov.in, Ministry of Power)

Then it will:
9. ✅ Validate and clean all data
10. ✅ Remove duplicates intelligently
11. ✅ Import into your PostgreSQL database

## Expected Results 📊

- **Runtime**: 45-90 minutes (depending on API keys)
- **Data Volume**: 25,000-50,000 unique charging stations
- **Coverage**: All major Indian cities + highways + rural areas
- **Quality**: Multi-source validated, deduplicated, production-ready
- **Sources**: 8 different data sources combined

## Monitoring Progress 👀

Watch the logs in real-time:
```bash
tail -f logs/data_collection_*.log
```

## What You'll Get 🎁

After completion, your database will have:
- ✅ Charging station names and addresses
- ✅ GPS coordinates (validated for India)
- ✅ Port types (Type 2, CCS, CHAdeMO, etc.)
- ✅ Number of ports
- ✅ Amenities (parking, cafe, restroom, etc.)
- ✅ Operator information
- ✅ Verification levels

## Next Steps 🔜

1. **Test the app** - Launch your frontend and see the stations on the map
2. **Verify data** - Users can verify stations and earn rewards
3. **Add photos** - Users upload photos for each station
4. **Update regularly** - Run the script weekly/monthly for new stations

## Need Help? 🆘

Check the full [README.md](README.md) for:
- Detailed documentation
- Troubleshooting guide
- Advanced configuration
- Individual scraper usage
- API cost information

## Pro Tips 💡

1. **Run overnight** - It takes time, let it run while you sleep
2. **Check logs** - If something fails, logs tell you exactly what
3. **Start simple** - Run without API keys first to test
4. **Add API keys later** - For 10x more data
5. **Schedule updates** - Set up cron job for weekly updates

---

**Ready to collect 25,000-50,000 charging stations? Run:**
```bash
python run_data_collection.py
```

## 📋 All Data Sources

See [DATA_SOURCES.md](DATA_SOURCES.md) for complete details on all 17+ data sources including:
- OpenStreetMap (FREE)
- Open Charge Map (FREE)
- Google Places, HERE Maps, TomTom
- Tata Power, Ather Grid, Statiq, IOCL, BPCL
- Wikidata, GitHub datasets
- Government open data portals

---

**🎯 Goal**: 50,000 charging stations covering all of India
**💰 Cost**: $0 (using free tiers)
**⏱️ Time**: 60-90 minutes
**📦 Result**: Production-ready EV charging database
