with open("backend/src/hr/hr.service.ts", "r") as f:
    lines = f.readlines()
for j in range(270, min(320, len(lines))):
    print(f"{j+1}: {lines[j].rstrip()}")
