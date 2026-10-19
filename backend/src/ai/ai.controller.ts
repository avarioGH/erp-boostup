import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/ai')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Permissions('ai.create')
  @Post('chat')
  async chat(
    @Req() req,
    @Body() body: { prompt: string; chatHistory?: any[] },
  ) {
    if (req.user.role?.toLowerCase() !== 'owner') {
      throw new ForbiddenException('Fitur Chat AI ini hanya dapat diakses oleh Owner.');
    }
    return this.aiService.handleChat(
      req.user,
      body.prompt,
      body.chatHistory || [],
    );
  }

  @Post('parse-tally')
  @UseInterceptors(FileInterceptor('file'))
  async parseTally(
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: { imageBase64?: string; mimeType?: string; workflowType?: 'RAW_LOG' | 'SAWN_TIMBER' },
  ) {
    const companyId = req.user?.company_id || req.user?.companyId;
    const workflowType = body?.workflowType || 'RAW_LOG';

    let fileBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (file && file.buffer) {
      fileBuffer = file.buffer;
      mimeType = file.mimetype;
    } else if (body?.imageBase64) {
      const match = body.imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        fileBuffer = Buffer.from(match[2], 'base64');
      } else {
        fileBuffer = Buffer.from(body.imageBase64, 'base64');
        mimeType = body.mimeType || 'image/jpeg';
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('File gambar atau dokumen kayu tidak ditemukan.');
    }

    return this.aiService.parseTallyDocument(companyId, fileBuffer, mimeType, workflowType);
  }

  async _old_chat(
    @Req() req,
    @Body() body: { prompt: string; chatHistory?: any[] },
  ) {
    return this.aiService.handleChat(
      req.user,
      body.prompt,
      body.chatHistory || [],
    );
  }

  @Permissions('ai.create')
  @Post('execute')
  async executeAction(@Req() req, @Body() body: { actionData: any }) {
    return this.aiService.executeAction(req.user.company_id, body.actionData);
  }

  @Permissions('ai.create')
  @Post('undo')
  async undoAction(@Req() req, @Body() body: { actionData: any }) {
    return this.aiService.undoAction(req.user.company_id, body.actionData);
  }

  @Permissions('ai.create')
  @Post('history')
  async getHistory(@Req() req) {
    return this.aiService.getHistory(req.user.company_id, req.user.id);
  }
}

