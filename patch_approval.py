with open("backend/src/approval/approval.service.ts", "r", encoding="utf-8") as f:
    c = f.read()

replacement = """      // Self-Approval Block (unless explicit business logic says otherwise)
      const reqLog = await tx.approvalLog.findFirst({
        where: { approval_request_id: req.id, action: 'REQUESTED' }
      });
      if (reqLog && reqLog.acted_by === userId) {
        throw new ForbiddenException('Cannot self-approve your own request');
      }"""

c = c.replace(
    "// Self-Approval Block (unless explicit business logic says otherwise)\n      if (false) throw new ForbiddenException('Cannot self-approve your own request');",
    replacement
)

with open("backend/src/approval/approval.service.ts", "w", encoding="utf-8") as f:
    f.write(c)

