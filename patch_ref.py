import re

with open("backend/src/inventory/inventory.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Let's fix receiveStock and issueStock movement_types:
c = re.sub(r"movement_type: params\.referenceType \+ '_IN'", "movement_type: params.referenceType === 'IN' ? 'IN' : params.referenceType + '_IN'", c)
c = re.sub(r"movement_type: params\.referenceType \+ '_OUT'", "movement_type: params.referenceType === 'OUT' ? 'OUT' : params.referenceType + '_OUT'", c)

with open("backend/src/inventory/inventory.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
