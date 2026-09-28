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

function parseArgs(args) {
  const options = {
    isGlobal: true,
    localPath: null,
    all: false,
    harnesses: [],
    uninstall: false,
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
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        options.localPath = path.resolve(args[i + 1]);
        i++;
      } else {
        options.localPath = process.cwd();
      }
    } else if (arg.startsWith('--local=')) {
      options.isGlobal = false;
      options.localPath = path.resolve(arg.slice('--local='.length));
    } else if (arg === '--all' || arg === '-a') {
      options.all = true;
    } else if (arg === '--uninstall' || arg === '-u') {
      options.uninstall = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--interactive') {
      options.interactive = true;
    } else if (arg === '--harness') {
      if (args[i + 1]) {
        const parts = args[i + 1].split(',').map(s => s.trim().toLowerCase());
        options.harnesses.push(...parts);
        i++;
      }
    } else if (arg.startsWith('--harness=')) {
      const parts = arg.slice('--harness='.length).split(',').map(s => s.trim().toLowerCase());
      options.harnesses.push(...parts);
    }
    i++;
  }

  // Normalize aliases
  options.harnesses = options.harnesses.map(h => {
    if (h === 'agy' || h === 'gemini') return 'antigravity';
    if (h === 'claude-code') return 'claude';
    if (h === 'cline' || h === 'roo-code') return 'roo';
    return h;
  });

  return options;
}

function printHelp() {
  console.log(`
Grill-Plan-Team Universal Installer & Adapter Manager

Usage:
  npx grill-plan-team [options]
  node bin/install.js [options]
  ./install.sh [options]

Options:
  --global, -g          Install to user-level global configuration directories (default)
  --local, -l [path]    Install to project repository at [path] (default: current directory)
  --all, -a             Install to all supported harnesses regardless of host detection
  --harness <name>      Comma-separated list of target harnesses:
                        antigravity, claude, cursor, windsurf, roo
  --uninstall, -u       Cleanly remove installed grill-plan-team configurations
  --dry-run, -d         Preview changes without writing any files
  --interactive         Prompt for target harnesses interactively
  --help, -h            Show this help documentation

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
        // Core skills directory copy
        mappings.push({
          target: path.join(baseDir, '.gemini', 'config', 'skills', 'grill-plan-team', 'SKILL.md'),
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

async function run() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const baseDir = options.isGlobal ? os.homedir() : options.localPath;
  const manifestPath = path.join(baseDir, MANIFEST_FILENAME);

  if (options.uninstall) {
    console.log(`\nUninstalling grill-plan-team from ${options.isGlobal ? 'Global' : options.localPath}...`);
    const manifest = loadManifest(manifestPath);

    // Collect all potential files to clean up
    const targetHarnesses = options.harnesses.length > 0 ? options.harnesses : HARNESSES;
    const filesToRemove = new Set(manifest.installedFiles || []);

    // Also populate from harness mappings if manifest was incomplete
    for (const h of targetHarnesses) {
      const mappings = getHarnessFileMappings(h, baseDir, options.isGlobal);
      for (const m of mappings) {
        if (fs.existsSync(m.target)) {
          filesToRemove.add(m.target);
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

    // Clean empty parent directories
    const dirsToCheck = [
      path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team', 'skills', 'grill-plan-team'),
      path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team', 'rules'),
      path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team', 'skills'),
      path.join(baseDir, '.gemini', 'config', 'plugins', 'grill-plan-team'),
      path.join(baseDir, '.gemini', 'config', 'skills', 'grill-plan-team'),
      path.join(baseDir, '.claude', 'skills', 'grill-plan-team'),
      path.join(baseDir, '.claude', 'commands'),
      path.join(baseDir, '.cursor', 'rules'),
      path.join(baseDir, 'skills', 'grill-plan-team')
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

      if (options.isGlobal) {
        updateGeminiPluginsJson(baseDir, options.dryRun, true);
      }

      if (fs.existsSync(manifestPath)) {
        fs.unlinkSync(manifestPath);
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
    targetHarnesses = options.harnesses.filter(h => HARNESSES.includes(h));
    if (targetHarnesses.length === 0) {
      console.error(`Error: No valid harnesses specified. Choose from: ${HARNESSES.join(', ')}`);
      process.exit(1);
    }
  } else if (options.interactive || (process.stdin.isTTY && process.stdout.isTTY)) {
    targetHarnesses = await promptHarnesses(detected);
  } else {
    // Non-interactive fallback: detected or all if none detected
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
  parseArgs,
  detectInstalledHarnesses,
  getHarnessFileMappings,
  updateGeminiPluginsJson,
  run
};
