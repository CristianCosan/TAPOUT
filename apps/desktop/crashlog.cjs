// The crash log (plan M22): errors from the game and the shell, appended to crash.log in the
// user-data folder (%APPDATA%\TAP OUT on Windows) so a broken run can be looked at afterwards.
// Kept small: when it passes the limit, only the newer half is kept.
const fs = require('node:fs');
const path = require('node:path');

const LIMIT = 256 * 1024;

function createCrashLog(root, version) {
  const file = path.join(root, 'crash.log');
  return {
    file,
    write(source, text) {
      try {
        fs.mkdirSync(root, { recursive: true });
        const line = `[${new Date().toISOString()}] ${version} ${source}: ${String(text).slice(0, 8000)}\n`;
        fs.appendFileSync(file, line);
        const size = fs.statSync(file).size;
        if (size > LIMIT) {
          const kept = fs.readFileSync(file, 'utf8').slice(-Math.floor(LIMIT / 2));
          fs.writeFileSync(file, kept.slice(kept.indexOf('\n') + 1));
        }
        return true;
      } catch {
        return false;
      }
    },
  };
}

module.exports = { createCrashLog };
