const EPSILON = 0.0001;

function getFlags(physicalPcs, physicalM3, actualReservedPcs, actualReservedM3, expectedReservedPcs, expectedReservedM3, availablePcs, availableM3, locationId = "loc1", openOrders = []) {
    const reservationPcsDelta = actualReservedPcs - expectedReservedPcs;
    const reservationM3Delta = actualReservedM3 - expectedReservedM3;
    
    const flags = [];
    const anomalies = [];

    let hasDraft = false;
    let hasCancelled = false;
    for (const o of openOrders) {
      if (o.status === 'DRAFT') hasDraft = true;
      if (o.status === 'CANCELLED' && o.remainingPcs > 0) hasCancelled = true;
    }

    if (reservationPcsDelta === 0 && Math.abs(reservationM3Delta) < EPSILON) {
      if (expectedReservedPcs === 0 && actualReservedPcs === 0) {
         // Empty match
      } else {
         flags.push('MATCH');
      }
    }

    if (reservationPcsDelta > 0 || reservationM3Delta > EPSILON) {
      if (expectedReservedPcs === 0 && expectedReservedM3 === 0) {
        anomalies.push('ORPHAN_RESERVATION');
      } else {
        anomalies.push('OVER_RESERVED');
      }
      anomalies.push('RESERVATION_DRIFT');
    }

    if (reservationPcsDelta < 0 || reservationM3Delta < -EPSILON) {
      if (actualReservedPcs === 0 && actualReservedM3 === 0 && expectedReservedPcs > 0) {
        anomalies.push('LEGACY_UNRESERVED');
      } else {
        anomalies.push('UNDER_RESERVED');
      }
      anomalies.push('RESERVATION_DRIFT');
    }

    if (availablePcs < 0 || availableM3 < -EPSILON) {
      anomalies.push('NEGATIVE_AVAILABLE');
    }

    if (locationId === null && expectedReservedPcs > 0) {
      anomalies.push('LEGACY_OPEN_ORDER_NO_WAREHOUSE');
    }

    if (hasDraft && actualReservedPcs > 0) {
      anomalies.push('INVALID_DRAFT_RESERVATION');
    }

    flags.push(...anomalies);

    if (anomalies.length === 0) {
      flags.push('HEALTHY');
    }
    
    return flags;
}

const matrix = [
  { name: 'A. Perfect match', phys: 100, act: 40, exp: 40, expected: ['MATCH', 'HEALTHY'] },
  { name: 'B. Over reserved', phys: 100, act: 60, exp: 40, expected: ['OVER_RESERVED', 'RESERVATION_DRIFT'] },
  { name: 'C. Under reserved', phys: 100, act: 20, exp: 40, expected: ['UNDER_RESERVED', 'RESERVATION_DRIFT'] },
  { name: 'D. Negative available', phys: 30, act: 40, exp: 40, expected: ['MATCH', 'NEGATIVE_AVAILABLE'] },
  { name: 'E. Orphan', phys: 100, act: 20, exp: 0, expected: ['ORPHAN_RESERVATION', 'RESERVATION_DRIFT'] },
  { name: 'F. Legacy order', phys: 100, act: 0, exp: 40, loc: null, expected: ['LEGACY_UNRESERVED', 'RESERVATION_DRIFT', 'LEGACY_OPEN_ORDER_NO_WAREHOUSE'] },
  { name: 'G. Draft order', phys: 100, act: 40, exp: 0, orders: [{status: "DRAFT"}], expected: ['ORPHAN_RESERVATION', 'RESERVATION_DRIFT', 'INVALID_DRAFT_RESERVATION'] },
];

let failed = false;
for (const tc of matrix) {
    const actM3 = tc.act * 0.1;
    const expM3 = tc.exp * 0.1;
    const physM3 = tc.phys * 0.1;
    const availPcs = tc.phys - tc.act;
    const availM3 = physM3 - actM3;
    const loc = tc.hasOwnProperty('loc') ? tc.loc : "loc1";
    
    const res = getFlags(tc.phys, physM3, tc.act, actM3, tc.exp, expM3, availPcs, availM3, loc, tc.orders || []);
    
    const pass = JSON.stringify(res.sort()) === JSON.stringify(tc.expected.sort());
    console.log(`[${pass ? "PASS" : "FAIL"}] ${tc.name}`);
    if (!pass) {
        console.log(`   Got: ${res.join(', ')}`);
        console.log(`   Expected: ${tc.expected.join(', ')}`);
        failed = true;
    }
}
if (failed) process.exit(1);
console.log("All matrix tests passed.");