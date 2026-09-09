import os

controllers = []
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.controller.ts'):
            controllers.append(os.path.join(root, file))

for file in controllers:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    changed = False
    if "from 'auth/permissions.guard'" in content:
        content = content.replace("from 'auth/permissions.guard'", "from './auth/permissions.guard'")
        content = content.replace("from 'auth/permissions.decorator'", "from './auth/permissions.decorator'")
        changed = True
        
    if changed:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports in {file}")
