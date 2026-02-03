#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const SECRETS_PATH = path.join(process.env.HOME, '.openclaw/notion-secrets.json');

function loadSecrets() {
  return JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf8'));
}

function notionRequest(endpoint, options = {}) {
  const secrets = loadSecrets();
  
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.notion.com',
      path: endpoint,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${secrets.notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`Notion API Error: ${parsed.message || data}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

function normalizeId(input) {
  if (input.includes('notion.so/')) {
    const match = input.match(/([a-f0-9]{32})|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
    if (match) {
      return match[0].replace(/-/g, '');
    }
  }
  return input.replace(/-/g, '');
}

async function queryDatabase(databaseId) {
  const id = normalizeId(databaseId);
  const response = await notionRequest(`/v1/databases/${id}/query`, {
    method: 'POST',
    body: {}
  });
  
  console.log('📊 データベース内のクライアントページ:\n');
  
  response.results.forEach(page => {
    const title = page.properties['クライアント名']?.title?.[0]?.plain_text || 
                  page.properties.Name?.title?.[0]?.plain_text || 
                  page.properties.名前?.title?.[0]?.plain_text ||
                  page.properties.title?.title?.[0]?.plain_text ||
                  '(タイトルなし)';
    
    console.log(`📄 ${title}`);
    console.log(`   ID: ${page.id}`);
    console.log(`   URL: https://notion.so/${page.id.replace(/-/g, '')}`);
    console.log('');
  });
  
  return response.results;
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('使い方: node scripts/notion-db-query.js <databaseUrl>');
  process.exit(1);
}

queryDatabase(args[0]);
