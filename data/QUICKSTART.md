# 🚀 Quick Start Guide

Get 10,000-50,000 EV charging stations into your database in 3 simple steps!

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

That's it! The system will:
1. ✅ Scrape data from Open Charge Map (free)
2. ✅ Scrape data from Google Places (if API key provided)
3. ✅ Scrape data from public sources
4. ✅ Validate and clean all data
5. ✅ Remove duplicates
6. ✅ Import into your database

## Expected Results 📊

- **Runtime**: 30-60 minutes (depending on API keys)
- **Data Volume**: 10,000-20,000 unique charging stations
- **Coverage**: All major Indian cities + highways
- **Quality**: Validated, deduplicated, ready to use

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

**Ready to collect 10,000+ charging stations? Run:**
```bash
python run_data_collection.py
```
