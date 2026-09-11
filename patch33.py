with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "r", encoding="utf-8") as f:
    sc = f.read()

sc = sc.replace(
    "asset: {\n            work_center_id: { not: null }\n          }",
    ""
)
sc = sc.replace(
    "          asset: {\n            work_center_id: {\n              not: null\n            }\n          },\n",
    ""
)

with open("backend/src/manufacturing/scheduling/scheduling.service.ts", "w", encoding="utf-8") as f:
    f.write(sc)
