# How to Run SharaSpot Application

## Overview

**SharaSpot** is an EV Charging Aggregator App with the tagline "Whether you drive, Charge Nearby". The application consists of:
- **Frontend**: React Native + Expo mobile application
- **Backend**: FastAPI + MongoDB REST API

---

## Prerequisites

### System Requirements
- **Node.js**: v18.x or higher
- **Python**: 3.10 or higher
- **MongoDB**: 6.0 or higher (local or Atlas cloud)
- **Yarn**: 1.22.x (package manager)
- **Expo CLI**: Latest version
- **iOS Simulator** (macOS) or **Android Studio** (for mobile testing)

### Development Tools (Recommended)
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Python
  - React Native Tools
- **Postman** or **Thunder Client** (API testing)
- **MongoDB Compass** (database GUI)

---

## Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Python Virtual Environment
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

**Key Dependencies:**
- FastAPI 0.110.1 (web framework)
- Motor 3.3.1 (async MongoDB driver)
- Uvicorn 0.25.0 (ASGI server)
- Pydantic 2.12.4 (data validation)
- Bcrypt 4.1.3 (password hashing)
- PyJWT 2.10.1 (JWT tokens)

### 4. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=sharaspot

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:8081,http://192.168.1.x:8081

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_EXPIRY_DAYS=7

# External APIs (Optional - currently using mock data)
HERE_API_KEY=your-here-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=sharaspot-images

# Environment
ENVIRONMENT=development
```

**Important Notes:**
- Replace `your-super-secret-jwt-key-change-in-production` with a strong random key
- Use `openssl rand -hex 32` to generate a secure secret
- For production, use MongoDB Atlas URI instead of localhost
- Update `CORS_ORIGINS` with your actual frontend URL

### 5. Setup MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community@6.0

# Start MongoDB service
brew services start mongodb-community@6.0

# Verify MongoDB is running
mongosh --eval "db.runCommand({ connectionStatus: 1 })"
```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string (replace `<password>` with your database password)
4. Update `MONGODB_URI` in `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/sharaspot?retryWrites=true&w=majority
   ```

### 6. Initialize Database Collections

The backend automatically creates collections on first run. To manually verify:

```bash
# Connect to MongoDB
mongosh

# Switch to sharaspot database
use sharaspot

# Verify collections
show collections

# Should show:
# - users
# - user_sessions
# - chargers
# - coin_transactions
```

### 7. Start Backend Server

```bash
# Development mode (auto-reload)
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 8. Verify Backend is Running

Test the API:
```bash
# Health check endpoint (you may need to add this)
curl http://localhost:8000/

# Get chargers endpoint
curl http://localhost:8000/api/chargers

# Expected: JSON array of chargers (may be empty initially)
```

**API Documentation:**
- Once running, visit: `http://localhost:8000/docs` (interactive Swagger UI)
- Alternative docs: `http://localhost:8000/redoc`

---

## Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies
```bash
# Install all npm packages
yarn install

# Alternative with npm
npm install
```

**Key Dependencies:**
- React Native 0.79.5
- Expo 54.0.23
- Expo Router 5.1.4 (file-based routing)
- React Navigation
- TypeScript 5.8.3
- Axios 1.13.2

### 3. Configure Environment

Create a `.env` file in the `frontend/` directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8000

# For physical device testing, use your computer's IP address:
# EXPO_PUBLIC_API_URL=http://192.168.1.x:8000

# Google Maps API Key (for map view)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

**Finding Your IP Address:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

### 4. Update API URL in Code

If you're not using environment variables yet, update the API base URL:

**File:** `frontend/contexts/AuthContext.tsx`
```typescript
const API_URL = 'http://YOUR_IP_ADDRESS:8000';
```

### 5. Start Expo Development Server

```bash
# Start Expo development server
npx expo start

# Alternative shortcuts:
yarn start
npm start
```

**Expected Output:**
```
Starting Metro Bundler
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▀█ █▄▀▀▀▄█ ▄▄▄▄▄ █
█ █   █ █▀▀▀█ ▀ ▀█ █   █ █
█ █▄▄▄█ █▀ █▀▀█ ▀█ █▄▄▄█ █
...

› Metro waiting on exp://192.168.1.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor
```

### 6. Run on Device/Simulator

#### Option A: Physical Device
1. **Install Expo Go App:**
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Scan QR Code:**
   - iOS: Use Camera app to scan QR code
   - Android: Use Expo Go app to scan QR code

3. **Ensure Same Network:**
   - Device and computer must be on same WiFi network
   - Update API_URL with your computer's IP address

