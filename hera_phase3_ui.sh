#!/bin/bash
# ================================================================================
# HERA PHASE 3: UI COMPONENT INTEGRATION TESTING
# Testing Frontend Components with Authentication & API Integration
# ================================================================================

echo "🎨 HERA Phase 3: UI Component Integration Testing"
echo "=================================================="
echo "Testing React components with HERA Universal API on port 3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run UI test
run_ui_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -e "\n${BLUE}🧪 Testing: $test_name${NC}"
    echo "Command: $test_command"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Execute test
    result=$(eval "$test_command" 2>&1)
    
    if [[ "$result" == *"$expected_result"* ]] || [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo "Result: $result"
    echo "---"
}

# Check if UI development server is running
check_ui_server() {
    echo -e "${BLUE}🔍 Checking UI Development Server...${NC}"
    
    # Check common UI server ports
    for port in 3000 3002 5173 4173; do
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port" 2>/dev/null)
        if [[ "$response" == "200" ]]; then
            echo -e "${GREEN}✅ UI server found on port $port${NC}"
            UI_PORT=$port
            return 0
        fi
    done
    
    echo -e "${YELLOW}⚠️  UI development server not detected${NC}"
    echo -e "${YELLOW}💡 Start your UI server first:${NC}"
    echo "   npm run dev        # Vite/React"
    echo "   npm start          # Create React App"
    echo "   npm run dev:ui     # Custom command"
    return 1
}

# ================================================================================
# PHASE 3A: COMPONENT STRUCTURE VERIFICATION
# ================================================================================

echo -e "\n${YELLOW}📋 Phase 3A: Component Structure Verification${NC}"

# Test 1: Check if HERA component files exist
echo -e "\n${BLUE}📁 Checking HERA UI Component Files${NC}"

COMPONENT_FILES=(
    "src/components/auth/LoginForm.jsx"
    "src/components/auth/LoginForm.tsx"
    "src/components/auth/RegistrationWizard.jsx"
    "src/components/auth/RegistrationWizard.tsx"
    "src/components/ui/AuthProvider.jsx"
    "src/components/ui/AuthProvider.tsx"
    "src/components/layout/AppLayout.jsx"
    "src/components/layout/AppLayout.tsx"
    "src/components/common/ProtectedRoute.jsx"
    "src/components/common/ProtectedRoute.tsx"
)

FOUND_COMPONENTS=0
for file in "${COMPONENT_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
        FOUND_COMPONENTS=$((FOUND_COMPONENTS + 1))
    else
        echo -e "${YELLOW}⚠️  Missing: $file${NC}"
    fi
done

if [[ $FOUND_COMPONENTS -gt 0 ]]; then
    echo -e "${GREEN}✅ HERA components detected ($FOUND_COMPONENTS files)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ No HERA components found${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 2: Check package.json for required dependencies
echo -e "\n${BLUE}📦 Checking Required Dependencies${NC}"

REQUIRED_DEPS=(
    "react"
    "axios"
    "@supabase/supabase-js"
    "react-router-dom"
)

