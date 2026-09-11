with open("backend/src/integrations/providers/payment/tripay/tripay.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

import re

sig_check = """
    if (!privateKey) {
      await this.webhook.markFailed(event.id, 'Missing Private Key', 1);
      return { success: false, message: 'Internal config error' };
    }

    const expectedSignature = crypto.createHmac('sha256', privateKey).update(JSON.stringify(body)).digest('hex');
    if (signatureHeader !== expectedSignature) {
      return { success: false, message: 'Invalid signature' };
    }
"""

c = c.replace("""    if (!privateKey) {
      await this.webhook.markFailed(event.id, 'Missing Private Key', 1);
      return { success: false, message: 'Internal config error' };
    }""", sig_check)

with open("backend/src/integrations/providers/payment/tripay/tripay.service.ts", "w", encoding="utf-8") as f:
    f.write(c)
