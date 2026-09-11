import os
import json

routes = []
for root, dirs, files in os.walk("frontend/src/app"):
    for file in files:
        if file == "page.tsx":
            rel_path = os.path.relpath(root, "frontend/src/app")
            routes.append(rel_path.replace("\\", "/"))

print(json.dumps(routes, indent=2))
