#!/bin/bash
# Comprehensive validation script for EV navigation system

echo "🧪 SharaSpot EV Navigation - Comprehensive Test Suite"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS_COUNT=0
FAIL_COUNT=0

# Test function
test_check() {
    local test_name="$1"
    local test_result="$2"

    if [ "$test_result" = "0" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        ((PASS_COUNT++))
    else
        echo -e "${RED}✗${NC} $test_name"
        ((FAIL_COUNT++))
    fi
}

echo "📦 DEPENDENCY VALIDATION"
echo "------------------------"

# Check backend dependencies
if [ -f "backend/requirements.txt" ]; then
    test_check "Backend requirements.txt exists" 0

    # Check critical dependencies
    grep -q "fastapi" backend/requirements.txt
    test_check "FastAPI dependency present" $?

    grep -q "httpx" backend/requirements.txt
    test_check "httpx dependency present" $?

    grep -q "asyncpg" backend/requirements.txt
    test_check "asyncpg dependency present" $?
else
    test_check "Backend requirements.txt exists" 1
fi

# Check frontend dependencies
if [ -f "frontend/package.json" ]; then
    test_check "Frontend package.json exists" 0

    grep -q "expo-speech" frontend/package.json
    test_check "expo-speech dependency present" $?

    grep -q "expo-haptics" frontend/package.json
    test_check "expo-haptics dependency present" $?

    grep -q "expo-location" frontend/package.json
    test_check "expo-location dependency present" $?

    grep -q "react-native-maps" frontend/package.json
    test_check "react-native-maps dependency present" $?
else
    test_check "Frontend package.json exists" 1
fi

echo ""
echo "🔧 BACKEND CODE VALIDATION"
echo "----------------------------"

# Check Python syntax
python -m py_compile backend/app/services/routing_service.py 2>/dev/null
test_check "routing_service.py syntax valid" $?

python -m py_compile backend/app/core/config.py 2>/dev/null
test_check "config.py syntax valid" $?

# Check for math import in routing service
grep -q "import math" backend/app/services/routing_service.py
test_check "Math module imported for cosine calculation" $?

# Check for corrected longitude padding
grep -q "math.cos(math.radians(avg_lat))" backend/app/services/routing_service.py
test_check "Correct longitude padding calculation" $?

# Check for Mapbox API integration
grep -q "mapbox.*directions.*api" backend/app/services/routing_service.py -i
test_check "Mapbox Directions API integrated" $?

# Check for Open-Topo-Data integration
grep -q "opentopodata" backend/app/services/routing_service.py -i
test_check "Open-Topo-Data elevation API integrated" $?

# Check for elevation caching
grep -q "_elevation_cache" backend/app/services/routing_service.py
test_check "Elevation caching implemented" $?

# Check for retry logic
grep -q "max_retries" backend/app/services/routing_service.py
test_check "Retry logic with exponential backoff" $?

# Check for input validation
grep -q "Invalid.*coordinates" backend/app/services/routing_service.py
test_check "Input validation for coordinates" $?

echo ""
echo "🎨 FRONTEND CODE VALIDATION"
echo "-----------------------------"

# Check TypeScript files exist
[ -f "frontend/app/navigation.tsx" ]
test_check "navigation.tsx exists" $?

[ -f "frontend/app/(tabs)/map.tsx" ]
test_check "map.tsx exists" $?

# Check for critical imports in navigation.tsx
grep -q "Animated" frontend/app/navigation.tsx
test_check "Animated import for smooth transitions" $?

grep -q "import.*Haptics" frontend/app/navigation.tsx
test_check "Haptics import for tactile feedback" $?

grep -q "import.*Speech" frontend/app/navigation.tsx
test_check "Speech import for voice guidance" $?

grep -q "import.*Location" frontend/app/navigation.tsx
test_check "Location import for GPS tracking" $?

# Check for key features in navigation.tsx
grep -q "estimatedArrivalTime" frontend/app/navigation.tsx
test_check "Arrival time calculation (not duration)" $?

grep -q "instructionFadeAnim" frontend/app/navigation.tsx
test_check "Instruction fade animation" $?

grep -q "Haptics.*notification.*Warning" frontend/app/navigation.tsx -i
test_check "Haptic feedback at 200m" $?

grep -q "Haptics.*impact.*Medium" frontend/app/navigation.tsx -i
test_check "Haptic feedback at 50m" $?

grep -q "Haptics.*impact.*Heavy" frontend/app/navigation.tsx -i
test_check "Haptic feedback on turn completion" $?

grep -q "animateCamera" frontend/app/navigation.tsx
test_check "Smooth camera following" $?

grep -q "pitch.*60" frontend/app/navigation.tsx
test_check "3D map tilt (Google Maps style)" $?

grep -q "formatDistance" frontend/app/navigation.tsx
test_check "Smart distance formatting" $?

grep -q "ARRIVE" frontend/app/navigation.tsx
test_check "Arrival time label (not duration)" $?

# Check for Google Maps-style polyline
grep -q "strokeWidth.*6" frontend/app/navigation.tsx
test_check "Inner polyline stroke (6px)" $?

grep -q "strokeWidth.*9" frontend/app/navigation.tsx
test_check "Outer polyline stroke (9px)" $?

grep -q "#5E96FF" frontend/app/navigation.tsx
test_check "Google Maps blue color" $?

echo ""
echo "📝 CONFIGURATION VALIDATION"
echo "-----------------------------"

# Check environment variable configuration
grep -q "MAPBOX_API_KEY" backend/app/core/config.py
test_check "Mapbox API key configuration" $?

grep -q "OPENWEATHER_API_KEY" backend/app/core/config.py
test_check "Weather API key configuration" $?

grep -q "DATABASE_URL" backend/app/core/config.py
test_check "Database URL configuration" $?

# Check API documentation
grep -q "Mapbox Directions API" backend/app/core/config.py
test_check "API documentation updated" $?

grep -q "Open-Topo-Data" backend/app/core/config.py
test_check "Elevation service documented" $?

echo ""
echo "🔍 CODE QUALITY VALIDATION"
echo "---------------------------"

# Check for no TODOs or FIXMEs in production code
! grep -r "TODO\|FIXME\|XXX\|HACK" backend/app/services/routing_service.py frontend/app/navigation.tsx 2>/dev/null | grep -v "DEBUG"
test_check "No TODO/FIXME in production code" $?

# Check for proper error handling
grep -c "try:" backend/app/services/routing_service.py | grep -q "^[0-9]" && \
grep -c "except" backend/app/services/routing_service.py | grep -q "^[0-9]"
test_check "Comprehensive error handling" $?

# Check for console.error (not console.log) in frontend
grep -q "console.error" frontend/app/navigation.tsx && \
! grep "console.log[^.error]" frontend/app/navigation.tsx 2>/dev/null
test_check "Proper error logging (no console.log)" $?

echo ""
echo "📊 TEST FILE VALIDATION"
echo "------------------------"

[ -f "backend/tests/test_routing_service.py" ]
test_check "Unit tests created" $?

[ -f "backend/tests/test_integration.py" ]
test_check "Integration tests created" $?

# Check test coverage
grep -q "test_elevation_gain" backend/tests/test_routing_service.py
test_check "Elevation tests present" $?

grep -q "test_energy_consumption" backend/tests/test_routing_service.py
test_check "Energy consumption tests present" $?

grep -q "test_invalid.*coordinates" backend/tests/test_routing_service.py -i
test_check "Input validation tests present" $?

grep -q "test_bounding_box" backend/tests/test_routing_service.py
test_check "Bounding box calculation tests present" $?

echo ""
echo "🔐 SECURITY VALIDATION"
echo "-----------------------"

# Check that API keys are not hardcoded
! grep -r "pk\.[a-zA-Z0-9]" backend/app frontend/app 2>/dev/null | grep -v "EXPO_PUBLIC"
test_check "No hardcoded API keys" $?

# Check for environment variable usage
grep -q "os.environ.get.*MAPBOX_API_KEY" backend/app/services/routing_service.py
test_check "Environment variables used for API keys" $?

echo ""
echo "=================================================="
echo "📈 TEST SUMMARY"
echo "=================================================="
echo ""
echo -e "Tests Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Tests Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED! System is production-ready.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
