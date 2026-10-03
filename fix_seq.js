const fs = require("fs");
let content = fs.readFileSync("backend/src/reports/sequence.service.ts", "utf8");
content = content.replace(/const sequence = await \(tx as any\)\.documentSequence\.upsert\(\{[\s\S]*?last_value: 1\n\s*\}\n\s*\}\);/, `let sequence = await (tx as any).documentSequence.findFirst({
        where: {
          company_id: companyId,
          type: type,
          prefix: fullPrefix
        }
      });

      if (sequence) {
        sequence = await (tx as any).documentSequence.update({
          where: { id: sequence.id },
          data: { last_value: { increment: 1 } }
        });
      } else {
        sequence = await (tx as any).documentSequence.create({
          data: {
            company_id: companyId,
            type: type,
            prefix: fullPrefix,
            last_value: 1
          }
        });
      }`);
fs.writeFileSync("backend/src/reports/sequence.service.ts", content);

