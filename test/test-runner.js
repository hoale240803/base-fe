/**
 * Simple Test Runner
 */

let testCount = 0;
let passedCount = 0;
let failedCount = 0;

export function test(name, fn) {
  testCount++;
  console.log(`\n🧪 Running: ${name}`);
  
  try {
    fn();
    passedCount++;
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    failedCount++;
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    if (error.stack) {
      console.log(`   Stack: ${error.stack.split('\n').slice(1, 3).join('\n')}`);
    }
  }
}

export function assertEquals(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

export function assertTrue(condition, message = '') {
  if (!condition) {
    throw new Error(`${message}\n  Expected: true\n  Actual: ${condition}`);
  }
}

export function assertThrows(fn, expectedError, message = '') {
  try {
    fn();
    throw new Error(`${message}\n  Expected function to throw, but it didn't`);
  } catch (error) {
    if (expectedError && !error.message.includes(expectedError)) {
      throw new Error(`${message}\n  Expected error containing: ${expectedError}\n  Actual error: ${error.message}`);
    }
  }
}

export async function assertThrowsAsync(fn, expectedError, message = '') {
  try {
    await fn();
    throw new Error(`${message}\n  Expected function to throw, but it didn't`);
  } catch (error) {
    if (expectedError && !error.message.includes(expectedError)) {
      throw new Error(`${message}\n  Expected error containing: ${expectedError}\n  Actual error: ${error.message}`);
    }
  }
}

export function runSummary() {
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Summary:`);
  console.log(`   Total: ${testCount}`);
  console.log(`   ✅ Passed: ${passedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   Success Rate: ${testCount > 0 ? ((passedCount / testCount) * 100).toFixed(1) : 0}%`);
  console.log('='.repeat(50));
  
  if (failedCount > 0) {
    process.exit(1);
  }
}