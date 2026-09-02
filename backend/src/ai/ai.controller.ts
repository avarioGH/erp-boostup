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

  @Post('history')
  async getHistory(@Req() req) {
    return this.aiService.getHistory(req.user.company_id, req.user.id);
  }
}
