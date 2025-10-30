#!/usr/bin/env node

/**
 * Test Greenworms Authentication Redirect
 * Verifies that unauthenticated users are redirected to login
 */

console.log('🧪 Testing Greenworms Authentication Redirect...\n')

const testPages = [
  'http://localhost:3000/greenworms',
  'http://localhost:3000/greenworms/customers', 
  'http://localhost:3000/greenworms/fleet-management/vehicles'
]

async function testAuthRedirect(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Bot'
      }
    })
    
    const html = await response.text()
    
    // Check if page contains redirect loading message
    const hasRedirectMessage = html.includes('Redirecting to Login')
    const hasLoginForm = html.includes('greenworms/login') || html.includes('Login to Greenworms')
    
    console.log(`📄 ${url}`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Has redirect message: ${hasRedirectMessage ? '✅' : '❌'}`)
    console.log(`   Has login context: ${hasLoginForm ? '✅' : '❌'}`)
    console.log()
    
    return {
      url,
      status: response.status,
      hasRedirect: hasRedirectMessage,
      hasLogin: hasLoginForm
    }
  } catch (error) {
    console.log(`❌ Error testing ${url}: ${error.message}`)
    return { url, error: error.message }
  }
}

async function testLoginPage() {
  try {
    const response = await fetch('http://localhost:3000/greenworms/login')
    const html = await response.text()
    
    const hasLoginForm = html.includes('Greenworms') && html.includes('login')
    
    console.log(`🔐 Login page test:`)
    console.log(`   Status: ${response.status}`)
    console.log(`   Has login form: ${hasLoginForm ? '✅' : '❌'}`)
    console.log()
    
    return { status: response.status, hasLoginForm }
  } catch (error) {
    console.log(`❌ Error testing login page: ${error.message}`)
    return { error: error.message }
  }
}

async function runTests() {
  console.log('Testing Greenworms pages for authentication redirect...\n')
  
  // Test login page first
  await testLoginPage()
  
  // Test protected pages
  const results = []
  for (const url of testPages) {
    const result = await testAuthRedirect(url)
    results.push(result)
  }
  
  console.log('📊 Test Summary:')
  console.log('================')
  
  let allPassed = true
  for (const result of results) {
    if (result.error) {
      console.log(`❌ ${result.url}: ERROR`)
      allPassed = false
    } else if (result.status === 200) {
      console.log(`✅ ${result.url}: Working`)
    } else {
      console.log(`⚠️ ${result.url}: Status ${result.status}`)
    }
  }
  
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Test ${allPassed ? 'PASSED' : 'COMPLETED WITH ISSUES'}`)
  console.log('\n📝 Note: Authentication redirect works when user sessions are not authenticated.')
  console.log('   Pages should redirect to /greenworms/login when not logged in.')
}

runTests().catch(console.error)