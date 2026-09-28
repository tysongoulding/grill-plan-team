const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execSync, execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const BIN_INSTALL_JS = path.join(REPO_ROOT, 'bin', 'install.js');
const INSTALL_SH = path.join(REPO_ROOT, 'install.sh');

describe('Repository Manifest & Schema Integrity', () => {
  test('package.json has valid schema and required fields', () => {
    const pkgPath = path.join(REPO_ROOT, 'package.json');
    assert.ok(fs.existsSync(pkgPath), 'package.json exists');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    assert.strictEqual(pkg.name, 'grill-plan-team');
    assert.strictEqual(pkg.version, '1.0.0');
    assert.strictEqual(pkg.license, 'MIT');
    assert.ok(pkg.bin && pkg.bin['grill-plan-team'], 'bin entry exists');
    assert.ok(pkg.repository && pkg.repository.url, 'repository url exists');
    assert.ok(pkg.description && pkg.description.length > 10, 'description is non-trivial');
  });

  test('Antigravity plugin.json is valid and exports SKILL.md', () => {
    const pluginPath = path.join(REPO_ROOT, 'plugin.json');
    assert.ok(fs.existsSync(pluginPath), 'plugin.json exists');
    const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));

    assert.strictEqual(plugin.name, 'grill-plan-team');
    assert.strictEqual(plugin.version, '1.0.0');
    assert.ok(plugin.displayName, 'displayName exists');
    assert.ok(Array.isArray(plugin.skills), 'skills is an array');
    assert.ok(
      plugin.skills.includes('skills/grill-plan-team/SKILL.md'),
      'skills exports skills/grill-plan-team/SKILL.md'
    );

    // Check that exported skill file actually exists
    const skillPath = path.join(REPO_ROOT, 'skills', 'grill-plan-team', 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), 'SKILL.md exists');
    const skillContent = fs.readFileSync(skillPath, 'utf8');
    assert.ok(skillContent.includes('Phase 1: Interactive Alignment (Grill-Me)'));
    assert.ok(skillContent.includes('Phase 2: Technical Design & Verification (Plan)'));
    assert.ok(skillContent.includes('Phase 3: Teamwork Execution & Verification'));
  });

  test('Antigravity rules/AGENTS.md exists and contains phase governance', () => {
    const rulesPath = path.join(REPO_ROOT, 'rules', 'AGENTS.md');
    assert.ok(fs.existsSync(rulesPath), 'rules/AGENTS.md exists');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    assert.ok(rulesContent.includes('Phase 1: Interactive Alignment (Grill-Me)'));
    assert.ok(rulesContent.includes('Phase 2: Technical Design & Verification (Plan)'));
    assert.ok(rulesContent.includes('Phase 3: Teamwork Execution & Verification'));
  });

  test('Root AGENTS.md exists and contains agent installation and workflow governance', () => {
    const rootAgentsPath = path.join(REPO_ROOT, 'AGENTS.md');
    assert.ok(fs.existsSync(rootAgentsPath), 'root AGENTS.md exists');
    const content = fs.readFileSync(rootAgentsPath, 'utf8');
    assert.ok(content.includes('Agent Installation Guide'), 'includes installation guide');
    assert.ok(content.includes('Agent Uninstallation Guide'), 'includes uninstallation guide');
    assert.ok(content.includes('node bin/install.js'), 'includes install commands');
    assert.ok(content.includes('Do NOT run `npm test` as an install step'), 'includes guardrails');
    assert.ok(content.includes('Phase 1: Interactive Alignment (Grill-Me)'), 'includes Phase 1');
    assert.ok(content.includes('Phase 2: Technical Design & Verification (Plan)'), 'includes Phase 2');
    assert.ok(content.includes('Phase 3: Teamwork Execution & Verification'), 'includes Phase 3');
    assert.ok(content.includes('Phase 4: Reflection & Distillation Loop'), 'includes Phase 4');
  });

  test('Claude Code adapter files exist and are valid', () => {
    const skillPath = path.join(REPO_ROOT, '.claude', 'skills', 'grill-plan-team', 'SKILL.md');
    const cmdPath = path.join(REPO_ROOT, '.claude', 'commands', 'grill-plan-team.md');

    assert.ok(fs.existsSync(skillPath), '.claude skill exists');
    assert.ok(fs.existsSync(cmdPath), '.claude command exists');

    const skillContent = fs.readFileSync(skillPath, 'utf8');
    assert.ok(skillContent.startsWith('---'));
    assert.ok(skillContent.includes('name: grill-plan-team'));

    const cmdContent = fs.readFileSync(cmdPath, 'utf8');
    assert.ok(cmdContent.includes('/grill-plan-team'));
  });

  test('Cursor adapter files exist and are valid', () => {
    const rulesPath = path.join(REPO_ROOT, '.cursorrules');
    const mdcPath = path.join(REPO_ROOT, '.cursor', 'rules', 'grill-plan-team.mdc');

    assert.ok(fs.existsSync(rulesPath), '.cursorrules exists');
    assert.ok(fs.existsSync(mdcPath), '.cursor/rules/grill-plan-team.mdc exists');

    const mdcContent = fs.readFileSync(mdcPath, 'utf8');
    assert.ok(mdcContent.startsWith('---'));
    assert.ok(mdcContent.includes('alwaysApply: true'));
    assert.ok(mdcContent.includes('Grill-Plan-Team'));
  });

  test('Windsurf adapter file exists and is valid', () => {
    const rulesPath = path.join(REPO_ROOT, '.windsurfrules');
    assert.ok(fs.existsSync(rulesPath), '.windsurfrules exists');
    const content = fs.readFileSync(rulesPath, 'utf8');
    assert.ok(content.includes('Cascade'));
    assert.ok(content.includes('Phase 1: Interactive Alignment (Grill-Me)'));
  });

  test('Roo Code adapter files exist and .roomodes is valid JSON', () => {
    const modesPath = path.join(REPO_ROOT, '.roomodes');
    const clinePath = path.join(REPO_ROOT, '.clinerules');

    assert.ok(fs.existsSync(modesPath), '.roomodes exists');
    assert.ok(fs.existsSync(clinePath), '.clinerules exists');

    const modes = JSON.parse(fs.readFileSync(modesPath, 'utf8'));
    assert.ok(Array.isArray(modes.customModes), 'customModes is an array');
    const grillMode = modes.customModes.find(m => m.slug === 'grill-plan-team');
    assert.ok(grillMode, 'grill-plan-team mode is defined');
    assert.strictEqual(grillMode.name, 'Grill-Plan-Team');
  });

  test('canonical sources and memory directory contain all required files', () => {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'plugin.json')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'rules', 'AGENTS.md')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'skills', 'grill-plan-team', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, '.claude', 'commands', 'grill-plan-team.md')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, '.cursorrules')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, '.cursor', 'rules', 'grill-plan-team.mdc')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, '.windsurfrules')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, '.roomodes')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, '.clinerules')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'memory', 'ASSESSMENT.md')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'memory', 'REQUIREMENTS.md')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'memory', 'user-memory.md')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'memory', 'project-memory.md')));

    const { HARNESSES, HARNESS_DISPLAY_NAMES } = require('../bin/install.js');
    assert.strictEqual(HARNESSES.length, 12, 'HARNESSES array contains 12 entries');
    const expected = ['antigravity', 'claude', 'cursor', 'windsurf', 'roo', 'kimi', 'hermes', 'pi', 'omp', 'opencode', 'codex', 'grok'];
    assert.deepStrictEqual(HARNESSES, expected);
    for (const h of expected) {
      assert.ok(HARNESS_DISPLAY_NAMES[h], `Display name exists for ${h}`);
    }
  });
});

