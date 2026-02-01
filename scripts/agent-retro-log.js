/**
 * Append a retro entry for an agent to agent-retro-log.md.
 *
 * Usage:
 *   node scripts/agent-retro-log.js "Agent Name" "Worked" "Slowdown" "Checklist tweak" "Unneeded docs"
 *
 * Only the first two arguments are required (agent name, worked). Others default to "n/a".
 */
import { appendFileSync } from 'fs';
import { join } from 'path';

const [agentName, worked, slowdown, checklistTweak, unneededDocs] = process.argv.slice(2);

if (!agentName || !worked) {
  console.log(
    'Usage: node scripts/agent-retro-log.js "Agent Name" "Worked" "Slowdown" "Checklist tweak" "Unneeded docs"',
  );
  process.exit(1);
}

const timestamp = new Date().toISOString();
const entry = [
  `## ${timestamp} - ${agentName}`,
  `- Worked: ${worked}`,
  `- Slowdown: ${slowdown || 'n/a'}`,
  `- Checklist tweak: ${checklistTweak || 'n/a'}`,
  `- Unneeded docs: ${unneededDocs || 'n/a'}`,
  '',
].join('\n');

const logPath = join(__dirname, '..', 'agent-retro-log.md');

try {
  appendFileSync(logPath, `${entry}\n`);
  console.log(`Retro logged to ${logPath}`);
} catch (error) {
  console.error('Failed to write retro log:', error);
  process.exit(1);
}
