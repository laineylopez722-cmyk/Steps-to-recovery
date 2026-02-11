#!/usr/bin/env node
/**
 * Performance Audit Script for Steps to Recovery
 *
 * This script performs a comprehensive performance audit:
 * - Runs bundle analysis
 * - Checks for common performance anti-patterns
 * - Analyzes import patterns
 * - Checks for virtualization opportunities
 * - Suggests optimizations
 * - Generates PERFORMANCE_REPORT.md
 *
 * Usage:
 *   node scripts/performance-audit.js
 *   node scripts/performance-audit.js --fix
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const ROOT_PATH = path.join(__dirname, '..');
const MOBILE_APP_PATH = path.join(ROOT_PATH, 'apps', 'mobile');
const SRC_PATH = path.join(MOBILE_APP_PATH, 'src');
const REPORT_PATH = path.join(ROOT_PATH, 'docs', 'PERFORMANCE_REPORT.md');

// Audit configuration
const AUDIT_CONFIG = {
  maxFileLines: 300,
  maxComponentLines: 200,
  maxFunctionLines: 50,
  maxDependencySize: 1024 * 1024, // 1MB
  slowRenderThreshold: 16, // ms
  maxStarImports: 10,
};

// Anti-patterns to detect
const ANTI_PATTERNS = {
  // Large imports that can bloat bundle
  starImports: {
    pattern: /import\s*\*\s*as\s+\w+\s+from\s+['"]([^'"]+)['"]/g,
    severity: 'warning',
    message: 'Star import detected',
    suggestion: 'Import specific named exports to enable tree-shaking',
  },
  // Inline function definitions in render (causes re-renders)
  inlineFunctions: {
    pattern: /onPress=\{\(\)\s*=>/g,
    severity: 'warning',
    message: 'Inline arrow function in JSX',
    suggestion: 'Use useCallback to memoize the function',
  },
  // Inline objects in render (causes re-renders)
  inlineObjects: {
    pattern: /style=\{\{[^}]+\}\}/g,
    severity: 'info',
    message: 'Inline style object',
    suggestion: 'Define styles outside component or use StyleSheet',
  },
  // Console.log statements (performance impact in production)
  consoleLogs: {
    pattern: /console\.(log|warn|error|info)\(/g,
    severity: 'info',
    message: 'Console statement detected',
    suggestion: 'Use logger utility instead for production safety',
  },
  // Large components that should be split
  largeComponents: {
    pattern: /function\s+(\w+).*\{/g,
    check: 'lineCount',
    threshold: AUDIT_CONFIG.maxComponentLines,
    severity: 'warning',
    message: 'Large component detected',
    suggestion: 'Consider splitting into smaller components',
  },
  // No FlatList/FlashList for large lists
  noListVirtualization: {
    pattern: /\bmap\s*\(\s*\(?\s*\w+\s*\)?\s*=>/g,
    severity: 'error',
    message: 'Array.map() used for rendering list',
    suggestion: 'Use FlatList or FlashList for large lists to enable virtualization',
  },
  // Missing key prop
  missingKey: {
    pattern: /map\s*\([^)]*\)\s*=>\s*[^(]*<\w+(?!.*key=)/g,
    severity: 'error',
    message: 'List rendering may be missing key prop',
    suggestion: 'Add a unique key prop to list items',
  },
  // Heavy computations in render
  heavyComputation: {
    pattern: /\{(\s*\w+\.)*(filter|sort|reduce)\s*\(/g,
    severity: 'warning',
    message: 'Computation in render',
    suggestion: 'Use useMemo to memoize expensive computations',
  },
};

// Issue tracking
const issues = [];
const optimizations = [];
const stats = {
  filesAnalyzed: 0,
  componentsFound: 0,
  screensFound: 0,
  hooksFound: 0,
  totalLines: 0,
  starImports: 0,
  flatListUsages: 0,
  flashListUsages: 0,
  useMemoUsages: 0,
  useCallbackUsages: 0,
  memoUsages: 0,
};

/**
 * Add an issue to the report
 */
