with open("frontend/src/app/purchasing/analytics/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("formatter={(value: number)", "formatter={(value: any)")

with open("frontend/src/app/purchasing/analytics/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
