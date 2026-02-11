#!/usr/bin/env node
/**
 * Bundle Size Analyzer for Steps to Recovery
 *
 * Analyzes the JavaScript bundle size, identifies largest dependencies,
 * suggests code splitting opportunities, and generates a bundle report.
 *
 * Usage:
 *   node scripts/analyze-bundle.js
 *   node scripts/analyze-bundle.js --json
 *   node scripts/analyze-bundle.js --verbose
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MOBILE_APP_PATH = path.join(__dirname, '..', 'apps', 'mobile');
const PACKAGE_JSON_PATH = path.join(MOBILE_APP_PATH, 'package.json');
const NODE_MODULES_PATH = path.join(MOBILE_APP_PATH, 'node_modules');
const OUTPUT_PATH = path.join(__dirname, '..', 'docs', 'BUNDLE_ANALYSIS.md');

// Size thresholds (in bytes)
const SIZE_THRESHOLDS = {
  small: 50 * 1024, // < 50KB
  medium: 100 * 1024, // < 100KB
  large: 500 * 1024, // < 500KB
  huge: 1024 * 1024, // >= 1MB
};

// Known heavy dependencies that should be code-split or optimized
const HEAVY_DEPENDENCIES = [
  '@sentry/react-native',
  '@supabase/supabase-js',
  'crypto-js',
  'react-native-reanimated',
  'react-native-gesture-handler',
  '@shopify/flash-list',
  'drizzle-orm',
  '@tanstack/react-query',
  'expo-sqlite',
  'lucide-react-native',
  '@expo/vector-icons',
];

// Dependencies that support tree-shaking
const TREE_SHAKABLE_DEPENDENCIES = [
  'lucide-react-native',
  '@expo/vector-icons',
  'date-fns',
  'lodash-es',
];

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get size category
 */
function getSizeCategory(bytes) {
  if (bytes < SIZE_THRESHOLDS.small) return 'small';
  if (bytes < SIZE_THRESHOLDS.medium) return 'medium';
  if (bytes < SIZE_THRESHOLDS.large) return 'large';
  if (bytes < SIZE_THRESHOLDS.huge) return 'huge';
  return 'massive';
}

/**
 * Get size color for terminal output
 */
function getSizeColor(bytes) {
  const category = getSizeCategory(bytes);
  const colors = {
    small: '\x1b[32m', // green
    medium: '\x1b[33m', // yellow
    large: '\x1b[35m', // magenta
    huge: '\x1b[31m', // red
    massive: '\x1b[31m\x1b[1m', // bold red
  };
  return colors[category] || '\x1b[0m';
}

/**
 * Calculate directory size recursively
 */
function getDirectorySize(dirPath) {
  let totalSize = 0;

  try {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        // Skip common non-essential directories
        if (
          [
            '.bin',
            'node_modules',
            '.git',
            'test',
            'tests',
            '__tests__',
            'docs',
            'examples',
          ].includes(file)
        ) {
          continue;
        }
        totalSize += getDirectorySize(filePath);
      } else {
        // Only count JS/TS files and assets
        const ext = path.extname(file);
        if (['.js', '.ts', '.tsx', '.json', '.wasm'].includes(ext)) {
          totalSize += stats.size;
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return totalSize;
}

/**
 * Get dependency size
 */
function getDependencySize(depName) {
  const depPath = path.join(NODE_MODULES_PATH, depName);

  // Check if it's a scoped package
  if (depName.startsWith('@')) {
    const [scope, name] = depName.split('/');
    const scopePath = path.join(NODE_MODULES_PATH, scope);
    const packagePath = path.join(scopePath, name);
    return getDirectorySize(packagePath);
  }

  return getDirectorySize(depPath);
}

/**
 * Analyze imports in source files
 */
function analyzeImports() {
  const srcPath = path.join(MOBILE_APP_PATH, 'src');
  const importPatterns = {
    starImports: [], // import * as X from '...'
    defaultImports: [], // import X from '...'
    namedImports: [], // import { X } from '...'
    dynamicImports: [], // import('...')
  };

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, lineNum) => {
        // Star imports (potential bundle bloat)
        const starMatch = line.match(/import\s*\*\s*as\s+\w+\s+from\s+['"]([^'"]+)['"]/);
        if (starMatch) {
          importPatterns.starImports.push({
            file: filePath,
            line: lineNum + 1,
            module: starMatch[1],
          });
        }

        // Dynamic imports (good for code splitting)
        const dynamicMatch = line.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (dynamicMatch) {
          importPatterns.dynamicImports.push({
            file: filePath,
            line: lineNum + 1,
            module: dynamicMatch[1],
          });
        }

        // Named imports
        const namedMatch = line.match(/import\s*\{([^}]+)\}\s*from\s+['"]([^'"]+)['"]/);
        if (namedMatch) {
          importPatterns.namedImports.push({
            file: filePath,
            line: lineNum + 1,
            module: namedMatch[2],
            imports: namedMatch[1].split(',').map((s) => s.trim()),
          });
        }
      });
    } catch (error) {
      // File can't be read
    }
  }

  function scanDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath);

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const stats = fs.statSync(entryPath);

        if (stats.isDirectory() && entry !== 'node_modules' && !entry.startsWith('.')) {
          scanDirectory(entryPath);
        } else if (stats.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry)) {
          scanFile(entryPath);
        }
      }
    } catch (error) {
      // Directory can't be read
    }
  }

  scanDirectory(srcPath);
  return importPatterns;
}

