/**
 * Custom test sequencer to run tests in a specific order
 * Ensures dependencies are respected and critical tests run first
 */

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  /**
   * Sort test files to run in optimal order
   */
  sort(tests) {
    // Define test priority based on path patterns
    const getPriority = (testPath) => {
      if (testPath.includes('/unit/')) return 1;
      if (testPath.includes('/golden-path/')) return 2;
      if (testPath.includes('/failure-scenarios/')) return 3;
      if (testPath.includes('/property-based/')) return 4;
      if (testPath.includes('/integration/')) return 5;
      return 6;
    };
    
    // Define test groups that should run together
    const getGroup = (testPath) => {
      if (testPath.includes('parser')) return 'parser';
      if (testPath.includes('executor')) return 'executor';
      if (testPath.includes('validator')) return 'validator';
      if (testPath.includes('generator')) return 'generator';
      return 'other';
    };
    
    // Sort tests
    return tests.sort((a, b) => {
      // First, sort by priority
      const priorityA = getPriority(a.path);
      const priorityB = getPriority(b.path);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Then, group related tests together
      const groupA = getGroup(a.path);
      const groupB = getGroup(b.path);
      if (groupA !== groupB) {
        return groupA.localeCompare(groupB);
      }
      
      // Finally, sort alphabetically within groups
      return a.path.localeCompare(b.path);
    });
  }
  
  /**
   * Shard tests for parallel execution
   * This can be used in CI/CD environments
   */
  shard(tests, { shardIndex, shardCount }) {
    // Distribute tests evenly across shards
    const shardSize = Math.ceil(tests.length / shardCount);
    const start = shardSize * shardIndex;
    const end = Math.min(start + shardSize, tests.length);
    
    return tests.slice(start, end);
  }
}

module.exports = CustomSequencer;