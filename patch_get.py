with open("backend/test/verify.erp.ts", "r", encoding="utf-8") as f:
    c = f.read()

imports = """import { EcommerceCartService } from '../src/ecommerce/ecommerce-cart.service';
import { EcommerceCheckoutService } from '../src/ecommerce/ecommerce-checkout.service';
import { TripayService } from '../src/integrations/providers/payment/tripay/tripay.service';
import { PaymentService } from '../src/finance/payment/payment.service';
"""

if "EcommerceCartService" not in c[:1000]:
    c = imports + "\n" + c

c = c.replace("app.get('EcommerceCartService')", "app.get(EcommerceCartService)")
c = c.replace("app.get('EcommerceCheckoutService')", "app.get(EcommerceCheckoutService)")
c = c.replace("app.get('TripayService')", "app.get(TripayService)")
c = c.replace("app.get('PaymentService')", "app.get(PaymentService)")

with open("backend/test/verify.erp.ts", "w", encoding="utf-8") as f:
    f.write(c)
