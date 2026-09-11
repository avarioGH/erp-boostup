with open("backend/src/purchasing/purchasing.service.ts", "r") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "async createVendorBill" in line:
        for j in range(i, i+50):
            if j < len(lines):
                print(f"{j+1}: {lines[j].rstrip()}")
        break
