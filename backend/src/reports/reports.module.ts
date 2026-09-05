import { Module } from '@nestjs/common';
import { SequenceService } from './sequence.service';
import { ExportService } from './export.service';
import { PdfService } from './pdf.service';
import { ReportService } from './report.service';
import { DocumentService } from './document.service';
import { ReportController } from './report.controller';

@Module({
  providers: [SequenceService, ExportService, PdfService, ReportService, DocumentService],
  controllers: [ReportController],
  exports: [SequenceService]
})
export class ReportsModule {}
