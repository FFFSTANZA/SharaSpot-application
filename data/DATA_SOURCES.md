# Data Sources Overview

Complete list of all data sources used in the SharaSpot data collection system.

## 🌍 Public APIs & Open Data

### 1. OpenStreetMap (Overpass API) ⭐ **FREE**
- **Website**: https://www.openstreetmap.org
- **API**: https://overpass-api.de
- **Cost**: FREE - Community maintained
- **Requirements**: None (No API key needed)
- **Rate Limit**: Reasonable use (3-5 second delays recommended)
- **Coverage**: Global, including India
- **Expected Data**: 5,000-10,000 stations
- **Quality**: High (community verified)
- **Data Freshness**: Real-time updates
- **Scraper**: `scraper_openstreetmap.py`

### 2. Open Charge Map ⭐ **FREE**
- **Website**: https://openchargemap.org
- **API**: https://api.openchargemap.io
- **Cost**: FREE (API key recommended)
- **Requirements**: Free account (optional)
- **Rate Limit**: 3,000 requests/day (with API key)
- **Coverage**: Global, India included
- **Expected Data**: 2,000-5,000 stations
- **Quality**: Very High (verified submissions)
- **Data Freshness**: Regularly updated
- **Scraper**: `scraper_open_charge_map.py`

### 3. Google Places API 💰 **PAID (Free Tier Available)**
- **Website**: https://developers.google.com/maps/documentation/places
- **Cost**: Pay-per-request (Free $200/month credit)
- **Requirements**: Google Cloud account, API key
- **Rate Limit**: Based on billing
- **Coverage**: Excellent India coverage
- **Expected Data**: 10,000-20,000 stations
- **Quality**: Very High (Google verified)
- **Cost per Request**: ~$0.032
- **Free Tier**: $200 credit = ~6,250 requests
- **Scraper**: `scraper_google_places.py`

### 4. HERE Maps EV Charging API 💰 **FREE TIER**
- **Website**: https://developer.here.com
- **API**: https://developer.here.com/documentation/charging-stations
- **Cost**: FREE tier available
- **Requirements**: HERE developer account
- **Rate Limit**: 250,000 requests/month (free)
- **Coverage**: Good India coverage
- **Expected Data**: 3,000-8,000 stations
- **Quality**: High (commercial data)
- **Scraper**: `scraper_here_maps.py`

### 5. TomTom EV Charging API 💰 **FREE TIER**
- **Website**: https://developer.tomtom.com
- **API**: https://developer.tomtom.com/search-api
- **Cost**: FREE tier available
- **Requirements**: TomTom developer account
- **Rate Limit**: 2,500 requests/day (free)
- **Coverage**: Good India coverage
- **Expected Data**: 2,000-6,000 stations
- **Quality**: High (commercial data)
- **Scraper**: `scraper_tomtom.py`

## 🏢 Indian Charging Network Operators

### 6. Tata Power EZ Charge
- **Network**: Largest EV charging network in India
- **Website**: https://www.tatapowerezcharge.com
- **Coverage**: 300+ cities across India
- **Stations**: 5,000+ charging points
- **Note**: Public data / partnership opportunity
- **Scraper**: `scraper_charging_networks.py`

### 7. Ather Grid
- **Network**: Ather Energy's charging network
- **Website**: https://www.athergrid.com
- **Coverage**: Major cities (Bangalore focus)
- **Stations**: 1,400+ charge points
- **Note**: Fast growing network
- **Scraper**: `scraper_charging_networks.py`

### 8. Statiq
- **Network**: Leading DC fast charging network
- **Website**: https://www.statiq.in
- **Coverage**: 50+ cities
- **Stations**: 1,000+ charging points
- **Note**: Highway and city network
- **Scraper**: `scraper_charging_networks.py`

### 9. Indian Oil (IOCL)
- **Network**: Government oil company network
- **Coverage**: Nationwide at petrol pumps
- **Stations**: 10,000+ planned
- **Note**: Rapidly expanding
- **Scraper**: `scraper_charging_networks.py`

### 10. Bharat Petroleum (BPCL)
- **Network**: Government oil company network
- **Coverage**: Nationwide
- **Stations**: Growing network
- **Scraper**: `scraper_charging_networks.py`

### 11. ChargeZone
- **Network**: EV charging infrastructure provider
- **Coverage**: Multiple cities
- **Stations**: 500+ points
- **Scraper**: `scraper_charging_networks.py`

### 12. Magenta Power
- **Network**: Home and public charging
- **Coverage**: Mumbai, Pune, Bangalore
- **Stations**: 1,000+ points
- **Scraper**: `scraper_charging_networks.py`

### Others
- Fortum Charge & Drive
- Exicom
- Delta Electronics
- Kazam EV
- Reliance BP

## 🌐 Community & Open Data

### 13. Wikidata SPARQL
- **Source**: https://www.wikidata.org
- **API**: https://query.wikidata.org
- **Cost**: FREE
- **Data Type**: Community-contributed structured data
- **Coverage**: Variable (growing)
- **Expected Data**: 100-500 stations
- **Quality**: Medium-High (community verified)
- **Scraper**: `scraper_community_data.py`

