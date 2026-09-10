with open('backend/src/app.module.ts', 'r') as f:
    c = f.read()

if 'SystemModule' not in c:
    c = c.replace("import { Module } from '@nestjs/common';", "import { Module } from '@nestjs/common';\nimport { SystemModule } from './system/system.module';")
    c = c.replace("imports: [", "imports: [\n    SystemModule,")

with open('backend/src/app.module.ts', 'w') as f:
    f.write(c)
