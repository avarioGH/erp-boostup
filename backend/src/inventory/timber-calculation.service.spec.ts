import { TimberCalculationService } from './timber-calculation.service';

describe('TimberCalculationService', () => {
  let service: TimberCalculationService;

  beforeEach(() => {
    service = new TimberCalculationService();
  });

  it('should calculate average diameter correctly', () => {
    // Example from prompt: 39, 43, 25, 32 => 34.75
    const avg = service.calculateAverageDiameter(39, 43, 25, 32);
    expect(avg).toBe(34.75);
  });

  it('should calculate rounded diameter correctly', () => {
    // Example from prompt: 34.75 => 35
    const rounded = service.calculateRoundedDiameter(34.75);
    expect(rounded).toBe(35);
  });

  it('should calculate raw log gross volume correctly', () => {
    // Example from prompt: Diameter = 35 cm, Length = 11 m
    // Gross = (35 * 35 * 11 * 0.7854) / 10000 = 1.0583265
    // Rounded to 2 decimals = 1.06
    const gross = service.calculateRawLogGrossVolume(35, 11);
    expect(gross).toBe(1.06);
  });

  it('should calculate timber dimensional stock volume correctly', () => {
    // Example from prompt: 20 x 30 x 1000 x 120
    // Volume = 0.072 M3
    const vol1 = service.calculateTimberStockVolume(20, 30, 1000, 120);
    expect(vol1).toBe(0.072);

    // Another example from prompt: 30 x 112 x 4100 x 15
    // Volume = 0.20664 M3
    const vol2 = service.calculateTimberStockVolume(30, 112, 4100, 15);
    expect(vol2).toBe(0.20664);
  });
});