### 14. GitHub Open Datasets
- **Source**: Various GitHub repositories
- **Cost**: FREE
- **Data Type**: Community-shared datasets
- **Coverage**: Variable
- **Expected Data**: 200-1,000 stations
- **Quality**: Medium (varies by source)
- **Scraper**: `scraper_community_data.py`

### 15. Government Open Data Portal
- **Source**: https://data.gov.in
- **Cost**: FREE
- **Data Type**: Government published data
- **Coverage**: Official government stations
- **Expected Data**: 500-2,000 stations
- **Quality**: High (official data)
- **Scraper**: `scraper_public_data.py`

### 16. Ministry of Power Data
- **Source**: https://powermin.gov.in
- **Cost**: FREE
- **Data Type**: Official government data
- **Coverage**: All approved charging stations
- **Expected Data**: 1,000-3,000 stations
- **Quality**: Very High (official)
- **Scraper**: `scraper_public_data.py`

### 17. NITI Aayog Reports
- **Source**: https://www.niti.gov.in
- **Cost**: FREE
- **Data Type**: Policy documents and data
- **Coverage**: Strategic locations
- **Expected Data**: 200-500 stations
- **Quality**: High (official planning data)
- **Scraper**: `scraper_public_data.py`

## 📊 Expected Total Data

### By Source Type
- **Free APIs**: 15,000-30,000 stations
- **Paid APIs (free tier)**: 15,000-35,000 stations
- **Network Operators**: 5,000-10,000 stations
- **Community Data**: 500-2,000 stations
- **Government Data**: 1,500-5,000 stations

### After Deduplication
- **Unique Stations**: 25,000-50,000
- **Coverage**: All major cities + highways
- **Completeness**: 90%+ of public charging infrastructure

## 🎯 Data Quality Levels

### Verification Levels (1-5)
- **Level 5**: Multiple source verification + recent update
- **Level 4**: Single authoritative source (Google, HERE, OCM)
- **Level 3**: Community verified or network operator data
- **Level 2**: Single community submission
- **Level 1**: Unverified submission

### Source Reliability Ranking
1. **Tier 1 (Most Reliable)**: Google Places, Open Charge Map, OSM
2. **Tier 2 (Very Reliable)**: HERE Maps, TomTom, Network Operators
3. **Tier 3 (Reliable)**: Government Data, Wikidata
4. **Tier 4 (Useful)**: GitHub Datasets, Community Submissions

## 🔑 API Key Setup Guide

### Required (Recommended for 30,000+ stations)
1. **Open Charge Map** - FREE, easy signup
2. **Google Places** - $200 free credit
3. **OpenStreetMap** - No key needed!

### Optional (for 50,000+ stations)
4. **HERE Maps** - 250k requests/month free
5. **TomTom** - 2,500 requests/day free

### Partnership Opportunities
- **Tata Power** - Contact for B2B data sharing
- **Ather Grid** - API partnership
- **Statiq** - Data collaboration
- **IOCL/BPCL** - Government data sharing

## 📈 Estimated API Costs

### Free Tier (0 cost)
- OpenStreetMap: Unlimited (community)
- Open Charge Map: 3,000 req/day
- HERE Maps: 250,000 req/month
- TomTom: 2,500 req/day
- **Total Free Coverage**: 20,000-35,000 stations

### With Google Places ($0-200)
- Use free $200 credit
- ~6,000 charging station searches
- **Additional Coverage**: +10,000-15,000 stations

### Full Collection ($0-200/month)
- All free APIs + Google free tier
- **Total Coverage**: 30,000-50,000 stations
- **Cost**: $0 (within free tiers)

## ⚖️ Legal Compliance

### ✅ All Sources are Legal
- Free APIs with proper attribution
- Licensed commercial APIs
- Public government data
- Community open data
- Robots.txt compliance for web scraping

### 🤝 Terms of Service
All scrapers respect:
- API rate limits
- Terms of service
- Attribution requirements
- Data usage policies

### 📜 Attributions Required
- OpenStreetMap: © OpenStreetMap contributors
- Open Charge Map: © Open Charge Map contributors
- Google Places: Google Maps Platform
- HERE Maps: © HERE Technologies
- TomTom: © TomTom

## 🔄 Data Update Frequency

### Recommended Schedule
- **Daily**: Fast-growing networks (Tata, Ather)
- **Weekly**: API sources (Google, HERE, TomTom)
- **Bi-weekly**: Community sources (OSM, Wikidata)
- **Monthly**: Government data

### Automated Updates
Set up cron jobs for regular updates:
```bash
# Daily at 2 AM
0 2 * * * cd /path/to/data && python run_data_collection.py
```

## 📞 Support & Partnerships

### For More Data
Contact these networks for official partnerships:
- Tata Power: business@tatapowerddl.com
- Ather Grid: support@atherenergy.com
- Statiq: support@statiq.in
- IOCL: customer.relations@indianoil.in

### API Support
- Google: https://console.cloud.google.com/support
- HERE: https://developer.here.com/help
- TomTom: https://developer.tomtom.com/support
- Open Charge Map: https://openchargemap.org/site/develop

---

**Last Updated**: November 2024
**Total Sources**: 17+ data sources
**Expected Stations**: 25,000-50,000 unique charging stations
**Coverage**: All of India
