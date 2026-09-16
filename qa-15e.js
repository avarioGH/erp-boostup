const fs = require('fs');
const https = require('https');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im93bmVyIiwic3ViIjoiNmE5ODcxMTQ3NzBlMGE1NDg4Mzc3MGIzIiwicm9sZSI6Ik93bmVyIiwiY29tcGFueV9pZCI6IjZhOTg3MTE0NzcwZTBhNTQ4ODM3NzBiMSIsImlhdCI6MTc4OTI1NjQ4MiwiZXhwIjoxNzg5MzQyODgyfQ.6sr5upnwPWj3Ok8EV4Ixoolqzh-LBkR4XFIgBgK8NF4';
const baseURL = 'https://api.erp.boostup.id/production/reports';

const endpoints = [
  '/summary',
  '/rendement',
  '/products',
  '/shifts',
  '/chamber',
  '/daily',
  '/reconciliation',
  '/data-quality'
];

async function runQA() {
  console.log('Starting QA for Phase 15E...');
  for (const ep of endpoints) {
    try {
      const res = await fetch(baseURL + ep, {
        method: 'GET',
        headers: {
          'Authorization': \Bearer \\
        }
      });
      
      console.log(\\n==> GET \\);
      console.log(\Status: \\);
      
      if (res.status === 200) {
        const data = await res.json();
        console.log(\Success. Data keys: \\);
        
        if (ep === '/summary') {
          console.log(\Summary Data: \...\);
        }
        if (ep === '/rendement') {
           console.log(\Rendement Data rows: \\);
        }
      } else {
        const err = await res.text();
        console.log(\Error Response: \\);
      }
    } catch (e) {
      console.error(\Failed to fetch \: \\);
    }
  }
}

runQA();
