import glob
import os
import re

for path in glob.glob('frontend/src/app/**/*.tsx', recursive=True):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()
    
    changed = False
    
    # Fix className=\\f...\\>
    if r'className=\' in c or 'className=\f' in c or 'className=\\' in c:
        c = re.sub(r'className=\\?\f?ont-mono px-2 \\\\?>', 'className="font-mono px-2">', c)
        c = re.sub(r'className=\\?\f?ont-mono px-2\\?>', 'className="font-mono px-2">', c)
        c = re.sub(r'className=\\\\[a-zA-Z0-9 -]+\\\\\>', 'className="font-mono px-2">', c) # general fix
        changed = True
        
    # Fix api.get(\\/mrp/calculate\\\\)
    if r'\/' in c or r'\\' in c:
        c = re.sub(r'api\.get\(\\\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)\\\\\)', r"api.get('/\1/\2')", c)
        changed = True

    if changed:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(c)

