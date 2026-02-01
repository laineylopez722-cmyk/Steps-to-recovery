/**
 * Accessibility Audit Script
 * Scans codebase for interactive components missing required accessibility props
 *
 * Usage: npx tsx scripts/audit-accessibility.ts
 *
 * WCAG AAA Requirements (from CLAUDE.md):
 * - accessibilityLabel (required)
 * - accessibilityRole (required)
 * - accessibilityState (when disabled/loading)
 * - accessibilityHint (when action is non-obvious)
 */

import * as fs from 'fs';
import * as path from 'path';

const INTERACTIVE_COMPONENTS = [
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'Pressable',
  'Button',
];

const REQUIRED_PROPS = ['accessibilityLabel', 'accessibilityRole'];
const CONDITIONAL_PROPS = ['accessibilityState', 'accessibilityHint'];

interface AccessibilityIssue {
  file: string;
  line: number;
  component: string;
  missingProps: string[];
  severity: 'error' | 'warning';
}

function scanFile(filePath: string): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Check for interactive components
    INTERACTIVE_COMPONENTS.forEach((component) => {
      if (line.includes(`<${component}`)) {
        const missingProps: string[] = [];

        // Check for required props
        REQUIRED_PROPS.forEach((prop) => {
          // Look ahead a few lines to check if prop is present
          const contextLines = lines.slice(index, Math.min(index + 10, lines.length)).join('\n');
          if (!contextLines.includes(prop)) {
            missingProps.push(prop);
          }
        });

        if (missingProps.length > 0) {
          issues.push({
            file: filePath,
            line: index + 1,
            component,
            missingProps,
            severity: 'error',
          });
        }
      }
    });
  });

  return issues;
}

function scanDirectory(dir: string): AccessibilityIssue[] {
  let issues: AccessibilityIssue[] = [];

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build
      if (!['node_modules', 'dist', 'build', '.expo'].includes(file)) {
        issues = issues.concat(scanDirectory(fullPath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      issues = issues.concat(scanFile(fullPath));
    }
  });

  return issues;
}

function generateReport(issues: AccessibilityIssue[]): void {
  console.log('\n========================================');
  console.log('  Accessibility Audit Report');
  console.log('========================================\n');

  if (issues.length === 0) {
    console.log('✅ No accessibility issues found!\n');
    return;
  }

  console.log(`❌ Found ${issues.length} accessibility issues:\n`);

  // Group by file
  const byFile: Record<string, AccessibilityIssue[]> = {};
  issues.forEach((issue) => {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  });

  Object.entries(byFile).forEach(([file, fileIssues]) => {
    console.log(`\n📄 ${file.replace(process.cwd(), '')}`);
    fileIssues.forEach((issue) => {
      console.log(
        `   Line ${issue.line}: <${issue.component}> missing: ${issue.missingProps.join(', ')}`,
      );
    });
  });

  console.log('\n========================================');
  console.log(`Total: ${issues.length} issues`);
  console.log('========================================\n');
}

// Run the audit
const srcDir = path.join(process.cwd(), 'apps', 'mobile', 'src');
const issues = scanDirectory(srcDir);
generateReport(issues);

// Exit with error code if issues found
process.exit(issues.length > 0 ? 1 : 0);
