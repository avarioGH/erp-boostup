import os
import re

for root, dirs, files in os.walk("frontend/src/app"):
    for file in files:
        if not file.endswith(".tsx"): continue
        path = os.path.join(root, file)
        with open(path, "r", encoding="utf-8") as f:
            c = f.read()

        changed = False

        if "fetch(" in c and "https://api.erp.boostup.id" in c:
            
            # Use DOTALL to capture multiline JSON.stringify
            c = re.sub(
                r'const (.*?) = await fetch\(`?https://api\.erp\.boostup\.id(/[^"`]+)`?,\s*\{\s*method:\s*"POST",\s*headers:\s*\{[^}]*\},\s*body:\s*JSON\.stringify\((.*?)\)\s*\}\)',
                r'const \1 = await api.post("\2", \3)',
                c,
                flags=re.DOTALL
            )
            
            c = re.sub(
                r'await fetch\(`?https://api\.erp\.boostup\.id(/[^"`]+)`?,\s*\{\s*method:\s*"POST",\s*headers:\s*\{[^}]*\},\s*body:\s*JSON\.stringify\((.*?)\)\s*\}\)',
                r'await api.post("\1", \2)',
                c,
                flags=re.DOTALL
            )

            # Check if res.ok logic is there
            if "api.post" in c:
                c = re.sub(r'if \((.*?)\.ok\)', r'if (\1.status === 200 || \1.status === 201)', c)

            changed = True
            
        if changed:
            with open(path, "w", encoding="utf-8") as f:
                f.write(c)

print("api.post fixes with DOTALL done.")
