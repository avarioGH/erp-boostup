with open("backend/src/inventory/inventory.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Let's completely replace createInbound, createOutbound, validateTransfer
import re

inbound_regex = r"(async createInbound.*?return transaction;\n    \}\);\n  \})"
outbound_regex = r"(async createOutbound.*?return transaction;\n    \}\);\n  \})"
transfer_regex = r"(async validateTransfer\(companyId: string, id: string, userId: string\).*?return transaction;\n    \}\);\n  \})"

def get_match(regex):
    m = re.search(regex, c, re.DOTALL)
    if not m:
        print("Regex not found:", regex[:50])
    return m.group(1) if m else None

print("Inbound found:", bool(get_match(inbound_regex)))
print("Outbound found:", bool(get_match(outbound_regex)))
print("Transfer found:", bool(get_match(transfer_regex)))

