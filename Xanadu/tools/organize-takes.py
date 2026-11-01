#!/usr/bin/env python3
"""Organize ~/Desktop/Studio/Episode Files/02 - Episode Library into takes: every render of an episode lives in <episode>/takes/<Title> - Take NN.mp4 (chronological),
a <Title> - Thumbnail.jpg (the newest take's first frame) sits in the episode folder, and there is NO "- FINAL.mp4" until one take is
chosen (then it is copied to <Title> - FINAL.mp4). Idempotent: run it any time. Course material, promos and tests are left alone."""
import os, re, subprocess, sys, shutil
ROOT = os.path.expanduser('~/Desktop/Studio/Episode Files/02 - Episode Library'); FF = '/Users/chris/Desktop/Azure 104/studio/node_modules/ffmpeg-static/ffmpeg'
SKIP = {'Cloud Shift - AZ-104 course', 'Countdown to Strange', 'Promo'}
def mtime(p): return os.path.getmtime(p)
def thumb(video, out):
    subprocess.run([FF, '-v', 'error', '-y', '-i', video, '-vf', 'select=eq(n\\,0)', '-frames:v', '1', '-q:v', '2', out], check=True)
changed = []
def series_dirs():
    for ch in sorted(os.listdir(ROOT)):
        cdir = os.path.join(ROOT, ch)
        if not os.path.isdir(cdir) or ch in SKIP: continue
        if ch.startswith('Channel '):
            for sr in sorted(os.listdir(cdir)):
                if os.path.isdir(os.path.join(cdir, sr)): yield f'{ch}/{sr}', os.path.join(cdir, sr)
        else: yield ch, cdir
for series, sdir in series_dirs():
    for ep in sorted(os.listdir(sdir)):
        edir = os.path.join(sdir, ep)
        if not os.path.isdir(edir) or not re.match(r'^\d\d - ', ep): continue
        takes = os.path.join(edir, 'takes'); os.makedirs(takes, exist_ok=True)
        # 1. collect every render: older versions (v1, v2 … or "v1 - description") then the current FINAL, grouped by base name (cut)
        groups = {}
        old = os.path.join(edir, 'older versions')
        if os.path.isdir(old):
            for f in sorted(os.listdir(old)):
                if not f.endswith('.mp4'): continue
                m = re.match(r'^(.*) - v(\d+)\.mp4$', f); m2 = re.match(r'^v(\d+) - (.*)\.mp4$', f)
                if m: groups.setdefault(m.group(1), []).append((int(m.group(2)), mtime(os.path.join(old, f)), os.path.join(old, f), ''))
                elif m2: groups.setdefault(None, []).append((int(m2.group(1)), mtime(os.path.join(old, f)), os.path.join(old, f), m2.group(2)))
        for f in sorted(os.listdir(edir)):
            m = re.match(r'^(.*) - FINAL\.mp4$', f)
            if m: groups.setdefault(m.group(1), []).append((10**6, mtime(os.path.join(edir, f)), os.path.join(edir, f), ''))
        if None in groups:   # descriptive old versions belong to the single FINAL's base name
            base = next((k for k in groups if k is not None), None)
            if base: groups[base] = groups.pop(None) + groups[base]
        # 2. move them into takes, numbered after any takes already there
        for base, items in groups.items():
            if base is None: continue
            existing = [f for f in os.listdir(takes) if re.match(re.escape(base) + r' - Take \d\d', f)]
            n = len(existing)
            for _, _, path, desc in sorted(items):
                n += 1; name = f'{base} - Take {n:02d}' + (f' ({desc})' if desc else '') + '.mp4'
                shutil.move(path, os.path.join(takes, name)); changed.append(f'{series}/{ep}: {os.path.basename(path)} → takes/{name}')
        if os.path.isdir(old) and not os.listdir(old): os.rmdir(old)
        # 3. a thumbnail per cut from its newest take (the first frame is the cover)
        bases = {}
        for f in os.listdir(takes):
            m = re.match(r'^(.*) - Take (\d\d)', f)
            if m and f.endswith('.mp4'): bases.setdefault(m.group(1), []).append((int(m.group(2)), f))
        for base, lst in bases.items():
            newest = os.path.join(takes, max(lst)[1]); out = os.path.join(edir, f'{base} - Thumbnail.jpg')
            if not os.path.exists(out) or mtime(out) < mtime(newest): thumb(newest, out); changed.append(f'{series}/{ep}: thumbnail ← {os.path.basename(newest)}')
print('\n'.join(changed) if changed else 'nothing to do')