/**
 * Generate code splitting recommendations
 */
function generateRecommendations(deps, imports) {
  const recommendations = [];

  // Check for star imports from large packages
  imports.starImports.forEach(({ file, line, module }) => {
    if (HEAVY_DEPENDENCIES.some((dep) => module.includes(dep))) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        message: `Star import from heavy dependency "${module}" may increase bundle size`,
        location: `${path.relative(MOBILE_APP_PATH, file)}:${line}`,
        suggestion: `Import specific exports instead: import { specificFunction } from '${module}'`,
      });
    }
  });

  // Check for heavy dependencies that could be lazy loaded
  const lazyLoadableDeps = [
    { name: '@sentry/react-native', reason: 'Only needed for error tracking' },
    { name: 'expo-print', reason: 'Only needed when printing' },
    { name: 'expo-sharing', reason: 'Only needed when sharing' },
    { name: 'react-native-confetti-cannon', reason: 'Only needed for celebrations' },
  ];

  lazyLoadableDeps.forEach((dep) => {
    const depInfo = deps.find((d) => d.name === dep.name);
    if (depInfo) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        message: `"${dep.name}" (${formatBytes(depInfo.size)}) could be lazy loaded`,
        reason: dep.reason,
        suggestion: `Use React.lazy() or dynamic import: const Module = await import('${dep.name}')`,
      });
    }
  });

  // Check for icon libraries (often import all icons)
  const iconImports = imports.namedImports.filter(
    (i) => i.module.includes('lucide-react-native') || i.module.includes('@expo/vector-icons'),
  );

  if (iconImports.length > 0) {
    recommendations.push({
      type: 'optimization',
      priority: 'low',
      message: 'Icon libraries detected - verify tree-shaking is working',
      suggestion: 'Ensure babel-plugin-lodash or similar is configured for icon libraries',
    });
  }

  return recommendations;
}

/**
 * Generate bundle analysis report
 */
function generateReport(deps, imports, options = {}) {
  const { json = false, verbose = false } = options;

  const totalSize = deps.reduce((sum, d) => sum + d.size, 0);
  const heavyDeps = deps.filter((d) => d.size > SIZE_THRESHOLDS.large);
  const recommendations = generateRecommendations(deps, imports);

  const report = {
    summary: {
      totalDependencies: deps.length,
      totalSize: formatBytes(totalSize),
      totalSizeBytes: totalSize,
      heavyDependencies: heavyDeps.length,
      starImports: imports.starImports.length,
      dynamicImports: imports.dynamicImports.length,
    },
    topDependencies: deps.slice(0, 20).map((d) => ({
      name: d.name,
      size: formatBytes(d.size),
      sizeBytes: d.size,
      category: getSizeCategory(d.size),
    })),
    heavyDependencies: heavyDeps.map((d) => ({
      name: d.name,
      size: formatBytes(d.size),
      sizeBytes: d.size,
    })),
    importAnalysis: {
      starImports: verbose ? imports.starImports : imports.starImports.slice(0, 10),
      dynamicImports: imports.dynamicImports,
    },
    recommendations: recommendations,
    timestamp: new Date().toISOString(),
  };

  if (json) {
    return JSON.stringify(report, null, 2);
  }

  // Generate Markdown report
  let md = `# Bundle Size Analysis Report\n\n`;
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Summary
  md += `## Summary\n\n`;
  md += `- **Total Dependencies**: ${report.summary.totalDependencies}\n`;
  md += `- **Total Size**: ${report.summary.totalSize}\n`;
  md += `- **Heavy Dependencies**: ${report.summary.heavyDependencies}\n`;
  md += `- **Star Imports**: ${report.summary.starImports} (potential bloat)\n`;
  md += `- **Dynamic Imports**: ${report.summary.dynamicImports} (good for code splitting)\n\n`;

  // Performance Budget Check
  const BUDGET_LIMIT = 5 * 1024 * 1024; // 5MB
  const budgetPercent = (totalSize / BUDGET_LIMIT) * 100;
  const budgetStatus = totalSize > BUDGET_LIMIT ? '❌ EXCEEDED' : '✅ Within budget';
  md += `## Performance Budget\n\n`;
  md += `- **Budget**: ${formatBytes(BUDGET_LIMIT)}\n`;
  md += `- **Current**: ${formatBytes(totalSize)} (${budgetPercent.toFixed(1)}%)\n`;
  md += `- **Status**: ${budgetStatus}\n\n`;

  // Top Dependencies
  md += `## Top 20 Dependencies by Size\n\n`;
  md += `| Package | Size | Category |\n`;
  md += `|---------|------|----------|\n`;
  report.topDependencies.forEach((dep) => {
    const icon = {
      small: '🟢',
      medium: '🟡',
      large: '🟠',
      huge: '🔴',
      massive: '🚨',
    }[dep.category];
    md += `| ${dep.name} | ${dep.size} | ${icon} ${dep.category} |\n`;
  });
  md += `\n`;

  // Recommendations
  md += `## Optimization Recommendations\n\n`;
  if (recommendations.length === 0) {
    md += `No critical issues found. Bundle is well-optimized! 🎉\n`;
  } else {
    recommendations.forEach((rec, i) => {
      const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      md += `### ${icon} ${i + 1}. ${rec.message}\n\n`;
      if (rec.location) md += `- **Location**: \`${rec.location}\`\n`;
      if (rec.reason) md += `- **Reason**: ${rec.reason}\n`;
      md += `- **Suggestion**: ${rec.suggestion}\n\n`;
    });
  }

  // Import Patterns
  if (imports.starImports.length > 0) {
    md += `## Star Import Analysis\n\n`;
    md += `Star imports (\`import * as X\`) can increase bundle size by importing unused exports.\n\n`;
    md += `| File | Line | Module |\n`;
    md += `|------|------|--------|\n`;
    (verbose ? imports.starImports : imports.starImports.slice(0, 20)).forEach((imp) => {
      md += `| ${path.relative(MOBILE_APP_PATH, imp.file)} | ${imp.line} | ${imp.module} |\n`;
    });
    if (!verbose && imports.starImports.length > 20) {
      md += `\n... and ${imports.starImports.length - 20} more. Use --verbose to see all.\n`;
    }
    md += `\n`;
  }

  return md;
}

