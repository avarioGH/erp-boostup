import os
import re

for root, dirs, files in os.walk("frontend/src/app"):
    for file in files:
        if not file.endswith(".tsx"): continue
        path = os.path.join(root, file)
        with open(path, "r", encoding="utf-8") as f:
            c = f.read()

        changed = False

        if c.startswith('import { api } from "@/lib/api"\n"use client"'):
            c = c.replace('import { api } from "@/lib/api"\n"use client"\n', '"use client"\nimport { api } from "@/lib/api"\n')
            changed = True

        if changed:
            with open(path, "w", encoding="utf-8") as f:
                f.write(c)

print("Imports fixed.")