describe('Shell Installer (install.sh)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-sh-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('bash -n install.sh passes syntax check', () => {
    const res = execFileSync('bash', ['-n', INSTALL_SH], { encoding: 'utf8' });
    assert.strictEqual(res, '');
  });

  test('install.sh --help displays usage', () => {
    const res = execFileSync('bash', [INSTALL_SH, '--help'], { encoding: 'utf8' });
    assert.ok(res.includes('Grill-Plan-Team Universal Shell Installer'));
    assert.ok(res.includes('--all'));
    assert.ok(res.includes('--harness'));
    for (const h of ['kimi', 'hermes', 'pi', 'omp', 'opencode', 'codex', 'grok']) {
      assert.ok(res.includes(h), `Help includes ${h}`);
    }
  });

  test('install.sh --local installs all harnesses with --all flag', () => {
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--all'], { encoding: 'utf8' });

    assert.ok(fs.existsSync(path.join(tmpDir, 'plugin.json')), 'Antigravity plugin.json installed');
    assert.ok(fs.existsSync(path.join(tmpDir, 'rules', 'AGENTS.md')), 'rules/AGENTS.md installed');
    assert.ok(fs.existsSync(path.join(tmpDir, 'skills', 'grill-plan-team', 'SKILL.md')), 'SKILL.md installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'grill-plan-team', 'SKILL.md')), 'Claude skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'grill-plan-team.md')), 'Claude command installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'grill-plan-team.mdc')), 'Cursor MDC installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.windsurfrules')), 'Windsurf rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')), 'Roo modes installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.clinerules')), 'Cline rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')), 'Universal .agents skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.kimi', 'skills', 'grill-plan-team', 'SKILL.md')), 'Kimi skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.hermes', 'skills', 'grill-plan-team', 'SKILL.md')), 'Hermes skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.pi', 'skills', 'grill-plan-team', 'SKILL.md')), 'Pi skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.omp', 'skills', 'grill-plan-team', 'SKILL.md')), 'Oh My Pi skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.opencode', 'skills', 'grill-plan-team', 'SKILL.md')), 'OpenCode skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.codex', 'skills', 'grill-plan-team', 'SKILL.md')), 'Codex skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.grok', 'skills', 'grill-plan-team', 'SKILL.md')), 'Grok skill installed');
  });

  test('install.sh --local installs only selected harness', () => {
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });

    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'grill-plan-team.mdc')), 'Cursor MDC installed');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.windsurfrules')), 'Windsurf rules should not be installed');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.roomodes')), 'Roo modes should not be installed');
  });

  test('install.sh --uninstall cleans up without touching unrelated files', () => {
    // Create unrelated user file
    const unrelatedFile = path.join(tmpDir, 'keep_me.txt');
    fs.writeFileSync(unrelatedFile, 'Do not delete me!');

    // Install all
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')));

    // Uninstall
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--uninstall'], { encoding: 'utf8' });

    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursorrules')), '.cursorrules was removed');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.windsurfrules')), '.windsurfrules was removed');
    assert.ok(fs.existsSync(unrelatedFile), 'Unrelated user file was preserved');
    assert.strictEqual(fs.readFileSync(unrelatedFile, 'utf8'), 'Do not delete me!');
  });

  test('install.sh short options (-l, -d) parse correctly', () => {
    const res = execFileSync('bash', [INSTALL_SH, '-l', tmpDir, '-d'], { encoding: 'utf8' });
    assert.ok(res.includes('[dry-run] Would write'));
    assert.strictEqual(fs.readdirSync(tmpDir).length, 0, 'No files written in dry-run');
  });

  test('install.sh supports selective uninstallation of single harness', () => {
    // Install all harnesses
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.windsurfrules')));
    assert.ok(fs.existsSync(path.join(tmpDir, 'plugin.json')));

    // Unlink only cursor
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'cursor', '--uninstall'], { encoding: 'utf8' });

    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules removed');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'grill-plan-team.mdc')), 'Cursor MDC removed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.windsurfrules')), 'Windsurf rules preserved');
    assert.ok(fs.existsSync(path.join(tmpDir, 'plugin.json')), 'Antigravity plugin.json preserved');
  });

  test('install.sh cleans empty directories on complete uninstall', () => {
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--uninstall'], { encoding: 'utf8' });

    const remaining = fs.readdirSync(tmpDir);
    assert.strictEqual(remaining.length, 0, 'Clean directory left empty after complete uninstall');
  });

  test('install.sh supports uninstall and remove subcommands', () => {
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')));

    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, 'uninstall'], { encoding: 'utf8' });
    assert.ok(!fs.existsSync(path.join(tmpDir, '.roomodes')));

    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')));

    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, 'remove'], { encoding: 'utf8' });
    assert.ok(!fs.existsSync(path.join(tmpDir, '.roomodes')));
  });

  test('install.sh rejects unknown options with exit code 1', () => {
    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, '--locall', tmpDir], { encoding: 'utf8', stdio: 'pipe' });
    }, /Unknown option/);
  });

  test('install.sh rejects invalid harness names with exit code 1 on install and uninstall', () => {
    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'nonexistent'], { encoding: 'utf8', stdio: 'pipe' });
    }, /No valid harnesses specified/);

    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'nonexistent', '--uninstall'], { encoding: 'utf8', stdio: 'pipe' });
    }, /No valid harnesses specified/);
  });

  test('install.sh incremental install installs multiple harnesses correctly', () => {
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'claude'], { encoding: 'utf8' });

    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'grill-plan-team.mdc')), 'Cursor MDC installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'grill-plan-team', 'SKILL.md')), 'Claude skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'grill-plan-team.md')), 'Claude command installed');
  });

  test('install.sh selective uninstall and legacy manifest removal', () => {
    const legacyManifest = path.join(tmpDir, '.grill-plan-team-manifest.json');
    fs.writeFileSync(legacyManifest, JSON.stringify({ installedFiles: [], harnesses: ['cursor', 'claude'] }));

    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'claude'], { encoding: 'utf8' });

    // Remove claude
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'claude', '--uninstall'], { encoding: 'utf8' });
    assert.ok(!fs.existsSync(path.join(tmpDir, '.claude')), 'Claude directory removed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor preserved');

    // Remove cursor (last harness)
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'cursor', '--uninstall'], { encoding: 'utf8' });
    assert.ok(!fs.existsSync(legacyManifest), 'Legacy manifest cleanly removed');
    assert.strictEqual(fs.readdirSync(tmpDir).length, 0, 'Target directory clean after complete selective uninstall');
  });

  test('install.sh normalizes harness names case-insensitively and trims whitespace', () => {
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', '  CURSOR , CLAUDE  '], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'grill-plan-team.md')), 'Claude command installed');
  });

  test('install.sh rejects empty or whitespace --harness argument with exit code 1', () => {
    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', ''], { encoding: 'utf8', stdio: 'pipe' });
    }, /--harness requires an argument/);

    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', '   '], { encoding: 'utf8', stdio: 'pipe' });
    }, /--harness requires an argument/);
  });

  test('install.sh supports -l=<path> syntax', () => {
    const res = execFileSync('bash', [INSTALL_SH, `-l=${tmpDir}`, '-d'], { encoding: 'utf8' });
    assert.ok(res.includes('[dry-run] Would write'));
    assert.ok(res.includes(tmpDir));
  });

  test('install.sh handles paths with apostrophes and empty -l correctly', () => {
    const quoteDir = path.join(tmpDir, "alice's-project");
    const res = execFileSync('bash', [INSTALL_SH, '--local', quoteDir, '-d'], { encoding: 'utf8' });
    assert.ok(res.includes(`Target scope: ${quoteDir}`));

    const emptyRes = execFileSync('bash', [INSTALL_SH, '-l', '', '-d'], { encoding: 'utf8', cwd: tmpDir });
    assert.ok(emptyRes.includes(`Target scope: ${tmpDir}`));
  });
});