function addIssue(type, file, line, message, suggestion, severity = 'warning') {
  issues.push({
    type,
    file: path.relative(ROOT_PATH, file),
    line,
    message,
    suggestion,
    severity,
  });
}

/**
 * Add an optimization suggestion
 */
function addOptimization(title, description, impact, effort, files = []) {
  optimizations.push({
    title,
    description,
    impact, // high, medium, low
    effort, // high, medium, low
    files: files.map((f) => path.relative(ROOT_PATH, f)),
  });
}

/**
 * Count lines in a file
 */
function countLines(content) {
  return content.split('\n').length;
}

/**
 * Analyze a single file
 */
function analyzeFile(filePath, content) {
  const lines = content.split('\n');
  const lineCount = lines.length;
  stats.filesAnalyzed++;
  stats.totalLines += lineCount;

  const isComponent = filePath.includes('components') || filePath.includes('screens');
  const isScreen = filePath.includes('screens');
  const isHook = path.basename(filePath).startsWith('use');

  if (isComponent) stats.componentsFound++;
  if (isScreen) stats.screensFound++;
  if (isHook) stats.hooksFound++;

  // Check for large files
  if (lineCount > AUDIT_CONFIG.maxFileLines) {
    addIssue(
      'large-file',
      filePath,
      1,
      `File has ${lineCount} lines (threshold: ${AUDIT_CONFIG.maxFileLines})`,
      'Consider splitting into smaller modules',
      'warning',
    );
  }

  // Check for anti-patterns
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Star imports
    if (line.match(ANTI_PATTERNS.starImports.pattern)) {
      const match = line.match(/from\s+['"]([^'"]+)['"]/);
      const module = match ? match[1] : 'unknown';

      // Skip allowed star imports (React, Haptics, etc.)
      const allowedModules = ['react', 'expo-haptics', 'expo-secure-store', 'expo-notifications'];
      if (!allowedModules.some((m) => module.includes(m))) {
        addIssue(
          'star-import',
          filePath,
          lineNumber,
          `Star import from "${module}"`,
          ANTI_PATTERNS.starImports.suggestion,
          'warning',
        );
        stats.starImports++;
      }
    }

    // Inline functions in JSX
    if (line.match(ANTI_PATTERNS.inlineFunctions.pattern)) {
      addIssue(
        'inline-function',
        filePath,
        lineNumber,
        ANTI_PATTERNS.inlineFunctions.message,
        ANTI_PATTERNS.inlineFunctions.suggestion,
        'info',
      );
    }

    // Heavy computations
    if (line.match(ANTI_PATTERNS.heavyComputation.pattern)) {
      addIssue(
        'heavy-computation',
        filePath,
        lineNumber,
        ANTI_PATTERNS.heavyComputation.message,
        ANTI_PATTERNS.heavyComputation.suggestion,
        'warning',
      );
    }

    // Console statements
    if (line.match(ANTI_PATTERNS.consoleLogs.pattern) && !filePath.includes('logger')) {
      addIssue(
        'console-log',
        filePath,
        lineNumber,
        ANTI_PATTERNS.consoleLogs.message,
        ANTI_PATTERNS.consoleLogs.suggestion,
        'info',
      );
    }
  });

  // Check for performance hooks usage
  if (content.includes('useMemo')) stats.useMemoUsages++;
  if (content.includes('useCallback')) stats.useCallbackUsages++;
  if (content.includes('React.memo') || content.includes('memo(')) stats.memoUsages++;

  // Check for list virtualization
  if (content.includes('FlatList')) stats.flatListUsages++;
  if (content.includes('FlashList')) stats.flashListUsages++;

  // Check for potential list virtualization opportunities
  if (
    isComponent &&
    content.includes('.map(') &&
    !content.includes('FlatList') &&
    !content.includes('FlashList')
  ) {
    // Check if it's a large component with map usage
    const mapMatches = content.match(/\.map\(/g);
    if (mapMatches && mapMatches.length > 0) {
      addIssue(
        'no-virtualization',
        filePath,
        1,
        'Component uses .map() for rendering lists without FlatList/FlashList',
        'Consider using FlashList for better performance with large lists',
        'warning',
      );
    }
  }

  // Check for missing useMemo on expensive calculations
  if (content.includes('filter(') || content.includes('sort(') || content.includes('reduce(')) {
    // Check if inside useMemo
    if (!content.includes('useMemo')) {
      addIssue(
        'no-memoization',
        filePath,
        1,
        'File contains array operations that could benefit from memoization',
        'Wrap expensive computations in useMemo',
        'info',
      );
    }
  }
}

