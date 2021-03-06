#!/usr/bin/env node

'use strict';

require('shelljs/global');
var execSync = require('child_process').execSync;

var changelogExecPath = '/node_modules/.bin/changelog';

function isDirectoryClean() {
  var fatalState = config.fatal;
  config.fatal = false;
  var isUnstagedChanges = exec('git diff --exit-code', {silent:true}).code;
  var isStagedChanged =
    exec('git diff --cached --exit-code', {silent:true}).code;
  config.fatal = fatalState;

  return !(isUnstagedChanges || isStagedChanged);
}

function existChangelogBinary() {
  var testPath = process.cwd() + changelogExecPath;
  if (test('-f', testPath)) {
    changelogExecPath = testPath;
    return true;
  }
  testPath = __dirname + '/..' + changelogExecPath;
  if (test('-f', testPath)) {
    changelogExecPath = testPath;
    return true;
  }
  return false
}

function prerelease() {
  if (!isDirectoryClean()) {
    echo('RELEASE ERROR: Working directory must be clean to push release!');
    exit(1);
  }
  if (!existChangelogBinary()) {
    echo('RELEASE ERROR: changelog binary cannot be found!');
    exit(1);
  }
}

function bump(version) {
  execSync('npm --no-git-tag-version version ' + version);
}

function changelog(releaseVersion, fileName) {
  var changelogFileName = fileName || 'CHANGELOG.md';
  execSync('touch ' + changelogFileName);
  execSync('node ' + changelogExecPath + ' ' + releaseVersion + ' CHANGELOG.tmp');
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