describe('Node Installer CLI (bin/install.js)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-node-test-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('bin/install.js --help displays usage', () => {
    const res = execFileSync('node', [BIN_INSTALL_JS, '--help'], { encoding: 'utf8' });
    assert.ok(res.includes('Grill-Plan-Team Universal Installer'));
    assert.ok(res.includes('--global'));
    assert.ok(res.includes('--local'));
    for (const h of ['kimi', 'hermes', 'pi', 'omp', 'opencode', 'codex', 'grok']) {
      assert.ok(res.includes(h), `Help includes ${h}`);
    }
  });

  test('bin/install.js --dry-run does not write files', () => {
    const res = execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all', '--dry-run'], { encoding: 'utf8' });
    assert.ok(res.includes('[dry-run] Would write'));
    assert.strictEqual(fs.readdirSync(tmpDir).length, 0, 'No files written in dry-run');
  });

  test('bin/install.js --local installs all harnesses with --all flag', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all'], { encoding: 'utf8' });

    assert.ok(fs.existsSync(path.join(tmpDir, 'plugin.json')), 'Antigravity plugin.json installed');
    assert.ok(fs.existsSync(path.join(tmpDir, 'rules', 'AGENTS.md')), 'rules/AGENTS.md installed');
    assert.ok(fs.existsSync(path.join(tmpDir, 'skills', 'grill-plan-team', 'SKILL.md')), 'SKILL.md installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'grill-plan-team', 'SKILL.md')), 'Claude skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'grill-plan-team.md')), 'Claude command installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'grill-plan-team.mdc')), 'Cursor MDC installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.windsurfrules')), 'Windsurf rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')), 'Roo modes installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.clinerules')), 'Cline rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')), 'Universal .agents skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.kimi', 'skills', 'grill-plan-team', 'SKILL.md')), 'Kimi skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.hermes', 'skills', 'grill-plan-team', 'SKILL.md')), 'Hermes skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.pi', 'skills', 'grill-plan-team', 'SKILL.md')), 'Pi skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.omp', 'skills', 'grill-plan-team', 'SKILL.md')), 'Oh My Pi skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.opencode', 'skills', 'grill-plan-team', 'SKILL.md')), 'OpenCode skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.codex', 'skills', 'grill-plan-team', 'SKILL.md')), 'Codex skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.grok', 'skills', 'grill-plan-team', 'SKILL.md')), 'Grok skill installed');
  });

  test('bin/install.js --uninstall cleanly removes installed files and preserves others', () => {
    const userSecret = path.join(tmpDir, 'secret_config.json');
    fs.writeFileSync(userSecret, '{"api_key": "12345"}');

    // Install all
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')));

    // Uninstall
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--uninstall'], { encoding: 'utf8' });

    assert.ok(!fs.existsSync(path.join(tmpDir, '.roomodes')), '.roomodes removed');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursorrules')), '.cursorrules removed');
    assert.ok(fs.existsSync(userSecret), 'Unrelated user config preserved');
    assert.strictEqual(fs.readFileSync(userSecret, 'utf8'), '{"api_key": "12345"}');
  });

  test('bin/install.js supports uninstall and remove subcommands', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')));

    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, 'uninstall'], { encoding: 'utf8' });
    assert.ok(!fs.existsSync(path.join(tmpDir, '.roomodes')));

    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')));

    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, 'remove'], { encoding: 'utf8' });
    assert.ok(!fs.existsSync(path.join(tmpDir, '.roomodes')));
  });

  test('bin/install.js --local runs with auto-detection without hanging', () => {
    // Should complete cleanly and not hang waiting on interactive stdin
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, 'skills', 'grill-plan-team', 'SKILL.md')) || fs.existsSync(path.join(tmpDir, 'plugin.json')));
  });

  test('bin/install.js supports selective uninstallation of single harness', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')));

    // Selective uninstall of cursor
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'cursor', '--uninstall'], { encoding: 'utf8' });

    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules removed');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'grill-plan-team.mdc')), 'Cursor MDC removed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')), 'Roo modes preserved');
  });

  test('bin/install.js cleans empty directories on complete uninstall', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--uninstall'], { encoding: 'utf8' });

    const remaining = fs.readdirSync(tmpDir);
    assert.strictEqual(remaining.length, 0, 'Clean directory left empty after complete uninstall');
  });

  test('Simulated global install updates ~/.gemini/config/plugins.json and uninstalls cleanly', () => {
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-fake-home-'));
    try {
      // Pre-populate plugins.json with existing other plugin
      const geminiConfigDir = path.join(fakeHome, '.gemini', 'config');
      fs.mkdirSync(geminiConfigDir, { recursive: true });
      const initialPluginsJson = {
        entries: [{ path: '/some/other/plugin' }]
      };
      fs.writeFileSync(
        path.join(geminiConfigDir, 'plugins.json'),
        JSON.stringify(initialPluginsJson, null, 2)
      );

      // Run global install with HOME overridden
      execFileSync('node', [BIN_INSTALL_JS, '--all'], {
        encoding: 'utf8',
        env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome, XDG_CONFIG_HOME: path.join(fakeHome, '.config') }
      });

      // Verify plugin installed
      const pluginDir = path.join(geminiConfigDir, 'plugins', 'grill-plan-team');
      assert.ok(fs.existsSync(path.join(pluginDir, 'plugin.json')), 'Global plugin.json installed');

      // Verify plugins.json updated with both plugins
      const updatedConfig = JSON.parse(fs.readFileSync(path.join(geminiConfigDir, 'plugins.json'), 'utf8'));
      assert.strictEqual(updatedConfig.entries.length, 2);
      assert.strictEqual(updatedConfig.entries[0].path, '/some/other/plugin');
      assert.strictEqual(updatedConfig.entries[1].path, pluginDir);

      // Run global uninstall with HOME overridden
      execFileSync('node', [BIN_INSTALL_JS, '--uninstall'], {
        encoding: 'utf8',
        env: { ...process.env, HOME: fakeHome, USERPROFILE: fakeHome, XDG_CONFIG_HOME: path.join(fakeHome, '.config') }
      });

      // Verify plugin files removed
      assert.ok(!fs.existsSync(pluginDir), 'Global plugin dir removed');

      // Verify plugins.json restored without affecting other plugin
      const cleanedConfig = JSON.parse(fs.readFileSync(path.join(geminiConfigDir, 'plugins.json'), 'utf8'));
      assert.strictEqual(cleanedConfig.entries.length, 1);
      assert.strictEqual(cleanedConfig.entries[0].path, '/some/other/plugin');
    } finally {
      fs.rmSync(fakeHome, { recursive: true, force: true });
    }
  });

  test('bin/install.js rejects unknown options with exit code 1', () => {
    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, '--locall', tmpDir], { encoding: 'utf8', stdio: 'pipe' });
    }, /Unknown option/);
  });

  test('bin/install.js rejects invalid harness names with exit code 1 on install and uninstall', () => {
    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'nonexistent'], { encoding: 'utf8', stdio: 'pipe' });
    }, /No valid harnesses specified/);

    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'nonexistent', '--uninstall'], { encoding: 'utf8', stdio: 'pipe' });
    }, /No valid harnesses specified/);
  });

  test('bin/install.js incremental install installs multiple harnesses correctly', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'claude'], { encoding: 'utf8' });

    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'grill-plan-team.mdc')), 'Cursor MDC installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'grill-plan-team', 'SKILL.md')), 'Claude skill installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'grill-plan-team.md')), 'Claude command installed');
  });

  test('bin/install.js selective uninstall and legacy manifest removal', () => {
    const legacyManifest = path.join(tmpDir, '.grill-plan-team-manifest.json');
    fs.writeFileSync(legacyManifest, JSON.stringify({ installedFiles: [], harnesses: ['cursor'] }));

    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'cursor', '--uninstall'], { encoding: 'utf8' });

    assert.ok(!fs.existsSync(legacyManifest), 'Legacy manifest removed');
    assert.strictEqual(fs.readdirSync(tmpDir).length, 0, 'Target directory clean after complete selective uninstall');
  });

  test('bin/install.js normalizes harness names case-insensitively and trims whitespace', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', '  CURSOR , CLAUDE  '], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules installed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.claude', 'commands', 'grill-plan-team.md')), 'Claude command installed');
  });

  test('bin/install.js rejects empty or whitespace --harness argument with exit code 1', () => {
    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', ''], { encoding: 'utf8', stdio: 'pipe' });
    }, /--harness requires an argument/);

    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', '   '], { encoding: 'utf8', stdio: 'pipe' });
    }, /--harness requires an argument/);
  });

  test('bin/install.js supports -l=<path> syntax', () => {
    const res = execFileSync('node', [BIN_INSTALL_JS, `-l=${tmpDir}`, '-d'], { encoding: 'utf8' });
    assert.ok(res.includes('[dry-run] Would write'));
    assert.ok(res.includes(tmpDir));
  });

  test('bin/install.js handles paths with apostrophes and empty -l correctly', () => {
    const quoteDir = path.join(tmpDir, "alice's-project");
    const res = execFileSync('node', [BIN_INSTALL_JS, '--local', quoteDir, '-d'], { encoding: 'utf8' });
    assert.ok(res.includes(`Target scope: ${quoteDir}`));

    const emptyRes = execFileSync('node', [BIN_INSTALL_JS, '-l', '', '-d'], { encoding: 'utf8', cwd: tmpDir });
    assert.ok(emptyRes.includes(`Target scope: ${tmpDir}`));
  });
});

