import { Controller, Get, Query, Param, UseGuards, Request, Res, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportService } from './report.service';
import { ExportService } from './export.service';
import { PdfService } from './pdf.service';
import { DocumentService } from './document.service';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller()
export class ReportController {
  constructor(
    private reportService: ReportService,
    private exportService: ExportService,
    private pdfService: PdfService,
    private documentService: DocumentService
  ) {}

  @Get('reports/:module/:type')
  async getReport(
    @Request() req: any,
    @Param('module') module: string,
    @Param('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    if (module === 'sales') return this.reportService.getSalesData(req.user.company_id, startDate, endDate);
    if (module === 'finance') return this.reportService.getFinancialData(req.user.company_id, startDate, endDate);
    throw new BadRequestException('Report module not supported');
  }

  @Get('reports/:module/:type/export')
  async exportReport(
    @Request() req: any,
    @Res() res: Response,
    @Param('module') module: string,
    @Param('type') type: string,
    @Query('format') format: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    let reportData: any;
    if (module === 'sales') reportData = await this.reportService.getSalesData(req.user.company_id, startDate, endDate);
    else if (module === 'finance') reportData = await this.reportService.getFinancialData(req.user.company_id, startDate, endDate);
    else throw new BadRequestException('Report module not supported');

    if (format === 'xlsx') {
      const buffer = await this.exportService.toXlsx(reportData.title, reportData.columns, reportData.data);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportData.title}.xlsx"`);
      res.send(buffer);
    } else if (format === 'csv') {
      const buffer = this.exportService.toCsv(reportData.columns, reportData.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportData.title}.csv"`);
      res.send(buffer);
    } else if (format === 'pdf') {
      const buffer = await this.pdfService.generateDocument({
         title: reportData.title,
         documentTitle: reportData.title,
         columns: reportData.columns,
         data: reportData.data
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportData.title}.pdf"`);
      res.send(buffer);
    } else {
      throw new BadRequestException('Format not supported');
    }
  }

  @Get('documents/:type/:id/pdf')
  async downloadDocumentPdf(
    @Request() req: any,
    @Res() res: Response,
    @Param('type') type: string,
    @Param('id') id: string
  ) {
    let docDef: any;
    if (type === 'invoices') docDef = await this.documentService.getInvoicePdfDefinition(req.user.company_id, id);
    else throw new BadRequestException('Document type not supported');

    const buffer = await this.pdfService.generateDocument(docDef);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${docDef.documentNumber}.pdf"`);
    res.send(buffer);
  }
}
