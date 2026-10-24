"""Records Dan's thoughts (D-067) with the Kokoro voice model, one .ogg per line.

A voice model reads a whole paragraph in one breath and barely stops at commas. So each line
is recorded the way an actor would be directed: sentence by sentence, every sentence ending on
its own fall, the pauses at commas stretched, real beats between phrases where the line is
marked ( / and // ), a soft breath where it says ~, and the whole line a little slower than
speech. Then a gentle "inside the head" colour: no rumble, softened top, even loudness.

Setup, once (free; Kokoro-82M is Apache-2.0):
  python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
  download kokoro-v1.0.onnx and voices-v1.0.bin from
  https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
Then:
  npm run voice:lines -- /tmp/lines.json
  .venv/bin/python scripts/voice/render.py --model DIR --lines /tmp/lines.json --out apps/game/public/voice
Lines whose words have not changed are skipped (manifest.json holds a hash per line).
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import tempfile

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

RENDER_VERSION = 2
VOICE = 'am_michael'
SR = 24000
SPEED = 0.88          # a thought is slower than speech
LAST_SLOWER = 0.03    # the last sentence of a line slows a little more
GAP_SENTENCE = 0.45
GAP_BEAT = 0.55       # ' / '
GAP_LONG = 1.05       # ' // '
COMMA_MIN = 0.30      # every pause the model leaves inside a sentence is at least this long
LEAD, TAIL = 0.12, 0.40
TARGET_RMS_DB = -21.0
ALOUD_SPEED = 0.95    # said to the camera: out loud, closer to normal speech
ALOUD_RMS_DB = -19.0


def tokens(say):
    """The line as a list of ('text', s) | ('beat', seconds) | ('breath', None)."""
    out = []
    for part in re.split(r'(\s//\s|\s/\s|~)', say):
        if part is None or part == '':
            continue
        if part.strip() == '//':
            out.append(('beat', GAP_LONG))
        elif part.strip() == '/':
            out.append(('beat', GAP_BEAT))
        elif part == '~':
            out.append(('breath', None))
        elif part.strip():
            for i, sentence in enumerate(re.split(r'(?<=[.!?])\s+', part.strip())):
                if i:
                    out.append(('beat', GAP_SENTENCE))
                out.append(('text', sentence))
    return out


def trim(a, floor=0.012, pad=0.03):
    idx = np.where(np.abs(a) > floor * max(1e-6, np.abs(a).max()) * 4)[0]
    if len(idx) == 0:
        return a
    p = int(pad * SR)
    return a[max(0, idx[0] - p): idx[-1] + p]


def stretch_pauses(a):
    """Finds the short dips the model leaves at commas and lets them breathe."""
    fr = int(0.01 * SR)
    n = len(a) // fr
    if n < 10:
        return a
    peak = np.abs(a).max()
    quiet = [np.sqrt((a[i * fr:(i + 1) * fr] ** 2).mean()) < 0.02 * peak for i in range(n)]
    out, i, last = [], 0, 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            run = (j - i) * 0.01
            # Inside the sentence only, and long enough to be a real pause, not a stop consonant.
            if i > 8 and j < n - 8 and run >= 0.12 and run < COMMA_MIN:
                mid = (i + j) // 2 * fr
                out.append(a[last:mid])
                out.append(np.zeros(int((COMMA_MIN - run) * SR), dtype=a.dtype))
                last = mid
            i = j
        else:
            i += 1
    out.append(a[last:])
    return np.concatenate(out)


def breath(rng):
    """A soft breath in through the nose: shaped, band-limited noise."""
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    noise = rng.standard_normal(n + 512)
    spec = np.fft.rfft(noise)
    f = np.fft.rfftfreq(len(noise), 1 / SR)
    band = np.exp(-((np.log(np.maximum(f, 1)) - np.log(1300)) ** 2) / (2 * 0.55 ** 2))
    shaped = np.fft.irfft(spec * band)[:n]
    env = np.sin(np.pi * np.clip(t / 0.30, 0, 1) / 2) ** 2 * np.clip((0.42 - t) / 0.12, 0, 1)
    b = shaped * env
    return (b / (np.abs(b).max() + 1e-9) * 0.035).astype(np.float32)


def colour(a, aloud=False):
    """Inside the head: cut the rumble below 90 Hz, soften above 7 kHz, even loudness.
    Out loud (to the camera): the full top end, a little louder."""
    spec = np.fft.rfft(a)
    f = np.fft.rfftfreq(len(a), 1 / SR)
    hp = 1 / (1 + (90 / np.maximum(f, 1)) ** 4)
    lp = 1 if aloud else 1 / (1 + (f / 7000) ** 4)
    a = np.fft.irfft(spec * hp * lp, n=len(a))
    rms = np.sqrt((a[np.abs(a) > 0.01 * np.abs(a).max()] ** 2).mean())
    a = a * (10 ** ((ALOUD_RMS_DB if aloud else TARGET_RMS_DB) / 20) / max(rms, 1e-9))
    peak = np.abs(a).max()
    if peak > 0.89:
        a = a * (0.89 / peak)
    return a.astype(np.float32)


def fade(a, s=0.008):
    n = min(int(s * SR), len(a) // 2)
    if n > 0:
        a = a.copy()
        a[:n] *= np.linspace(0, 1, n)
        a[-n:] *= np.linspace(1, 0, n)
    return a


def record(k, line):
    aloud = line.get('style') == 'aloud'
    speed = line.get('speed') or (ALOUD_SPEED if aloud else SPEED)
    toks = tokens(line['say'])
    last_text = max(i for i, t in enumerate(toks) if t[0] == 'text')
    rng = np.random.default_rng(int(hashlib.sha1(line['id'].encode()).hexdigest()[:8], 16))
    parts = [np.zeros(int(LEAD * SR), np.float32)]
    for i, (kind, val) in enumerate(toks):
        if kind == 'beat':
            parts.append(np.zeros(int(val * SR), np.float32))
        elif kind == 'breath':
            parts.append(breath(rng))
            parts.append(np.zeros(int(0.10 * SR), np.float32))
        else:
            s = speed - (LAST_SLOWER if i == last_text else 0)
            a, sr = k.create(val, voice=VOICE, speed=s, lang='en-us')
            assert sr == SR
            parts.append(fade(stretch_pauses(trim(a.astype(np.float32)))))
    parts.append(np.zeros(int(TAIL * SR), np.float32))
    return colour(np.concatenate(parts), aloud)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--lines', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--only', nargs='*')
    args = ap.parse_args()
    k = Kokoro(os.path.join(args.model, 'kokoro-v1.0.onnx'), os.path.join(args.model, 'voices-v1.0.bin'))
    lines = json.load(open(args.lines))
    os.makedirs(args.out, exist_ok=True)
    man_path = os.path.join(args.out, 'manifest.json')
    manifest = json.load(open(man_path)) if os.path.exists(man_path) else {}
    keep = set()
    for line in lines:
        keep.add(line['id'])
        h = hashlib.sha1(json.dumps([RENDER_VERSION, VOICE, line['say'], line.get('speed')] + ([line['style']] if line.get('style') else [])).encode()).hexdigest()[:12]
        target = os.path.join(args.out, line['id'] + '.ogg')
        if args.only and line['id'] not in args.only:
            continue
        if not args.only and manifest.get(line['id'], {}).get('hash') == h and os.path.exists(target):
            continue
        audio = record(k, line)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            sf.write(tmp.name, audio, SR)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-ac', '1', '-c:a', 'libopus', '-b:a', '32k', target], check=True)
        os.unlink(tmp.name)
        manifest[line['id']] = {'hash': h, 'seconds': round(len(audio) / SR, 2)}
        print(line['id'], manifest[line['id']]['seconds'], 's')
    for gone in [i for i in manifest if i not in keep]:
        del manifest[gone]
        if os.path.exists(os.path.join(args.out, gone + '.ogg')):
            os.unlink(os.path.join(args.out, gone + '.ogg'))
    json.dump(dict(sorted(manifest.items())), open(man_path, 'w'), indent=1)


if __name__ == '__main__':
    main()