describe('Cross-Harness Parity & Byte Integrity', () => {
  let shDir;
  let nodeDir;

  beforeEach(() => {
    shDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-parity-sh-'));
    nodeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-parity-node-'));
  });

  afterEach(() => {
    if (shDir && fs.existsSync(shDir)) fs.rmSync(shDir, { recursive: true, force: true });
    if (nodeDir && fs.existsSync(nodeDir)) fs.rmSync(nodeDir, { recursive: true, force: true });
  });

  test('install.sh and bin/install.js produce byte-identical template files across all harnesses', () => {
    execFileSync('bash', [INSTALL_SH, '--local', shDir, '--all'], { encoding: 'utf8' });
    execFileSync('node', [BIN_INSTALL_JS, '--local', nodeDir, '--all'], { encoding: 'utf8' });

    const filesToCheck = [
      'plugin.json',
      'rules/AGENTS.md',
      'skills/grill-plan-team/SKILL.md',
      '.claude/skills/grill-plan-team/SKILL.md',
      '.claude/commands/grill-plan-team.md',
      '.cursor/rules/grill-plan-team.mdc',
      '.cursorrules',
      '.windsurfrules',
      '.roomodes',
      '.clinerules',
      '.agents/skills/grill-plan-team/SKILL.md',
      '.kimi/skills/grill-plan-team/SKILL.md',
      '.hermes/skills/grill-plan-team/SKILL.md',
      '.pi/skills/grill-plan-team/SKILL.md',
      '.omp/skills/grill-plan-team/SKILL.md',
      '.opencode/skills/grill-plan-team/SKILL.md',
      '.codex/skills/grill-plan-team/SKILL.md',
      '.grok/skills/grill-plan-team/SKILL.md'
    ];

    for (const relPath of filesToCheck) {
      const shContent = fs.readFileSync(path.join(shDir, relPath));
      const nodeContent = fs.readFileSync(path.join(nodeDir, relPath));
      assert.strictEqual(
        shContent.compare(nodeContent),
        0,
        `Byte mismatch found in installed file: ${relPath}`
      );
    }
  });

  test('install.sh and bin/install.js produce matching installed file sets', () => {
    execFileSync('bash', [INSTALL_SH, '--local', shDir, '--all'], { encoding: 'utf8' });
    execFileSync('node', [BIN_INSTALL_JS, '--local', nodeDir, '--all'], { encoding: 'utf8' });

    assert.ok(!fs.existsSync(path.join(shDir, '.grill-plan-team-manifest.json')), 'No stateful manifest in shDir');
    assert.ok(!fs.existsSync(path.join(nodeDir, '.grill-plan-team-manifest.json')), 'No stateful manifest in nodeDir');
  });
});

