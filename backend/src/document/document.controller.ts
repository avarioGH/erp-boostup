import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { Controller } from '@nestjs/common';

@Controller('document')
export class DocumentController {}
