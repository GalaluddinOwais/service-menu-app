const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function uploadToBlob() {
  try {
    // التحقق من وجود token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN not found in .env.local');
    }

    // قراءة ملف menu.json المحلي
    const dataPath = path.join(__dirname, '..', 'data', 'menu.json');
    const jsonData = fs.readFileSync(dataPath, 'utf-8');

    // التحقق من صحة JSON
    JSON.parse(jsonData);

    console.log('📤 Uploading menu data to Vercel Blob...');

    // رفع البيانات إلى Vercel Blob
    const blob = await put('menu-database.json', jsonData, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      allowOverwrite: true
    });

    console.log('✅ Upload successful!');
    console.log('📍 Blob URL:', blob.url);
    console.log('🔗 Download URL:', blob.downloadUrl);

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadToBlob();
