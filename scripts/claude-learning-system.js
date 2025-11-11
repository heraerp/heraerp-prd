#!/usr/bin/env node

/**
 * HERA Claude Learning System
 * 
 * Continuous improvement through pattern recognition and success tracking
 * This system makes Claude smarter with every build
 */

const fs = require('fs').promises;
const path = require('path');

class ClaudeLearningSystem {
  constructor() {
    this.knowledgeBase = {
      patterns: {},
      successes: [],
      failures: [],
      fixes: [],
      improvements: [],
      metrics: {
        totalBuilds: 0,
        successfulBuilds: 0,
        averageBuildTime: 0,
        commonErrors: {},
        fixSuccessRate: 0
      }
    };
    
    this.learningPath = path.join(process.cwd(), '.claude', 'learning');
    this.knowledgeBasePath = path.join(this.learningPath, 'knowledge-base.json');
  }

  /**
   * Initialize learning system
   */
  async initialize() {
    await fs.mkdir(this.learningPath, { recursive: true });
    
    try {
      const existing = await fs.readFile(this.knowledgeBasePath, 'utf8');
      this.knowledgeBase = { ...this.knowledgeBase, ...JSON.parse(existing) };
      console.log('📚 Learning system initialized with existing knowledge');
    } catch (error) {
      console.log('📚 Learning system initialized with fresh knowledge base');
    }
  }

  /**
   * Learn from a successful build
   */
  async learnFromSuccess(buildData) {
    console.log('🎯 Learning from successful build...');
    
    const successRecord = {
      timestamp: new Date(),
      buildTime: buildData.duration,
      components: buildData.components || [],
      patterns: this.extractPatterns(buildData),
      metrics: buildData.metrics || {},
      yamlConfig: buildData.yamlConfig
    };
    
    this.knowledgeBase.successes.push(successRecord);
    this.knowledgeBase.metrics.totalBuilds++;
    this.knowledgeBase.metrics.successfulBuilds++;
    
    // Update average build time
    this.updateAverageBuildTime(buildData.duration);
    
    // Extract and store successful patterns
    await this.updateSuccessPatterns(successRecord);
    
    await this.saveKnowledgeBase();
    console.log('✅ Success patterns learned and stored');
  }

  /**
   * Learn from a failure and fix
   */
  async learnFromFailure(errorData, fixData = null) {
    console.log('🔍 Learning from failure...');
    
    const failureRecord = {
      timestamp: new Date(),
      error: errorData.message,
      errorType: this.categorizeError(errorData),
      context: errorData.context || {},
      stackTrace: errorData.stack,
      component: errorData.component
    };
    
    this.knowledgeBase.failures.push(failureRecord);
    this.knowledgeBase.metrics.totalBuilds++;
    
    // Update common errors tracking
    const errorCategory = failureRecord.errorType;
    this.knowledgeBase.metrics.commonErrors[errorCategory] = 
      (this.knowledgeBase.metrics.commonErrors[errorCategory] || 0) + 1;
    
    if (fixData) {
      const fixRecord = {
        timestamp: new Date(),
        originalError: errorData.message,
        fixStrategy: fixData.strategy,
        fixCode: fixData.code,
        success: fixData.success,
        attempts: fixData.attempts || 1
      };
      
      this.knowledgeBase.fixes.push(fixRecord);
      
      if (fixData.success) {
        this.knowledgeBase.metrics.fixSuccessRate = 
          this.calculateFixSuccessRate();
      }
    }
    
    await this.saveKnowledgeBase();
    console.log('📝 Failure patterns analyzed and stored');
  }

  /**
   * Get intelligent suggestions for current build
   */
  async getIntelligentSuggestions(context) {
    console.log('🧠 Analyzing knowledge base for suggestions...');
    
    const suggestions = [];
    
    // Pattern-based suggestions
    const patternSuggestions = await this.getPatternBasedSuggestions(context);
    suggestions.push(...patternSuggestions);
    
    // Error prevention suggestions
    const preventionSuggestions = await this.getErrorPreventionSuggestions(context);
    suggestions.push(...preventionSuggestions);
    
    // Performance optimization suggestions
    const performanceSuggestions = await this.getPerformanceSuggestions(context);
    suggestions.push(...performanceSuggestions);
    
    // Quality improvement suggestions
    const qualitySuggestions = await this.getQualitySuggestions(context);
    suggestions.push(...qualitySuggestions);
    
    return {
      suggestions,
      confidence: this.calculateConfidence(suggestions),
      basedOnBuilds: this.knowledgeBase.metrics.totalBuilds
    };
  }

