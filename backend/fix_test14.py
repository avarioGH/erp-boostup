import re
with open('test/step20e.ts', 'r') as f:
    c = f.read()

c = c.replace("import { MongoMemoryReplSet }\nimport { ObjectId } from 'bson'; from 'mongodb-memory-server';", "import { MongoMemoryReplSet } from 'mongodb-memory-server';\nimport { ObjectId } from 'bson';")

with open('test/step20e.ts', 'w') as f:
    f.write(c)

