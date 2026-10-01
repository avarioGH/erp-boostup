import re
filepath = r"frontend\src\app\inventory\partai\[id]\page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace Tab 4 with a very simple one to isolate the error.
start4 = content.find('<TabsContent value="input">')
end4 = content.find('</TabsContent>', start4) + 14

replacement = """<TabsContent value="input">
  <Card>
    <CardHeader>
      <CardTitle>Test</CardTitle>
    </CardHeader>
  </Card>
</TabsContent>"""

with open('test_page.tsx', 'w', encoding='utf-8') as f:
    f.write(content[:start4] + replacement + content[end4:])
