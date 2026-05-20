import json
import os
root = os.path.join(os.getcwd(), 'src', 'i18n', 'locales')
files = ['en.json', 'es.json', 'pt.json']
translations = {f: json.load(open(os.path.join(root, f), encoding='utf-8')) for f in files}

def flatten(d, prefix=''):
    items = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            items.update(flatten(v, key))
        else:
            items[key] = v
    return items

flat = {f: flatten(translations[f]) for f in files}
all_keys = sorted({k for d in flat.values() for k in d})
for f in files:
    missing = [k for k in all_keys if k not in flat[f]]
    print(f"{f} missing {len(missing)} keys")
    for k in missing:
        print('  ', k)
    print()
