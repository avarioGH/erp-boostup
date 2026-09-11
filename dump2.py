with open("backend/src/purchasing/purchasing.service.ts", "r") as f:
    lines = f.readlines()
for j in range(258, 280):
    if j < len(lines):
        print(f"{j+1}: {lines[j].rstrip()}")
