#!/usr/bin/env node
/**
 * Wrapper that runs Hardhat programmatically, bypassing the interactive
 * telemetry consent prompt that blocks CI on first run.
 *
 * Usage:  node scripts/run-hardhat.js compile
 *         node scripts/run-hardhat.js test
 */
"use strict";

process.env.HARDHAT_TELEMETRY_ENABLED = "false";
process.env.DO_NOT_TRACK = "1";

// Pre-write the telemetry consent so Hardhat never asks interactively
const fs   = require("fs");
const path = require("path");
const os   = require("os");

const configDir = path.join(os.homedir(), "AppData", "Roaming", "hardhat-nodejs", "Config");
const promptFile = path.join(configDir, "extension-prompt.json");

try {
  if (fs.existsSync(promptFile)) {
    const existing = JSON.parse(fs.readFileSync(promptFile, "utf8"));
    // Only write if the telemetry key isn't already set
    if (!existing.telemetry && !existing["telemetry-v2"]) {
      existing["telemetry-v2"] = false;
      existing.telemetry = false;
      fs.writeFileSync(promptFile, JSON.stringify(existing, null, 2));
    }
  }
} catch (_) {
  // Non-fatal — continue anyway
}

// Now delegate to Hardhat's actual CLI
require("hardhat/internal/cli/cli.js");
