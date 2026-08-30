import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { appendEvent, readRecent, clearTelemetry } from '../telemetry';
import { getAdaptiveThreshold, THRESHOLD_DEFAULT } from '../../orchestrator/orchestrator';

describe('learning', () => {
  let tmpFile: string;
  let origTelemetry: string | undefined;
  let origPath: string | undefined;

  beforeEach(() => {
    tmpFile = path.join(
      os.tmpdir(),
      `qwispr-test-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`
    );
    origTelemetry = process.env.QWISPR_TELEMETRY;
    origPath = process.env.QWISPR_TELEMETRY_PATH;
    process.env.QWISPR_TELEMETRY_PATH = tmpFile;
  });

  afterEach(() => {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      void 0;
    }
    if (origTelemetry === undefined) delete process.env.QWISPR_TELEMETRY;
    else process.env.QWISPR_TELEMETRY = origTelemetry;
    if (origPath === undefined) delete process.env.QWISPR_TELEMETRY_PATH;
    else process.env.QWISPR_TELEMETRY_PATH = origPath;
  });

  it("append/read works and opt-in off doesn't write", () => {
    delete process.env.QWISPR_TELEMETRY;
    appendEvent({
      ts: Date.now(),
      task: 'search',
      route: 'classical',
      nVars: 2,
      wallMs: 10,
      success: true,
    });
    expect(fs.existsSync(tmpFile)).toBe(false);

    process.env.QWISPR_TELEMETRY = '1';
    appendEvent({
      ts: Date.now(),
      task: 'search',
      route: 'classical',
      nVars: 2,
      wallMs: 10,
      success: true,
    });
    expect(fs.existsSync(tmpFile)).toBe(true);
    const events = readRecent(10);
    expect(events.length).toBe(1);
    expect(events[0].route).toBe('classical');

    // bad line ignored
    fs.appendFileSync(tmpFile, 'not json\n');
    const events2 = readRecent(10);
    expect(events2.length).toBe(1);

    clearTelemetry();
    expect(fs.existsSync(tmpFile)).toBe(false);
    expect(readRecent(10)).toEqual([]);
  });

  it('quantum 3x slower without gain pushes threshold up', () => {
    process.env.QWISPR_TELEMETRY = '1';
    // 10 classical fast, 10 quantum 3x slower, same success rate
    for (let i = 0; i < 10; i++) {
      appendEvent({
        ts: Date.now(),
        task: 'resolve',
        route: 'classical',
        nVars: 2,
        wallMs: 10,
        success: true,
      });
      appendEvent({
        ts: Date.now(),
        task: 'resolve',
        route: 'quantum',
        nVars: 10,
        wallMs: 30,
        success: true,
      });
    }
    // add one failure to quantum to make successRate slightly lower or equal
    // already equal (1.0), so condition qAvg >2*cAvg && qRate <= cRate holds
    expect(getAdaptiveThreshold()).toBeGreaterThan(THRESHOLD_DEFAULT);
  });
});
