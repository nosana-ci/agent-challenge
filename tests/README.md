# Unified Test Suite for Solana Trading Agent

This unified test suite combines all testing functionality from the various test files (`simple-test.mjs`, `test-pyth-integration.mjs`, `test-enhanced-agent.mjs`, and `test-solana-agent.ts`) into a single comprehensive TypeScript test file.

## Features

The unified test suite includes:

### 🔍 **Test Coverage**

1. **Pyth Price Discovery** - Tests price feed discovery functionality
2. **Multi-Asset Price Fetching** - Tests fetching prices for SOL, BTC, ETH
3. **Direct Pyth API Integration** - Tests direct Hermes API calls
4. **Comprehensive Trading Analysis** - Tests the main trading tool
5. **Agent Conversation** - Tests agent responses with live data
6. **Workflow Execution** - Tests the complete workflow
7. **Error Handling** - Tests edge cases and error scenarios
8. **Performance Testing** - Tests concurrent requests and timing

### 📊 **Test Reporting**

- Detailed test results with timing information
- Success/failure tracking for each test
- Comprehensive test coverage report
- Performance metrics and statistics

### 🛠️ **Type Safety**

- Full TypeScript implementation with proper type definitions
- Interface definitions for test results and data structures
- Better error handling and debugging

## Usage

### Running the Complete Test Suite

```bash
# Run the unified test suite
npm test

# Alternative using tsx directly
npx tsx tests/unified-test-suite.ts
```

### Running Individual Legacy Tests

```bash
# Simple tool test
npm run test:simple

# Pyth integration test
npm run test:pyth

# Enhanced agent test
npm run test:enhanced
```

### Running Specific Test Categories

You can import and run specific test functions:

```typescript
import { 
    testPythIntegration, 
    testSolanaTradeAgent, 
    testWorkflowOnly 
} from './tests/unified-test-suite';

// Run only Pyth integration tests
await testPythIntegration();

// Run only trading agent tests
await testSolanaTradeAgent();

// Run only workflow tests
await testWorkflowOnly();
```

## Test Structure

### UnifiedTestSuite Class

The main test suite is implemented as a class with the following methods:

- `runAllTests()` - Executes the complete test suite
- `generateTestReport()` - Creates a comprehensive test report
- `runTest()` - Helper method to run individual tests with error handling

### Individual Test Methods

Each test is implemented as a private method:

- `testPythPriceDiscovery()` - Pyth Network price feed discovery
- `testMultiAssetPriceFetching()` - Multi-asset price fetching via Pyth
- `testDirectPythAPI()` - Direct Pyth Hermes API integration
- `testComprehensiveTradingAnalysis()` - Trading analysis tool testing
- `testAgentConversation()` - Agent response testing
- `testWorkflowExecution()` - Workflow execution testing
- `testErrorHandling()` - Error handling and edge cases
- `testPerformance()` - Performance and load testing

## Expected Output

When running the unified test suite, you'll see:

```text
🚀 Starting Unified Test Suite for Solana Trading Agent
================================================================================
📅 Test Date: 2025-01-14T...
🖥️ Node Version: v20.x.x
================================================================================

🧪 Running Test: Pyth Price Discovery
--------------------------------------------------
Testing Pyth price feed discovery...
   📊 Discovered X SOL-related price feeds
   💰 Live SOL Price: $XX.XX
   📈 Confidence: ±$X.XX
   🔗 Feed ID: abcd1234...
   ⏰ Data freshness: fresh (X.Xs old)
✅ Pyth Price Discovery - PASSED (XXXms)

[... more tests ...]

================================================================================
📋 UNIFIED TEST SUITE REPORT
================================================================================

📊 Summary:
   Total Tests: 8
   Passed: X ✅
   Failed: X ❌
   Success Rate: XX.X%
   Total Duration: XXXXms
   Average Test Duration: XXX.Xms

🎯 Test Coverage:
   ✅ Pyth Network Integration
   ✅ Multi-Asset Price Fetching
   ✅ Direct API Integration
   ✅ Trading Analysis Tools
   ✅ Agent Conversation
   ✅ Workflow Execution
   ✅ Error Handling
   ✅ Performance Testing

🎉 ALL TESTS PASSED! The Solana Trading Agent is fully functional.
```

## Dependencies

The test suite requires:

- `tsx` for running TypeScript files directly
- All existing project dependencies for the trading agent
- Node.js version 20.9.0 or higher

## Integration with CI/CD

This unified test suite can be easily integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Unified Test Suite
  run: npm test
```

## Benefits of the Unified Approach

1. **Single Source of Truth** - All tests in one place
2. **Better Maintainability** - Easier to update and maintain
3. **Comprehensive Reporting** - Detailed test results and metrics
4. **Type Safety** - Full TypeScript implementation
5. **Performance Monitoring** - Built-in performance testing
6. **Error Tracking** - Detailed error reporting and handling
7. **Consistency** - Unified test structure and output format

## Troubleshooting

If tests fail:

1. Check that all dependencies are installed (`npm install`)
2. Ensure the Pyth Network API is accessible
3. Verify that the Solana trading agent tools are properly built
4. Check the detailed error messages in the test output
5. Review the test report for specific failure points
