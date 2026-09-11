with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "r", encoding="utf-8") as f:
    sc = f.read()

sc = sc.replace("const routingOps = [] as any;.sort((a: any, b: any) => a.sequence - b.sequence);", "const routingOps = [] as any;")

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "w", encoding="utf-8") as f:
    f.write(sc)

