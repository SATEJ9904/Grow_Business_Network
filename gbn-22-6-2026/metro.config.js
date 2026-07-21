const fs = require('fs');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// On Windows, __dirname can carry whatever drive-letter case the shell used
// to launch the process (e.g. lowercase "d:\..." from Git Bash), while
// Watchman/the OS report the real case (e.g. "D:\..."). Metro's Haste file
// map is a case-sensitive lookup, so a mismatch here makes Metro fail to
// resolve files (including the entry ./index, or node_modules polyfills
// pulled in by @react-native/metro-config) that genuinely exist on disk.
// Normalizing to the native, correctly-cased path keeps Metro and Watchman
// in agreement regardless of which terminal/case starts the packager.
const projectRoot = fs.realpathSync.native(__dirname);

// Requiring @react-native/metro-config via a bare specifier would resolve
// relative to this file's own (possibly wrongly-cased) __dirname, and every
// require it does internally (js-polyfills, the babel transformer,
// asyncRequire) would inherit that wrong case too. Resolving it starting
// from the already-corrected projectRoot (still going through Node's normal
// resolution so the package's "exports" map is honored) fixes the case for
// that whole subtree.
const metroConfigEntry = require.resolve('@react-native/metro-config', {
  paths: [projectRoot],
});
const { getDefaultConfig, mergeConfig } = require(metroConfigEntry);

const config = {
  projectRoot,
  watchFolders: [projectRoot],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