  /**
   * Pattern-based suggestions
   */
  async getPatternBasedSuggestions(context) {
    const suggestions = [];
    
    // Analyze successful patterns for similar contexts
    const similarSuccesses = this.knowledgeBase.successes.filter(success => 
      this.calculateSimilarity(success.yamlConfig, context.yamlConfig) > 0.7
    );
    
    if (similarSuccesses.length > 0) {
      const mostSuccessful = similarSuccesses.sort((a, b) => 
        a.buildTime - b.buildTime
      )[0];
      
      suggestions.push({
        type: 'pattern',
        priority: 'high',
        suggestion: 'Use proven pattern from similar successful build',
        details: {
          pattern: mostSuccessful.patterns,
          buildTime: mostSuccessful.buildTime,
          components: mostSuccessful.components
        }
      });
    }
    
    // Component generation patterns
    if (this.knowledgeBase.patterns.componentGeneration) {
      const patterns = this.knowledgeBase.patterns.componentGeneration;
      
      suggestions.push({
        type: 'component-pattern',
        priority: 'medium',
        suggestion: 'Apply proven component generation patterns',
        details: patterns
      });
    }
    
    return suggestions;
  }

  /**
   * Error prevention suggestions
   */
  async getErrorPreventionSuggestions(context) {
    const suggestions = [];
    
    // Most common errors
    const commonErrors = Object.entries(this.knowledgeBase.metrics.commonErrors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    commonErrors.forEach(([errorType, count]) => {
      const relatedFixes = this.knowledgeBase.fixes.filter(fix => 
        this.categorizeError({ message: fix.originalError }) === errorType && fix.success
      );
      
      if (relatedFixes.length > 0) {
        const bestFix = relatedFixes.sort((a, b) => b.success - a.success)[0];
        
        suggestions.push({
          type: 'error-prevention',
          priority: 'high',
          suggestion: `Prevent common ${errorType} errors`,
          details: {
            errorType,
            occurrences: count,
            preventionStrategy: bestFix.fixStrategy,
            successRate: (relatedFixes.filter(f => f.success).length / relatedFixes.length) * 100
          }
        });
      }
    });
    
    return suggestions;
  }

  /**
   * Performance optimization suggestions
   */
  async getPerformanceSuggestions(context) {
    const suggestions = [];
    
    if (this.knowledgeBase.metrics.averageBuildTime > 300) { // 5 minutes
      suggestions.push({
        type: 'performance',
        priority: 'medium',
        suggestion: 'Consider build optimization - average build time is high',
        details: {
          averageBuildTime: this.knowledgeBase.metrics.averageBuildTime,
          optimizationTips: [
            'Use lazy loading for components',
            'Implement code splitting',
            'Optimize imports',
            'Cache heavy computations'
          ]
        }
      });
    }
    
    // Fast build patterns
    const fastBuilds = this.knowledgeBase.successes.filter(s => s.buildTime < 60);
    if (fastBuilds.length > 0) {
      const fastestBuild = fastBuilds.sort((a, b) => a.buildTime - b.buildTime)[0];
      
      suggestions.push({
        type: 'performance',
        priority: 'low',
        suggestion: 'Apply patterns from fastest builds',
        details: {
          fastestBuildTime: fastestBuild.buildTime,
          patterns: fastestBuild.patterns
        }
      });
    }
    
    return suggestions;
  }

  /**
   * Quality improvement suggestions
   */
  async getQualitySuggestions(context) {
    const suggestions = [];
    
    const highQualityBuilds = this.knowledgeBase.successes.filter(s => 
      s.metrics.testPassRate > 95 && s.metrics.codeQualityScore > 90
    );
    
    if (highQualityBuilds.length > 0) {
      suggestions.push({
        type: 'quality',
        priority: 'medium',
        suggestion: 'Apply quality patterns from high-scoring builds',
        details: {
          qualityPatterns: highQualityBuilds[0].patterns,
          testPassRate: highQualityBuilds[0].metrics.testPassRate,
          codeQualityScore: highQualityBuilds[0].metrics.codeQualityScore
        }
      });
    }
    
    return suggestions;
  }

  /**
   * Get fix suggestions for specific error
   */
  async getFixSuggestionsForError(error) {
    const errorCategory = this.categorizeError(error);
    
    const relatedFixes = this.knowledgeBase.fixes.filter(fix => 
      this.categorizeError({ message: fix.originalError }) === errorCategory
    );
    
    if (relatedFixes.length === 0) {
      return null;
    }
    
    // Get the most successful fix strategy
    const successfulFixes = relatedFixes.filter(fix => fix.success);
    
    if (successfulFixes.length === 0) {
      return null;
    }
    
    const bestFix = successfulFixes.sort((a, b) => {
      // Prefer recent fixes with fewer attempts
      const aScore = (new Date() - new Date(a.timestamp)) / (1000 * 60 * 60 * 24) + a.attempts;
      const bScore = (new Date() - new Date(b.timestamp)) / (1000 * 60 * 60 * 24) + b.attempts;
      return aScore - bScore;
    })[0];
    
    return {
      strategy: bestFix.fixStrategy,
      code: bestFix.fixCode,
      confidence: this.calculateFixConfidence(bestFix, relatedFixes),
      attempts: bestFix.attempts,
      successRate: (successfulFixes.length / relatedFixes.length) * 100
    };
  }

  /**
   * Learning analytics and insights
   */
  async generateLearningReport() {
    const report = {
      timestamp: new Date(),
      overview: {
        totalBuilds: this.knowledgeBase.metrics.totalBuilds,
        successRate: (this.knowledgeBase.metrics.successfulBuilds / this.knowledgeBase.metrics.totalBuilds) * 100,
        averageBuildTime: this.knowledgeBase.metrics.averageBuildTime,
        fixSuccessRate: this.knowledgeBase.metrics.fixSuccessRate
      },
      insights: {
        mostCommonErrors: this.getMostCommonErrors(),
        bestPerformingPatterns: this.getBestPerformingPatterns(),
        improvementTrends: this.getImprovementTrends(),
        recommendations: await this.getSystemRecommendations()
      },
      knowledgeGrowth: {
        patternsLearned: Object.keys(this.knowledgeBase.patterns).length,
        successfulFixes: this.knowledgeBase.fixes.filter(f => f.success).length,
        totalExperience: this.knowledgeBase.successes.length + this.knowledgeBase.failures.length
      }
    };
    
    // Save report
    const reportPath = path.join(this.learningPath, 'learning-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * Utility methods
   */
  extractPatterns(buildData) {
    return {
      componentTypes: buildData.components?.map(c => c.type) || [],
      successfulStrategies: buildData.strategies || [],
      buildSequence: buildData.sequence || [],
      optimizations: buildData.optimizations || []
    };
  }

  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('typescript') || message.includes('type')) return 'typescript';
    if (message.includes('import') || message.includes('module')) return 'import';
    if (message.includes('hera') || message.includes('compliance')) return 'hera-compliance';
    if (message.includes('mobile') || message.includes('responsive')) return 'mobile-responsive';
    if (message.includes('performance')) return 'performance';
    if (message.includes('accessibility')) return 'accessibility';
    if (message.includes('syntax')) return 'syntax';
    
    return 'unknown';
  }

  calculateSimilarity(config1, config2) {
    if (!config1 || !config2) return 0;
    
    // Simple similarity calculation based on shared keys
    const keys1 = new Set(Object.keys(config1));
    const keys2 = new Set(Object.keys(config2));
    const intersection = new Set([...keys1].filter(x => keys2.has(x)));
    const union = new Set([...keys1, ...keys2]);
    
    return intersection.size / union.size;
  }

  updateAverageBuildTime(newTime) {
    const totalBuilds = this.knowledgeBase.metrics.totalBuilds;
    const currentAvg = this.knowledgeBase.metrics.averageBuildTime;
    
    this.knowledgeBase.metrics.averageBuildTime = 
      (currentAvg * (totalBuilds - 1) + newTime) / totalBuilds;
  }

  calculateFixSuccessRate() {
    const totalFixes = this.knowledgeBase.fixes.length;
    const successfulFixes = this.knowledgeBase.fixes.filter(f => f.success).length;
    
    return totalFixes > 0 ? (successfulFixes / totalFixes) * 100 : 0;
  }

  calculateConfidence(suggestions) {
    if (suggestions.length === 0) return 0;
    
    const highPriority = suggestions.filter(s => s.priority === 'high').length;
    const total = suggestions.length;
    
    return (highPriority / total) * 100;
  }

  calculateFixConfidence(fix, allRelatedFixes) {
    const recency = (new Date() - new Date(fix.timestamp)) / (1000 * 60 * 60 * 24); // days
    const successRate = allRelatedFixes.filter(f => f.success).length / allRelatedFixes.length;
    const attempts = fix.attempts;
    
    // Higher confidence for recent, successful fixes with fewer attempts
    return Math.max(0, Math.min(100, 
      (successRate * 100) - (recency * 2) - (attempts * 5)
    ));
  }

  async updateSuccessPatterns(successRecord) {
    const patterns = successRecord.patterns;
    
    // Update component generation patterns
    if (patterns.componentTypes) {
      if (!this.knowledgeBase.patterns.componentGeneration) {
        this.knowledgeBase.patterns.componentGeneration = {};
      }
      
      patterns.componentTypes.forEach(type => {
        if (!this.knowledgeBase.patterns.componentGeneration[type]) {
          this.knowledgeBase.patterns.componentGeneration[type] = 0;
        }
        this.knowledgeBase.patterns.componentGeneration[type]++;
      });
    }
    
    // Update strategy patterns
    if (patterns.successfulStrategies) {
      if (!this.knowledgeBase.patterns.strategies) {
        this.knowledgeBase.patterns.strategies = {};
      }
      
      patterns.successfulStrategies.forEach(strategy => {
        if (!this.knowledgeBase.patterns.strategies[strategy]) {
          this.knowledgeBase.patterns.strategies[strategy] = 0;
        }
        this.knowledgeBase.patterns.strategies[strategy]++;
      });
    }
  }

  getMostCommonErrors() {
    return Object.entries(this.knowledgeBase.metrics.commonErrors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
  }

  getBestPerformingPatterns() {
    const fastBuilds = this.knowledgeBase.successes
      .filter(s => s.buildTime < this.knowledgeBase.metrics.averageBuildTime)
      .sort((a, b) => a.buildTime - b.buildTime)
      .slice(0, 3);
    
    return fastBuilds.map(build => ({
      buildTime: build.buildTime,
      patterns: build.patterns
    }));
  }

  getImprovementTrends() {
    const recentBuilds = this.knowledgeBase.successes
      .filter(s => new Date() - new Date(s.timestamp) < 30 * 24 * 60 * 60 * 1000) // Last 30 days
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    if (recentBuilds.length < 2) return null;
    
    const firstHalf = recentBuilds.slice(0, Math.floor(recentBuilds.length / 2));
    const secondHalf = recentBuilds.slice(Math.floor(recentBuilds.length / 2));
    
    const avgTimeFirst = firstHalf.reduce((sum, b) => sum + b.buildTime, 0) / firstHalf.length;
    const avgTimeSecond = secondHalf.reduce((sum, b) => sum + b.buildTime, 0) / secondHalf.length;
    
    return {
      buildTimeImprovement: ((avgTimeFirst - avgTimeSecond) / avgTimeFirst) * 100,
      trend: avgTimeSecond < avgTimeFirst ? 'improving' : 'declining'
    };
  }

  async getSystemRecommendations() {
    const recommendations = [];
    
    if (this.knowledgeBase.metrics.fixSuccessRate < 70) {
      recommendations.push({
        type: 'system',
        message: 'Consider improving error detection patterns - fix success rate is low',
        priority: 'high'
      });
    }
    
    if (this.knowledgeBase.metrics.totalBuilds > 10 && 
        this.knowledgeBase.metrics.successfulBuilds / this.knowledgeBase.metrics.totalBuilds < 0.8) {
      recommendations.push({
        type: 'system',
        message: 'Build success rate could be improved - review common failure patterns',
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  async saveKnowledgeBase() {
    await fs.writeFile(this.knowledgeBasePath, JSON.stringify(this.knowledgeBase, null, 2));
  }
}

// Main execution
async function main() {
  const action = process.argv[2];
  
  try {
    const learning = new ClaudeLearningSystem();
    await learning.initialize();
    
    switch (action) {
      case 'report':
        const report = await learning.generateLearningReport();
        console.log('\n📊 LEARNING SYSTEM REPORT:');
        console.log(`   📈 Total Builds: ${report.overview.totalBuilds}`);
        console.log(`   ✅ Success Rate: ${report.overview.successRate.toFixed(1)}%`);
        console.log(`   ⏱️ Average Build Time: ${report.overview.averageBuildTime.toFixed(1)}s`);
        console.log(`   🔧 Fix Success Rate: ${report.overview.fixSuccessRate.toFixed(1)}%`);
        console.log(`   🧠 Patterns Learned: ${report.knowledgeGrowth.patternsLearned}`);
        break;
        
      case 'status':
        console.log('\n📚 LEARNING SYSTEM STATUS:');
        console.log(`   🏗️ Total Builds: ${learning.knowledgeBase.metrics.totalBuilds}`);
        console.log(`   ✅ Successful: ${learning.knowledgeBase.metrics.successfulBuilds}`);
        console.log(`   🔧 Fixes Applied: ${learning.knowledgeBase.fixes.length}`);
        console.log(`   📊 Patterns Learned: ${Object.keys(learning.knowledgeBase.patterns).length}`);
        break;
        
      default:
        console.log('Usage: node claude-learning-system.js [report|status]');
    }
    
  } catch (error) {
    console.error('❌ Learning System Error:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = ClaudeLearningSystem;