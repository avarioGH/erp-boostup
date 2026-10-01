import re
filepath = r"frontend\src\app\inventory\input-logs\[id]\page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<DialogTrigger asChild>',
    '<DialogTrigger>'
)
content = content.replace(
    '<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={data.status === \'DONE\'}>\n                    <Plus className="w-4 h-4 mr-2" /> Tally Hari Ini\n                  </Button>',
    '<div className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-emerald-600 text-primary-foreground shadow hover:bg-emerald-700 h-8 rounded-md px-3" style={data.status === "DONE" ? {opacity: 0.5, pointerEvents: "none"} : {}}><Plus className="w-4 h-4" /> Tally Hari Ini</div>'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed asChild")
