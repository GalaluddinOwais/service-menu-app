# Quick Start Guide

## Installation
```bash
npm install
npm run dev
```

## Create Your First Admin

### Option 1: Using the Script (Easiest)
```bash
node scripts/create-admin.js
```
Follow the prompts to create your admin account.

### Option 2: Using API
```bash
# Using curl
curl -X POST http://localhost:3000/api/admins \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","theme":"ocean"}'

# Using PowerShell (Windows)
Invoke-RestMethod -Uri "http://localhost:3000/api/admins" -Method Post -ContentType "application/json" -Body '{"username":"admin","password":"admin123","theme":"ocean"}'
```

## Login
1. Go to `http://localhost:3000/login`
2. Enter credentials (e.g., username: `admin`, password: `admin123`)
3. Click "تسجيل الدخول" (Login)

## Create Your Menu
1. Add a new list (e.g., "Drinks Menu")
2. Specify item type (e.g., "Drink")
3. Add items to your list with prices
4. Customize your theme and settings

## View Your Public Menu
Your menu is available at: `http://localhost:3000/menu/[username]`
Example: `http://localhost:3000/menu/admin`

## Features
- 5 Beautiful themes (Ocean, Sunset, Forest, Royal, Rose)
- Multi-user support
- Custom logo and background
- Responsive design
- Easy to use

## Available Themes
- `ocean` - Cyan/Blue
- `sunset` - Orange/Red
- `forest` - Green/Emerald
- `royal` - Purple/Violet
- `rose` - Pink/Rose

---
Built with Next.js 15, TypeScript, and TailwindCSS