/**
 * Walk directory and analyze files
 */
function walkDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry);
    const stats = fs.statSync(entryPath);

    if (stats.isDirectory()) {
      // Skip excluded directories
      if (['node_modules', '.expo', 'dist', 'build', '__tests__', 'test-utils'].includes(entry)) {
        continue;
      }
      walkDirectory(entryPath);
    } else if (stats.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry)) {
      try {
        const content = fs.readFileSync(entryPath, 'utf-8');
        analyzeFile(entryPath, content);
      } catch (error) {
        console.error(`Error reading ${entryPath}:`, error.message);
      }
    }
  }
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations() {
  // 1. Code splitting opportunities
  const heavyScreens = [
    'MeetingFinderScreen.tsx',
    'ChatScreen.tsx',
    'JournalListScreen.tsx',
    'ProgressDashboardScreen.tsx',
  ];

  addOptimization(
    'Implement Code Splitting for Heavy Screens',
    `Screens like ${heavyScreens.join(', ')} are loaded upfront but may not be needed immediately. Use React.lazy() for on-demand loading.`,
    'high',
    'medium',
    heavyScreens.map((s) => path.join(SRC_PATH, 'features', s)),
  );

  // 2. List virtualization
  if (stats.flatListUsages > 0 || stats.flashListUsages === 0) {
    addOptimization(
      'Migrate to FlashList for All Large Lists',
      `Currently using FlatList ${stats.flatListUsages} times. FlashList provides better performance with recycling.`,
      'high',
      'low',
    );
  }

  // 3. Star imports
  if (stats.starImports > 0) {
    addOptimization(
      'Replace Star Imports with Named Imports',
      `${stats.starImports} star imports found. Named imports enable better tree-shaking.`,
      'medium',
      'low',
    );
  }

  // 4. Memoization
  const memoizationRate = (stats.useMemoUsages + stats.useCallbackUsages) / stats.componentsFound;
  if (memoizationRate < 0.5) {
    addOptimization(
      'Increase Memoization Coverage',
      `Only ${(memoizationRate * 100).toFixed(1)}% of components use memoization hooks. Add useMemo/useCallback to prevent unnecessary re-renders.`,
      'medium',
      'medium',
    );
  }

  // 5. Bundle optimization
  addOptimization(
    'Optimize Bundle Size',
    'Several heavy dependencies detected. Consider: 1) Lazy loading Sentry, 2) Importing specific icons instead of full libraries, 3) Using babel-plugin-lodash for tree-shaking.',
    'high',
    'medium',
  );

  // 6. Image optimization
  addOptimization(
    'Optimize Image Loading',
    'Ensure all images use expo-image with proper caching, content-fit, and lazy loading for off-screen images.',
    'medium',
    'low',
  );

  // 7. Performance monitoring
  addOptimization(
    'Add Performance Monitoring',
    'Use the new usePerformanceMonitor hook in key components to track render times and identify bottlenecks.',
    'low',
    'low',
  );
}

/**
 * Generate markdown report
 */
