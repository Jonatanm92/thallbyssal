import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("agent orchestration standard keeps AGENTS as canonical source", () => {
  const agents = readRepoFile("AGENTS.md");

  assert.match(agents, /## Agent Orchestration Standard/);
  assert.match(agents, /`AGENTS\.md` is the canonical rule source/);
  assert.match(agents, /`CLAUDE\.md`/);
  assert.match(agents, /`program\.md`/);
  assert.match(agents, /Durable agent rules must be backed by tests or explicit evidence/);
});

test("Claude and program entrypoints redirect to canonical governance", () => {
  const claude = readRepoFile("CLAUDE.md");
  const program = readRepoFile("program.md");

  assert.match(claude, /Read `AGENTS\.md` first/);
  assert.match(claude, /Read `program\.md`/);
  assert.match(claude, /Do not touch product DSP/);
  assert.match(program, /AGENTS\.md/);
  assert.match(program, /Strict Current Best source parity is blocked/);
  assert.match(program, /Do not claim source parity/);
});

test("multi-agent setup guide includes safe Claude prompts and owner gates", () => {
  const guide = readRepoFile("docs/AI_AGENT_ORCHESTRATION_SETUP.md");

  assert.match(guide, /Good First Prompt For Claude Code/);
  assert.match(guide, /Safe Autopilot Prompt/);
  assert.match(guide, /Review Prompt/);
  assert.match(guide, /Do not modify DSP/);
  assert.match(guide, /owner-gated/);
});
