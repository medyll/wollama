import { test, expect } from '../fixtures/multi-device-context';

/**
 * Minimal smoke test: prove that one piece of data (a companion) replicates
 * between two devices via RxDB ↔ PouchDB. Detailed UX flows remain covered by
 * existing single-device UI tests; this file only validates cross-device sync.
 */

test.describe('Multi-Device Sync Smoke', () => {
  test('companion created on Device A appears on Device B (and updates propagate)', async ({ multiDevice }) => {
    const companionName = `Sync Smoke ${Date.now()}`;

    // Create on Device A
    await multiDevice.deviceA.createCompanion('assistant', companionName, 'Minimal smoke prompt');

    // Creation replicates to Device B
    await multiDevice.waitForCompanionSync(companionName, 8000);

    const companionsA = await multiDevice.deviceA.getCompanionList();
    const companionsB = await multiDevice.deviceB.getCompanionList();

    const countByName = (list: string[]) => list.filter((name) => name === companionName).length;
    expect(countByName(companionsA)).toBe(1);
    expect(countByName(companionsB)).toBe(1);

    // Update on Device A and ensure Device B observes the change
    const updatedPrompt = 'Updated after initial sync';
    await multiDevice.deviceA.modifyCompanion(companionName, { prompt: updatedPrompt });

    const start = Date.now();
    let synced = false;
    while (Date.now() - start < 8000) {
      const dataB = await multiDevice.deviceB.getCompanionData(companionName);
      if (dataB.system_prompt === updatedPrompt) {
        synced = true;
        break;
      }
      await multiDevice.deviceB.page.waitForTimeout(200);
    }

    expect(synced).toBe(true);

    // Final consistency check: IDs match across devices
    const dataA = await multiDevice.deviceA.getCompanionData(companionName);
    const dataB = await multiDevice.deviceB.getCompanionData(companionName);
    expect(dataA.id).toBe(dataB.id);
  });
});
