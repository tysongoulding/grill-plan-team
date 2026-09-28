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
    assert.ok(skillContent.includes('Phase 3: Multi-Agent Swarm Handoff (Teamwork Preview)'));
  });

  test('Antigravity rules/AGENTS.md exists and contains phase governance', () => {
    const rulesPath = path.join(REPO_ROOT, 'rules', 'AGENTS.md');
    assert.ok(fs.existsSync(rulesPath), 'rules/AGENTS.md exists');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    assert.ok(rulesContent.includes('Phase 1: Interactive Alignment (Grill-Me)'));
    assert.ok(rulesContent.includes('Phase 2: Technical Design & Verification (Plan)'));
    assert.ok(rulesContent.includes('Phase 3: Multi-Agent Swarm Handoff (Teamwork Preview)'));
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

  test('templates directory contains all required harness templates', () => {
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'templates', 'antigravity', 'plugin.json')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'templates', 'claude', 'commands', 'grill-plan-team.md')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'templates', 'cursor', '.cursorrules')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'templates', 'windsurf', '.windsurfrules')));
    assert.ok(fs.existsSync(path.join(REPO_ROOT, 'templates', 'roo', '.roomodes')));
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
    assert.ok(fs.existsSync(path.join(tmpDir, '.grill-plan-team-manifest.json')), 'Manifest created');
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

  test('install.sh incremental install merges manifest files and harnesses', () => {
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'claude'], { encoding: 'utf8' });

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.grill-plan-team-manifest.json'), 'utf8'));
    assert.ok(manifest.harnesses.includes('cursor'), 'Manifest contains cursor');
    assert.ok(manifest.harnesses.includes('claude'), 'Manifest contains claude');
    assert.strictEqual(manifest.harnesses.length, 2);
    assert.strictEqual(manifest.installedFiles.length, 4);
  });

  test('install.sh selective uninstall updates manifest and removes manifest when last harness is uninstalled', () => {
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'claude'], { encoding: 'utf8' });

    // Remove claude
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'claude', '--uninstall'], { encoding: 'utf8' });
    let manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.grill-plan-team-manifest.json'), 'utf8'));
    assert.deepStrictEqual(manifest.harnesses, ['cursor']);
    assert.strictEqual(manifest.installedFiles.length, 2);

    // Remove cursor
    execFileSync('bash', [INSTALL_SH, '--local', tmpDir, '--harness', 'cursor', '--uninstall'], { encoding: 'utf8' });
    assert.ok(!fs.existsSync(path.join(tmpDir, '.grill-plan-team-manifest.json')), 'Manifest removed');
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

  test('bin/install.js --local runs with auto-detection without hanging', () => {
    // Should complete cleanly and not hang waiting on interactive stdin
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.grill-plan-team-manifest.json')));
  });

  test('bin/install.js supports selective uninstallation of single harness and updates manifest', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--all'], { encoding: 'utf8' });
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursorrules')));
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')));

    // Selective uninstall of cursor
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'cursor', '--uninstall'], { encoding: 'utf8' });

    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursorrules')), 'Cursor rules removed');
    assert.ok(!fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'grill-plan-team.mdc')), 'Cursor MDC removed');
    assert.ok(fs.existsSync(path.join(tmpDir, '.roomodes')), 'Roo modes preserved');

    // Manifest should still exist and not have cursor
    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.grill-plan-team-manifest.json'), 'utf8'));
    assert.ok(!manifest.harnesses.includes('cursor'), 'Manifest removed cursor');
    assert.ok(manifest.harnesses.includes('roo'), 'Manifest preserved roo');
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
        env: { ...process.env, HOME: fakeHome }
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
        env: { ...process.env, HOME: fakeHome }
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

  test('bin/install.js incremental install merges manifest files and harnesses', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'claude'], { encoding: 'utf8' });

    const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, '.grill-plan-team-manifest.json'), 'utf8'));
    assert.ok(manifest.harnesses.includes('cursor'), 'Manifest contains cursor');
    assert.ok(manifest.harnesses.includes('claude'), 'Manifest contains claude');
    assert.strictEqual(manifest.harnesses.length, 2);
    assert.strictEqual(manifest.installedFiles.length, 4);
  });

  test('bin/install.js selective uninstall removes manifest when last harness is uninstalled', () => {
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'cursor'], { encoding: 'utf8' });
    execFileSync('node', [BIN_INSTALL_JS, '--local', tmpDir, '--harness', 'cursor', '--uninstall'], { encoding: 'utf8' });

    assert.ok(!fs.existsSync(path.join(tmpDir, '.grill-plan-team-manifest.json')), 'Manifest removed');
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
      '.clinerules'
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

  test('install.sh and bin/install.js produce matching manifest structures', () => {
    execFileSync('bash', [INSTALL_SH, '--local', shDir, '--all'], { encoding: 'utf8' });
    execFileSync('node', [BIN_INSTALL_JS, '--local', nodeDir, '--all'], { encoding: 'utf8' });

    const shManifest = JSON.parse(fs.readFileSync(path.join(shDir, '.grill-plan-team-manifest.json'), 'utf8'));
    const nodeManifest = JSON.parse(fs.readFileSync(path.join(nodeDir, '.grill-plan-team-manifest.json'), 'utf8'));

    assert.strictEqual(shManifest.version, nodeManifest.version);
    assert.deepStrictEqual(shManifest.harnesses.sort(), nodeManifest.harnesses.sort());
    assert.strictEqual(shManifest.installedFiles.length, nodeManifest.installedFiles.length);
  });
});