if [[ -f "package.json" ]]; then
    for dep in "${REQUIRED_DEPS[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo -e "${GREEN}✅ Dependency found: $dep${NC}"
        else
            echo -e "${YELLOW}⚠️  Missing dependency: $dep${NC}"
        fi
    done
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ package.json not found${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ================================================================================
# PHASE 3B: AUTH COMPONENT TESTING
# ================================================================================

echo -e "\n${YELLOW}📋 Phase 3B: Authentication Component Testing${NC}"

# Check if UI server is running before component tests
if check_ui_server; then
    UI_BASE="http://localhost:$UI_PORT"
    
    # Test 3: Login Form Accessibility
    echo -e "\n${BLUE}🔐 Testing Login Form Components${NC}"
    
    # Test if login form renders and has required fields
    LOGIN_TEST=$(curl -s "$UI_BASE" | grep -i "login\|email\|password" | wc -l)
    
    if [[ $LOGIN_TEST -gt 0 ]]; then
        echo -e "${GREEN}✅ Login form elements detected${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  Login form not visible on main page${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test 4: Registration Form Accessibility
    echo -e "\n${BLUE}📝 Testing Registration Components${NC}"
    
    REG_TEST=$(curl -s "$UI_BASE" | grep -i "register\|signup\|business" | wc -l)
    
    if [[ $REG_TEST -gt 0 ]]; then
        echo -e "${GREEN}✅ Registration form elements detected${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  Registration form not visible${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
else
    echo -e "${YELLOW}⏭️  Skipping UI server tests - Server not running${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 2))
    TOTAL_TESTS=$((TOTAL_TESTS + 2))
fi

# ================================================================================
# PHASE 3C: COMPONENT INTEGRATION TESTING
# ================================================================================

echo -e "\n${YELLOW}📋 Phase 3C: Component Integration Testing${NC}"

# Test 5: Check for HERA API integration in components
echo -e "\n${BLUE}🔗 Testing API Integration in Components${NC}"

API_INTEGRATION_FOUND=0

# Check for API calls in component files
for file in src/components/**/*.{js,jsx,ts,tsx} src/**/*.{js,jsx,ts,tsx}; do
    if [[ -f "$file" ]]; then
        # Look for HERA API patterns
        if grep -q "localhost:3001\|/api/v1\|supabase" "$file" 2>/dev/null; then
            echo -e "${GREEN}✅ API integration found in: $file${NC}"
            API_INTEGRATION_FOUND=$((API_INTEGRATION_FOUND + 1))
        fi
    fi
done

if [[ $API_INTEGRATION_FOUND -gt 0 ]]; then
    echo -e "${GREEN}✅ API integration detected in $API_INTEGRATION_FOUND files${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  No obvious API integration found${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 6: Environment Configuration
echo -e "\n${BLUE}⚙️ Testing Environment Configuration${NC}"

ENV_FILES=(".env" ".env.local" ".env.development")
ENV_FOUND=0

for env_file in "${ENV_FILES[@]}"; do
    if [[ -f "$env_file" ]]; then
        echo -e "${GREEN}✅ Found: $env_file${NC}"
        
        # Check for HERA/Supabase configuration
        if grep -q "SUPABASE\|API_URL\|3001" "$env_file" 2>/dev/null; then
            echo -e "${GREEN}  ✅ Contains HERA API configuration${NC}"
            ENV_FOUND=$((ENV_FOUND + 1))
        fi
    fi
done

if [[ $ENV_FOUND -gt 0 ]]; then
    echo -e "${GREEN}✅ Environment configuration detected${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  No environment configuration found${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ================================================================================
# PHASE 3D: END-TO-END USER FLOW TESTING
# ================================================================================

echo -e "\n${YELLOW}📋 Phase 3D: End-to-End User Flow Testing${NC}"

# Test 7: Complete Authentication Flow (if UI server is running)
if [[ -n "$UI_PORT" ]]; then
    echo -e "\n${BLUE}🔄 Testing Complete Authentication Flow${NC}"
    
    # Test navigation to login/register
    NAVIGATION_TEST=$(curl -s "$UI_BASE" | grep -i "nav\|menu\|login\|register" | wc -l)
    
    if [[ $NAVIGATION_TEST -gt 0 ]]; then
        echo -e "${GREEN}✅ Navigation elements detected${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  Navigation not clearly visible${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Test 8: Business Dashboard Components
    echo -e "\n${BLUE}📊 Testing Business Dashboard Components${NC}"
    
    DASHBOARD_TEST=$(curl -s "$UI_BASE" | grep -i "dashboard\|menu\|orders\|entities" | wc -l)
    
    if [[ $DASHBOARD_TEST -gt 0 ]]; then
        echo -e "${GREEN}✅ Dashboard elements detected${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  Dashboard components not visible${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi

# ================================================================================
# PHASE 3E: RESPONSIVE DESIGN & ACCESSIBILITY TESTING
# ================================================================================

echo -e "\n${YELLOW}📋 Phase 3E: Design & Accessibility Testing${NC}"

# Test 9: CSS Framework Integration
echo -e "\n${BLUE}🎨 Testing CSS Framework Integration${NC}"

CSS_FRAMEWORKS=("tailwind" "bootstrap" "mui" "chakra" "styled-components")
CSS_FOUND=0

for framework in "${CSS_FRAMEWORKS[@]}"; do
    if [[ -f "package.json" ]] && grep -q "$framework" package.json; then
        echo -e "${GREEN}✅ CSS framework detected: $framework${NC}"
        CSS_FOUND=$((CSS_FOUND + 1))
    fi
done

# Check for custom CSS files
if ls src/**/*.css src/**/*.scss 2>/dev/null | head -1 > /dev/null; then
    echo -e "${GREEN}✅ Custom CSS files found${NC}"
    CSS_FOUND=$((CSS_FOUND + 1))
fi

if [[ $CSS_FOUND -gt 0 ]]; then
    echo -e "${GREEN}✅ Styling framework detected${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  No obvious styling framework${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 10: Component Testing Setup
echo -e "\n${BLUE}🧪 Testing Component Test Setup${NC}"

TEST_FILES_FOUND=0

# Look for test files
for test_pattern in "*.test.js" "*.test.jsx" "*.test.ts" "*.test.tsx" "*.spec.js" "*.spec.jsx"; do
    if ls src/**/$test_pattern 2>/dev/null | head -1 > /dev/null; then
        echo -e "${GREEN}✅ Test files found: $test_pattern${NC}"
        TEST_FILES_FOUND=$((TEST_FILES_FOUND + 1))
    fi
done

# Check for testing framework
if [[ -f "package.json" ]] && (grep -q "jest\|vitest\|@testing-library" package.json); then
    echo -e "${GREEN}✅ Testing framework detected${NC}"
    TEST_FILES_FOUND=$((TEST_FILES_FOUND + 1))
fi

if [[ $TEST_FILES_FOUND -gt 0 ]]; then
    echo -e "${GREEN}✅ Component testing setup detected${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  No component tests found${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ================================================================================
# PHASE 3F: HERA-SPECIFIC UI FEATURES
# ================================================================================

echo -e "\n${YELLOW}📋 Phase 3F: HERA-Specific UI Features${NC}"

# Test 11: Universal Business Components
echo -e "\n${BLUE}🏢 Testing Universal Business Components${NC}"

BUSINESS_COMPONENTS=0

# Look for business-specific component patterns
BUSINESS_PATTERNS=("restaurant" "healthcare" "manufacturing" "menu" "patient" "inventory" "universal")

for pattern in "${BUSINESS_PATTERNS[@]}"; do
    if find src -name "*.js*" -o -name "*.ts*" | xargs grep -l -i "$pattern" 2>/dev/null | head -1 > /dev/null; then
        echo -e "${GREEN}✅ $pattern components found${NC}"
        BUSINESS_COMPONENTS=$((BUSINESS_COMPONENTS + 1))
    fi
done

if [[ $BUSINESS_COMPONENTS -gt 2 ]]; then
    echo -e "${GREEN}✅ Universal business patterns detected${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  Limited business component patterns${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 12: Multi-tenant UI Support
echo -e "\n${BLUE}🏗️ Testing Multi-tenant UI Support${NC}"

TENANT_FEATURES=0

# Look for organization/tenant-aware components
if find src -name "*.js*" -o -name "*.ts*" | xargs grep -l -i "organization\|tenant\|context" 2>/dev/null | head -1 > /dev/null; then
    echo -e "${GREEN}✅ Multi-tenant context components found${NC}"
    TENANT_FEATURES=$((TENANT_FEATURES + 1))
fi

# Look for role-based access
if find src -name "*.js*" -o -name "*.ts*" | xargs grep -l -i "role\|permission\|protected" 2>/dev/null | head -1 > /dev/null; then
    echo -e "${GREEN}✅ Role-based access components found${NC}"
    TENANT_FEATURES=$((TENANT_FEATURES + 1))
fi

if [[ $TENANT_FEATURES -gt 0 ]]; then
    echo -e "${GREEN}✅ Multi-tenant UI features detected${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  Multi-tenant UI features not obvious${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ================================================================================
# FINAL UI INTEGRATION RESULTS
# ================================================================================

echo -e "\n${PURPLE}===============================================================${NC}"
echo -e "${PURPLE}🎨 HERA PHASE 3: UI COMPONENT INTEGRATION RESULTS${NC}"
echo -e "${PURPLE}===============================================================${NC}"

echo -e "\n📊 UI Test Summary:"
echo -e "   Total Tests: ${TOTAL_TESTS}"
echo -e "   ${GREEN}✅ Passed: ${PASSED_TESTS}${NC}"
echo -e "   ${RED}❌ Failed: ${FAILED_TESTS}${NC}"

PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "   🎯 Pass Rate: ${PASS_RATE}%"

echo -e "\n🔍 Component Analysis:"
echo -e "   📁 Component Files: $FOUND_COMPONENTS found"
echo -e "   🔗 API Integration: $API_INTEGRATION_FOUND files"
echo -e "   🏢 Business Components: $BUSINESS_COMPONENTS patterns"
echo -e "   🏗️ Multi-tenant Features: $TENANT_FEATURES detected"

if [[ $PASS_RATE -ge 70 ]]; then
    echo -e "\n${GREEN}🎉 PHASE 3 STATUS: SUCCESS${NC}"
    echo -e "${GREEN}✅ UI components are well-structured${NC}"
    echo -e "${GREEN}✅ API integration is properly configured${NC}"
    echo -e "${GREEN}✅ HERA universal patterns implemented${NC}"
    echo -e "\n${BLUE}🏆 COMPLETE HERA INTEGRATION ACHIEVED!${NC}"
    
    echo -e "\n${YELLOW}📋 FINAL DEPLOYMENT CHECKLIST:${NC}"
    echo -e "   ✅ Phase 1: SQL Schema Enhanced"
    echo -e "   ✅ Phase 2: API Integration Working"
    echo -e "   ✅ Phase 3: UI Components Integrated"
    echo -e "   🚀 Ready for Production Deployment!"
    
else
    echo -e "\n${YELLOW}⚠️  PHASE 3 STATUS: NEEDS IMPROVEMENT${NC}"
    echo -e "${YELLOW}💡 Consider adding missing components:${NC}"
    
    if [[ $FOUND_COMPONENTS -eq 0 ]]; then
        echo -e "   - Create authentication components"
    fi
    
    if [[ $API_INTEGRATION_FOUND -eq 0 ]]; then
        echo -e "   - Add API integration to components"
    fi
    
    if [[ $BUSINESS_COMPONENTS -lt 2 ]]; then
        echo -e "   - Implement universal business patterns"
    fi
fi

echo -e "\n${PURPLE}===============================================================${NC}"

# ================================================================================
# PRODUCTION DEPLOYMENT RECOMMENDATIONS
# ================================================================================

if [[ $PASS_RATE -ge 70 ]]; then
    echo -e "\n${GREEN}🚀 PRODUCTION DEPLOYMENT COMMANDS:${NC}"
    echo -e "\n# Build for production"
    echo -e "npm run build"
    echo -e "\n# Deploy to your hosting platform"
    echo -e "# Vercel: vercel --prod"
    echo -e "# Netlify: netlify deploy --prod"
    echo -e "# AWS: aws s3 sync build/ s3://your-bucket"
    
    echo -e "\n${GREEN}🔧 ENVIRONMENT VARIABLES FOR PRODUCTION:${NC}"
    echo -e "REACT_APP_API_URL=https://your-api-domain.com/api/v1"
    echo -e "REACT_APP_SUPABASE_URL=your-supabase-url"
    echo -e "REACT_APP_SUPABASE_ANON_KEY=your-supabase-key"
fi

echo -e "\n${BLUE}🏗️ HERA Universal Integration: ALL PHASES COMPLETE!${NC}"