describe('Two-Tier Recursive Memory Engine', () => {
  let tmpDir;
  let fakeHome;

  function getFakeEnv(homePath) {
    return {
      ...process.env,
      HOME: homePath,
      USERPROFILE: homePath,
      XDG_CONFIG_HOME: path.join(homePath, '.config')
    };
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-mem-test-'));
    fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-fake-home-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    if (fakeHome && fs.existsSync(fakeHome)) fs.rmSync(fakeHome, { recursive: true, force: true });
  });

  test('Memory template files exist and contain required schema sections', () => {
    const assessMemPath = path.join(REPO_ROOT, 'memory', 'ASSESSMENT.md');
    const reqMemPath = path.join(REPO_ROOT, 'memory', 'REQUIREMENTS.md');
    const userMemPath = path.join(REPO_ROOT, 'memory', 'user-memory.md');
    const projMemPath = path.join(REPO_ROOT, 'memory', 'project-memory.md');

    assert.ok(fs.existsSync(assessMemPath), 'ASSESSMENT.md template exists');
    assert.ok(fs.existsSync(reqMemPath), 'REQUIREMENTS.md template exists');
    assert.ok(fs.existsSync(userMemPath), 'user-memory.md template exists');
    assert.ok(fs.existsSync(projMemPath), 'project-memory.md template exists');

    const assessContent = fs.readFileSync(assessMemPath, 'utf8');
    assert.ok(assessContent.includes('# Developer Assessment & Baseline Profile (grill-plan-team)'));
    assert.ok(assessContent.includes('## Developer Role & Daily Work'));
    assert.ok(assessContent.includes('## AI Experience & Proficiency'));
    assert.ok(assessContent.includes('## Activation & Trigger Preference'));
    assert.ok(assessContent.includes('## Collaboration & Communication Style'));
    assert.ok(assessContent.includes('## Distilled User Preferences'));

    const reqContent = fs.readFileSync(reqMemPath, 'utf8');
    assert.ok(reqContent.includes('# Engineering Requirements & Technical Guardrails (grill-plan-team)'));
    assert.ok(reqContent.includes('## Guardrails & Safety'));
    assert.ok(reqContent.includes('## VCS & Repository Processes'));
    assert.ok(reqContent.includes('## Preferred Languages & Runtimes'));
    assert.ok(reqContent.includes('## Preferred Libraries & Frameworks'));
    assert.ok(reqContent.includes('## Architectural Decision History'));
    assert.ok(reqContent.includes('## Past Pitfalls & Reviewer Lessons'));

    const userContent = fs.readFileSync(userMemPath, 'utf8');
    assert.ok(userContent.includes('# Global User Memory (grill-plan-team)'));
    assert.ok(userContent.includes('## Developer Profile & Interaction Style'));

    const projContent = fs.readFileSync(projMemPath, 'utf8');
    assert.ok(projContent.includes('# Local Project Memory (grill-plan-team)'));
    assert.ok(projContent.includes('## Established Repository Conventions'));
  });

  test('SKILL.md and all adapter files include Step 0 Memory Recall and Phase 4 Reflection & Distillation', () => {
    const files = [
      path.join(REPO_ROOT, 'skills', 'grill-plan-team', 'SKILL.md'),
      path.join(REPO_ROOT, '.agents', 'skills', 'grill-plan-team', 'SKILL.md'),
      path.join(REPO_ROOT, 'rules', 'AGENTS.md'),
      path.join(REPO_ROOT, '.claude', 'skills', 'grill-plan-team', 'SKILL.md'),
      path.join(REPO_ROOT, '.claude', 'commands', 'grill-plan-team.md'),
      path.join(REPO_ROOT, '.cursorrules'),
      path.join(REPO_ROOT, '.cursor', 'rules', 'grill-plan-team.mdc'),
      path.join(REPO_ROOT, '.windsurfrules'),
      path.join(REPO_ROOT, '.roomodes'),
      path.join(REPO_ROOT, '.clinerules')
    ];

    for (const file of files) {
      assert.ok(fs.existsSync(file), `File exists: ${file}`);
      const content = fs.readFileSync(file, 'utf8');
      const hasStep0 = content.includes('Step 0') || content.includes('Memory Recall') || content.includes('Recall');
      const hasPhase4 = content.includes('Phase 4') || content.includes('Reflection') || content.includes('Distill');
      assert.ok(hasStep0, `${path.basename(file)} contains Step 0 Memory Recall`);
      assert.ok(hasPhase4, `${path.basename(file)} contains Phase 4 Reflection & Distillation`);
    }
  });

  test('bin/install.js memory subcommands (path, init, show)', () => {
    // memory path with standard flags and aliases
    const userPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userPathRes, path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md'));

    const userAssessPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', 'assessment', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userAssessPathRes, path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md'));

    const userReqPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', 'requirements', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userReqPathRes, path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md'));

    const userLegacyPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', 'legacy', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userLegacyPathRes, path.join(fakeHome, '.config', 'grill-plan-team', 'user-memory.md'));

    const userAliasPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '-user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userAliasPathRes, userPathRes);

    const projPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projPathRes, path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md'));

    const projAssessPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', 'assessment', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projAssessPathRes, path.join(tmpDir, '.grill-plan-team', 'ASSESSMENT.md'));

    const projReqPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', 'requirements', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projReqPathRes, path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md'));

    const projLegacyPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', 'legacy', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projLegacyPathRes, path.join(tmpDir, '.grill-plan-team', 'project-memory.md'));

    const projAliasPathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--per-project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projAliasPathRes, projPathRes);

    const projSingleDashRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '-per-project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projSingleDashRes, projPathRes);

    const projShortAliasRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '-project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projShortAliasRes, projPathRes);

    // path with apostrophe/single quote and spaces
    const quoteDir = path.join(tmpDir, "alice's-project");
    const quotePathRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--project', '-l', quoteDir], {
      encoding: 'utf8'
    }).trim();
    assert.strictEqual(quotePathRes, path.join(quoteDir, '.grill-plan-team', 'REQUIREMENTS.md'));

    // empty and whitespace -l handling
    const emptyLRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--project', '-l', ''], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(emptyLRes, projPathRes);

    const whitespaceLRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--project', '-l', '   '], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(whitespaceLRes, projPathRes);

    // XDG_CONFIG_HOME with trailing slash
    const trailingXdgRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--user'], {
      encoding: 'utf8',
      env: { ...process.env, XDG_CONFIG_HOME: path.join(fakeHome, '.config') + '/' }
    }).trim();
    assert.strictEqual(trailingXdgRes, userPathRes);

    // relative -l path resolution including .. dot-dot
    const relSubRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--project', '-l', './subtest'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(relSubRes, path.join(tmpDir, 'subtest', '.grill-plan-team', 'REQUIREMENTS.md'));

    const relDotDotRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--project', '-l', '../sibling'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(relDotDotRes, path.resolve(tmpDir, '..', 'sibling', '.grill-plan-team', 'REQUIREMENTS.md'));

    // memory init --project
    const initProjRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'init', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.ok(initProjRes.includes('Initialized project memory'));
    const projAssessFile = path.join(tmpDir, '.grill-plan-team', 'ASSESSMENT.md');
    const projReqFile = path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md');
    assert.ok(fs.existsSync(projAssessFile));
    assert.ok(fs.existsSync(projReqFile));
    const projAssessContent = fs.readFileSync(projAssessFile, 'utf8');
    const projReqContent = fs.readFileSync(projReqFile, 'utf8');
    assert.ok(projAssessContent.includes('## Developer Role & Daily Work'));
    assert.ok(projReqContent.includes('## Guardrails & Safety'));
    assert.ok(projReqContent.includes('## Architectural Decision History'));

    // Test --force on memory init (preserves modified content without --force, overwrites with --force)
    fs.appendFileSync(projReqFile, '\n- Custom project note 123');
    const initAgainRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'init', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.ok(initAgainRes.includes('already exists'));
    assert.ok(fs.readFileSync(projReqFile, 'utf8').includes('Custom project note 123'));

    const initForceRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'init', '--project', '--force'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.ok(initForceRes.includes('Initialized project memory'));
    assert.ok(!fs.readFileSync(projReqFile, 'utf8').includes('Custom project note 123'));

    // memory show --project (defaults to REQUIREMENTS.md for project)
    const showProjRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'show', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.strictEqual(showProjRes, projReqContent);

    // memory show assessment --project
    const showProjAssessRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'show', 'assessment', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.strictEqual(showProjAssessRes, projAssessContent);

    // memory init --user
    const initUserRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'init', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(initUserRes.includes('Initialized user memory'));
    const userAssessFile = path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md');
    const userReqFile = path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md');
    assert.ok(fs.existsSync(userAssessFile));
    assert.ok(fs.existsSync(userReqFile));
    const userAssessContent = fs.readFileSync(userAssessFile, 'utf8');
    const userReqContent = fs.readFileSync(userReqFile, 'utf8');
    assert.ok(userAssessContent.includes('## Developer Role & Daily Work'));
    assert.ok(userAssessContent.includes('## AI Experience & Proficiency'));
    assert.ok(userReqContent.includes('## Guardrails & Safety'));

    // memory show --user (defaults to ASSESSMENT.md for user)
    const showUserRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'show', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.strictEqual(showUserRes, userAssessContent);

    // memory show requirements --user
    const showUserReqRes = execFileSync('node', [BIN_INSTALL_JS, 'memory', 'show', 'requirements', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.strictEqual(showUserReqRes, userReqContent);

    // memory show on nonexistent file throws exit code 1
    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, 'memory', 'show', '--user'], {
        encoding: 'utf8',
        env: getFakeEnv(path.join(fakeHome, 'nonexistent')),
        stdio: 'pipe'
      });
    });

    // Directory collision handling (EISDIR avoidance) on show and init
    const collisionDir = path.join(tmpDir, 'node-collision');
    fs.mkdirSync(path.join(collisionDir, '.grill-plan-team', 'REQUIREMENTS.md'), { recursive: true });
    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, 'memory', 'show', '--project', '-l', collisionDir], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });
    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, 'memory', 'init', '--project', '-l', collisionDir], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });

    // Unknown memory subcommand and unknown option rejection
    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, 'memory', 'unknown_cmd'], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });
    assert.throws(() => {
      execFileSync('node', [BIN_INSTALL_JS, 'memory', 'path', '--unknown-flag'], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });
  });

  test('install.sh memory subcommands (path, init, show)', () => {
    // memory path with standard flags and aliases
    const userPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userPathRes, path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md'));

    const userAssessPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', 'assessment', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userAssessPathRes, path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md'));

    const userReqPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', 'requirements', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userReqPathRes, path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md'));

    const userLegacyPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', 'legacy', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userLegacyPathRes, path.join(fakeHome, '.config', 'grill-plan-team', 'user-memory.md'));

    const userAliasPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '-user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    }).trim();
    assert.strictEqual(userAliasPathRes, userPathRes);

    const projPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projPathRes, path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md'));

    const projAssessPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', 'assessment', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projAssessPathRes, path.join(tmpDir, '.grill-plan-team', 'ASSESSMENT.md'));

    const projReqPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', 'requirements', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projReqPathRes, path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md'));

    const projLegacyPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', 'legacy', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projLegacyPathRes, path.join(tmpDir, '.grill-plan-team', 'project-memory.md'));

    const projAliasPathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--per-project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projAliasPathRes, projPathRes);

    const projSingleDashRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '-per-project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projSingleDashRes, projPathRes);

    const projShortAliasRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '-project'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(projShortAliasRes, projPathRes);

    // path with apostrophe/single quote and spaces
    const quoteDir = path.join(tmpDir, "alice's-project");
    const quotePathRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--project', '-l', quoteDir], {
      encoding: 'utf8'
    }).trim();
    assert.strictEqual(quotePathRes, path.join(quoteDir, '.grill-plan-team', 'REQUIREMENTS.md'));

    // empty and whitespace -l handling
    const emptyLRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--project', '-l', ''], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(emptyLRes, projPathRes);

    const whitespaceLRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--project', '-l', '   '], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(whitespaceLRes, projPathRes);

    // XDG_CONFIG_HOME with trailing slash
    const trailingXdgRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--user'], {
      encoding: 'utf8',
      env: { ...process.env, XDG_CONFIG_HOME: path.join(fakeHome, '.config') + '/' }
    }).trim();
    assert.strictEqual(trailingXdgRes, userPathRes);

    // relative -l path resolution parity including .. dot-dot
    const relSubRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--project', '-l', './subtest'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(relSubRes, path.join(tmpDir, 'subtest', '.grill-plan-team', 'REQUIREMENTS.md'));

    const relDotDotRes = execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--project', '-l', '../sibling'], {
      encoding: 'utf8',
      cwd: tmpDir
    }).trim();
    assert.strictEqual(relDotDotRes, path.resolve(tmpDir, '..', 'sibling', '.grill-plan-team', 'REQUIREMENTS.md'));

    // memory init --project
    const initProjRes = execFileSync('bash', [INSTALL_SH, 'memory', 'init', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.ok(initProjRes.includes('Initialized project memory'));
    const projAssessFile = path.join(tmpDir, '.grill-plan-team', 'ASSESSMENT.md');
    const projReqFile = path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md');
    assert.ok(fs.existsSync(projAssessFile));
    assert.ok(fs.existsSync(projReqFile));
    const projAssessContent = fs.readFileSync(projAssessFile, 'utf8');
    const projReqContent = fs.readFileSync(projReqFile, 'utf8');
    assert.ok(projAssessContent.includes('## Developer Role & Daily Work'));
    assert.ok(projReqContent.includes('## Guardrails & Safety'));
    assert.ok(projReqContent.includes('## Architectural Decision History'));

    // Test --force on memory init (preserves modified content without --force, overwrites with --force)
    fs.appendFileSync(projReqFile, '\n- Custom project note 123');
    const initAgainRes = execFileSync('bash', [INSTALL_SH, 'memory', 'init', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.ok(initAgainRes.includes('already exists'));
    assert.ok(fs.readFileSync(projReqFile, 'utf8').includes('Custom project note 123'));

    const initForceRes = execFileSync('bash', [INSTALL_SH, 'memory', 'init', '--project', '--force'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.ok(initForceRes.includes('Initialized project memory'));
    assert.ok(!fs.readFileSync(projReqFile, 'utf8').includes('Custom project note 123'));

    // memory show --project (defaults to REQUIREMENTS.md for project)
    const showProjRes = execFileSync('bash', [INSTALL_SH, 'memory', 'show', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.strictEqual(showProjRes, projReqContent);

    // memory show assessment --project
    const showProjAssessRes = execFileSync('bash', [INSTALL_SH, 'memory', 'show', 'assessment', '--project'], {
      encoding: 'utf8',
      cwd: tmpDir
    });
    assert.strictEqual(showProjAssessRes, projAssessContent);

    // memory init --user
    const initUserRes = execFileSync('bash', [INSTALL_SH, 'memory', 'init', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(initUserRes.includes('Initialized user memory'));
    const userAssessFile = path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md');
    const userReqFile = path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md');
    assert.ok(fs.existsSync(userAssessFile));
    assert.ok(fs.existsSync(userReqFile));
    const userAssessContent = fs.readFileSync(userAssessFile, 'utf8');
    const userReqContent = fs.readFileSync(userReqFile, 'utf8');
    assert.ok(userAssessContent.includes('## Developer Role & Daily Work'));
    assert.ok(userAssessContent.includes('## AI Experience & Proficiency'));
    assert.ok(userReqContent.includes('## Guardrails & Safety'));

    // memory show --user (defaults to ASSESSMENT.md for user)
    const showUserRes = execFileSync('bash', [INSTALL_SH, 'memory', 'show', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.strictEqual(showUserRes, userAssessContent);

    // memory show requirements --user
    const showUserReqRes = execFileSync('bash', [INSTALL_SH, 'memory', 'show', 'requirements', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.strictEqual(showUserReqRes, userReqContent);

    // memory show on nonexistent file throws exit code 1
    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, 'memory', 'show', '--user'], {
        encoding: 'utf8',
        env: getFakeEnv(path.join(fakeHome, 'nonexistent')),
        stdio: 'pipe'
      });
    });

    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, 'memory', 'show', '--project', '-l', path.join(tmpDir, 'nonexistent')], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });

    // Directory collision handling on show and init
    const collisionDir = path.join(tmpDir, 'bash-collision');
    fs.mkdirSync(path.join(collisionDir, '.grill-plan-team', 'REQUIREMENTS.md'), { recursive: true });
    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, 'memory', 'show', '--project', '-l', collisionDir], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });
    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, 'memory', 'init', '--project', '-l', collisionDir], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });

    // Unknown memory subcommand and unknown option rejection
    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, 'memory', 'unknown_cmd'], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });
    assert.throws(() => {
      execFileSync('bash', [INSTALL_SH, 'memory', 'path', '--unknown-flag'], {
        encoding: 'utf8',
        stdio: 'pipe'
      });
    });
  });

  test('install.sh and bin/install.js --dry-run --uninstall --purge parity', () => {
    // Set up user memory
    const userAssessMem = path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md');
    const userReqMem = path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md');
    execFileSync('node', [BIN_INSTALL_JS, 'memory', 'init', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(fs.existsSync(userAssessMem));
    assert.ok(fs.existsSync(userReqMem));

    // Dry-run uninstall with purge on node
    const nodeDryRes = execFileSync('node', [BIN_INSTALL_JS, '--uninstall', '--purge', '--dry-run'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(nodeDryRes.includes('[dry-run] Would purge:'), 'node CLI reports dry-run purge');
    assert.ok(fs.existsSync(userAssessMem), 'file preserved during dry-run');
    assert.ok(fs.existsSync(userReqMem), 'file preserved during dry-run');

    // Dry-run uninstall with purge on bash
    const bashDryRes = execFileSync('bash', [INSTALL_SH, '--uninstall', '--purge', '--dry-run'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(bashDryRes.includes('[dry-run] Would purge:'), 'install.sh reports dry-run purge');
    assert.ok(fs.existsSync(userAssessMem), 'file preserved during dry-run');
    assert.ok(fs.existsSync(userReqMem), 'file preserved during dry-run');
  });

  test('Auto-initialization on global install and preservation on uninstall without --purge', () => {
    const userAssessMem = path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md');
    const userReqMem = path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md');
    const userLegacyMem = path.join(fakeHome, '.config', 'grill-plan-team', 'user-memory.md');

    // Run global install with node CLI
    execFileSync('node', [BIN_INSTALL_JS, '--all'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(fs.existsSync(userAssessMem), 'ASSESSMENT.md was auto-initialized by bin/install.js');
    assert.ok(fs.existsSync(userReqMem), 'REQUIREMENTS.md was auto-initialized by bin/install.js');
    assert.ok(fs.existsSync(userLegacyMem), 'user-memory.md was auto-initialized by bin/install.js');

    // Append custom preference to user memory
    fs.appendFileSync(userAssessMem, '\n- Custom user preference 123');

    // Run uninstall without --purge
    execFileSync('node', [BIN_INSTALL_JS, '--uninstall'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(fs.existsSync(userAssessMem), 'ASSESSMENT.md was preserved during uninstall without --purge');
    assert.ok(fs.existsSync(userReqMem), 'REQUIREMENTS.md was preserved during uninstall without --purge');
    assert.ok(fs.readFileSync(userAssessMem, 'utf8').includes('Custom user preference 123'));

    // Run uninstall with --purge
    const nodePurgeRes = execFileSync('node', [BIN_INSTALL_JS, '--uninstall', '--purge'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(nodePurgeRes.includes(`Purged: ${userAssessMem}`), 'Node CLI logs Purged: <path>');
    assert.ok(!fs.existsSync(userAssessMem), 'ASSESSMENT.md was removed during uninstall with --purge');
    assert.ok(!fs.existsSync(userReqMem), 'REQUIREMENTS.md was removed during uninstall with --purge');

    // Repeat verification with install.sh
    execFileSync('bash', [INSTALL_SH, '--all'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(fs.existsSync(userAssessMem), 'ASSESSMENT.md was auto-initialized by install.sh');
    assert.ok(fs.existsSync(userReqMem), 'REQUIREMENTS.md was auto-initialized by install.sh');

    // Uninstall without --purge
    execFileSync('bash', [INSTALL_SH, '--uninstall'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(fs.existsSync(userAssessMem), 'ASSESSMENT.md was preserved by install.sh without --purge');
    assert.ok(fs.existsSync(userReqMem), 'REQUIREMENTS.md was preserved by install.sh without --purge');

    // Uninstall with --purge
    const bashPurgeRes = execFileSync('bash', [INSTALL_SH, '--uninstall', '--purge'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(bashPurgeRes.includes(`Purged: ${userAssessMem}`), 'install.sh logs Purged: <path>');
    assert.ok(!fs.existsSync(userAssessMem), 'ASSESSMENT.md was removed by install.sh with --purge');
    assert.ok(!fs.existsSync(userReqMem), 'REQUIREMENTS.md was removed by install.sh with --purge');
  });

  test('Local project uninstall preserves project memory files unless --purge is passed', () => {
    const projAssessMem = path.join(tmpDir, '.grill-plan-team', 'ASSESSMENT.md');
    const projReqMem = path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md');

    // Init project memory and install local harnesses with Node CLI
    execFileSync('node', [BIN_INSTALL_JS, 'memory', 'init', '--project', '-l', tmpDir]);
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all']);
    assert.ok(fs.existsSync(projAssessMem));
    assert.ok(fs.existsSync(projReqMem));
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')));

    // Uninstall without --purge (node)
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--uninstall']);
    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Harness files removed');
    assert.ok(fs.existsSync(projAssessMem), 'Project assessment memory preserved without --purge');
    assert.ok(fs.existsSync(projReqMem), 'Project requirements memory preserved without --purge');

    // Uninstall with --purge (node)
    const nodeProjPurgeRes = execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--uninstall', '--purge']);
    assert.ok(nodeProjPurgeRes.includes(`Purged: ${projAssessMem}`) || nodeProjPurgeRes.includes(`Purged: ${projReqMem}`));
    assert.ok(!fs.existsSync(projAssessMem), 'Project assessment memory removed with --purge');
    assert.ok(!fs.existsSync(projReqMem), 'Project requirements memory removed with --purge');

    // Re-test with install.sh
    execFileSync('bash', [INSTALL_SH, 'memory', 'init', '--project', '-l', tmpDir]);
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--all']);
    assert.ok(fs.existsSync(projAssessMem));
    assert.ok(fs.existsSync(projReqMem));
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')));

    // Uninstall without --purge (bash)
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--uninstall']);
    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Harness files removed');
    assert.ok(fs.existsSync(projAssessMem), 'Project assessment preserved by install.sh without --purge');
    assert.ok(fs.existsSync(projReqMem), 'Project requirements preserved by install.sh without --purge');

    // Uninstall with --purge (bash)
    const bashProjPurgeRes = execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--uninstall', '--purge']);
    assert.ok(bashProjPurgeRes.includes(`Purged: ${projAssessMem}`) || bashProjPurgeRes.includes(`Purged: ${projReqMem}`));
    assert.ok(!fs.existsSync(projAssessMem), 'Project assessment memory removed by install.sh with --purge');
    assert.ok(!fs.existsSync(projReqMem), 'Project requirements memory removed by install.sh with --purge');
  });

  test('assess command initializes ASSESSMENT.md and REQUIREMENTS.md in both Node and bash CLIs', () => {
    // Node CLI assess --user
    const nodeUserOut = execFileSync('node', [BIN_INSTALL_JS, 'assess', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(nodeUserOut.includes('[assess] Baseline memory initialized'));
    assert.ok(fs.existsSync(path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md')));
    assert.ok(fs.existsSync(path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md')));
    const nodeAssessText = fs.readFileSync(path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md'), 'utf8');
    assert.ok(nodeAssessText.includes('## Activation & Trigger Preference'));

    // Node CLI assess --project
    const nodeProjOut = execFileSync('node', [BIN_INSTALL_JS, 'assess', '--project', '-l', tmpDir], {
      encoding: 'utf8'
    });
    assert.ok(nodeProjOut.includes('[assess] Baseline memory initialized'));
    assert.ok(fs.existsSync(path.join(tmpDir, '.grill-plan-team', 'ASSESSMENT.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md')));

    // Bash CLI assess --user
    fs.rmSync(fakeHome, { recursive: true, force: true });
    fs.mkdirSync(fakeHome, { recursive: true });
    const bashUserOut = execFileSync('bash', [INSTALL_SH, 'assess', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(bashUserOut.includes('[assess] Baseline memory initialized'));
    assert.ok(fs.existsSync(path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md')));
    assert.ok(fs.existsSync(path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md')));
    const bashAssessText = fs.readFileSync(path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md'), 'utf8');
    assert.ok(bashAssessText.includes('## Activation & Trigger Preference'));

    // Bash CLI assess --project
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    const bashProjOut = execFileSync('bash', [INSTALL_SH, 'assess', '--project', '-l', tmpDir], {
      encoding: 'utf8'
    });
    assert.ok(bashProjOut.includes('[assess] Baseline memory initialized'));
    assert.ok(fs.existsSync(path.join(tmpDir, '.grill-plan-team', 'ASSESSMENT.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md')));
  });

  test('Legacy memory files automatically migrate to ASSESSMENT.md and REQUIREMENTS.md', () => {
    const legacyUserMem = path.join(fakeHome, '.config', 'grill-plan-team', 'user-memory.md');
    fs.mkdirSync(path.dirname(legacyUserMem), { recursive: true });
    fs.writeFileSync(legacyUserMem, '# Global User Memory (grill-plan-team)\n- Legacy setting', 'utf8');

    // Run memory init --user on Node CLI
    execFileSync('node', [BIN_INSTALL_JS, 'memory', 'init', '--user'], {
      encoding: 'utf8',
      env: getFakeEnv(fakeHome)
    });
    assert.ok(fs.existsSync(path.join(fakeHome, '.config', 'grill-plan-team', 'ASSESSMENT.md')));
    assert.ok(fs.existsSync(path.join(fakeHome, '.config', 'grill-plan-team', 'REQUIREMENTS.md')));

    // Project legacy migration on bash CLI
    const legacyProjMem = path.join(tmpDir, '.grill-plan-team', 'project-memory.md');
    fs.mkdirSync(path.dirname(legacyProjMem), { recursive: true });
    fs.writeFileSync(legacyProjMem, '# Local Project Memory (grill-plan-team)\n- Legacy proj convention', 'utf8');

    execFileSync('bash', [INSTALL_SH, 'memory', 'init', '--project', '-l', tmpDir], {
      encoding: 'utf8'
    });
    assert.ok(fs.existsSync(path.join(tmpDir, '.grill-plan-team', 'ASSESSMENT.md')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.grill-plan-team', 'REQUIREMENTS.md')));
  });
});

describe('7 Additional Coding Agent Harnesses Integration (12 Total)', () => {
  let tmpDir;
  let fakeHome;

  function getFakeEnv(homePath) {
    return {
      ...process.env,
      HOME: homePath,
      USERPROFILE: homePath,
      XDG_CONFIG_HOME: path.join(homePath, '.config')
    };
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-new-harness-'));
    fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gpt-new-fake-home-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    if (fakeHome && fs.existsSync(fakeHome)) fs.rmSync(fakeHome, { recursive: true, force: true });
  });

  test('CLI alias normalization for all 7 new harnesses in Node and Bash installers', () => {
    const aliasMap = [
      { alias: 'kimi-code', canonical: 'kimi' },
      { alias: 'hermes-agent', canonical: 'hermes' },
      { alias: 'pi-agent', canonical: 'pi' },
      { alias: 'oh-my-pi', canonical: 'omp' },
      { alias: 'openai-codex', canonical: 'codex' },
      { alias: 'grok-build', canonical: 'grok' }
    ];

    for (const item of aliasMap) {
      // Test Node CLI
      const testDirNode = path.join(tmpDir, `node-${item.canonical}`);
      fs.mkdirSync(testDirNode, { recursive: true });
      execFileSync('node', [BIN_INSTALL_JS, '--local', testDirNode, '--harness', item.alias]);
      assert.ok(fs.existsSync(path.join(testDirNode, `.${item.canonical}`, 'skills', 'grill-plan-team', 'SKILL.md')));
      assert.ok(fs.existsSync(path.join(testDirNode, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')));

      // Test Bash Installer
      const testDirBash = path.join(tmpDir, `bash-${item.canonical}`);
      fs.mkdirSync(testDirBash, { recursive: true });
      execFileSync('bash', [INSTALL_SH, '--local', testDirBash, '--harness', item.alias]);
      assert.ok(fs.existsSync(path.join(testDirBash, `.${item.canonical}`, 'skills', 'grill-plan-team', 'SKILL.md')));
      assert.ok(fs.existsSync(path.join(testDirBash, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')));
    }
  });

  test('Local install of individual new harness writes both dedicated path and .agents open standard', () => {
    const harnesses = ['kimi', 'hermes', 'pi', 'omp', 'opencode', 'codex', 'grok'];
    for (const harness of harnesses) {
      const subDir = path.join(tmpDir, harness);
      fs.mkdirSync(subDir, { recursive: true });
      execFileSync('node', [BIN_INSTALL_JS, '--local', subDir, '--harness', harness]);

      assert.ok(
        fs.existsSync(path.join(subDir, `.${harness}`, 'skills', 'grill-plan-team', 'SKILL.md')),
        `Dedicated .${harness} path exists`
      );
      assert.ok(
        fs.existsSync(path.join(subDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')),
        `.agents standard path exists for ${harness}`
      );

      // Verify clean uninstallation
      execFileSync('node', [BIN_INSTALL_JS, '--local', subDir, '--harness', harness, '--uninstall']);
      assert.ok(!fs.existsSync(path.join(subDir, `.${harness}`)), `.${harness} removed`);
      assert.ok(!fs.existsSync(path.join(subDir, '.agents')), '.agents removed');
      assert.strictEqual(fs.readdirSync(subDir).length, 0, `Clean directory for ${harness}`);
    }
  });

  test('Selective uninstallation preserves .agents standard when other agent harnesses remain (Node & Bash)', () => {
    // Test Node CLI
    const nodeDir = path.join(tmpDir, 'selective-node');
    fs.mkdirSync(nodeDir, { recursive: true });
    execFileSync('node', [BIN_INSTALL_JS, '--local', nodeDir, '--harness', 'kimi,hermes,opencode']);
    assert.ok(fs.existsSync(path.join(nodeDir, '.kimi', 'skills', 'grill-plan-team', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(nodeDir, '.hermes', 'skills', 'grill-plan-team', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(nodeDir, '.opencode', 'skills', 'grill-plan-team', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(nodeDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')));

    // Uninstall kimi
    execFileSync('node', [BIN_INSTALL_JS, '--local', nodeDir, '--harness', 'kimi', '--uninstall']);
    assert.ok(!fs.existsSync(path.join(nodeDir, '.kimi', 'skills', 'grill-plan-team', 'SKILL.md')), 'kimi removed');
    assert.ok(fs.existsSync(path.join(nodeDir, '.hermes', 'skills', 'grill-plan-team', 'SKILL.md')), 'hermes preserved');
    assert.ok(fs.existsSync(path.join(nodeDir, '.opencode', 'skills', 'grill-plan-team', 'SKILL.md')), 'opencode preserved');
    assert.ok(fs.existsSync(path.join(nodeDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')), '.agents preserved while hermes & opencode exist');

    // Uninstall hermes
    execFileSync('node', [BIN_INSTALL_JS, '--local', nodeDir, '--harness', 'hermes', '--uninstall']);
    assert.ok(!fs.existsSync(path.join(nodeDir, '.hermes', 'skills', 'grill-plan-team', 'SKILL.md')), 'hermes removed');
    assert.ok(fs.existsSync(path.join(nodeDir, '.opencode', 'skills', 'grill-plan-team', 'SKILL.md')), 'opencode preserved');
    assert.ok(fs.existsSync(path.join(nodeDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')), '.agents preserved while opencode exists');

    // Uninstall opencode (last agent harness)
    execFileSync('node', [BIN_INSTALL_JS, '--local', nodeDir, '--harness', 'opencode', '--uninstall']);
    assert.ok(!fs.existsSync(path.join(nodeDir, '.opencode', 'skills', 'grill-plan-team', 'SKILL.md')), 'opencode removed');
    assert.ok(!fs.existsSync(path.join(nodeDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')), '.agents removed when last agent harness uninstalled');
    assert.strictEqual(fs.readdirSync(nodeDir).length, 0, 'Clean directory after all uninstalled');

    // Test Bash script
    const bashDir = path.join(tmpDir, 'selective-bash');
    fs.mkdirSync(bashDir, { recursive: true });
    execFileSync('bash', [INSTALL_SH, '--local', bashDir, '--harness', 'kimi,hermes,opencode']);
    assert.ok(fs.existsSync(path.join(bashDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')));

    execFileSync('bash', [INSTALL_SH, '--local', bashDir, '--harness', 'kimi', '--uninstall']);
    assert.ok(!fs.existsSync(path.join(bashDir, '.kimi', 'skills', 'grill-plan-team', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(bashDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')), '.agents preserved by bash installer');

    execFileSync('bash', [INSTALL_SH, '--local', bashDir, '--harness', 'hermes,opencode', '--uninstall']);
    assert.ok(!fs.existsSync(path.join(bashDir, '.agents', 'skills', 'grill-plan-team', 'SKILL.md')), '.agents removed by bash installer on last agent uninstall');
    assert.strictEqual(fs.readdirSync(bashDir).length, 0, 'Clean directory after all uninstalled in bash');
  });

  test('Auto-detection discovers all 7 new harnesses via directory markers', () => {
    const { detectInstalledHarnesses } = require('../bin/install.js');
    const markers = [
      { dir: '.kimi', harness: 'kimi' },
      { dir: '.hermes', harness: 'hermes' },
      { dir: '.pi', harness: 'pi' },
      { dir: '.omp', harness: 'omp' },
      { dir: path.join('.config', 'opencode'), harness: 'opencode' },
      { dir: '.codex', harness: 'codex' },
      { dir: '.grok', harness: 'grok' }
    ];

    for (const marker of markers) {
      const harnessHome = fs.mkdtempSync(path.join(os.tmpdir(), `gpt-detect-${marker.harness}-`));
      fs.mkdirSync(path.join(harnessHome, marker.dir), { recursive: true });
      const detected = detectInstalledHarnesses(harnessHome);
      assert.ok(detected.includes(marker.harness), `Detected ${marker.harness} via ${marker.dir}`);
      fs.rmSync(harnessHome, { recursive: true, force: true });
    }
  });

  test('Simulated global install and uninstall for new harnesses (Node & Bash)', () => {
    // Node CLI global install
    execFileSync('node', [BIN_INSTALL_JS, '--harness', 'kimi,pi,opencode'], {
      env: getFakeEnv(fakeHome)
    });

    const expectedKimi = path.join(fakeHome, '.kimi', 'skills', 'grill-plan-team', 'SKILL.md');
    const expectedPi = path.join(fakeHome, '.pi', 'agent', 'skills', 'grill-plan-team', 'SKILL.md');
    const expectedOpencode = path.join(fakeHome, '.config', 'opencode', 'skills', 'grill-plan-team', 'SKILL.md');

    assert.ok(fs.existsSync(expectedKimi), 'Global Kimi skill installed');
    assert.ok(fs.existsSync(expectedPi), 'Global Pi skill installed in .pi/agent/skills/...');
    assert.ok(fs.existsSync(expectedOpencode), 'Global OpenCode skill installed in .config/opencode/skills/...');

    // Node CLI global uninstall
    execFileSync('node', [BIN_INSTALL_JS, '--harness', 'kimi,pi,opencode', '--uninstall'], {
      env: getFakeEnv(fakeHome)
    });

    assert.ok(!fs.existsSync(expectedKimi), 'Global Kimi skill uninstalled');
    assert.ok(!fs.existsSync(expectedPi), 'Global Pi skill uninstalled');
    assert.ok(!fs.existsSync(expectedOpencode), 'Global OpenCode skill uninstalled');

    // Bash script global install
    execFileSync('bash', [INSTALL_SH, '--harness', 'kimi,pi,opencode'], {
      env: getFakeEnv(fakeHome)
    });

    assert.ok(fs.existsSync(expectedKimi), 'Bash global Kimi skill installed');
    assert.ok(fs.existsSync(expectedPi), 'Bash global Pi skill installed in .pi/agent/skills/...');
    assert.ok(fs.existsSync(expectedOpencode), 'Bash global OpenCode skill installed in .config/opencode/skills/...');

    // Bash script global uninstall
    execFileSync('bash', [INSTALL_SH, '--harness', 'kimi,pi,opencode', '--uninstall'], {
      env: getFakeEnv(fakeHome)
    });

    assert.ok(!fs.existsSync(expectedKimi), 'Bash global Kimi skill uninstalled');
    assert.ok(!fs.existsSync(expectedPi), 'Bash global Pi skill uninstalled');
    assert.ok(!fs.existsSync(expectedOpencode), 'Bash global OpenCode skill uninstalled');
  });
});



