#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const REPORTS_DIR = 'reports';

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Failed to read ${filePath}:`, error.message);
    return null;
  }
}

function generateSummary() {
  const summary = {
    timestamp: new Date().toISOString(),
    overall: 'UNKNOWN',
    details: {}
  };

  // Links check
  const linkinator = readJsonFile(path.join(REPORTS_DIR, 'linkinator.public.json'));
  const linksAuth = readJsonFile(path.join(REPORTS_DIR, 'links.auth.json'));
  
  summary.details.links = {
    public: linkinator ? {
      total: linkinator.links?.length || 0,
      passed: linkinator.passed?.length || 0,
      failed: linkinator.failed?.length || 0,
      skipped: linkinator.skipped?.length || 0,
      status: (linkinator.failed?.length || 0) === 0 ? 'PASS' : 'FAIL'
    } : { status: 'ERROR', error: 'No linkinator report found' },
    
    authenticated: linksAuth?.tests ? {
      total: linksAuth.tests.length,
      passed: linksAuth.tests.filter(t => t.status === 'passed').length,
      failed: linksAuth.tests.filter(t => t.status === 'failed').length,
      status: linksAuth.tests.every(t => t.status === 'passed') ? 'PASS' : 'FAIL'
    } : { status: 'ERROR', error: 'No auth links report found' }
  };

  // Lighthouse
  const lhciDir = path.join(REPORTS_DIR, 'lhci');
  let lighthouseStatus = 'ERROR';
  let lighthouseScores = {};
  
  if (fs.existsSync(lhciDir)) {
    try {
      const manifestPath = path.join(lhciDir, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = readJsonFile(manifestPath);
        if (manifest && manifest.length > 0) {
          const latestRun = manifest[manifest.length - 1];
          const reportPath = path.join(lhciDir, latestRun.jsonPath);
          const report = readJsonFile(reportPath);
          
          if (report && report.categories) {
            lighthouseScores = {
              performance: Math.round(report.categories.performance.score * 100),
              accessibility: Math.round(report.categories.accessibility.score * 100),
              bestPractices: Math.round(report.categories['best-practices'].score * 100),
              seo: Math.round(report.categories.seo.score * 100),
              pwa: report.categories.pwa ? Math.round(report.categories.pwa.score * 100) : null
            };
            
            const thresholds = {
              performance: parseInt(process.env.LH_MIN_PERF || '90'),
              accessibility: parseInt(process.env.LH_MIN_BP || '90'),
              bestPractices: parseInt(process.env.LH_MIN_BP || '90'),
              seo: parseInt(process.env.LH_MIN_SEO || '90'),
              pwa: parseInt(process.env.LH_MIN_PWA || '100')
            };
            
            const meetsThresholds = Object.entries(lighthouseScores).every(([key, score]) => {
              if (score === null) return true; // Skip PWA if not applicable
              return score >= thresholds[key];
            });
            
            lighthouseStatus = meetsThresholds ? 'PASS' : 'FAIL';
          }
        }
      }
    } catch (error) {
      console.warn('Error processing Lighthouse reports:', error.message);
    }
  }
  
  summary.details.lighthouse = {
    status: lighthouseStatus,
    scores: lighthouseScores
  };

  // Accessibility
  const axeAuth = readJsonFile(path.join(REPORTS_DIR, 'axe.auth.json'));
  summary.details.accessibility = {
    status: axeAuth ? 'COLLECTED' : 'ERROR',
    violations: axeAuth?.tests?.[0]?.results?.[0]?.violations?.length || 0
  };

  // Security headers
  const headers = readJsonFile(path.join(REPORTS_DIR, 'headers.json'));
  summary.details.headers = {
    status: headers?.allPresent ? 'PASS' : 'FAIL',
    missing: headers?.missing || [],
    present: headers?.requiredHeaders || {}
  };

  // Health check
  const healthz = readJsonFile(path.join(REPORTS_DIR, 'healthz.json'));
  summary.details.health = {
    status: healthz?.ok ? 'PASS' : 'FAIL',
    db: healthz?.db || 'unknown',
    responseTime: healthz?.responseTimeMs || null
  };

  // Overall status
  const statuses = [
    summary.details.links.public.status,
    summary.details.links.authenticated.status,
    summary.details.lighthouse.status,
    summary.details.headers.status,
    summary.details.health.status
  ];
  
  if (statuses.every(s => s === 'PASS')) {
    summary.overall = 'PASS';
  } else if (statuses.some(s => s === 'FAIL')) {
    summary.overall = 'FAIL';
  } else {
    summary.overall = 'WARN';
  }

  return summary;
}

function generateHTML(summary) {
  const getStatusBadge = (status) => {
    const colors = {
      'PASS': '#22c55e',
      'FAIL': '#ef4444',
      'WARN': '#f59e0b',
      'ERROR': '#6b7280',
      'COLLECTED': '#3b82f6'
    };
    return `<span style="background: ${colors[status] || colors.ERROR}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${status}</span>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pre-deployment Check Results</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
        .metric:last-child { border-bottom: none; }
        .score { font-size: 24px; font-weight: bold; }
        .links a { color: #3b82f6; text-decoration: none; }
        .links a:hover { text-decoration: underline; }
        .overall-${summary.overall.toLowerCase()} { border-left: 4px solid ${summary.overall === 'PASS' ? '#22c55e' : summary.overall === 'FAIL' ? '#ef4444' : '#f59e0b'}; }
    </style>
</head>
<body>
    <div class="header overall-${summary.overall.toLowerCase()}">
        <h1>Pre-deployment Check Results</h1>
        <p><strong>Overall Status:</strong> ${getStatusBadge(summary.overall)}</p>
        <p><strong>Generated:</strong> ${summary.timestamp}</p>
    </div>

    <div class="grid">
        <div class="section">
            <h2>🔗 Link Validation</h2>
            <div class="metric">
                <span>Public Pages</span>
                <span>${getStatusBadge(summary.details.links.public.status)}</span>
            </div>
            <div class="metric">
                <span>Authenticated Pages</span>
                <span>${getStatusBadge(summary.details.links.authenticated.status)}</span>
            </div>
            ${summary.details.links.public.total ? `
            <div class="metric">
                <span>Total Links Checked</span>
                <span>${summary.details.links.public.total}</span>
            </div>
            <div class="metric">
                <span>Failed Links</span>
                <span style="color: ${summary.details.links.public.failed > 0 ? '#ef4444' : '#22c55e'}">${summary.details.links.public.failed}</span>
            </div>
            ` : ''}
        </div>

        <div class="section">
            <h2>🚀 Lighthouse Performance</h2>
            <div class="metric">
                <span>Status</span>
                <span>${getStatusBadge(summary.details.lighthouse.status)}</span>
            </div>
            ${Object.entries(summary.details.lighthouse.scores).map(([key, score]) => 
              score !== null ? `
              <div class="metric">
                  <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span class="score" style="color: ${score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444'}">${score}</span>
              </div>` : ''
            ).join('')}
        </div>

        <div class="section">
            <h2>♿ Accessibility</h2>
            <div class="metric">
                <span>Status</span>
                <span>${getStatusBadge(summary.details.accessibility.status)}</span>
            </div>
            <div class="metric">
                <span>Violations Found</span>
                <span style="color: ${summary.details.accessibility.violations > 0 ? '#ef4444' : '#22c55e'}">${summary.details.accessibility.violations}</span>
            </div>
        </div>

        <div class="section">
            <h2>🔒 Security Headers</h2>
            <div class="metric">
                <span>Status</span>
                <span>${getStatusBadge(summary.details.headers.status)}</span>
            </div>
            ${Object.entries(summary.details.headers.present || {}).map(([header, present]) => `
            <div class="metric">
                <span>${header}</span>
                <span style="color: ${present ? '#22c55e' : '#ef4444'}">${present ? '✓' : '✗'}</span>
            </div>`).join('')}
        </div>

        <div class="section">
            <h2>💚 Health Check</h2>
            <div class="metric">
                <span>Status</span>
                <span>${getStatusBadge(summary.details.health.status)}</span>
            </div>
            <div class="metric">
                <span>Database</span>
                <span style="color: ${summary.details.health.db === 'up' ? '#22c55e' : '#ef4444'}">${summary.details.health.db}</span>
            </div>
            ${summary.details.health.responseTime ? `
            <div class="metric">
                <span>Response Time</span>
                <span>${summary.details.health.responseTime}ms</span>
            </div>` : ''}
        </div>
    </div>

    <div class="section">
        <h2>📄 Raw Reports</h2>
        <div class="links">
            <p><a href="linkinator.public.json">Public Links Report</a></p>
            <p><a href="links.auth.json">Authenticated Links Report</a></p>
            <p><a href="lhci/">Lighthouse Reports</a></p>
            <p><a href="axe.auth.json">Accessibility Report</a></p>
            <p><a href="headers.json">Security Headers Report</a></p>
            <p><a href="healthz.json">Health Check Report</a></p>
            <p><a href="summary.json">Summary JSON</a></p>
        </div>
    </div>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(REPORTS_DIR)) {
    console.error('Reports directory not found');
    process.exit(1);
  }

  const summary = generateSummary();
  const html = generateHTML(summary);

  // Write summary.json
  fs.writeFileSync(path.join(REPORTS_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  
  // Write index.html
  fs.writeFileSync(path.join(REPORTS_DIR, 'index.html'), html);

  console.log('Reports aggregated successfully');
  console.log(`Overall status: ${summary.overall}`);

  // Exit with error code if checks failed
  if (summary.overall === 'FAIL') {
    process.exit(1);
  }
}

main();