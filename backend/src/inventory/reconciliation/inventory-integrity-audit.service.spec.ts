import { AuditClassifiers } from './inventory-integrity-audit.service';

describe('InventoryIntegrityAuditService Classifiers', () => {
  it('stock equals ledger → MATCH', () => {
    expect(AuditClassifiers.classifyStockLedger(10, 10, true, true)).toBe('MATCH');
  });

  it('stock differs ledger → MISMATCH', () => {
    expect(AuditClassifiers.classifyStockLedger(10, 8, true, true)).toBe('STOCK_LEDGER_MISMATCH');
  });

  it('no ledger history', () => {
    expect(AuditClassifiers.classifyStockLedger(10, 0, false, true)).toBe('NO_LEDGER_HISTORY');
  });

  it('ledger without stock', () => {
    expect(AuditClassifiers.classifyStockLedger(0, 10, true, false)).toBe('LEDGER_WITHOUT_STOCK');
  });

  it('unknown movement type', () => {
    expect(AuditClassifiers.classifyMovement('RANDOM_TYPE')).toBe('UNKNOWN_MOVEMENT_SEMANTICS');
    expect(AuditClassifiers.classifyMovement('TIMBER_SHIPMENT')).toBe('KNOWN_SEMANTICS');
  });

  it('exact batch distinction', () => {
    expect(AuditClassifiers.classifyBatch(' BATCH-01 ', 'BATCH-01')).toBe('FORMAT_VARIANT');
    expect(AuditClassifiers.classifyBatch('BATCH-01', 'BATCH-01')).toBe('NORMAL');
  });

  it('reservation over-allocation', () => {
    expect(AuditClassifiers.classifyReservation(20, 10)).toBe('OVER_RESERVED');
  });

  it('shipment/reference mismatch', () => {
    expect(AuditClassifiers.classifyShipment(10, 8)).toBe('SHIPMENT_REFERENCE_MISMATCH');
    expect(AuditClassifiers.classifyShipment(10, 10)).toBe('MATCH');
  });

  it('duplicate classification', () => {
    expect(AuditClassifiers.classifyDuplicate(true, true)).toBe('EXPECTED_MULTI_ITEM_MOVEMENT');
    expect(AuditClassifiers.classifyDuplicate(true, false)).toBe('EXACT_DUPLICATE_REFERENCE');
  });
});
