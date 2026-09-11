with open("backend/src/manufacturing/quality/quality.service.ts", "r", encoding="utf-8") as f:
    qc = f.read()

qc = qc.replace("(tx.qualityDisposition as any)", "(tx as any).qualityDisposition")

with open("backend/src/manufacturing/quality/quality.service.ts", "w", encoding="utf-8") as f:
    f.write(qc)

