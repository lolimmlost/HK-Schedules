#!/usr/bin/env ts-node
/**
 * GitHub Issue Generator for HK-Schedules Quality of Life Stories
 *
 * This script parses QUALITY_OF_LIFE_STORIES.md and generates GitHub issues
 * for each story and its phases.
 *
 * Usage:
 *   npm run generate-issues                    # Generate all issues
 *   npm run generate-issues -- --dry-run       # Preview without creating
 *   npm run generate-issues -- --priority high # Only high priority
 *   npm run generate-issues -- --story 1       # Only Story 1
 *   npm run generate-issues -- --help          # Show help
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

// Types
interface Story {
  number: number;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  complexity: 'Low' | 'Medium' | 'High' | 'Very High';
  estimate: string;
  userStory: string;
  acceptanceCriteria: string[];
  technicalRequirements: string[];
  phases: Phase[];
  description: string;
}

interface Phase {
  number: string;
  description: string;
}

interface GeneratorOptions {
  dryRun: boolean;
  priority?: 'High' | 'Medium' | 'Low';
  story?: number;
  createLabels: boolean;
  verbose: boolean;
}

// Constants
const STORIES_FILE = join(__dirname, '..', 'QUALITY_OF_LIFE_STORIES.md');
const OUTPUT_FILE = join(__dirname, '..', 'generated-issues.json');

const PRIORITY_LABELS = {
  'High': 'priority: high',
  'Medium': 'priority: medium',
  'Low': 'priority: low'
};

const COMPLEXITY_LABELS = {
  'Low': 'complexity: low',
  'Medium': 'complexity: medium',
  'High': 'complexity: high',
  'Very High': 'complexity: very-high'
};

const LABELS = {
  FEATURE: 'feature',
  ENHANCEMENT: 'enhancement',
  QOL: 'quality-of-life',
  PHASE: 'phase',
  STORY: 'story'
};

// Utility Functions
function log(message: string, verbose = false, options: GeneratorOptions) {
  if (!verbose || options.verbose) {
    console.log(message);
  }
}

function exec(command: string, options: GeneratorOptions): string {
  if (options.dryRun) {
    log(`[DRY RUN] Would execute: ${command}`, false, options);
    return '';
  }

  try {
    return execSync(command, { encoding: 'utf-8' });
  } catch (error: any) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    throw error;
  }
}

// Parse the stories markdown file
function parseStoriesFile(filePath: string): Story[] {
  const content = readFileSync(filePath, 'utf-8');
  const stories: Story[] = [];

  // Split into story sections
  const storyRegex = /### Story (\d+): (.+?)\n\*\*Priority\*\*: (.+?) \| \*\*Complexity\*\*: (.+?) \| \*\*Estimate\*\*: (.+?)\n\n\*\*User Story\*\*: (.+?)\n\n\*\*Acceptance Criteria\*\*:\n((?:- .+\n)+)\n\*\*Technical Requirements\*\*:\n((?:- .+\n)+)\*\*Phases\*\*:\n((?:\d+\. \*\*Phase .+\n)+)/gs;

  let match;
  while ((match = storyRegex.exec(content)) !== null) {
    const [
      ,
      numberStr,
      title,
      priority,
      complexity,
      estimate,
      userStory,
      acceptanceCriteriaRaw,
      technicalRequirementsRaw,
      phasesRaw
    ] = match;

    const number = parseInt(numberStr);

    // Parse acceptance criteria
    const acceptanceCriteria = acceptanceCriteriaRaw
      .split('\n')
      .filter(line => line.trim().startsWith('- ✅'))
      .map(line => line.replace('- ✅', '').trim());

    // Parse technical requirements
    const technicalRequirements = technicalRequirementsRaw
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace('-', '').trim());

    // Parse phases
    const phaseRegex = /\d+\. \*\*Phase ([\d.]+)\*\*: (.+)/g;
    const phases: Phase[] = [];
    let phaseMatch;
    while ((phaseMatch = phaseRegex.exec(phasesRaw)) !== null) {
      phases.push({
        number: phaseMatch[1],
        description: phaseMatch[2]
      });
    }

    // Build full description
    const description = `
## User Story
${userStory}

## Acceptance Criteria
${acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Technical Requirements
${technicalRequirements.map(r => `- ${r}`).join('\n')}

## Estimate
${estimate}

## Phases
This story has ${phases.length} phases. Each phase will have its own issue linked below.
    `.trim();

    stories.push({
      number,
      title,
      priority: priority as Story['priority'],
      complexity: complexity as Story['complexity'],
      estimate,
      userStory,
      acceptanceCriteria,
      technicalRequirements,
      phases,
      description
    });
  }

  return stories;
}

// Create GitHub labels if they don't exist
function ensureLabels(options: GeneratorOptions) {
  if (!options.createLabels) return;

  log('Creating labels...', false, options);

  const labels = [
    { name: LABELS.FEATURE, color: '0E8A16', description: 'New feature' },
    { name: LABELS.ENHANCEMENT, color: 'A2EEEF', description: 'Enhancement to existing feature' },
    { name: LABELS.QOL, color: 'FBCA04', description: 'Quality of life improvement' },
    { name: LABELS.PHASE, color: 'D4C5F9', description: 'Implementation phase' },
    { name: LABELS.STORY, color: '0052CC', description: 'User story' },
    { name: PRIORITY_LABELS.High, color: 'D93F0B', description: 'High priority' },
    { name: PRIORITY_LABELS.Medium, color: 'FBCA04', description: 'Medium priority' },
    { name: PRIORITY_LABELS.Low, color: 'C5DEF5', description: 'Low priority' },
    { name: COMPLEXITY_LABELS.Low, color: 'C2E0C6', description: 'Low complexity' },
    { name: COMPLEXITY_LABELS.Medium, color: 'F9D0C4', description: 'Medium complexity' },
    { name: COMPLEXITY_LABELS.High, color: 'F7C6C7', description: 'High complexity' },
    { name: COMPLEXITY_LABELS['Very High'], color: 'E99695', description: 'Very high complexity' }
  ];

  for (const label of labels) {
    try {
      exec(`gh label create "${label.name}" --color ${label.color} --description "${label.description}" --force`, options);
      log(`  ✓ Created label: ${label.name}`, true, options);
    } catch (error) {
      log(`  ⚠ Label may already exist: ${label.name}`, true, options);
    }
  }
}

// Create a GitHub issue
function createIssue(
  title: string,
  body: string,
  labels: string[],
  options: GeneratorOptions
): string {
  const labelsArg = labels.map(l => `"${l}"`).join(',');
  const command = `gh issue create --title "${title}" --body "${body.replace(/"/g, '\\"')}" --label ${labelsArg}`;

  log(`Creating issue: ${title}`, false, options);
  const output = exec(command, options);

  if (options.dryRun) {
    return `#DRY-RUN-${Math.random()}`;
  }

  // Extract issue URL from output
  const urlMatch = output.match(/https:\/\/github\.com\/[^\s]+/);
  return urlMatch ? urlMatch[0] : '';
}

// Generate issues for a story
function generateStoryIssues(story: Story, options: GeneratorOptions): { storyUrl: string; phaseUrls: string[] } {
  log(`\n📋 Processing Story ${story.number}: ${story.title}`, false, options);

  // Create main story issue
  const storyLabels = [
    LABELS.STORY,
    LABELS.QOL,
    PRIORITY_LABELS[story.priority],
    COMPLEXITY_LABELS[story.complexity]
  ];

  const storyTitle = `Story ${story.number}: ${story.title}`;
  const storyUrl = createIssue(storyTitle, story.description, storyLabels, options);

  log(`  ✓ Created story issue: ${storyUrl}`, false, options);

  // Create phase issues
  const phaseUrls: string[] = [];
  for (const phase of story.phases) {
    const phaseLabels = [
      LABELS.PHASE,
      LABELS.QOL,
      PRIORITY_LABELS[story.priority]
    ];

    const phaseTitle = `[Story ${story.number}] Phase ${phase.number}: ${phase.description}`;
    const phaseBody = `
## Story
${story.title}

## Phase
${phase.number}: ${phase.description}

## Parent Story
${storyUrl}

## Related Stories
- [ ] Complete all previous phases
- [ ] See Story ${story.number} for full context
    `.trim();

    const phaseUrl = createIssue(phaseTitle, phaseBody, phaseLabels, options);
    phaseUrls.push(phaseUrl);

    log(`  ✓ Created phase issue: Phase ${phase.number}`, true, options);
  }

  // Update story issue with phase links (if not dry run)
  if (!options.dryRun && phaseUrls.length > 0) {
    const phaseLinks = phaseUrls.map((url, i) => `- [ ] Phase ${story.phases[i].number}: ${url}`).join('\n');
    const updatedBody = story.description + '\n\n## Phase Issues\n' + phaseLinks;

    // Get issue number from URL
    const issueNumberMatch = storyUrl.match(/\/(\d+)$/);
    if (issueNumberMatch) {
      const issueNumber = issueNumberMatch[1];
      try {
        exec(`gh issue edit ${issueNumber} --body "${updatedBody.replace(/"/g, '\\"')}"`, options);
        log(`  ✓ Updated story issue with phase links`, true, options);
      } catch (error) {
        log(`  ⚠ Failed to update story issue with phase links`, true, options);
      }
    }
  }

  return { storyUrl, phaseUrls };
}

// Main function
function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: GeneratorOptions = {
    dryRun: args.includes('--dry-run'),
    createLabels: !args.includes('--no-labels'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    priority: args.includes('--priority')
      ? (args[args.indexOf('--priority') + 1] as GeneratorOptions['priority'])
      : undefined,
    story: args.includes('--story')
      ? parseInt(args[args.indexOf('--story') + 1])
      : undefined
  };

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
GitHub Issue Generator for HK-Schedules

Usage:
  npm run generate-issues [options]

Options:
  --dry-run           Preview issues without creating them
  --priority <level>  Only generate issues for specified priority (High, Medium, Low)
  --story <number>    Only generate issues for specified story number
  --no-labels         Skip label creation
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  npm run generate-issues
  npm run generate-issues -- --dry-run
  npm run generate-issues -- --priority High
  npm run generate-issues -- --story 1
  npm run generate-issues -- --dry-run --verbose
    `);
    process.exit(0);
  }

  console.log('🚀 GitHub Issue Generator for HK-Schedules\n');

  if (options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No issues will be created\n');
  }

  // Ensure labels exist
  if (options.createLabels) {
    ensureLabels(options);
  }

  // Parse stories
  log('\n📖 Parsing stories file...', false, options);
  const allStories = parseStoriesFile(STORIES_FILE);
  log(`Found ${allStories.length} stories\n`, false, options);

  // Filter stories based on options
  let stories = allStories;
  if (options.priority) {
    stories = stories.filter(s => s.priority === options.priority);
    log(`Filtered to ${stories.length} stories with priority: ${options.priority}\n`, false, options);
  }
  if (options.story) {
    stories = stories.filter(s => s.number === options.story);
    log(`Filtered to story #${options.story}\n`, false, options);
  }

  // Generate issues
  const results: Array<{ story: Story; storyUrl: string; phaseUrls: string[] }> = [];

  for (const story of stories) {
    const { storyUrl, phaseUrls } = generateStoryIssues(story, options);
    results.push({ story, storyUrl, phaseUrls });
  }

  // Save results to file
  if (!options.dryRun) {
    const output = {
      generatedAt: new Date().toISOString(),
      options,
      results: results.map(r => ({
        storyNumber: r.story.number,
        storyTitle: r.story.title,
        storyUrl: r.storyUrl,
        phaseCount: r.phaseUrls.length,
        phaseUrls: r.phaseUrls
      }))
    };

    writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    log(`\n✓ Results saved to: ${OUTPUT_FILE}`, false, options);
  }

  // Summary
  console.log('\n📊 Summary');
  console.log(`   Stories processed: ${results.length}`);
  console.log(`   Total issues created: ${results.reduce((sum, r) => sum + 1 + r.phaseUrls.length, 0)}`);
  console.log(`   Story issues: ${results.length}`);
  console.log(`   Phase issues: ${results.reduce((sum, r) => sum + r.phaseUrls.length, 0)}`);

  if (options.dryRun) {
    console.log('\n⚠️  This was a dry run. No issues were actually created.');
    console.log('   Remove --dry-run to create issues for real.');
  } else {
    console.log('\n✓ All issues created successfully!');
  }
}

// Run the script
if (require.main === module) {
  try {
    main();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

export { parseStoriesFile, generateStoryIssues, ensureLabels };
