with open('src/crm/crm.service.ts', 'r') as f:
    c = f.read()

c = c.replace("// source:", "source:")
c = c.replace("source: dto.source,", "// source: dto.source,") # Opportunity doesn't have source
c = c.replace("opportunity_id: opp.id,", "opportunity_id: opp.id,") # keep it
c = c.replace("if (opp.quotation_id)", "if (false)") # Line 175

with open('src/crm/crm.service.ts', 'w') as f:
    f.write(c)
