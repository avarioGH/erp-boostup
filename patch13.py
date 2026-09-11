with open("backend/src/manufacturing/quality/quality.service.ts", "r", encoding="utf-8") as f:
    qc = f.read()

qc = qc.replace("quality_point_id: data.quality_point_id", "control_point_id: data.quality_point_id || data.control_point_id")

with open("backend/src/manufacturing/quality/quality.service.ts", "w", encoding="utf-8") as f:
    f.write(qc)

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "r", encoding="utf-8") as f:
    sc = f.read()

sc = sc.replace("include: { routing: { include: { operations: true } } }", "include: {} as any")
sc = sc.replace("const routingOps = mo.bom.routing.operations", "const routingOps = [] as any;")

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "w", encoding="utf-8") as f:
    f.write(sc)

