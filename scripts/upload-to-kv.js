const { createClient } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function uploadToKV() {
  try {
    // التحقق من وجود KV credentials
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      throw new Error('KV credentials not found in .env.local. Please add KV_REST_API_URL and KV_REST_API_TOKEN');
    }

    // إنشاء KV client
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });

    // قراءة ملف menu.json المحلي
    const dataPath = path.join(__dirname, '..', 'data', 'menu.json');
    const jsonData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(jsonData);

    console.log('📤 Uploading menu data to Vercel KV...');
    console.log(`📊 Data summary: ${data.admins.length} admins, ${data.lists.length} lists, ${data.items.length} items`);

    // رفع البيانات إلى Vercel KV
    await kv.set('menu-database', data);

    console.log('✅ Upload successful!');
    console.log('🚀 Data is now stored in Vercel KV (Redis) - Ultra fast!');

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadToKV();
