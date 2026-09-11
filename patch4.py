code = """
  // Manufacturing DI
  const bomService = app.get(require('../src/manufacturing/bom/bom.service').BomService);
  const moService = app.get(require('../src/manufacturing/mo/mo.service').MoService);
  const qualityService = app.get(require('../src/manufacturing/quality/quality.service').QualityService);
  const schedulingService = app.get(require('../src/manufacturing/scheduling/scheduling.service').SchedulingService);
  const mrpService = app.get(require('../src/mrp/mrp.service').MrpService);
"""
import re
with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("const paymentService = app.get(PaymentService);", "const paymentService = app.get(PaymentService);\n" + code)

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)

