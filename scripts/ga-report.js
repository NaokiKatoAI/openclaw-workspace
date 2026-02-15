#!/usr/bin/env node
/**
 * GA4 レポート取得スクリプト
 * 使い方:
 *   node scripts/ga-report.js              # 昨日のレポート
 *   node scripts/ga-report.js 7            # 過去7日間
 *   node scripts/ga-report.js 30           # 過去30日間
 */

const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');

const PROPERTY_ID = '523655167';
const CREDENTIALS_PATH = path.join(__dirname, '../showa-filter-app/.ga-credentials.json');

async function getReport(days = 1) {
  const client = new BetaAnalyticsDataClient({
    keyFilename: CREDENTIALS_PATH,
  });

  const startDate = days === 1 ? 'yesterday' : `${days}daysAgo`;
  const endDate = days === 1 ? 'yesterday' : 'yesterday';

  // 基本指標
  const [basicResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
  });

  // 参照元
  const [referrerResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  });

  // ページ別PV
  const [pageResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });

  // デバイス別
  const [deviceResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  });

  // 地域別
  const [geoResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'city' }, { name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 10,
  });

  // イベント（プランクリックなど）
  const [eventResponse] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'CONTAINS',
          value: 'plan_click',
        },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
  });

  // 結果整形
  const basic = basicResponse.rows?.[0]?.metricValues || [];
  const pv = basic[0]?.value || '0';
  const users = basic[1]?.value || '0';
  const newUsers = basic[2]?.value || '0';
  const sessions = basic[3]?.value || '0';
  const avgDuration = parseFloat(basic[4]?.value || '0').toFixed(1);
  const bounceRate = (parseFloat(basic[5]?.value || '0') * 100).toFixed(1);

  const periodLabel = days === 1 ? '昨日' : `過去${days}日間`;

  let report = `📊 **昭和Pictures アクセスレポート（${periodLabel}）**\n\n`;
  report += `👥 ユーザー数: **${users}** （新規: ${newUsers}）\n`;
  report += `📄 ページビュー: **${pv}**\n`;
  report += `🔗 セッション数: **${sessions}**\n`;
  report += `⏱️ 平均滞在時間: **${avgDuration}秒**\n`;
  report += `↩️ 直帰率: **${bounceRate}%**\n`;

  // デバイス
  if (deviceResponse.rows?.length) {
    report += `\n📱 **デバイス別**\n`;
    for (const row of deviceResponse.rows) {
      const device = row.dimensionValues[0].value;
      const count = row.metricValues[0].value;
      const emoji = device === 'mobile' ? '📱' : device === 'desktop' ? '💻' : '📟';
      report += `${emoji} ${device}: ${count}人\n`;
    }
  }

  // 参照元
  if (referrerResponse.rows?.length) {
    report += `\n🔍 **参照元 TOP5**\n`;
    for (const row of referrerResponse.rows.slice(0, 5)) {
      const source = row.dimensionValues[0].value;
      const count = row.metricValues[0].value;
      report += `- ${source}: ${count}セッション\n`;
    }
  }

  // ページ別
  if (pageResponse.rows?.length) {
    report += `\n📄 **ページ別PV TOP5**\n`;
    for (const row of pageResponse.rows.slice(0, 5)) {
      const page = row.dimensionValues[0].value;
      const count = row.metricValues[0].value;
      report += `- ${page}: ${count}PV\n`;
    }
  }

  // 地域別
  if (geoResponse.rows?.length) {
    report += `\n📍 **地域別**\n`;
    for (const row of geoResponse.rows.slice(0, 5)) {
      const city = row.dimensionValues[0].value;
      const country = row.dimensionValues[1].value;
      const count = row.metricValues[0].value;
      report += `- ${city}(${country}): ${count}人\n`;
    }
  }

  // プランクリック
  if (eventResponse.rows?.length) {
    report += `\n💳 **プランクリック数**\n`;
    for (const row of eventResponse.rows) {
      const event = row.dimensionValues[0].value;
      const count = row.metricValues[0].value;
      const label = event.replace('plan_click_', '').replace('free', '🆓無料').replace('light', '⭐ライト').replace('pro', '👑プロ');
      report += `- ${label}: ${count}回\n`;
    }
  } else {
    report += `\n💳 プランクリック: データなし\n`;
  }

  return report;
}

// CLI実行
const days = parseInt(process.argv[2]) || 1;
getReport(days)
  .then((report) => {
    console.log(report);
  })
  .catch((err) => {
    console.error('GA4レポート取得エラー:', err.message);
    process.exit(1);
  });