/**
 * Main analysis function
 */
async function analyzeBundle() {
  console.log('🔍 Analyzing bundle size...\n');

  // Check if mobile app exists
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.error(`❌ Mobile app not found at ${MOBILE_APP_PATH}`);
    process.exit(1);
  }

  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  console.log(`📦 Found ${Object.keys(allDeps).length} dependencies\n`);

  // Analyze each dependency
  console.log('📊 Calculating dependency sizes...');
  const deps = [];

  for (const [name, version] of Object.entries(allDeps)) {
    const size = getDependencySize(name);
    deps.push({ name, version, size });
  }

  // Sort by size (descending)
  deps.sort((a, b) => b.size - a.size);

  // Analyze imports
  console.log('🔎 Scanning source files for import patterns...');
  const imports = analyzeImports();

  // Parse options
  const args = process.argv.slice(2);
  const options = {
    json: args.includes('--json'),
    verbose: args.includes('--verbose'),
  };

  // Generate report
  console.log('\n📄 Generating report...\n');
  const report = generateReport(deps, imports, options);

  if (options.json) {
    console.log(report);
  } else {
    // Save markdown report
    fs.writeFileSync(OUTPUT_PATH, report);
    console.log(`✅ Report saved to ${OUTPUT_PATH}\n`);

    // Print summary to console
    const totalSize = deps.reduce((sum, d) => sum + d.size, 0);
    console.log('='.repeat(60));
    console.log('BUNDLE SIZE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Size: ${getSizeColor(totalSize)}${formatBytes(totalSize)}\x1b[0m`);
    console.log(`Dependencies: ${deps.length}`);
    console.log(
      `Heavy deps (>500KB): ${deps.filter((d) => d.size > SIZE_THRESHOLDS.large).length}`,
    );
    console.log(`Star imports: ${imports.starImports.length}`);
    console.log('='.repeat(60));

    console.log('\n📋 Top 10 Largest Dependencies:');
    console.log('-'.repeat(60));
    deps.slice(0, 10).forEach((dep, i) => {
      const color = getSizeColor(dep.size);
      console.log(
        `${(i + 1).toString().padStart(2)}. ${color}${formatBytes(dep.size).padStart(10)}\x1b[0m ${dep.name}`,
      );
    });

    // Recommendations
    const recommendations = generateRecommendations(deps, imports);
    if (recommendations.length > 0) {
      console.log('\n⚠️  Recommendations:');
      console.log('-'.repeat(60));
      recommendations.slice(0, 5).forEach((rec) => {
        const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
        console.log(`${icon} ${rec.message}`);
      });
    }

    console.log('\n✨ Run with --verbose for detailed analysis\n');
  }
}

// Run analysis
analyzeBundle().catch((error) => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});
