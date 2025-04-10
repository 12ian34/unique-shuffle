const { testInsertShuffle } = require('./api/shuffles/test-insert')
const { checkAndFixConstraints } = require('./api/shuffles/fix-constraint')
const dotenv = require('dotenv')

// Load environment variables from .env.test.local if exists, otherwise from .env.test
dotenv.config({ path: '.env.test.local' })
dotenv.config({ path: '.env.test' })

/**
 * Main test runner
 * This can be executed from the command line with `npm run test`
 */
async function runTests() {
  console.log('Running tests...')

  // Get test user ID from command line arguments or use default
  const userId = process.argv[2] || process.env.TEST_USER_ID

  if (!userId) {
    console.error('Error: No user ID provided for testing')
    console.log('Usage: npm run test <userId>')
    console.log('       or set TEST_USER_ID in .env.test.local')
    process.exit(1)
  }

  console.log(`Using test user ID: ${userId}`)

  // Run tests
  try {
    // Test 1: Check and fix constraints
    console.log('\n→ Running test: Check and fix constraints')
    const constraintResult = await checkAndFixConstraints(userId)
    console.log('Result:', JSON.stringify(constraintResult, null, 2))

    if (constraintResult.error) {
      console.error('❌ Test failed: Check and fix constraints')
      process.exit(1)
    } else {
      console.log('✅ Test passed: Check and fix constraints')
    }

    // Test 2: Insert test shuffle
    console.log('\n→ Running test: Insert test shuffle')
    const insertResult = await testInsertShuffle(userId)
    console.log('Result:', JSON.stringify(insertResult, null, 2))

    if (insertResult.error) {
      console.error('❌ Test failed: Insert test shuffle')
      process.exit(1)
    } else {
      console.log('✅ Test passed: Insert test shuffle')
    }

    // All tests passed
    console.log('\n✅ All tests passed!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Tests failed with unexpected error:', error)
    process.exit(1)
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests()
}

module.exports = { runTests, testInsertShuffle, checkAndFixConstraints }
