with open('src/app.module.ts', 'r') as f:
    c = f.read()

c = c.replace("import { AttachmentModule } from './attachment/attachment.module';", "")
c = c.replace("AttachmentModule,", "")

with open('src/app.module.ts', 'w') as f:
    f.write(c)
