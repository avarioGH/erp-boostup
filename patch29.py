import re
with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "r", encoding="utf-8") as f:
    sc = f.read()

sc = sc.replace("planned_start:", "started_at:")
sc = sc.replace("planned_end:", "completed_at:")

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "w", encoding="utf-8") as f:
    f.write(sc)

