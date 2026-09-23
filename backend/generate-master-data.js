const fs = require('fs');
const path = require('path');

const models = [
  { name: 'TimberSpecies', param: 'timberSpecies', path: 'timber-species', idType: 'string' },
  { name: 'TimberGrade', param: 'timberGrade', path: 'timber-grade', idType: 'string' },
  { name: 'TimberSource', param: 'timberSource', path: 'timber-source', idType: 'string' },
  { name: 'Location', param: 'location', path: 'location', idType: 'string' },
  { name: 'Vehicle', param: 'vehicle', path: 'vehicle', idType: 'string' },
  { name: 'Driver', param: 'driver', path: 'driver', idType: 'string' },
];

const basePath = path.join(__dirname, 'src/inventory/master-data');
const dtoPath = path.join(basePath, 'dto');
const controllersPath = path.join(basePath, 'controllers');
const servicesPath = path.join(basePath, 'services');

[dtoPath, controllersPath, servicesPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create basic DTOs
const createDtoContent = `import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateTimberSpeciesDto {
  @IsString() company_id: string;
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateTimberSpeciesDto extends CreateTimberSpeciesDto {}

export class CreateTimberGradeDto {
  @IsString() company_id: string;
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateTimberGradeDto extends CreateTimberGradeDto {}

export class CreateTimberSourceDto {
  @IsString() company_id: string;
  @IsString() code: string;
  @IsString() name: string;
  @IsString() type: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateTimberSourceDto extends CreateTimberSourceDto {}

export class CreateLocationDto {
  @IsString() warehouseId: string;
  @IsString() code: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateLocationDto extends CreateLocationDto {}

export class CreateVehicleDto {
  @IsString() company_id: string;
  @IsString() code: string;
  @IsString() plateNumber: string;
  @IsOptional() @IsString() name?: string;
  @IsString() vehicleType: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateVehicleDto extends CreateVehicleDto {}

export class CreateDriverDto {
  @IsString() company_id: string;
  @IsOptional() @IsString() code?: string;
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() licenseNumber?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateDriverDto extends CreateDriverDto {}
`;

fs.writeFileSync(path.join(dtoPath, 'master-data.dto.ts'), createDtoContent);

// Generate services and controllers
let moduleControllers = [];
let moduleServices = [];
let moduleImports = [];

models.forEach(model => {
  const serviceName = `${model.name}Service`;
  const controllerName = `${model.name}Controller`;
  
  // Service Content
  const serviceContent = `import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Create${model.name}Dto, Update${model.name}Dto } from '../dto/master-data.dto';

@Injectable()
export class ${serviceName} {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.${model.param}.findMany();
  }

  async findOne(id: string) {
    const item = await this.prisma.${model.param}.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('${model.name} not found');
    return item;
  }

  async create(data: Create${model.name}Dto) {
    return this.prisma.${model.param}.create({ data });
  }

  async update(id: string, data: Partial<Update${model.name}Dto>) {
    await this.findOne(id);
    return this.prisma.${model.param}.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.${model.param}.update({
      where: { id },
      data: { isActive },
    });
  }
}
`;
  fs.writeFileSync(path.join(servicesPath, `${model.path}.service.ts`), serviceContent);

  // Controller Content
  const controllerContent = `import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ${serviceName} } from '../services/${model.path}.service';
import { Create${model.name}Dto, Update${model.name}Dto } from '../dto/master-data.dto';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../../auth/permissions.guard';
import { Permissions } from '../../../auth/permissions.decorator';

@Controller('inventory/master-data/${model.path}')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ${controllerName} {
  constructor(private readonly service: ${serviceName}) {}

  @Get()
  @Permissions('inventory.view')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Permissions('inventory.view')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('inventory.create')
  create(@Body() data: Create${model.name}Dto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Permissions('inventory.update')
  update(@Param('id') id: string, @Body() data: Partial<Update${model.name}Dto>) {
    return this.service.update(id, data);
  }

  @Patch(':id/status')
  @Permissions('inventory.update')
  updateStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.updateStatus(id, isActive);
  }
}
`;
  fs.writeFileSync(path.join(controllersPath, `${model.path}.controller.ts`), controllerContent);

  moduleControllers.push(controllerName);
  moduleServices.push(serviceName);
  moduleImports.push(`import { ${controllerName} } from './controllers/${model.path}.controller';`);
  moduleImports.push(`import { ${serviceName} } from './services/${model.path}.service';`);
});

// Module Content
const moduleContent = `import { Module } from '@nestjs/common';
${moduleImports.join('\n')}
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [\n    ${moduleControllers.join(',\n    ')}\n  ],
  providers: [\n    ${moduleServices.join(',\n    ')}\n  ],
})
export class MasterDataModule {}
`;

fs.writeFileSync(path.join(basePath, 'master-data.module.ts'), moduleContent);

console.log('Master data generation complete.');
