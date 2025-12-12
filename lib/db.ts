import { put, head } from '@vercel/blob';
// Vercel Blob Storage Integration - v2
export interface Admin {
  id: string;
  username: string; // اسم فريد
  password: string;
  logoUrl?: string; // رابط الشعار
  backgroundUrl?: string; // رابط الخلفية
  theme: 'ocean' | 'sunset' | 'forest' | 'royal' | 'rose'; // السمة
  welcomeMessage?: string; // رسالة ترحيبية تظهر بعد الشعار
  contactMessage?: string; // رسالة تواصل تظهر بعد كل قائمة
}

export interface MenuList {
  id: string;
  name: string;
  itemType: string;
  adminId: string; // معرف الأدمن المالك للقائمة
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string; // وصف العنصر (يدعم multi-line)
  listId: string;
}

interface Database {
  admins: Admin[];
  lists: MenuList[];
  items: MenuItem[];
}

// السمات المتاحة
export const THEMES = {
  ocean: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#3b82f6' },
  sunset: { primary: '#f97316', secondary: '#fb923c', accent: '#dc2626' },
  forest: { primary: '#10b981', secondary: '#34d399', accent: '#059669' },
  royal: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#7c3aed' },
  rose: { primary: '#ec4899', secondary: '#f472b6', accent: '#db2777' },
};

const BLOB_FILENAME = 'menu-database.json';

async function readDB(): Promise<Database> {
  try {
    // محاولة قراءة البيانات من Vercel Blob
    const blobInfo = await head(BLOB_FILENAME);
    if (blobInfo && blobInfo.url) {
      const response = await fetch(blobInfo.url);
      const data = await response.text();
      return JSON.parse(data);
    }
  } catch (error) {
    // إذا لم يوجد الملف، نعيد قاعدة بيانات فارغة
  }
  return { admins: [], lists: [], items: [] };
}

async function writeDB(db: Database): Promise<void> {
  const jsonData = JSON.stringify(db, null, 2);
  await put(BLOB_FILENAME, jsonData, {
    access: 'public',
    addRandomSuffix: false // للحفاظ على نفس اسم الملف
  });
}

// دوال إدارة القوائم
export async function getMenuLists(): Promise<MenuList[]> {
  const db = await readDB();
  return db.lists;
}

export async function getMenuList(id: string): Promise<MenuList | null> {
  const db = await readDB();
  return db.lists.find(list => list.id === id) || null;
}

export async function createMenuList(list: Omit<MenuList, 'id'>): Promise<MenuList> {
  const db = await readDB();
  const newList: MenuList = {
    ...list,
    id: Date.now().toString(),
  };
  db.lists.push(newList);
  await writeDB(db);
  return newList;
}

export async function updateMenuList(id: string, updates: Partial<MenuList>): Promise<MenuList | null> {
  const db = await readDB();
  const index = db.lists.findIndex(list => list.id === id);
  if (index === -1) return null;

  db.lists[index] = { ...db.lists[index], ...updates, id };
  await writeDB(db);
  return db.lists[index];
}

export async function deleteMenuList(id: string): Promise<boolean> {
  const db = await readDB();
  const filteredLists = db.lists.filter(list => list.id !== id);
  if (filteredLists.length === db.lists.length) return false;

  // حذف جميع العناصر التابعة لهذه القائمة
  db.lists = filteredLists;
  db.items = db.items.filter(item => item.listId !== id);
  await writeDB(db);
  return true;
}

// دوال إدارة العناصر
export async function getMenuItems(listId?: string): Promise<MenuItem[]> {
  const db = await readDB();
  if (listId) {
    return db.items.filter(item => item.listId === listId);
  }
  return db.items;
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  const db = await readDB();
  return db.items.find(item => item.id === id) || null;
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const db = await readDB();
  const newItem: MenuItem = {
    ...item,
    id: Date.now().toString(),
  };
  db.items.push(newItem);
  await writeDB(db);
  return newItem;
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
  const db = await readDB();
  const index = db.items.findIndex(item => item.id === id);
  if (index === -1) return null;

  db.items[index] = { ...db.items[index], ...updates, id };
  await writeDB(db);
  return db.items[index];
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const db = await readDB();
  const filteredItems = db.items.filter(item => item.id !== id);
  if (filteredItems.length === db.items.length) return false;

  db.items = filteredItems;
  await writeDB(db);
  return true;
}

// دوال إدارة الأدمن
export async function getAdmins(): Promise<Admin[]> {
  const db = await readDB();
  return db.admins;
}

export async function getAdmin(id: string): Promise<Admin | null> {
  const db = await readDB();
  return db.admins.find(admin => admin.id === id) || null;
}

export async function getAdminByUsername(username: string): Promise<Admin | null> {
  const db = await readDB();
  return db.admins.find(admin => admin.username === username) || null;
}

export async function createAdmin(admin: Omit<Admin, 'id'>): Promise<Admin> {
  const db = await readDB();

  // التحقق من عدم تكرار اسم المستخدم
  const existing = db.admins.find(a => a.username === admin.username);
  if (existing) {
    throw new Error('Username already exists');
  }

  const newAdmin: Admin = {
    ...admin,
    id: Date.now().toString(),
  };
  db.admins.push(newAdmin);
  await writeDB(db);
  return newAdmin;
}

export async function updateAdmin(id: string, updates: Partial<Admin>): Promise<Admin | null> {
  const db = await readDB();
  const index = db.admins.findIndex(admin => admin.id === id);
  if (index === -1) return null;

  db.admins[index] = { ...db.admins[index], ...updates, id };
  await writeDB(db);
  return db.admins[index];
}

export async function deleteAdmin(id: string): Promise<boolean> {
  const db = await readDB();
  const filteredAdmins = db.admins.filter(admin => admin.id !== id);
  if (filteredAdmins.length === db.admins.length) return false;

  // حذف جميع القوائم والعناصر التابعة لهذا الأدمن
  db.admins = filteredAdmins;
  const adminLists = db.lists.filter(list => list.adminId === id).map(l => l.id);
  db.lists = db.lists.filter(list => list.adminId !== id);
  db.items = db.items.filter(item => !adminLists.includes(item.listId));
  await writeDB(db);
  return true;
}