#### Option B: iOS Simulator (macOS only)
```bash
# Press 'i' in Expo terminal
# Or run:
npx expo start --ios

# First time setup (if needed):
xcode-select --install
```

#### Option C: Android Emulator
```bash
# Start Android Studio emulator first
# Then press 'a' in Expo terminal
# Or run:
npx expo start --android

# First time setup:
# 1. Install Android Studio
# 2. Install Android SDK
# 3. Create AVD (Android Virtual Device)
```

#### Option D: Web Browser
```bash
# Press 'w' in Expo terminal
# Or run:
npx expo start --web

# Note: Map view may not work on web (conditional imports)
```

---

## Testing the Application

### 1. Create Test Account

**Method A: Through App UI**
1. Launch app → Welcome screen
2. Tap "Get Started with Email"
3. Enter: Name, Email, Password (min 6 chars)
4. Tap "Create Account"
5. Complete preferences setup:
   - Allow location permission
   - Select port type (e.g., Type 2)
   - Select vehicle (e.g., Tesla Model 3)
   - Choose distance unit (km/mi)

**Method B: Via API (curl)**
```bash
# Signup
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 2. Test Core Features

**Navigation:**
- ✅ Discover Tab: View charger list/map
- ✅ Eco Route Tab: Calculate smart routes
- ✅ Profile Tab: View stats, wallet, settings

**Charger Discovery:**
- ✅ View list of chargers (mock data)
- ✅ Apply filters (verification level, port type, amenities)
- ✅ Toggle map view
- ✅ Tap charger for details

**Add Charger:**
- ✅ Tap "+" icon in Discover tab
- ✅ Fill form (name, location, port types, amenities)
- ✅ Take photos (up to 5)
- ✅ Submit charger
- ✅ Earn 5 SharaCoins + 3 coins per photo

**Verify Charger:**
- ✅ Open charger detail
- ✅ Submit verification (active/not working/partial)
- ✅ Earn 2 SharaCoins
- ✅ View verification history

**Smart Routing:**
- ✅ Enter origin and destination
- ✅ Set battery percentage
- ✅ View 3 route alternatives
- ✅ See chargers along route
- ✅ Compare eco scores

### 3. Guest Mode Testing

```bash
# In app:
1. Welcome screen → "Continue as Guest"
2. Limited features:
   - ✅ View chargers
   - ✅ View charger details
   - ✅ Calculate routes
   - ❌ Cannot add chargers
   - ❌ Cannot verify chargers
```

---

## Common Issues & Troubleshooting

### Backend Issues

#### Issue: MongoDB Connection Failed
```
Error: MongoServerError: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
```bash
# Check MongoDB is running
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb-community@6.0

# Check logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

#### Issue: CORS Error in Browser
```
Access to XMLHttpRequest at 'http://localhost:8000' from origin 'http://localhost:8081' has been blocked by CORS policy
```
**Solution:**
Update `backend/server.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://192.168.1.x:8081"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Issue: Module Not Found Error
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Issues

#### Issue: Cannot Connect to Metro Bundler
```
Error: Unable to resolve module `./App` from `/Users/.../frontend/index.js`
```
**Solution:**
```bash
# Clear Metro cache
npx expo start --clear

# Or manually:
rm -rf node_modules
yarn install
```

#### Issue: Network Request Failed (iOS)
```
TypeError: Network request failed
```
**Solution:**
1. Update `EXPO_PUBLIC_API_URL` with your computer's IP
2. Ensure backend is running
3. Test API directly:
   ```bash
   curl http://YOUR_IP:8000/api/chargers
   ```
4. For iOS Simulator, use `http://localhost:8000` (not 127.0.0.1)

#### Issue: Location Permission Denied
```
Error: Location permission not granted
```
**Solution:**
1. iOS: Settings → Privacy → Location Services → Expo Go → "While Using"
2. Android: Settings → Apps → Expo Go → Permissions → Location → "Allow only while using"

#### Issue: Map Not Rendering
```
Map view shows blank screen
```
**Solution:**
1. Ensure Google Maps API key is configured
2. On web, map uses conditional import (may not work)
3. Test on physical device or simulator instead

### Performance Issues

#### Issue: Slow API Responses
**Solution:**
```bash
# Check database indexes (add if missing)
mongosh
use sharaspot
db.chargers.createIndex({ "verification_level": 1 })
db.users.createIndex({ "email": 1 }, { unique: true })
db.user_sessions.createIndex({ "session_token": 1 })
db.user_sessions.createIndex({ "expires_at": 1 })
```

#### Issue: App Crashes on Large Image Upload
**Solution:**
- Limit image size in add-charger form
- Consider implementing S3 upload instead of base64
- Add image compression before upload

