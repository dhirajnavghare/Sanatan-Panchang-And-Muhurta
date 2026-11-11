import { runStartupDiagnostics, getLastDiagnosticReport } from '../src/services/startupDiagnostics';

describe('Startup Diagnostics & Automated Invariant Tests', () => {
  it('should run complete diagnostic suite and return a HEALTHY status', async () => {
    const report = await runStartupDiagnostics();

    expect(report).toBeDefined();
    expect(report.status).toBe('HEALTHY');
    expect(report.totalTests).toBeGreaterThanOrEqual(15);
    expect(report.passedTests).toBe(report.totalTests);
    expect(report.failedTests).toBe(0);
    expect(report.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('should persist the last diagnostic report in memory', async () => {
    const report = await runStartupDiagnostics();
    const last = getLastDiagnosticReport();

    expect(last).not.toBeNull();
    expect(last?.timestamp).toBe(report.timestamp);
    expect(last?.status).toBe('HEALTHY');
  });

  it('should verify all critical system suites pass individually', async () => {
    const report = await runStartupDiagnostics();

    const suites = new Set(report.results.map((r) => r.suiteName));
    expect(suites.has('Astronomical Engine')).toBe(true);
    expect(suites.has('Panchanga Invariants')).toBe(true);
    expect(suites.has('Muhurta Engine')).toBe(true);
    expect(suites.has('Muhurta Finder')).toBe(true);
    expect(suites.has('Festivals Engine')).toBe(true);
    expect(suites.has('Day Planner Engine')).toBe(true);
    expect(suites.has('Dinacharya Engine')).toBe(true);
    expect(suites.has('Sadhana Engine')).toBe(true);
    expect(suites.has('Profile & Registry')).toBe(true);

    for (const res of report.results) {
      expect(res.passed).toBe(true);
      expect(res.error).toBeUndefined();
    }
  });
});
