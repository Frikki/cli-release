#!/usr/bin/env node

'use strict';

require('shelljs/global');
var execSync = require('child_process').execSync;

function isDirectoryClean() {
  var fatalState = config.fatal;
  config.fatal = false;
  var isUnstagedChanges = exec('git diff --exit-code', {silent:true}).code;
  var isStagedChanged =
    exec('git diff --cached --exit-code', {silent:true}).code;
  config.fatal = fatalState;

  return !(isUnstagedChanges || isStagedChanged);
}

function prerelease() {
  if (!isDirectoryClean()) {
    echo('RELEASE ERROR: Working directory must be clean to push release!');
    exit(1);
  }
}

function bump(version) {
  execSync('npm --no-git-tag-version version ' + version);
}

function changelog(releaseVersion, fileName) {
  var changelogFileName = fileName || 'CHANGELOG.md';
  execSync('touch ' + changelogFileName);
  execSync('$(npm bin)/changelog ' + releaseVersion + ' CHANGELOG.tmp');
  cat('CHANGELOG.tmp', changelogFileName).to('CHANGELOG.md.tmp');
  rm('CHANGELOG.tmp');
  rm(changelogFileName);
  mv('CHANGELOG.md.tmp', changelogFileName);
}

function commit(releaseVersion) {
  execSync('git add -A');
  execSync('git commit -m "chore(release): ' + releaseVersion + '"');
  execSync('git tag -f ' + releaseVersion);
  execSync('git push origin HEAD --tags');
}

function release(version, fileName) {
  prerelease();
  bump(version);
  var releaseVersion = 'v' + require(process.cwd() + '/package.json').version;
  changelog(releaseVersion, fileName);
  commit(releaseVersion);
}

release(process.argv[2], process.argv[3]);
