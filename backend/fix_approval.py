with open('src/approval/approval.service.ts', 'r') as f:
    c = f.read()

c = c.replace("requested_by: user_id,", "")
c = c.replace("requester: true,", "")

with open('src/approval/approval.service.ts', 'w') as f:
    f.write(c)

