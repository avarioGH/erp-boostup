with open("frontend/src/app/maintenance/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("Tool,", "Wrench,")
c = c.replace("<Tool ", "<Wrench ")

with open("frontend/src/app/maintenance/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
