const fs = require('fs');

// Fix pdf.service.ts
let pdfService = fs.readFileSync('backend/src/reports/pdf.service.ts', 'utf8');
pdfService = pdfService.replace("import * as PDFDocument from 'pdfkit';", "import PDFDocument = require('pdfkit');");
fs.writeFileSync('backend/src/reports/pdf.service.ts', pdfService);

// Fix report.controller.ts
let reportController = fs.readFileSync('backend/src/reports/report.controller.ts', 'utf8');
reportController = reportController.replace("import { Response } from 'express';", "import type { Response } from 'express';");
fs.writeFileSync('backend/src/reports/report.controller.ts', reportController);

// Fix report.service.ts
let reportService = fs.readFileSync('backend/src/reports/report.service.ts', 'utf8');
reportService = reportService.replace("include: { customer: true, branch: true }", "include: { customer: true }");
reportService = reportService.replace(/journalEntry/g, "journal_entry");
fs.writeFileSync('backend/src/reports/report.service.ts', reportService);

