with open("frontend/src/components/app-sidebar.tsx", "r", encoding="utf-8") as f:
    c = f.read()

import re
match = re.search(r"const items: MenuItem\[\] = \[(.*?)\]\n\nconst settings", c, re.DOTALL)
if match:
    print(match.group(1))
