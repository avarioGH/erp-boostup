with open('src/app.module.ts', 'r') as f:
    c = f.read()

c = c.replace("import { ManufacturingModule } from './manufacturing/manufacturing.module';", "")
c = c.replace("ManufacturingModule,", "")

with open('src/app.module.ts', 'w') as f:
    f.write(c)
