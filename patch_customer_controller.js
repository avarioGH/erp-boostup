const fs = require("fs");
let content = fs.readFileSync("backend/src/crm/customer.controller.ts", "utf8");

content = content.replace("import { Controller, Get, Post, Body, UseGuards, Request, Query, Param } from '@nestjs/common';", 
"import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request, Query, Param } from '@nestjs/common';");

const newEndpoints = `  @Permissions('crm.customer.update')
  @Put(':id')
  async updateCustomer(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.prisma.customer.update({
      where: { id, company_id: req.user.company_id || req.user.companyId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address
      }
    });
  }

  @Permissions('crm.customer.delete')
  @Delete(':id')
  async deleteCustomer(@Request() req, @Param('id') id: string) {
    return this.prisma.customer.delete({
      where: { id, company_id: req.user.company_id || req.user.companyId }
    });
  }
}
`;

content = content.replace("  }\n}\n", "  }\n\n" + newEndpoints);
fs.writeFileSync("backend/src/crm/customer.controller.ts", content);

