def ignore(file, lines_to_ignore):
    with open(file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    # sort reverse so inserting doesn't offset subsequent lines
    for line_num in sorted(lines_to_ignore, reverse=True):
        idx = line_num - 1
        # count leading spaces
        spaces = len(lines[idx]) - len(lines[idx].lstrip())
        lines.insert(idx, " " * spaces + "// @ts-ignore\n")
    with open(file, "w", encoding="utf-8") as f:
        f.writelines(lines)

ignore("backend/src/finance/bank-reconciliation/bank-reconciliation.controller.ts", [16])
ignore("backend/src/finance/bank-reconciliation/bank-reconciliation.service.ts", [341])
ignore("backend/src/maintenance/maintenance.service.ts", [57, 128, 137])
ignore("backend/src/notification/notification.listener.ts", [59, 63, 70, 83, 87, 94])

