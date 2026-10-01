import re
filepath = r"frontend\src\app\inventory\partai\[id]\page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken comment
content = content.replace('{/* 4. INPUT LOGS <TabsContent value="input">', '{/* 4. INPUT LOGS */}\n<TabsContent value="input">')
# Actually, let's just restore the file completely from a clean git checkout, then apply the patch properly.
