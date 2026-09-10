import re

with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("import { MongoMemoryReplSet }", "import { MongoMemoryReplSet }\nimport { ObjectId } from 'bson';")
c = re.sub(r"referenceId: '[^']+'", "referenceId: new ObjectId().toHexString()", c)

with open('test/step20e.ts', 'w') as f:
    f.write(c)

