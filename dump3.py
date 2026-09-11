with open("backend/src/accounting/accounting.listener.ts", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "invoice.posted" in line:
        for j in range(i, i+30):
            if j < len(lines):
                print(f"{j+1}: {lines[j].rstrip()}")
        break
