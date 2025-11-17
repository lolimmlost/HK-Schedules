# Scripts Directory

This directory contains utility scripts for the HK-Schedules project.

## Available Scripts

### GitHub Issue Generator

**File**: `generate-github-issues.mjs`

Automatically generates GitHub issues from the quality of life stories documented in `QUALITY_OF_LIFE_STORIES.md`.

#### Prerequisites

- GitHub CLI (`gh`) must be installed and authenticated
- Repository must be initialized as a Git repository
- You must have write access to the repository

#### Usage

```bash
# Generate all issues
npm run generate-issues

# Preview without creating (dry run)
npm run generate-issues:dry-run

# Generate only high priority issues
npm run generate-issues -- --priority High

# Generate issues for a specific story
npm run generate-issues -- --story 1

# Verbose output with details
npm run generate-issues -- --verbose

# Combine options
npm run generate-issues -- --dry-run --priority High --verbose
```

#### Options

- `--dry-run` - Preview what would be created without actually creating issues
- `--priority <level>` - Filter by priority (High, Medium, Low)
- `--story <number>` - Generate issues for a specific story number
- `--no-labels` - Skip automatic label creation
- `--verbose` or `-v` - Show detailed output
- `--help` or `-h` - Show help message

#### What It Does

1. **Parses Stories**: Reads `QUALITY_OF_LIFE_STORIES.md` and extracts all user stories
2. **Creates Labels**: Automatically creates GitHub labels for priority, complexity, and story types
3. **Generates Story Issues**: Creates a parent issue for each story with:
   - User story description
   - Acceptance criteria (as checkboxes)
   - Technical requirements
   - Estimate
   - Appropriate labels (priority, complexity, story type)
4. **Generates Phase Issues**: Creates child issues for each implementation phase:
   - Linked to parent story
   - Contains phase-specific details
   - Tagged with appropriate labels
5. **Links Issues**: Updates parent story issue with links to all phase issues
6. **Saves Results**: Outputs a JSON file (`generated-issues.json`) with all created issue URLs

#### Example Output

```
🚀 GitHub Issue Generator for HK-Schedules

Creating labels...
  ✓ Created label: quality-of-life
  ✓ Created label: priority: high
  ...

📖 Parsing stories file...
Found 25 stories

📋 Processing Story 1: Complete Toast Notification System
  ✓ Created story issue: https://github.com/user/repo/issues/1
  ✓ Created phase issue: Phase 1.1
  ✓ Created phase issue: Phase 1.2
  ...
  ✓ Updated story issue with phase links

📊 Summary
   Stories processed: 25
   Total issues created: 150
   Story issues: 25
   Phase issues: 125

✓ All issues created successfully!
```

#### Labels Created

The script automatically creates the following labels:

**Story Types**:
- `story` - User story (blue)
- `phase` - Implementation phase (purple)
- `quality-of-life` - QoL improvement (yellow)
- `feature` - New feature (green)
- `enhancement` - Enhancement (light blue)

**Priority**:
- `priority: high` - High priority (red)
- `priority: medium` - Medium priority (yellow)
- `priority: low` - Low priority (light blue)

**Complexity**:
- `complexity: low` - Low complexity (light green)
- `complexity: medium` - Medium complexity (light orange)
- `complexity: high` - High complexity (light red)
- `complexity: very-high` - Very high complexity (red)

#### Output File

After successful execution, a `generated-issues.json` file is created in the project root containing:

```json
{
  "generatedAt": "2025-01-15T10:30:00.000Z",
  "options": {
    "dryRun": false,
    "priority": null,
    "story": null
  },
  "results": [
    {
      "storyNumber": 1,
      "storyTitle": "Complete Toast Notification System",
      "storyUrl": "https://github.com/user/repo/issues/1",
      "phaseCount": 5,
      "phaseUrls": [
        "https://github.com/user/repo/issues/2",
        "https://github.com/user/repo/issues/3",
        ...
      ]
    },
    ...
  ]
}
```

#### Tips

1. **Always Dry Run First**: Test with `--dry-run` to see what would be created
2. **Start with High Priority**: Use `--priority High` to create critical issues first
3. **One Story at a Time**: Test with `--story 1` before generating all stories
4. **Check GitHub First**: Make sure you're authenticated with `gh auth status`
5. **Review Stories File**: Ensure `QUALITY_OF_LIFE_STORIES.md` is up to date

#### Troubleshooting

**Error: gh: command not found**
- Install GitHub CLI: https://cli.github.com/

**Error: gh: not authenticated**
- Run: `gh auth login`

**Error: Permission denied**
- Ensure you have write access to the repository
- Check you're in the correct repository directory

**Issues not creating**
- Check your internet connection
- Verify repository exists on GitHub
- Run with `--verbose` to see detailed output

#### Maintenance

When adding new stories to `QUALITY_OF_LIFE_STORIES.md`:

1. Follow the existing format exactly
2. Include all required sections (Priority, Complexity, User Story, etc.)
3. Number stories sequentially
4. Number phases with the format: `Phase X.Y` where X is story number
5. Run `--dry-run` to validate parsing before creating issues

#### Advanced Usage

**Create issues for entire sprint**:
```bash
# Sprint 1: Stories 1-4 (Priority High)
npm run generate-issues -- --story 1
npm run generate-issues -- --story 2
npm run generate-issues -- --story 3
npm run generate-issues -- --story 4
```

**Create issues for specific priorities across all stories**:
```bash
npm run generate-issues -- --priority High
npm run generate-issues -- --priority Medium
npm run generate-issues -- --priority Low
```

**Debug story parsing**:
```bash
npm run generate-issues -- --dry-run --verbose --story 1
```

---

## Adding New Scripts

When adding new scripts to this directory:

1. Use `.mjs` extension for ES modules
2. Add shebang: `#!/usr/bin/env node`
3. Make executable: `chmod +x scripts/your-script.mjs`
4. Add npm script to `package.json`
5. Document usage in this README
6. Include error handling and helpful messages
7. Support `--help` flag
8. Consider adding `--dry-run` for safety

---

## Contributing

When modifying scripts:

1. Test with `--dry-run` first
2. Update this README with any changes
3. Follow existing code style
4. Add error handling for edge cases
5. Include helpful error messages
6. Test on actual repository before committing
