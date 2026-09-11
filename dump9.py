with open("backend/src/hr/hr.service.ts", "r") as f:
    lines = f.readlines()
for j in range(275, min(330, len(lines))):
    print(f"{j+1}: {lines[j].rstrip()}")
