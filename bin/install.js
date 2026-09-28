#!/usr/bin/env node

/**
 * Universal installer and CLI for grill-plan-team.
 * Cross-harness plugin installer for Antigravity, Claude Code, Cursor, Windsurf, and Roo Code / Cline.
 * Zero external dependencies.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

const PKG_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(PKG_ROOT, 'templates');
const MANIFEST_FILENAME = '.grill-plan-team-manifest.json';

const HARNESSES = ['antigravity', 'claude', 'cursor', 'windsurf', 'roo'];

const HARNESS_DISPLAY_NAMES = {
  antigravity: 'Antigravity / Gemini CLI',
  claude: 'Claude Code',
  cursor: 'Cursor',
  windsurf: 'Windsurf',
  roo: 'Roo Code / Cline'
};

const DEFAULT_USER_MEMORY = `# Global User Memory (grill-plan-team)

Personal developer profile and global engineering preferences across all projects.

## Developer Profile & Interaction Style
- Preferred interaction cadence: direct, concise, technical rationale first.
- Decision preference: present structured multiple-choice recommendations with trade-offs.

## Preferred Tech Stacks & Tooling
- Architecture: modular, minimal runtime dependencies, clean interface boundaries.
- Runtime & language preferences: modern LTS Node.js / TypeScript / native tooling where applicable.
- Testing preference: native test runners (e.g. node:test), zero unnecessary testing frameworks.

## Architectural Heuristics
- Single Responsibility & High Cohesion: keep diffs focused on the exact requested requirement.
- Defensive boundaries: validate inputs at integration seams, keep core logic free of external bloat.
- Self-contained systems: prefer standalone scripts and zero-dependency utilities.

## Workflow Habits & Overrides
- Prioritize non-breaking changes and backward compatibility.
- Ensure thorough automated verification before certifying changes.
`;

const DEFAULT_PROJECT_MEMORY = `# Local Project Memory (grill-plan-team)

Repository-specific context, conventions, architectural decisions, and learned lessons.

## Project Archetype & Domain Terminology
- Archetype: Cross-harness AI agent workflow engine and installer CLI.
- Domain terms:
  - Harness: Target IDE or coding agent host (Antigravity, Claude Code, Cursor, Windsurf, Roo Code).
  - 3-Phase Gate: Grill-Me (interview) -> Plan (blueprint) -> Teamwork (execution).
  - Two-Tier Memory: Global user profile (~/.config/grill-plan-team) + local project memory (.grill-plan-team).

## Established Repository Conventions
- Dependencies: Zero external runtime dependencies; use native Node.js / POSIX bash APIs.
- Testing: node:test with strict parity testing between install.sh and bin/install.js.
- Governance: Gated phase progression; changes committed cleanly to git.

## Architectural Decision History
- [Initial Bootstrap]: Established unified 3-phase gated pipeline with cross-harness parity.

## Past Pitfalls & Reviewer Lessons
- Parity requirement: Any CLI or template change must be mirrored across both bin/install.js and install.sh.
- Path normalization: Always resolve paths and trim whitespace when handling user inputs.
`;

const DEFAULT_ASSESSMENT_TEMPLATE = `# Developer Assessment & Baseline Profile (grill-plan-team)

Baseline assessment of developer role, daily work, AI experience level, and preferred collaboration style.

## Developer Role & Daily Work
- Primary role: Software Engineer / Architect.
- Daily responsibilities: Full-stack system development, modular architecture, and autonomous workflow design.
- Target domains: Developer tooling, agentic pipelines, cross-platform CLI applications.

## AI Experience & Proficiency
- AI proficiency level: Advanced / Power User.
- Primary coding agent use cases: Automated refactoring, architecture design alignment, multi-agent swarm execution.
- Guidance style: Provide clear architectural requirements and objective verification; avoid micromanaging low-level implementation details.

## Activation & Trigger Preference
- Trigger mode: Automatic (LLM determines when to invoke on non-trivial features/architectural changes).
- Fallback: Can always be explicitly invoked with \`/grill-plan-team\` or chat prompt.

## Collaboration & Communication Style
- Preferred interaction cadence: Direct, concise, technical rationale first.
- Decision format: Present structured multiple-choice recommendations with explicit trade-offs and citations.
- Explanations: Keep UI options concise; provide expanded technical deep dives when requested.

## Distilled User Preferences
- Learned interaction habits: Prefers automated verification prior to certification.
- Workflow feedback: Value clean commits, high cohesion, and zero unnecessary dependencies.
`;

const DEFAULT_REQUIREMENTS_TEMPLATE = `# Engineering Requirements & Technical Guardrails (grill-plan-team)

Technical guardrails, VCS workflows, language and library preferences, architectural records, and reviewer lessons.

## Guardrails & Safety
- Dependency policy: Zero external runtime dependencies; prioritize native runtime APIs (Node.js built-ins, standard libraries).
- Test integrity: Never bypass, weaken, skip, or mock tests to achieve a passing state; run comprehensive test suites.
- Safety boundaries: Defensive validation at integration seams; no destructive operations or unapproved force-pushes.
- Compatibility: Maintain strict backward compatibility and non-breaking changes across releases.

## VCS & Repository Processes
- Preferred VCS tool: Official GitHub CLI (\`gh\`) and standard \`git\`.
- Remote providers: GitHub (primary), with support for GitLab, Bitbucket, and custom git origins.
- Branching & commits: Clean commit messages following conventional commits; local verification before push.
- PR & review process: Structured descriptions, verification proof, and automated CI passing checks.

## Preferred Languages & Runtimes
- Primary languages: TypeScript, modern JavaScript (ESM/CJS), Bash/POSIX shell, Python.
- Runtimes: Modern Node.js LTS (v20+, v22+), standard shell environments.
- Typing: Strict TypeScript compilation with \`noEmit\` type checking.

## Preferred Libraries & Frameworks
- Test frameworks: Native test runner (\`node:test\`, \`node:assert\`), zero heavy testing framework bloat.
- CLI & scripting: Built-in \`child_process\`, \`fs\`, \`path\`, \`os\`, and standard POSIX shell tools.

## Architectural Decision History
- [Initial Bootstrap]: Established unified 4-phase gated pipeline with cross-harness parity.

## Past Pitfalls & Reviewer Lessons
- Parity requirement: Any CLI or template change must be mirrored across both \`bin/install.js\` and \`install.sh\`.
- Path normalization: Always resolve paths and trim whitespace when handling user inputs.
- Cross-harness compatibility: Do not bind phase execution to proprietary subagent names.
`;

function getHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

function getUserConfigDir(homeDir = getHomeDir()) {
  const isDefaultHome = !homeDir || homeDir === getHomeDir();
  let configHome;
  if (!isDefaultHome) {
    configHome = path.join(homeDir, '.config');
  } else if (process.env.XDG_CONFIG_HOME) {
    configHome = process.env.XDG_CONFIG_HOME;
  } else {
    configHome = path.join(homeDir || getHomeDir(), '.config');
  }
  return path.join(configHome, 'grill-plan-team');
}

function getUserAssessmentPath(homeDir = getHomeDir()) {
  return path.join(getUserConfigDir(homeDir), 'ASSESSMENT.md');
}

function getUserRequirementsPath(homeDir = getHomeDir()) {
  return path.join(getUserConfigDir(homeDir), 'REQUIREMENTS.md');
}

function getUserMemoryPath(homeDir = getHomeDir()) {
  return path.join(getUserConfigDir(homeDir), 'user-memory.md');
}

function getProjectConfigDir(baseDir = process.cwd()) {
  return path.join(baseDir, '.grill-plan-team');
}

function getProjectAssessmentPath(baseDir = process.cwd()) {
  return path.join(getProjectConfigDir(baseDir), 'ASSESSMENT.md');
}

function getProjectRequirementsPath(baseDir = process.cwd()) {
  return path.join(getProjectConfigDir(baseDir), 'REQUIREMENTS.md');
}

function getProjectMemoryPath(baseDir = process.cwd()) {
  return path.join(getProjectConfigDir(baseDir), 'project-memory.md');
}

function getAssessmentTemplate() {
  try {
    return getTemplateContent('memory/ASSESSMENT.md');
  } catch {
    return DEFAULT_ASSESSMENT_TEMPLATE;
  }
}

function getRequirementsTemplate() {
  try {
    return getTemplateContent('memory/REQUIREMENTS.md');
  } catch {
    return DEFAULT_REQUIREMENTS_TEMPLATE;
  }
}

function getUserMemoryTemplate() {
  try {
    return getTemplateContent('memory/user-memory.md');
  } catch {
    return DEFAULT_USER_MEMORY;
  }
}

function getProjectMemoryTemplate() {
  try {
    return getTemplateContent('memory/project-memory.md');
  } catch {
    return DEFAULT_PROJECT_MEMORY;
  }
}

function migrateLegacyMemory(targetDir, scope = 'user') {
  if (scope === 'user') {
    const legacyPath = path.join(targetDir, 'user-memory.md');
    const assessPath = path.join(targetDir, 'ASSESSMENT.md');
    const reqPath = path.join(targetDir, 'REQUIREMENTS.md');

    if (fs.existsSync(legacyPath) && fs.statSync(legacyPath).isFile()) {
      if (!fs.existsSync(assessPath)) {
        writeFileSyncSafe(assessPath, getAssessmentTemplate(), false);
      }
      if (!fs.existsSync(reqPath)) {
        writeFileSyncSafe(reqPath, getRequirementsTemplate(), false);
      }
      return true;
    }
  } else {
    const legacyPath = path.join(targetDir, 'project-memory.md');
    const assessPath = path.join(targetDir, 'ASSESSMENT.md');
    const reqPath = path.join(targetDir, 'REQUIREMENTS.md');

    if (fs.existsSync(legacyPath) && fs.statSync(legacyPath).isFile()) {
      if (!fs.existsSync(reqPath)) {
        writeFileSyncSafe(reqPath, getRequirementsTemplate(), false);
      }
      if (!fs.existsSync(assessPath)) {
        writeFileSyncSafe(assessPath, getAssessmentTemplate(), false);
      }
      return true;
    }
  }
  return false;
}

function ensureUserMemory(homeDir, dryRun) {
  const configDir = getUserConfigDir(homeDir);
  const assessPath = getUserAssessmentPath(homeDir);
  const reqPath = getUserRequirementsPath(homeDir);

  const legacyMem = getUserMemoryPath(homeDir);
  if (fs.existsSync(legacyMem) && (!fs.existsSync(assessPath) || !fs.existsSync(reqPath))) {
    if (!dryRun) {
      migrateLegacyMemory(configDir, 'user');
      console.log(`Migrated legacy user memory to ASSESSMENT.md and REQUIREMENTS.md`);
    }
  }

  let created = false;
  if (!fs.existsSync(assessPath)) {
    if (dryRun) {
      console.log(`[dry-run] Would initialize assessment memory: ${assessPath}`);
    } else {
      writeFileSyncSafe(assessPath, getAssessmentTemplate(), false);
      console.log(`Initialized assessment memory: ${assessPath}`);
    }
    created = true;
  }

  if (!fs.existsSync(reqPath)) {
    if (dryRun) {
      console.log(`[dry-run] Would initialize requirements memory: ${reqPath}`);
    } else {
      writeFileSyncSafe(reqPath, getRequirementsTemplate(), false);
      console.log(`Initialized requirements memory: ${reqPath}`);
    }
    created = true;
  }

  // Also maintain user-memory.md for legacy tools
  if (!fs.existsSync(legacyMem)) {
    if (!dryRun) {
      writeFileSyncSafe(legacyMem, getUserMemoryTemplate(), false);
    }
  }

  return created;
}

function printMemoryHelp() {
  console.log(`
Grill-Plan-Team Two-Tier Memory CLI

Usage:
  npx grill-plan-team memory init [assessment | requirements] [--project | --user]
  npx grill-plan-team memory show [assessment | requirements] [--project | --user]
  npx grill-plan-team memory path [assessment | requirements] [--project | --user]
  npx grill-plan-team assess [--project | --user]

Options:
  --user, -u          Target global user memory (~/.config/grill-plan-team/) (default)
  --project, -p       Target local project memory (.grill-plan-team/)
  --local, -l [path]  Target specific project directory for --project
  --force, -f         Force overwrite of existing memory file on init
  --help, -h          Show this help message
`);
}

async function handleAssessCommand(args = []) {
  let target = 'user';
  let localPath = null;

  let i = 0;
  while (i < args.length) {
    const a = args[i];
    if (a === '--project' || a === '-p' || a === '--per-project') {
      target = 'project';
    } else if (a === '--user' || a === '-u' || a === '--user-global') {
      target = 'user';
    } else if (a === '--local' || a === '-l') {
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        localPath = path.resolve(args[i + 1].trim());
        i++;
      } else {
        localPath = process.cwd();
      }
    }
    i++;
  }

  const homeDir = getHomeDir();
  const projDir = localPath || process.cwd();
  const targetDir = target === 'project' ? getProjectConfigDir(projDir) : getUserConfigDir(homeDir);

  if (!process.stdin.isTTY) {
    const assessFile = path.join(targetDir, 'ASSESSMENT.md');
    const reqFile = path.join(targetDir, 'REQUIREMENTS.md');
    writeFileSyncSafe(assessFile, getAssessmentTemplate(), false);
    writeFileSyncSafe(reqFile, getRequirementsTemplate(), false);
    console.log(`[assess] Baseline memory initialized in ${target} scope:`);
    console.log(`- ${assessFile}`);
    console.log(`- ${reqFile}`);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise((res) => rl.question(q, res));

  console.log('\n=== Grill-Plan-Team Baseline Assessment ===\n');
  const scopeAns = await question('Where should preferences be saved? [1] User global (~/.config/grill-plan-team) [2] Project local (.grill-plan-team) [Default: 1]: ');
  const selectedScope = scopeAns.trim() === '2' ? 'project' : 'user';
  const finalDir = selectedScope === 'project' ? getProjectConfigDir(projDir) : getUserConfigDir(homeDir);

  const role = (await question('Developer role and daily focus [Default: Software Engineer / Architect]: ')).trim() || 'Software Engineer / Architect';
  const aiExp = (await question('Experience level with AI coding (Beginner / Intermediate / Advanced / Power User) [Default: Power User]: ')).trim() || 'Power User';
  const triggerAns = (await question('Trigger mode: [1] Automatic (LLM decides when to invoke on non-trivial tasks) [2] Explicit only (only run when explicitly requested) [Default: 1]: ')).trim();
  const triggerMode = triggerAns === '2' ? 'Explicit only (only run when explicitly invoked)' : 'Automatic (LLM determines when to invoke on non-trivial features/architectural changes)';
  const guardrails = (await question('Key guardrails & constraints [Default: Zero runtime dependencies, non-breaking changes, test integrity]: ')).trim() || 'Zero runtime dependencies, non-breaking changes, test integrity';
  const vcs = (await question('Preferred VCS tool & remote workflow [Default: GitHub CLI gh and standard git]: ')).trim() || 'GitHub CLI gh and standard git';
  const languages = (await question('Preferred languages and test runner [Default: TypeScript, Node.js LTS, native node:test]: ')).trim() || 'TypeScript, Node.js LTS, native node:test';

  rl.close();

  const assessContent = `# Developer Assessment & Baseline Profile (grill-plan-team)

Baseline assessment of developer role, daily work, AI experience level, and preferred collaboration style.

## Developer Role & Daily Work
- Primary role: ${role}.
- Daily responsibilities: Full-stack system development, modular architecture, and autonomous workflow design.

## AI Experience & Proficiency
- AI proficiency level: ${aiExp}.
- Primary coding agent use cases: Automated refactoring, architecture design alignment, multi-agent swarm execution.
- Guidance style: Provide clear architectural requirements and objective verification; avoid micromanaging low-level implementation details.

## Activation & Trigger Preference
- Trigger mode: ${triggerMode}.
- Fallback: Can always be explicitly invoked with \`/grill-plan-team\` or chat prompt.

## Collaboration & Communication Style
- Preferred interaction cadence: Direct, concise, technical rationale first.
- Decision format: Present structured multiple-choice recommendations with explicit trade-offs and citations.

## Distilled User Preferences
- Learned interaction habits: Prefers automated verification prior to certification.
`;

  const reqContent = `# Engineering Requirements & Technical Guardrails (grill-plan-team)

Technical guardrails, VCS workflows, language and library preferences, architectural records, and reviewer lessons.

## Guardrails & Safety
- Guardrails: ${guardrails}.
- Test integrity: Never bypass, weaken, skip, or mock tests to achieve a passing state.

## VCS & Repository Processes
- Preferred VCS tool: ${vcs}.
- Remote providers: GitHub (primary), GitLab, Bitbucket.
- Branching & commits: Clean commit messages following conventional commits; local verification before push.

## Preferred Languages & Runtimes
- Primary languages & runtimes: ${languages}.
- Typing: Strict TypeScript compilation with noEmit type checking where applicable.

## Architectural Decision History
- [Initial Baseline]: Established baseline developer requirements.

## Past Pitfalls & Reviewer Lessons
- Verification first: Run objective programmatic tests before completing tasks.
`;

  const assessFile = path.join(finalDir, 'ASSESSMENT.md');
  const reqFile = path.join(finalDir, 'REQUIREMENTS.md');
  writeFileSyncSafe(assessFile, assessContent, false);
  writeFileSyncSafe(reqFile, reqContent, false);

  console.log(`\nBaseline assessment saved successfully!`);
  console.log(`- ${assessFile}`);
  console.log(`- ${reqFile}`);
}

function handleMemoryCommand(args) {
  const subcmd = args[0];
  if (!subcmd || subcmd === '--help' || subcmd === '-h') {
    printMemoryHelp();
    return;
  }

  if (subcmd === 'assess') {
    return handleAssessCommand(args.slice(1));
  }

  let docType = null;
  let target = 'user';
  let localPath = null;
  let force = false;

  let i = 1;
  while (i < args.length) {
    const a = args[i];
    if (a === 'assessment' || a === 'assess' || a === 'profile') {
      docType = 'assessment';
    } else if (a === 'requirements' || a === 'req' || a === 'guardrails') {
      docType = 'requirements';
    } else if (a === 'legacy') {
      docType = 'legacy';
    } else if (a === '--project' || a === '-p' || a === '--per-project' || a === '-project' || a === '-per-project') {
      target = 'project';
    } else if (a === '--user' || a === '-u' || a === '-user' || a === '--user-global' || a === '-user-global') {
      target = 'user';
    } else if (a === '--force' || a === '-f') {
      force = true;
    } else if (a === '--local' || a === '-l') {
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        const raw = args[i + 1].trim();
        localPath = raw ? path.resolve(raw) : process.cwd();
        i++;
      } else {
        localPath = process.cwd();
      }
    } else if (a.startsWith('--local=') || a.startsWith('-l=')) {
      const prefix = a.startsWith('--local=') ? '--local=' : '-l=';
      const val = a.slice(prefix.length).trim();
      localPath = val ? path.resolve(val) : process.cwd();
    } else if (a === '--help' || a === '-h') {
      printMemoryHelp();
      return;
    } else {
      console.error(`Error: Unknown option for memory ${subcmd}: ${a}`);
      printMemoryHelp();
      process.exit(1);
    }
    i++;
  }

  const homeDir = getHomeDir();
  const projDir = localPath || process.cwd();

  switch (subcmd) {
    case 'path': {
      if (docType === 'assessment') {
        console.log(target === 'project' ? getProjectAssessmentPath(projDir) : getUserAssessmentPath(homeDir));
      } else if (docType === 'requirements') {
        console.log(target === 'project' ? getProjectRequirementsPath(projDir) : getUserRequirementsPath(homeDir));
      } else if (docType === 'legacy') {
        console.log(target === 'project' ? getProjectMemoryPath(projDir) : getUserMemoryPath(homeDir));
      } else {
        // When docType omitted: return assessment for user, requirements for project
        console.log(target === 'project' ? getProjectRequirementsPath(projDir) : getUserAssessmentPath(homeDir));
      }
      break;
    }

    case 'init': {
      const configDir = target === 'project' ? getProjectConfigDir(projDir) : getUserConfigDir(homeDir);
      migrateLegacyMemory(configDir, target);

      const filesToInit = [];
      if (docType === 'assessment') {
        filesToInit.push({
          path: target === 'project' ? getProjectAssessmentPath(projDir) : getUserAssessmentPath(homeDir),
          template: getAssessmentTemplate(),
          label: target === 'project' ? 'project assessment memory' : 'user assessment memory'
        });
      } else if (docType === 'requirements') {
        filesToInit.push({
          path: target === 'project' ? getProjectRequirementsPath(projDir) : getUserRequirementsPath(homeDir),
          template: getRequirementsTemplate(),
          label: target === 'project' ? 'project requirements memory' : 'user requirements memory'
        });
      } else {
        filesToInit.push({
          path: target === 'project' ? getProjectAssessmentPath(projDir) : getUserAssessmentPath(homeDir),
          template: getAssessmentTemplate(),
          label: target === 'project' ? 'project assessment memory' : 'user assessment memory'
        });
        filesToInit.push({
          path: target === 'project' ? getProjectRequirementsPath(projDir) : getUserRequirementsPath(homeDir),
          template: getRequirementsTemplate(),
          label: target === 'project' ? 'project requirements memory' : 'user requirements memory'
        });
      }

      for (const item of filesToInit) {
        if (fs.existsSync(item.path) && !fs.statSync(item.path).isFile()) {
          console.error(`Error: Cannot initialize memory because a directory exists at ${item.path}.`);
          process.exit(1);
        }
        if (fs.existsSync(item.path) && !force) {
          console.log(`${target === 'project' ? 'Project' : 'User'} memory already exists at: ${item.path}`);
        } else {
          writeFileSyncSafe(item.path, item.template, false);
          console.log(`Initialized ${target === 'project' ? 'project' : 'user'} memory: ${item.path}`);
        }
      }
      break;
    }

    case 'show': {
      let targetFile;
      if (docType === 'assessment') {
        targetFile = target === 'project' ? getProjectAssessmentPath(projDir) : getUserAssessmentPath(homeDir);
      } else if (docType === 'requirements') {
        targetFile = target === 'project' ? getProjectRequirementsPath(projDir) : getUserRequirementsPath(homeDir);
      } else {
        targetFile = target === 'project' ? getProjectRequirementsPath(projDir) : getUserAssessmentPath(homeDir);
      }

      if (!fs.existsSync(targetFile) || !fs.statSync(targetFile).isFile()) {
        const legacyFile = target === 'project' ? getProjectMemoryPath(projDir) : getUserMemoryPath(homeDir);
        if (fs.existsSync(legacyFile) && fs.statSync(legacyFile).isFile()) {
          targetFile = legacyFile;
        } else {
          console.error(`Error: ${target === 'project' ? 'Project' : 'User'} memory file not found at ${targetFile}.`);
          process.exit(1);
        }
      }
      process.stdout.write(fs.readFileSync(targetFile, 'utf8'));
      break;
    }

    default:
      console.error(`Error: Unknown memory subcommand: ${subcmd}`);
      printMemoryHelp();
      process.exit(1);
  }
}

function parseArgs(args) {
  const options = {
    isGlobal: true,
    localPath: null,
    all: false,
    harnesses: [],
    uninstall: false,
    purge: false,
    dryRun: false,
    help: false,
    interactive: false
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--global' || arg === '-g') {
      options.isGlobal = true;
      options.localPath = null;
    } else if (arg === '--local' || arg === '-l') {
      options.isGlobal = false;
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        const raw = args[i + 1].trim();
        options.localPath = raw ? path.resolve(raw) : process.cwd();
        i++;
      } else {
        options.localPath = process.cwd();
      }
    } else if (arg.startsWith('--local=') || arg.startsWith('-l=')) {
      options.isGlobal = false;
      const prefix = arg.startsWith('--local=') ? '--local=' : '-l=';
      const val = arg.slice(prefix.length).trim();
      options.localPath = val ? path.resolve(val) : process.cwd();
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--uninstall' || arg === '-u') {
      options.uninstall = true;
    } else if (arg === '--purge') {
      options.purge = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--interactive') {
      options.interactive = true;
    } else if (arg === '--harness') {
      if (args[i + 1] && !args[i + 1].startsWith('-') && args[i + 1].trim().length > 0) {
        const parts = args[i + 1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (parts.length === 0) {
          console.error('Error: --harness requires an argument.');
          process.exit(1);
        }
        options.harnesses.push(...parts);
        i++;
      } else {
        console.error('Error: --harness requires an argument.');
        process.exit(1);
      }
    } else if (arg.startsWith('--harness=')) {
      const val = arg.slice('--harness='.length).trim();
      if (!val) {
        console.error('Error: --harness requires an argument.');
        process.exit(1);
      }
      const parts = val.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (parts.length === 0) {
        console.error('Error: --harness requires an argument.');
        process.exit(1);
      }
      options.harnesses.push(...parts);
    } else {
      console.error(`Error: Unknown option: ${arg}`);
      printHelp();
      process.exit(1);
    }
    i++;
  }

  // Normalize aliases and deduplicate
  options.harnesses = options.harnesses.map(h => {
    if (h === 'agy' || h === 'gemini') return 'antigravity';
    if (h === 'claude-code') return 'claude';
    if (h === 'cline' || h === 'roo-code') return 'roo';
    return h;
  });
  options.harnesses = Array.from(new Set(options.harnesses));

  return options;
}

function printHelp() {
  console.log(`
Grill-Plan-Team Universal Installer & Adapter Manager

Usage:
  npx grill-plan-team [options]
  npx grill-plan-team memory <subcommand> [options]
  node bin/install.js [options]
  ./install.sh [options]

Options:
  --global, -g          Install to user-level global configuration directories (default)
  --local, -l [path]    Install to project repository at [path] (default: current directory)
  --all, -a             Install to all supported harnesses regardless of host detection
  --harness <name>      Comma-separated list of target harnesses:
                        antigravity, claude, cursor, windsurf, roo
  --uninstall, -u       Cleanly remove installed grill-plan-team configurations
  --purge               Purge persistent memory files when uninstalling
  --dry-run, -d         Preview changes without writing any files
  --interactive         Prompt for target harnesses interactively
  --help, -h            Show this help documentation

Memory Commands:
  npx grill-plan-team memory init [--project | --user]
  npx grill-plan-team memory show [--project | --user]
  npx grill-plan-team memory path [--project | --user]

Supported Harnesses:
  * antigravity   Antigravity / Gemini CLI (~/.gemini/config/plugins/grill-plan-team)
  * claude        Claude Code (~/.claude/skills and ~/.claude/commands)
  * cursor        Cursor (.cursorrules and .cursor/rules/grill-plan-team.mdc)
  * windsurf      Windsurf Cascade (.windsurfrules)
  * roo           Roo Code / Cline (.roomodes and .clinerules)
`);
}

function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function detectInstalledHarnesses(homeDir) {
  const detected = [];

  // Antigravity / Gemini
  if (
    fs.existsSync(path.join(homeDir, '.gemini')) ||
    commandExists('agy') ||
    commandExists('gemini')
  ) {
    detected.push('antigravity');
  }

  // Claude Code
  if (
    fs.existsSync(path.join(homeDir, '.claude')) ||
    commandExists('claude')
  ) {
    detected.push('claude');
  }

  // Cursor
  if (
    fs.existsSync(path.join(homeDir, '.cursor')) ||
    fs.existsSync(path.join(homeDir, '.cursorrules')) ||
    commandExists('cursor')
  ) {
    detected.push('cursor');
  }

  // Windsurf
  if (
    fs.existsSync(path.join(homeDir, '.windsurfrules')) ||
    fs.existsSync(path.join(homeDir, '.codeium', 'windsurf')) ||
    commandExists('windsurf')
  ) {
    detected.push('windsurf');
  }

  // Roo Code / Cline
  if (
    fs.existsSync(path.join(homeDir, '.roomodes')) ||
    fs.existsSync(path.join(homeDir, '.clinerules')) ||
    fs.existsSync(path.join(homeDir, '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline'))
  ) {
    detected.push('roo');
  }

  return detected;
}

function getTemplateContent(subpath) {
  const templatePath = path.join(TEMPLATES_DIR, subpath);
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }
  const rootPath = path.join(PKG_ROOT, subpath);
  if (fs.existsSync(rootPath)) {
    return fs.readFileSync(rootPath, 'utf8');
  }
  throw new Error(`Template not found: ${subpath}`);
}

function ensureDirSync(dirPath, dryRun) {
  if (!fs.existsSync(dirPath)) {
    if (!dryRun) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return true;
  }
  return false;
}

function writeFileSyncSafe(filePath, content, dryRun) {
  const dir = path.dirname(filePath);
  ensureDirSync(dir, dryRun);
  if (!dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

function getHarnessFileMappings(harness, baseDir, isGlobal) {
  const mappings = [];

  switch (harness) {
    case 'antigravity':
      if (isGlobal) {
        const pluginDir = path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team');
        mappings.push({
          target: path.join(pluginDir, 'plugin.json'),
          content: getTemplateContent('antigravity/plugin.json')
        });
        mappings.push({
          target: path.join(pluginDir, 'rules', 'AGENTS.md'),
          content: getTemplateContent('antigravity/rules/AGENTS.md')
        });
        mappings.push({
          target: path.join(pluginDir, 'skills', 'grill-plan-team', 'SKILL.md'),
          content: getTemplateContent('antigravity/skills/grill-plan-team/SKILL.md')
        });
      } else {
        mappings.push({
          target: path.join(baseDir, 'plugin.json'),
          content: getTemplateContent('antigravity/plugin.json')
        });
        mappings.push({
          target: path.join(baseDir, 'rules', 'AGENTS.md'),
          content: getTemplateContent('antigravity/rules/AGENTS.md')
        });
        mappings.push({
          target: path.join(baseDir, 'skills', 'grill-plan-team', 'SKILL.md'),
          content: getTemplateContent('antigravity/skills/grill-plan-team/SKILL.md')
        });
      }
      break;

    case 'claude':
      mappings.push({
        target: path.join(baseDir, isGlobal ? '.claude' : '.claude', 'skills', 'grill-plan-team', 'SKILL.md'),
        content: getTemplateContent('claude/skills/grill-plan-team/SKILL.md')
      });
      mappings.push({
        target: path.join(baseDir, isGlobal ? '.claude' : '.claude', 'commands', 'grill-plan-team.md'),
        content: getTemplateContent('claude/commands/grill-plan-team.md')
      });
      break;

    case 'cursor':
      mappings.push({
        target: path.join(baseDir, isGlobal ? '.cursor' : '.cursor', 'rules', 'grill-plan-team.mdc'),
        content: getTemplateContent('cursor/.cursor/rules/grill-plan-team.mdc')
      });
      mappings.push({
        target: path.join(baseDir, '.cursorrules'),
        content: getTemplateContent('cursor/.cursorrules')
      });
      break;

    case 'windsurf':
      mappings.push({
        target: path.join(baseDir, '.windsurfrules'),
        content: getTemplateContent('windsurf/.windsurfrules')
      });
      break;

    case 'roo':
      mappings.push({
        target: path.join(baseDir, '.roomodes'),
        content: getTemplateContent('roo/.roomodes')
      });
      mappings.push({
        target: path.join(baseDir, '.clinerules'),
        content: getTemplateContent('roo/.clinerules')
      });
      break;
  }

  return mappings;
}

function updateGeminiPluginsJson(homeDir, dryRun, remove = false) {
  const pluginsJsonPath = path.join(homeDir, '.gemini', 'config', 'plugins.json');
  const pluginDirPath = path.join(homeDir, '.gemini', 'config', 'plugins', 'grill-plan-team');

  if (!fs.existsSync(path.dirname(pluginsJsonPath))) {
    if (!remove) {
      ensureDirSync(path.dirname(pluginsJsonPath), dryRun);
    } else {
      return;
    }
  }

  let config = { entries: [] };
  if (fs.existsSync(pluginsJsonPath)) {
    try {
      config = JSON.parse(fs.readFileSync(pluginsJsonPath, 'utf8'));
      if (!Array.isArray(config.entries)) {
        config.entries = [];
      }
    } catch {
      config = { entries: [] };
    }
  }

  const existingIdx = config.entries.findIndex(
    e => e && (e.path === pluginDirPath || (typeof e.path === 'string' && e.path.endsWith('/grill-plan-team')))
  );

  if (remove) {
    if (existingIdx !== -1) {
      config.entries.splice(existingIdx, 1);
      if (!dryRun) {
        fs.writeFileSync(pluginsJsonPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
      }
      console.log(`[plugins.json] Unregistered grill-plan-team from ${pluginsJsonPath}`);
    }
  } else {
    if (existingIdx === -1) {
      config.entries.push({ path: pluginDirPath });
      if (!dryRun) {
        fs.writeFileSync(pluginsJsonPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
      }
      console.log(`[plugins.json] Registered grill-plan-team in ${pluginsJsonPath}`);
    }
  }
}

function loadManifest(manifestPath) {
  if (fs.existsSync(manifestPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch {
      return { installedFiles: [], harnesses: [] };
    }
  }
  return { installedFiles: [], harnesses: [] };
}

function saveManifest(manifestPath, manifest, dryRun) {
  if (!dryRun) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  }
}

async function promptHarnesses(detected) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    console.log('\nSelect harness(es) to install:');
    HARNESSES.forEach((h, idx) => {
      const isDet = detected.includes(h);
      const tag = isDet ? ' [detected]' : '';
      console.log(`  ${idx + 1}) ${HARNESS_DISPLAY_NAMES[h]}${tag}`);
    });
    console.log(`  A) All harnesses`);
    console.log(`  D) Detected harnesses only (${detected.join(', ') || 'none'})`);

    rl.question('\nEnter choices (e.g. 1,2 or A or D) [default: D]: ', answer => {
      rl.close();
      const trimmed = answer.trim().toUpperCase();
      if (!trimmed || trimmed === 'D') {
        resolve(detected.length ? detected : HARNESSES);
      } else if (trimmed === 'A') {
        resolve(HARNESSES);
      } else {
        const selected = [];
        const parts = trimmed.split(/[\s,]+/);
        for (const p of parts) {
          const num = parseInt(p, 10);
          if (num >= 1 && num <= HARNESSES.length) {
            selected.push(HARNESSES[num - 1]);
          } else {
            const match = HARNESSES.find(h => h.toLowerCase() === p.toLowerCase());
            if (match) selected.push(match);
          }
        }
        resolve(selected.length ? [...new Set(selected)] : detected);
      }
    });
  });
}

async function run(cliArgs = process.argv.slice(2)) {
  if (cliArgs.length > 0 && cliArgs[0] === 'assess') {
    await handleAssessCommand(cliArgs.slice(1));
    return;
  }

  if (cliArgs.length > 0 && cliArgs[0] === 'memory') {
    handleMemoryCommand(cliArgs.slice(1));
    return;
  }

  const options = parseArgs(cliArgs);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Validate requested harnesses if specified
  if (options.harnesses.length > 0) {
    const valid = [];
    for (const h of options.harnesses) {
      if (HARNESSES.includes(h)) {
        valid.push(h);
      } else {
        console.warn(`Warning: Unknown harness '${h}' ignored.`);
      }
    }
    if (valid.length === 0) {
      console.error(`Error: No valid harnesses specified. Choose from: ${HARNESSES.join(', ')}`);
      process.exit(1);
    }
    options.harnesses = valid;
  }

  const baseDir = options.isGlobal ? os.homedir() : options.localPath;
  const manifestPath = path.join(baseDir, MANIFEST_FILENAME);

  if (options.uninstall) {
    console.log(`\nUninstalling grill-plan-team from ${options.isGlobal ? 'Global' : options.localPath}...`);
    const manifest = loadManifest(manifestPath);

    // Collect potential files to clean up
    const targetHarnesses = options.harnesses.length > 0 ? options.harnesses : HARNESSES;
    const filesToRemove = new Set();

    for (const h of targetHarnesses) {
      const mappings = getHarnessFileMappings(h, baseDir, options.isGlobal);
      for (const m of mappings) {
        if (fs.existsSync(m.target)) {
          filesToRemove.add(m.target);
        }
      }
      if (h === 'cursor') {
        const cursorSkill = path.join(baseDir, '.cursor', 'skills', 'grill-plan-team', 'SKILL.md');
        if (fs.existsSync(cursorSkill)) {
          filesToRemove.add(cursorSkill);
        }
      }
    }

    // If uninstalling ALL harnesses (no specific harness requested), include any remaining manifest files
    if (options.harnesses.length === 0 && Array.isArray(manifest.installedFiles)) {
      for (const f of manifest.installedFiles) {
        if (fs.existsSync(f)) {
          filesToRemove.add(f);
        }
      }
    }

    let removedCount = 0;
    for (const file of filesToRemove) {
      if (fs.existsSync(file)) {
        if (options.dryRun) {
          console.log(`[dry-run] Would remove: ${file}`);
        } else {
          try {
            fs.unlinkSync(file);
            console.log(`Removed: ${file}`);
            removedCount++;
          } catch (err) {
            console.error(`Failed to remove ${file}: ${err.message}`);
          }
        }
      }
    }

    // Clean empty parent directories (hierarchical: deepest first)
    const dirsToCheck = [
      path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team', 'skills', 'grill-plan-team'),
      path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team', 'skills'),
      path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team', 'rules'),
      path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team'),
      path.join(baseDir, '.gemini', 'config', 'skills', 'grill-plan-team'),
      path.join(baseDir, '.claude', 'skills', 'grill-plan-team'),
      path.join(baseDir, '.claude', 'skills'),
      path.join(baseDir, '.claude', 'commands'),
      path.join(baseDir, '.claude'),
      path.join(baseDir, '.cursor', 'skills', 'grill-plan-team'),
      path.join(baseDir, '.cursor', 'skills'),
      path.join(baseDir, '.cursor', 'rules'),
      path.join(baseDir, '.cursor'),
      path.join(baseDir, 'skills', 'grill-plan-team'),
      path.join(baseDir, 'skills'),
      path.join(baseDir, 'rules')
    ];

    if (!options.dryRun) {
      for (const d of dirsToCheck) {
        if (fs.existsSync(d)) {
          try {
            const items = fs.readdirSync(d);
            if (items.length === 0) {
              fs.rmdirSync(d);
            }
          } catch {}
        }
      }

      if (options.isGlobal && targetHarnesses.includes('antigravity')) {
        updateGeminiPluginsJson(baseDir, options.dryRun, true);
      }

      if (options.harnesses.length > 0 && fs.existsSync(manifestPath)) {
        // Selective uninstallation: update manifest tracking
        const remainingInstalled = (manifest.installedFiles || []).filter(f => !filesToRemove.has(f));
        const remainingHarnesses = (manifest.harnesses || []).filter(h => !targetHarnesses.includes(h));
        if (remainingHarnesses.length === 0 || remainingInstalled.length === 0) {
          fs.unlinkSync(manifestPath);
        } else {
          manifest.installedFiles = remainingInstalled;
          manifest.harnesses = remainingHarnesses;
          manifest.updatedAt = new Date().toISOString();
          saveManifest(manifestPath, manifest, false);
        }
      } else if (fs.existsSync(manifestPath)) {
        fs.unlinkSync(manifestPath);
      }

      // Memory preservation / purge handling
      if (options.purge) {
        const memFiles = options.isGlobal
          ? [getUserAssessmentPath(baseDir), getUserRequirementsPath(baseDir), getUserMemoryPath(baseDir)]
          : [getProjectAssessmentPath(baseDir), getProjectRequirementsPath(baseDir), getProjectMemoryPath(baseDir)];
        for (const userMem of memFiles) {
          if (fs.existsSync(userMem) && fs.statSync(userMem).isFile()) {
            try {
              fs.unlinkSync(userMem);
              console.log(`Purged: ${userMem}`);
              const userDir = path.dirname(userMem);
              if (fs.existsSync(userDir) && fs.readdirSync(userDir).length === 0) {
                fs.rmdirSync(userDir);
              }
            } catch (err) {
              console.error(`Failed to remove ${userMem}: ${err.message}`);
            }
          }
        }
      } else {
        console.log('[memory] Preserved user memory files (use --purge to delete)');
      }
    } else if (options.purge) {
      const memFiles = options.isGlobal
        ? [getUserAssessmentPath(baseDir), getUserRequirementsPath(baseDir), getUserMemoryPath(baseDir)]
        : [getProjectAssessmentPath(baseDir), getProjectRequirementsPath(baseDir), getProjectMemoryPath(baseDir)];
      for (const memToPurge of memFiles) {
        if (fs.existsSync(memToPurge) && fs.statSync(memToPurge).isFile()) {
          console.log(`[dry-run] Would purge: ${memToPurge}`);
        }
      }
    }

    console.log(`\nUninstallation complete. Cleaned ${removedCount} file(s).`);
    return;
  }

  // Determine target harnesses
  let targetHarnesses = [];
  const detected = detectInstalledHarnesses(os.homedir());

  if (options.all) {
    targetHarnesses = HARNESSES;
  } else if (options.harnesses.length > 0) {
    targetHarnesses = options.harnesses;
  } else if (options.interactive) {
    if (process.stdin.isTTY) {
      targetHarnesses = await promptHarnesses(detected);
    } else {
      console.warn('Warning: Interactive mode requested but stdin is not a TTY. Falling back to auto-detection.');
      targetHarnesses = detected.length > 0 ? detected : HARNESSES;
    }
  } else {
    // Default: auto-detection of host harnesses (or all if none detected)
    targetHarnesses = detected.length > 0 ? detected : HARNESSES;
  }

  console.log(`\n=== Installing grill-plan-team ===`);
  console.log(`Target scope: ${options.isGlobal ? 'Global (~)' : options.localPath}`);
  console.log(`Selected harnesses: ${targetHarnesses.map(h => HARNESS_DISPLAY_NAMES[h]).join(', ')}`);
  if (options.dryRun) console.log(`Mode: DRY RUN (no files will be written)`);

  const manifest = loadManifest(manifestPath);
  const installedFiles = new Set(manifest.installedFiles || []);

  for (const h of targetHarnesses) {
    console.log(`\nConfiguring ${HARNESS_DISPLAY_NAMES[h]}...`);
    const mappings = getHarnessFileMappings(h, baseDir, options.isGlobal);

    for (const m of mappings) {
      if (options.dryRun) {
        console.log(`[dry-run] Would write: ${m.target}`);
      } else {
        writeFileSyncSafe(m.target, m.content, false);
        installedFiles.add(m.target);
        console.log(`Created: ${m.target}`);
      }
    }

    if (h === 'antigravity' && options.isGlobal) {
      updateGeminiPluginsJson(baseDir, options.dryRun, false);
    }
  }

  // Auto-initialize global user memory if it does not exist
  const homeDir = options.isGlobal ? baseDir : getHomeDir();
  ensureUserMemory(homeDir, options.dryRun);

  manifest.installedFiles = Array.from(installedFiles);
  manifest.harnesses = Array.from(new Set([...(manifest.harnesses || []), ...targetHarnesses]));
  manifest.updatedAt = new Date().toISOString();
  manifest.version = '1.0.0';

  saveManifest(manifestPath, manifest, options.dryRun);

  console.log(`\nInstallation successful!`);
  console.log(`Workflow installed across ${targetHarnesses.length} harness(es).`);
  console.log(`Run '/grill-plan-team' or invoke Phase 1 Grill-Me to get started.`);
}

if (require.main === module) {
  run().catch(err => {
    console.error('Fatal installer error:', err);
    process.exit(1);
  });
}

module.exports = {
  HARNESSES,
  HARNESS_DISPLAY_NAMES,
  DEFAULT_USER_MEMORY,
  DEFAULT_PROJECT_MEMORY,
  DEFAULT_ASSESSMENT_TEMPLATE,
  DEFAULT_REQUIREMENTS_TEMPLATE,
  getHomeDir,
  getUserConfigDir,
  getUserAssessmentPath,
  getUserRequirementsPath,
  getUserMemoryPath,
  getProjectConfigDir,
  getProjectAssessmentPath,
  getProjectRequirementsPath,
  getProjectMemoryPath,
  getAssessmentTemplate,
  getRequirementsTemplate,
  getUserMemoryTemplate,
  getProjectMemoryTemplate,
  migrateLegacyMemory,
  ensureUserMemory,
  handleMemoryCommand,
  handleAssessCommand,
  parseArgs,
  detectInstalledHarnesses,
  getHarnessFileMappings,
  updateGeminiPluginsJson,
  run
};