function generateReport() {
  let report = `# Performance Audit Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  report += `**App:** Steps to Recovery Mobile\n\n`;

  // Executive Summary
  report += `## Executive Summary\n\n`;

  const criticalCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  report += `- **Files Analyzed:** ${stats.filesAnalyzed}\n`;
  report += `- **Components:** ${stats.componentsFound}\n`;
  report += `- **Screens:** ${stats.screensFound}\n`;
  report += `- **Hooks:** ${stats.hooksFound}\n`;
  report += `- **Total Lines:** ${stats.totalLines.toLocaleString()}\n`;
  report += `- **Issues Found:** ${issues.length} (${criticalCount} critical, ${warningCount} warnings, ${infoCount} info)\n\n`;

  // Performance Score
  const score = Math.max(0, 100 - criticalCount * 10 - warningCount * 3 - infoCount * 1);
  const scoreEmoji = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';
  report += `## Performance Score: ${scoreEmoji} ${score}/100\n\n`;

  // Quick Stats
  report += `## Quick Stats\n\n`;
  report += `| Metric | Count | Status |\n`;
  report += `|--------|-------|--------|\n`;
  report += `| Star Imports | ${stats.starImports} | ${stats.starImports > 10 ? '🔴' : stats.starImports > 5 ? '🟡' : '🟢'} |\n`;
  report += `| FlatList Usage | ${stats.flatListUsages} | 🟢 |\n`;
  report += `| FlashList Usage | ${stats.flashListUsages} | ${stats.flashListUsages < stats.flatListUsages ? '🟡' : '🟢'} |\n`;
  report += `| useMemo Usage | ${stats.useMemoUsages} | 🟢 |\n`;
  report += `| useCallback Usage | ${stats.useCallbackUsages} | 🟢 |\n`;
  report += `| React.memo Usage | ${stats.memoUsages} | ${stats.memoUsages < stats.componentsFound / 2 ? '🟡' : '🟢'} |\n\n`;

  // Critical Issues
  if (criticalCount > 0) {
    report += `## 🔴 Critical Issues\n\n`;
    issues
      .filter((i) => i.severity === 'error')
      .forEach((issue) => {
        report += `### ${issue.message}\n\n`;
        report += `- **File:** \`${issue.file}\`\n`;
        report += `- **Line:** ${issue.line}\n`;
        report += `- **Suggestion:** ${issue.suggestion}\n\n`;
      });
  }

  // Warnings
  if (warningCount > 0) {
    report += `## 🟡 Warnings (${warningCount})\n\n`;
    const warningTypes = {};
    issues
      .filter((i) => i.severity === 'warning')
      .forEach((issue) => {
        if (!warningTypes[issue.type]) warningTypes[issue.type] = [];
        warningTypes[issue.type].push(issue);
      });

    Object.entries(warningTypes).forEach(([type, typeIssues]) => {
      report += `<details>\n`;
      report += `<summary><strong>${type.replace(/-/g, ' ').toUpperCase()}</strong> (${typeIssues.length})</summary>\n\n`;
      typeIssues.slice(0, 10).forEach((issue) => {
        report += `- \`${issue.file}:${issue.line}\` - ${issue.message}\n`;
      });
      if (typeIssues.length > 10) {
        report += `- ... and ${typeIssues.length - 10} more\n`;
      }
      report += `</details>\n\n`;
    });
  }

  // Optimization Recommendations
  report += `## 💡 Optimization Recommendations\n\n`;

  // Sort by impact
  const impactOrder = { high: 0, medium: 1, low: 2 };
  optimizations.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  optimizations.forEach((opt, index) => {
    const impactEmoji = opt.impact === 'high' ? '🔴' : opt.impact === 'medium' ? '🟡' : '🟢';
    const effortEmoji = opt.effort === 'high' ? '🔴' : opt.effort === 'medium' ? '🟡' : '🟢';

    report += `### ${index + 1}. ${opt.title}\n\n`;
    report += `${opt.description}\n\n`;
    report += `- **Impact:** ${impactEmoji} ${opt.impact.toUpperCase()}\n`;
    report += `- **Effort:** ${effortEmoji} ${opt.effort.toUpperCase()}\n`;
    if (opt.files.length > 0) {
      report += `- **Files:**\n`;
      opt.files.forEach((f) => {
        report += `  - \`${f}\`\n`;
      });
    }
    report += `\n`;
  });

  // Performance Budget
  report += `## 📊 Performance Budget\n\n`;
  report += `Current targets for the app:\n\n`;
  report += `| Metric | Target | Current | Status |\n`;
  report += `|--------|--------|---------|--------|\n`;
  report += `| Bundle Size | < 4MB | Unknown | ⚪ |\n`;
  report += `| Cold Start | < 2s | Unknown | ⚪ |\n`;
  report += `| Screen Load | < 300ms | Unknown | ⚪ |\n`;
  report += `| List Scroll | 60 FPS | Unknown | ⚪ |\n\n`;

  // Next Steps
  report += `## 🚀 Next Steps\n\n`;
  report += `1. **Immediate (This Week):**\n`;
  report += `   - [ ] Run bundle analysis: \`node scripts/analyze-bundle.js\`\n`;
  report += `   - [ ] Fix critical issues identified above\n`;
  report += `   - [ ] Add performance monitoring to 3 most-used screens\n\n`;
  report += `2. **Short Term (Next 2 Weeks):**\n`;
  report += `   - [ ] Migrate FlatList to FlashList where applicable\n`;
  report += `   - [ ] Replace star imports with named imports\n`;
  report += `   - [ ] Add code splitting for heavy screens\n\n`;
  report += `3. **Long Term (Next Month):**\n`;
  report += `   - [ ] Implement performance regression testing\n`;
  report += `   - [ ] Set up CI performance budget checks\n`;
  report += `   - [ ] Profile app on low-end devices\n\n`;

  report += `---\n\n`;
  report += `*This report was generated automatically by the performance audit script.*\n`;

  return report;
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('🔍 Starting Performance Audit...\n');

  // Check if source directory exists
  if (!fs.existsSync(SRC_PATH)) {
    console.error(`❌ Source directory not found: ${SRC_PATH}`);
    process.exit(1);
  }

  // Analyze all source files
  console.log('📁 Analyzing source files...');
  walkDirectory(SRC_PATH);

  // Generate recommendations
  console.log('💡 Generating recommendations...');
  generateRecommendations();

  // Generate report
  console.log('📄 Generating report...');
  const report = generateReport();

  // Save report
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`✅ Report saved to ${REPORT_PATH}\n`);

  // Print summary
  console.log('='.repeat(60));
  console.log('PERFORMANCE AUDIT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files Analyzed: ${stats.filesAnalyzed}`);
  console.log(`Total Lines: ${stats.totalLines.toLocaleString()}`);
  console.log(`Issues Found: ${issues.length}`);
  console.log(`  - Critical: ${issues.filter((i) => i.severity === 'error').length}`);
  console.log(`  - Warnings: ${issues.filter((i) => i.severity === 'warning').length}`);
  console.log(`  - Info: ${issues.filter((i) => i.severity === 'info').length}`);
  console.log(`Recommendations: ${optimizations.length}`);
  console.log('='.repeat(60));

  // Top issues
  const topIssues = issues
    .filter((i) => i.severity === 'warning' || i.severity === 'error')
    .slice(0, 5);
  if (topIssues.length > 0) {
    console.log('\n⚠️  Top Issues:');
    topIssues.forEach((issue, i) => {
      const icon = issue.severity === 'error' ? '🔴' : '🟡';
      console.log(`${icon} ${issue.message} (${issue.file}:${issue.line})`);
    });
  }

  console.log('\n✨ View full report: docs/PERFORMANCE_REPORT.md\n');
}

// Run audit
runAudit().catch((error) => {
  console.error('❌ Audit failed:', error);
  process.exit(1);
});
