// The save store behind the game's localStorage-shaped API (plan §10.2): one small JSON file per
// key under the user-data folder, %APPDATA%\TAP OUT on Windows. Run saves go in saves\, the rest
// (profile.json for run history) at the top. Writes go to a temporary file first and are renamed
// over the old one, so a crash mid-write never leaves a half-written save.
const fs = require('node:fs');
const path = require('node:path');

const KEY = /^tapout\.([a-z0-9]+(?:\.[a-z0-9]+)*)$/;

function createStore(root) {
  const fileFor = (key) => {
    const m = KEY.exec(String(key));
    if (!m) return null;
    const name = m[1] === 'history' ? 'profile' : m[1];
    return name.startsWith('run') ? path.join(root, 'saves', `${name}.json`) : path.join(root, `${name}.json`);
  };
  return {
    fileFor,
    get(key) {
      const file = fileFor(key);
      try {
        return file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      const file = fileFor(key);
      if (!file) return false;
      try {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        const tmp = `${file}.tmp`;
        const fd = fs.openSync(tmp, 'w');
        fs.writeSync(fd, String(value));
        fs.fsyncSync(fd);
        fs.closeSync(fd);
        fs.renameSync(tmp, file);
        return true;
      } catch (error) {
        console.error('Save failed', error);
        return false;
      }
    },
    remove(key) {
      const file = fileFor(key);
      try {
        if (file) fs.rmSync(file, { force: true });
      } catch (error) {
        console.error('Delete failed', error);
      }
      return true;
    },
  };
}

module.exports = { createStore };
