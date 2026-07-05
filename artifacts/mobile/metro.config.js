const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase Firestore creates temporary `_tmp_NNN` directories during
// compilation that Metro watches and then fails with ENOENT when they
// are deleted. Block them to prevent crashes.
config.resolver.blockList = [/.*_tmp_.*/];

module.exports = config;
