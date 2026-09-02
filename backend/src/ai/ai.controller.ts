import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Req() req, @Body() body: { prompt: string; chatHistory?: any[] }) {
    return this.aiService.handleChat(req.user, body.prompt, body.chatHistory || []);
  }

  @Post('execute')
  async executeAction(@Req() req, @Body() body: { actionData: any }) {
    return this.aiService.executeAction(req.user.company_id, body.actionData);
  }

  @Post('undo')
  async undoAction(@Req() req, @Body() body: { actionData: any }) {
    return this.aiService.undoAction(req.user.company_id, body.actionData);
  }

  @Post('history')
  async getHistory(@Req() req) {
    return this.aiService.getHistory(req.user.company_id, req.user.id);
  }
}
