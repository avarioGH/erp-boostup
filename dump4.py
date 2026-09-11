with open("backend/src/purchasing/purchasing.service.ts", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "async payVendorBill" in line:
        for j in range(i, i+60):
            if j < len(lines):
                print(f"{j+1}: {lines[j].rstrip()}")
        break
