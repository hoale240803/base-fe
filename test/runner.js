#!/usr/bin/env node

/**
 * Main Test Runner
 * Runs all tests and provides a summary
 */

import { runSummary } from './test-runner.js';

console.log('🚀 Starting Dependency Graph Resolution Tests\n');

// Import all test files
import './module-parser.test.js';
import './dependency-graph.test.js';
import './dependency-resolver.test.js';

// Run summary
runSummary();