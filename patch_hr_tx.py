import re

with open("backend/src/hr/hr.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

def replace_method(name):
    global c
    # Find the start of the method
    pattern = r"(async " + name + r"\([^)]*\)) \{(.*?)(return this\.prisma\.\$transaction\(async \(tx\) => \{)(.*?)(\}\);\s*\})"
    match = re.search(pattern, c, flags=re.DOTALL)
    if match:
        sig = match.group(1)
        # Add txClient
        if "txClient?: any" not in sig:
            sig = sig.replace(")", ", txClient?: any)")
        
        inner_body = match.group(4)
        
        new_body = f"""{sig} {{
    const run = async (tx: any) => {{{inner_body}}};
    return txClient ? run(txClient) : this.prisma.$transaction(run);
  }}"""
        c = c[:match.start()] + new_body + c[match.end():]
        print(f"Patched {name}")

replace_method("calculatePayroll")
replace_method("postPayroll")
replace_method("payPayroll")

with open("backend/src/hr/hr.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

