#!/usr/bin/env node

/**
 * Version management utility for Fallout PIP-Boy app
 * 
 * Usage:
 *   node scripts/version.js                    # Show current version
 *   node scripts/version.js --next-alpha       # Increment alpha major
 *   node scripts/version.js --build 123        # Set specific build number
 *   node scripts/version.js --beta             # Move to beta
 *   node scripts/version.js --release          # Move to release
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PACKAGE_JSON_PATH = './package.json';

const readPackageJson = () => JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));

const writePackageJson = packageData => {
  writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageData, null, 2) + '\n');
};

const parseVersion = version => {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^.]+)(?:\.(\d+))?)?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  
  const [, major, minor, patch, prerelease, prereleaseNumber] = match;
  return {
    major: parseInt(major),
    minor: parseInt(minor),
    patch: parseInt(patch),
    prerelease: prerelease || null,
    prereleaseNumber: prereleaseNumber ? parseInt(prereleaseNumber) : null
  };
};

const formatVersion = ({ major, minor, patch, prerelease, prereleaseNumber }) => {
  let version = `${major}.${minor}.${patch}`;
  if (prerelease) {
    version += `-${prerelease}`;
    if (prereleaseNumber !== null) {
      version += `.${prereleaseNumber}`;
    }
  }
  return version;
};

const showCurrentVersion = () => {
  const pkg = readPackageJson();
  const parsed = parseVersion(pkg.version);
  
  console.log('📦 Current Version Information:');
  console.log(`   Package: ${pkg.version}`);
  console.log(`   Alpha Milestone: ${parsed.patch}`);
  console.log(`   Build: ${parsed.prereleaseNumber || 0}`);
  console.log(`   Stage: ${parsed.prerelease || 'release'}`);
};

const incrementAlphaMajor = () => {
  const pkg = readPackageJson();
  const parsed = parseVersion(pkg.version);

  const newVersion = formatVersion({
    major: 0,                    // Keep at 0 for alpha phase
    minor: 0,                    // Keep at 0 for alpha phase
    patch: parsed.patch + 1,     // Increment patch for alpha milestones
    prerelease: 'alpha',
    prereleaseNumber: 0
  });

  pkg.version = newVersion;
  writePackageJson(pkg);

  console.log(`🚀 Incremented alpha milestone: ${pkg.version}`);
};

const setBuildNumber = buildNumber => {
  const pkg = readPackageJson();
  const parsed = parseVersion(pkg.version);
  
  if (!parsed.prerelease) {
    throw new Error('Can only set build number for pre-release versions');
  }
  
  const newVersion = formatVersion({
    ...parsed,
    prereleaseNumber: parseInt(buildNumber)
  });
  
  pkg.version = newVersion;
  writePackageJson(pkg);
  
  console.log(`🔢 Set build number: ${pkg.version}`);
};

const moveToBeta = () => {
  const pkg = readPackageJson();
  const parsed = parseVersion(pkg.version);

  const newVersion = formatVersion({
    major: 0,
    minor: 1,        // Move to 0.1.0 for beta
    patch: 0,        // Reset patch for beta
    prerelease: 'beta',
    prereleaseNumber: 0
  });

  pkg.version = newVersion;
  writePackageJson(pkg);

  console.log(`🧪 Moved to beta: ${pkg.version}`);
};

const moveToRelease = () => {
  const pkg = readPackageJson();
  const parsed = parseVersion(pkg.version);

  const newVersion = formatVersion({
    major: 1,        // Move to 1.0.0 for stable release
    minor: 0,
    patch: 0,
    prerelease: null,
    prereleaseNumber: null
  });

  pkg.version = newVersion;
  writePackageJson(pkg);

  console.log(`🎉 Moved to release: ${pkg.version}`);
};

// Parse command line arguments
const args = process.argv.slice(2);

try {
  if (args.length === 0) {
    showCurrentVersion();
  } else if (args[0] === '--next-alpha') {
    incrementAlphaMajor();
  } else if (args[0] === '--build' && args[1]) {
    setBuildNumber(args[1]);
  } else if (args[0] === '--beta') {
    moveToBeta();
  } else if (args[0] === '--release') {
    moveToRelease();
  } else {
    console.log('❌ Invalid arguments. Usage:');
    console.log('   node scripts/version.js                    # Show current version');
    console.log('   node scripts/version.js --next-alpha       # Increment alpha major');
    console.log('   node scripts/version.js --build 123        # Set specific build number');
    console.log('   node scripts/version.js --beta             # Move to beta');
    console.log('   node scripts/version.js --release          # Move to release');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
