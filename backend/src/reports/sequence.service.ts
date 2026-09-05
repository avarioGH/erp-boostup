import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class SequenceService {
  /**
   * Generates a unique sequential number atomically using Prisma transaction capabilities.
   * Format: PREFIX + PADDED_NUMBER (e.g. INV/2026/00001)
   */
  async generateNumber(
    tx: Prisma.TransactionClient,
    companyId: string,
    type: string,
    prefixString: string,
    padding: number = 5
  ): Promise<string> {
    const year = new Date().getFullYear();
    const fullPrefix = `${prefixString}/${year}/`;

    const sequence = await tx.documentSequence.upsert({
      where: {
        company_id_type_prefix: {
          company_id: companyId,
          type: type,
          prefix: fullPrefix
        }
      },
      update: {
        last_value: { increment: 1 }
      },
      create: {
        company_id: companyId,
        type: type,
        prefix: fullPrefix,
        last_value: 1
      }
    });

    const paddedValue = sequence.last_value.toString().padStart(padding, '0');
    return `${fullPrefix}${paddedValue}`;
  }
}
