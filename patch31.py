import re
with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    'started_at: { not: null },\n        completed_at: { not: null }',
    'planned_start: { not: null },\n        planned_end: { not: null }'
)

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
