#!/usr/bin/env python3
"""Download CC0-only OpenGameArt sound packs into Assets/Sound Effects/<category>/<pack>/ (zips extracted), log licences in SOURCES.md.
usage: fetch-oga.py  (edit PACKS). Skips any page that is not licensed CC0 only."""
import re, os, sys, urllib.request, urllib.parse, zipfile, datetime, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'Assets', 'Sound Effects'); TMP = os.path.join(ROOT, 'Temp', 'dl-oga'); os.makedirs(TMP, exist_ok=True)
PACKS = {
 'Steps': ['42-snow-and-gravel-footsteps','fantozzis-footsteps-grasssand-stone','footsteps-0','footsteps-leather-cloth-armor','metal-footsteps-on-concrete'],
 'Doors': ['4-door-closes','creaky-door-hinge-spooky','door-lock-sounds'],
 'Impacts': ['100-cc0-metal-and-wood-sfx'],
 'Foley': ['100-cc0-sfx','100-cc0-sfx-2','202-more-sound-effects','atmospheric-interaction-sound-pack'],
 'Water': ['40-cc0-water-splash-slime-sfx','6-short-water-splashes','boiling-water-loops','beach-ocean-waves'],
 'Weather': ['rain-long-thunder','storm-siren','amb-rain-loop-1','amb-rain-loop-2','rain-ambient-not-loopable-2-versions-available'],
 'Ambience': ['30-cc0-sfx-loops','park-ambiences','loopable-dungeon-ambience'],
}
UA = {'User-Agent': 'curl/8.4.0'}
def get(u): return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
log = open(os.path.join(OUT, 'SOURCES.md'), 'a')
for cat, slugs in PACKS.items():
    for slug in slugs:
        url = f'https://opengameart.org/content/{slug}'
        try: html = get(url).decode('utf8', 'replace')
        except Exception as e: print('FAIL page', slug, e); continue
        lic = re.findall(r"license-name'>([^<]+)<", html)
        if lic != ['CC0']: print('SKIP (licence %s)' % lic, slug); continue
        files = sorted(set(re.findall(r"https://opengameart\.org/sites/default/files/(?!styles|css|js|audio_preview)[^\"'<> ]+\.(?:zip|ogg|wav|mp3|flac)", html)))
        files = [f for f in files if '/styles/' not in f]
        dest = os.path.join(OUT, cat, slug)
        if os.path.isdir(dest) and os.listdir(dest): print('have', slug); continue
        os.makedirs(dest, exist_ok=True); n = 0
        for f in files:
            name = urllib.parse.unquote(os.path.basename(f))
            try: data = get(f)
            except Exception as e: print('FAIL file', f, e); continue
            p = os.path.join(dest, name); open(p, 'wb').write(data); n += 1
            if name.lower().endswith('.zip'):
                try: zipfile.ZipFile(p).extractall(os.path.join(dest, os.path.splitext(name)[0])); os.remove(p)
                except Exception as e: print('bad zip', name, e)
        log.write(f'- {cat}/{slug} | {url} | CC0 | {datetime.date.today()} | {n} file(s)\n'); log.flush(); print('OK', cat, slug, n)
