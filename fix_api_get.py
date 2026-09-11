import os
import re

for root, dirs, files in os.walk("frontend/src/app"):
    for file in files:
        if not file.endswith(".tsx"): continue
        path = os.path.join(root, file)
        with open(path, "r", encoding="utf-8") as f:
            c = f.read()

        changed = False

        # If it has api.get(...) and then res.ok
        if "api.get" in c and "res.ok" in c:
            c = re.sub(r'const (.*?) = await api\.get\((.*?)\)\n\s*if \(\1\.ok\) (.*?)\(await \1\.json\(\)\)', r'const \1 = await api.get(\2)\n      \3(\1.data)', c)
            changed = True
            
        if changed:
            with open(path, "w", encoding="utf-8") as f:
                f.write(c)

print("api.get fixes done.")