---

## Development Workflow

### 1. Daily Development Routine

```bash
# Terminal 1: Start Backend
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
cd frontend
npx expo start

# Terminal 3: MongoDB (if local)
mongosh

# Terminal 4: Git operations, testing, etc.
```

### 2. Making Code Changes

**Backend Changes:**
1. Edit files in `backend/`
2. Uvicorn auto-reloads on save (--reload flag)
3. Test changes with curl or Postman
4. Check backend logs for errors

**Frontend Changes:**
1. Edit files in `frontend/app/` or `frontend/components/`
2. Save file → Expo auto-reloads
3. Or press `r` in Expo terminal to manually reload
4. Check React Native logs in terminal

### 3. Testing API Endpoints

**Using curl:**
```bash
# Create account
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!", "name": "Test"}'

# Login and save session token
SESSION_TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!"}' | jq -r '.session_token')

# Use session token in requests
curl http://localhost:8000/api/profile/stats \
  -H "Authorization: Bearer $SESSION_TOKEN"
```

**Using Postman:**
1. Import collection (create from API docs)
2. Set environment variable: `API_URL = http://localhost:8000`
3. Login → Copy `session_token` from response
4. Add to environment: `SESSION_TOKEN = <copied-token>`
5. Use `{{SESSION_TOKEN}}` in Authorization headers

### 4. Database Management

**View Data:**
```bash
# Connect to MongoDB
mongosh

# Switch to database
use sharaspot

# Query examples
db.users.find().pretty()
db.chargers.find({ verification_level: 5 })
db.coin_transactions.find({ user_id: "user-uuid" }).sort({ timestamp: -1 })
db.user_sessions.find({ session_token: "your-token" })

# Count documents
db.users.countDocuments()
db.chargers.countDocuments()
```

**Reset Database (Development Only):**
```bash
mongosh
use sharaspot
db.dropDatabase()
# Restart backend to recreate collections
```

---

## Production Deployment (Future)

### Backend Deployment

**Option A: Docker Container**
```dockerfile
# Dockerfile (create in backend/)
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Option B: Platform as a Service**
- **Heroku**: Deploy with Procfile
- **Railway**: Connect GitHub repo
- **Render**: Auto-deploy from git
- **AWS Lambda**: Serverless with Mangum adapter

### Frontend Deployment

**Expo EAS Build:**
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**Web Deployment:**
```bash
# Build for web
npx expo export:web

# Deploy to Vercel/Netlify
# Point to web-build/ directory
```

---

## Environment-Specific Configurations

### Development
```env
# Backend
ENVIRONMENT=development
DEBUG=True
CORS_ORIGINS=*

# Frontend
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Staging
```env
# Backend
ENVIRONMENT=staging
DEBUG=False
CORS_ORIGINS=https://staging.sharaspot.com

# Frontend
EXPO_PUBLIC_APP_ENV=staging
EXPO_PUBLIC_API_URL=https://api-staging.sharaspot.com
```

### Production
```env
# Backend
ENVIRONMENT=production
DEBUG=False
CORS_ORIGINS=https://sharaspot.com
MONGODB_URI=mongodb+srv://prod-user:xxx@cluster.mongodb.net/sharaspot
JWT_SECRET=<strong-random-secret>

# Frontend
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://api.sharaspot.com
```

---

## Additional Resources

### Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)

### Monitoring & Debugging
- **Backend Logs**: Check terminal where uvicorn is running
- **Frontend Logs**: Check Expo terminal or device logs
- **Database**: Use MongoDB Compass for visual inspection
- **Network**: Use React Native Debugger or Expo Dev Tools

### Support
- **Project Documentation**: See `/docs` folder for additional guides
- **Module 1 Features**: `README_MODULE1.md`
- **Auth Testing**: `auth_testing.md`
- **API Endpoints**: `http://localhost:8000/docs` (when backend running)

---

## Quick Start Checklist

- [ ] Install Node.js, Python, MongoDB
- [ ] Clone repository
- [ ] Backend setup:
  - [ ] Create virtual environment
  - [ ] Install dependencies
  - [ ] Create `.env` file
  - [ ] Start MongoDB
  - [ ] Run `uvicorn server:app --reload`
- [ ] Frontend setup:
  - [ ] Install dependencies with `yarn install`
  - [ ] Create `.env` file
  - [ ] Update API_URL
  - [ ] Run `npx expo start`
- [ ] Test:
  - [ ] Create account in app
  - [ ] View chargers
  - [ ] Add charger
  - [ ] Verify charger
  - [ ] Calculate route

**Congratulations!** You're now running SharaSpot locally. Happy coding! 🚗⚡
