/*
 * DATABASE STORAGE - اختيار طريقة التخزين
 *
 * للتطوير المحلي (Local Development):
 * - استخدم: import { promises as fs } from 'fs';
 * - استخدم: const DB_FILE = path.join(process.cwd(), 'data', 'menu.json');
 * - readDB/writeDB تقرأ وتكتب من/إلى ملف JSON
 *
 * للنشر على Vercel (Production):
 * - غيّر: import { kv } from '@vercel/kv';
 * - غيّر: const KV_KEY = 'menu-database';
 * - readDB: const data = await kv.get<Database>(KV_KEY);
 * - writeDB: await kv.set(KV_KEY, db);
 */

import { kv } from '@vercel/kv';
// import { promises as fs } from 'fs';
// import path from 'path';
// Vercel KV Storage - للنشر على Vercel
export interface Admin {
  id: string;
  name?: string; // الاسم الحقيقي
  username: string; // اسم فريد
  password: string;
  logoUrl?: string; // رابط الشعار
  backgroundUrl?: string; // رابط الخلفية
  theme: 'ocean' | 'sunset' | 'forest' | 'royal' | 'rose' | 'midnight' | 'coral' | 'emerald' | 'lavender' | 'crimson' | 'coffee' | 'canary'; // السمة
  cardStyle?: 'rounded' | 'sharp' | 'bordered' | 'modern' | 'soft' | 'fancy'; // شكل الكارد
  fontFamily?: 'cairo' | 'baloo-bhaijaan' | 'zain'; // الخط
  welcomeMessage?: string; // رسالة ترحيبية تظهر بعد الشعار
  contactMessage?: string; // رسالة تواصل تظهر بعد كل قائمة
  whatsappNumber?: string; // رقم الواتساب
  isAcceptingOrders?: boolean; // تفعيل الطلب من الموقع
  isAcceptingOrdersViaWhatsapp?: boolean; // تفعيل الطلب عبر واتساب
  isAcceptingTableOrders?: boolean; // تفعيل طلبات الطاولة
  tablesCount?: number; // عدد الطاولات المتاحة
  showDeliveryStaff?: boolean; // إظهار قائمة الموظفين في طلبات التوصيل
  showWaiterStaff?: boolean; // إظهار قائمة الموظفين في طلبات الطاولات
  enableDeliveryEmployees?: boolean; // تفعيل عمال التوصيل
  enableWaiters?: boolean; // تفعيل الندلاء
  showWaitersAnyway?: boolean; // إظهار الندلاء في الطلبات حتى لو معطلين
  defaultDeliveryAssignment?: 'ANY_DELIVERY' | ''; // القيمة الافتراضية لعامل التوصيل في الطلبات الجديدة

  // Subscription Info
  plan: 'free' | 'basic' | 'pro' | 'business';
  subscriptionEndsAt?: string; // ISO Date string

  // عدّادات الطلبات حسب المصدر والتعيين (لجميع الباقات)
  websiteOrdersCount?: number;
  whatsappOrdersCount?: number;
  AnyDeliveryOrdersCount?: number;
  WithoutDeliveryOrdersCount?: number;

  // إحصائيات طلبات التوصيل والطاولة (باقة البزنس فقط): عدّادات انتقال من→إلى (القيمة = مجموع الأوزان)
  deliveryAssignedCount?: number;
  deliveryForward12?: number;
  deliveryForward13?: number;
  deliveryForward14?: number;
  deliveryForward23?: number;
  deliveryForward24?: number;
  deliveryForward34?: number;
  deliveryDowngrade43?: number;
  deliveryDowngrade42?: number;
  deliveryDowngrade41?: number;
  deliveryDowngrade32?: number;
  deliveryDowngrade31?: number;
  deliveryDowngrade21?: number;
  tableAssignedCount?: number;
  tableForward12?: number;
  tableForward13?: number;
  tableForward14?: number;
  tableForward23?: number;
  tableForward24?: number;
  tableForward34?: number;
  tableDowngrade43?: number;
  tableDowngrade42?: number;
  tableDowngrade41?: number;
  tableDowngrade32?: number;
  tableDowngrade31?: number;
  tableDowngrade21?: number;

  // إعدادات تقييم العاملين (باقة البزنس فقط)
  employeeRatingEnable?: boolean;
  employeeRatingScaleDeliveryForward?: number;
  employeeRatingScaleDeliveryBackward?: number;
  employeeRatingScaleTableForward?: number;
  employeeRatingScaleTableBackward?: number;
  employeeRatingTendencyX?: number;

  /** إحصائيات الطلبات للباقة Pro: عدادات وجوامع (تُحدَّث عند الإنشاء/الحذف/تغيير الحالة النهائية) */
  proOrderStats?: {
    countWhatsapp: number;
    countWebsite: number;
    countTable: number;
    sumPriceWhatsapp: number;
    sumPriceWebsite: number;
    sumPriceTable: number;
    sumDiscountWhatsapp: number;
    sumDiscountWebsite: number;
    sumDiscountTable: number;
    completedDeliveryWhatsapp: number;
    completedDeliveryWebsite: number;
    completedTable: number;
    /** الأسعار التامة (باقة Pro فقط) — تُزاد عند إتمام الطلب، تُطرح عند التأخير أو المسح */
    sumCompletedPriceWhatsapp: number;
    sumCompletedPriceWebsite: number;
    sumCompletedPriceTable: number;
    /** الخصومات التامة (باقة Pro فقط) */
    sumCompletedDiscountWhatsapp: number;
    sumCompletedDiscountWebsite: number;
    sumCompletedDiscountTable: number;
  };

  /** أكثر المنتجات طلباً (باقة البزنس فقط): كميات وإيرادات تُحدَّث عند إنشاء/حذف الطلبات */
  itemSalesStats?: Record<string, { quantity: number; revenue: number }>;

  /** كاش الطلبات والإيراد عبر الزمن (باقة Basic+): إتمام فقط، يُحدَّث بالإلحاق عند انتهاء صلاحية الكاش، ويُطرح عند الحذف أو تراجع الحالة */
  ordersOverTimeCache?: {
    cachedAt: string; // ISO
    delivery: Record<string, { completedCount: number; revenue: number; customerSaved: number }>; // key = YYYY-MM-DD
    table: Record<string, { completedCount: number; revenue: number; customerSaved: number }>;
  };

  /** كاش إحصائيات الفريق (سكشن العاملين في ملخص النشاط) — يُحدَّث كل 24 ساعة */
  adminCachedStats?: {
    team?: {
      cachedAt: string; // ISO
      users: Array<{ id: string; name: string; userType: 'admin' | 'employee'; stats: UserStats }>;
    };
  };
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
  discountedPrice?: number; // السعر بعد الخصم إن وجد
  imageUrl?: string; // رابط صورة العنصر
  description?: string; // وصف العنصر (يدعم multi-line)
  listId: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  adminId: string;
  orderType: 'website' | 'whatsapp';
  items: OrderItem[];
  totalPrice: number;
  totalDiscount: number;
  customerName?: string; // اسم العميل (للطلبات من الموقع/واتساب)
  customerPhone?: string; // رقم العميل — معرف العميل ضمن الأدمن
  customerAddress?: string; // عنوان العميل
  createdAt: string;
  status?: 'pending' | 'read' | 'delivering' | 'delivered'; // حالة الطلب
  assignedTo?: string; // معرف العامل المسؤول عن الطلب
  assignedEmployee?: { id: string; name: string }; // بيانات العامل المعيّن (يتم إضافتها عند الجلب)
}

/** عميل أدمن — الرقم + الأدمن فريدان معاً؛ عداد الطلبات يُحدَّث عند الإنشاء/الحذف/تغيير الرقم */
export interface Customer {
  adminId: string;
  phone: string;
  name: string;
  address: string;
  orderCount: number;
}

/** كاش إحصائيات عميل (باقة Business) — يُبطَل عند الطلب الجديد أو الحذف أو تغيير الرقم */
export interface CustomerBusinessStats {
  orders: Order[];
  topItems: { name: string; count: number }[];
  lastOrderAt: string | null;
  totalPaid: number;
  totalSaved: number;
}

export interface TableOrder {
  id: string;
  adminId: string;
  tableNumber: number; // رقم الطاولة
  items: OrderItem[];
  totalPrice: number;
  totalDiscount: number;
  createdAt: string;
  status?: 'pending' | 'read' | 'served' | 'completed'; // حالة الطلب
  assignedTo?: string; // معرف العامل المسؤول عن الطلب
  assignedEmployee?: { id: string; name: string }; // بيانات العامل المعيّن (يتم إضافتها عند الجلب)
}

export interface Employee {
  id: string;
  adminId: string; // معرف الأدمن المالك
  name: string;
  username: string; // اسم فريد لتسجيل الدخول
  password: string;
  isDelivery: boolean; // موصل - يظهر في طلبات التوصيل
  isWaiter: boolean; // نادل - يظهر في طلبات الطاولات
  createdAt: string;
  /** صورة العامل (اختياري) - يُرفع عند الإضافة/التحديث */
  imageUrl?: string;
  /** رقم العامل (اختياري) */
  employeeNumber?: string;
  /** رقم الهاتف (اختياري) */
  phone?: string;

  // إحصائيات طلبات التوصيل والطاولة (باقة البزنس فقط): عدّادات انتقال من→إلى (القيمة = مجموع الأوزان)
  deliveryAssignedCount?: number;
  deliveryForward12?: number;
  deliveryForward13?: number;
  deliveryForward14?: number;
  deliveryForward23?: number;
  deliveryForward24?: number;
  deliveryForward34?: number;
  deliveryDowngrade43?: number;
  deliveryDowngrade42?: number;
  deliveryDowngrade41?: number;
  deliveryDowngrade32?: number;
  deliveryDowngrade31?: number;
  deliveryDowngrade21?: number;
  tableAssignedCount?: number;
  tableForward12?: number;
  tableForward13?: number;
  tableForward14?: number;
  tableForward23?: number;
  tableForward24?: number;
  tableForward34?: number;
  tableDowngrade43?: number;
  tableDowngrade42?: number;
  tableDowngrade41?: number;
  tableDowngrade32?: number;
  tableDowngrade31?: number;
  tableDowngrade21?: number;

  /** كاش تقييم الموظف (نقاط، كفاءة، ترتيبات) — يُحدَّث عند طلب rating-info إذا تجاوز 24 ساعة */
  ratingInfoCache?: {
    cachedAt: string; // ISO
    points: number;
    efficiency: number;
    rank?: number;
    rankAmongDelivery?: number;
    rankAmongWaiters?: number;
  };
  /** لون العامل (باقة البزنس) — للدونات/الفطائر في ملخص النشاط؛ إن لم يُرسَل يُعيَّن عشوائياً */
  color?: string;
}

// لوجز تغيير حالة الطلبات (باقة البزنس فقط)
export interface DeliveryOrderStatusLog {
  id: string;
  adminId: string;
  userId: string; // معرف من قام بالتغيير (adminId أو employeeId)
  userType: 'admin' | 'employee';
  orderId: string;
  fromStatus: number; // 1-4: جديد=1، مقروء=2، قيد التوصيل=3، تم=4
  toStatus: number;
  createdAt: string;
}

export interface TableOrderStatusLog {
  id: string;
  adminId: string;
  userId: string;
  userType: 'admin' | 'employee';
  orderId: string;
  fromStatus: number; // 1-4: جديد=1، مقروء=2، تم التقديم=3، مكتمل=4
  toStatus: number;
  createdAt: string;
}

interface Database {
  admins: Admin[];
  lists: MenuList[];
  items: MenuItem[];
  orders: Order[];
  tableOrders: TableOrder[];
  employees: Employee[];
  customers: Customer[];
  deliveryOrderStatusLogs: DeliveryOrderStatusLog[];
  tableOrderStatusLogs: TableOrderStatusLog[];
  /** كاش إحصائيات العملاء (adminId -> phone -> { cachedAt, data }) — باقة Business فقط */
  customerStatsCache?: Record<string, Record<string, { cachedAt: string; data: CustomerBusinessStats }>>;
  /** طلبات اشتراك معلقة (order_id من بوابة الدفع -> { adminId, plan }) للربط عند استلام الـ webhook */
  subscriptionPending?: Record<string, { adminId: string; plan: 'basic' | 'pro' | 'business' }>;
}

// السمات المتاحة
export const THEMES = {
  ocean: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#3b82f6' },
  sunset: { primary: '#f97316', secondary: '#fb923c', accent: '#dc2626' },
  forest: { primary: '#10b981', secondary: '#34d399', accent: '#059669' },
  royal: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#7c3aed' },
  rose: { primary: '#ec4899', secondary: '#f472b6', accent: '#db2777' },
  midnight: { primary: '#1e293b', secondary: '#475569', accent: '#0f172a' },
  coral: { primary: '#ff6b6b', secondary: '#ff8787', accent: '#fa5252' },
  emerald: { primary: '#2dd4bf', secondary: '#5eead4', accent: '#14b8a6' },
  lavender: { primary: '#a78bfa', secondary: '#c4b5fd', accent: '#8b5cf6' },
  crimson: { primary: '#dc2626', secondary: '#ef4444', accent: '#b91c1c' },
  coffee: { primary: '#92400e', secondary: '#b45309', accent: '#78350f' },
  canary: { primary: '#eab308', secondary: '#facc15', accent: '#ca8a04' },
};

// أشكال الكروت المتاحة
export const CARD_STYLES = {
  rounded: {
    borderRadius: '1rem', // rounded-2xl
    shadow: 'shadow-lg hover:shadow-2xl',
    border: 'border-0',
    special: ''
  },
  sharp: {
    borderRadius: '0', // sharp corners
    shadow: 'shadow-md hover:shadow-xl',
    border: 'border-2 border-gray-200',
    special: ''
  },
  bordered: {
    borderRadius: '0.75rem', // rounded-xl
    shadow: 'shadow-lg hover:shadow-xl',
    border: 'border-4',
    special: 'theme-border' // سيتم تطبيق لون السمة
  },
  modern: {
    borderRadius: '0.5rem', // rounded-lg
    shadow: 'shadow-sm hover:shadow-lg',
    border: 'border-0',
    special: ''
  },
  soft: {
    borderRadius: '2rem', // أكثر دائرية
    shadow: 'shadow-md hover:shadow-xl',
    border: 'border-0',
    special: ''
  },
  fancy: {
    borderRadius: '1.25rem',
    shadow: 'shadow-2xl hover:shadow-3xl',
    border: 'border-2 border-dashed',
    special: 'theme-border-dashed' // إطار متقطع بلون السمة
  },
};

const KV_KEY = 'menu-database';

async function readDB(): Promise<Database> {
  try {
    const data = await kv.get<Database>(KV_KEY);
    if (!data) {
      return { admins: [], lists: [], items: [], orders: [], tableOrders: [], employees: [], customers: [], deliveryOrderStatusLogs: [], tableOrderStatusLogs: [], customerStatsCache: {}, subscriptionPending: {} };
    }
    if (!data.tableOrders) data.tableOrders = [];
    if (!data.employees) data.employees = [];
    if (!data.customers) data.customers = [];
    if (!data.deliveryOrderStatusLogs) data.deliveryOrderStatusLogs = [];
    if (!data.tableOrderStatusLogs) data.tableOrderStatusLogs = [];
    if (!data.customerStatsCache) data.customerStatsCache = {};
    if (!data.subscriptionPending) data.subscriptionPending = {};
    return data;
  } catch (error) {
    console.error('Error reading from KV:', error);
    return { admins: [], lists: [], items: [], orders: [], tableOrders: [], employees: [], customers: [], deliveryOrderStatusLogs: [], tableOrderStatusLogs: [], customerStatsCache: {}, subscriptionPending: {} };
  }
}

async function writeDB(db: Database): Promise<void> {
  try {
    await kv.set(KV_KEY, db);
  } catch (error) {
    console.error('Error writing to KV:', error);
    throw error;
  }
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

  // Check for username duplication if username is being updated
  if (updates.username && updates.username !== db.admins[index].username) {
    const existing = db.admins.find(a => a.username === updates.username && a.id !== id);
    if (existing) {
      throw new Error('Username already exists');
    }
  }

  db.admins[index] = { ...db.admins[index], ...updates, id };
  await writeDB(db);
  return db.admins[index];
}

/** حفظ طلب اشتراك معلق لربطه عند استلام webhook الدفع */
export async function setSubscriptionPending(
  orderId: string,
  data: { adminId: string; plan: 'basic' | 'pro' | 'business' }
): Promise<void> {
  const db = await readDB();
  if (!db.subscriptionPending) db.subscriptionPending = {};
  db.subscriptionPending[orderId] = data;
  await writeDB(db);
}

/** جلب وحذف طلب اشتراك معلق (بعد نجاح الدفع) */
export async function getAndClearSubscriptionPending(orderId: string): Promise<{ adminId: string; plan: 'basic' | 'pro' | 'business' } | null> {
  const db = await readDB();
  const pending = db.subscriptionPending?.[orderId] ?? null;
  if (pending && db.subscriptionPending) {
    delete db.subscriptionPending[orderId];
    await writeDB(db);
  }
  return pending;
}

/**
 * Check if admin's subscription plan is active at a given level.
 * If not, auto-disable the relevant features and save to DB.
 * Returns true if the plan is active at the required level.
 */
export async function checkPlanAndAutoDisable(
  admin: Admin,
  requiredPlan: 'basic' | 'pro' | 'business' = 'basic'
): Promise<boolean> {
  const planLevels = { free: 0, basic: 1, pro: 2, business: 3 };

  const isPlanActiveAt = (level: 'basic' | 'pro' | 'business') => {
    if (!admin.plan || admin.plan === 'free') return false;
    if (!admin.subscriptionEndsAt) return false;
    const expiryDate = new Date(admin.subscriptionEndsAt);
    if (expiryDate < new Date()) return false;
    return planLevels[admin.plan] >= planLevels[level];
  };

  // Auto-disable features regardless of requiredPlan
  const disableUpdates: Partial<Admin> = {};

  // basic+ features - disable if not active at basic
  if (!isPlanActiveAt('basic')) {
    if (admin.isAcceptingOrders) disableUpdates.isAcceptingOrders = false;
    if (admin.enableDeliveryEmployees) disableUpdates.enableDeliveryEmployees = false;
  }

  // pro+ features - disable if not active at pro
  if (!isPlanActiveAt('pro')) {
    if (admin.isAcceptingTableOrders) disableUpdates.isAcceptingTableOrders = false;
    if (admin.enableWaiters) disableUpdates.enableWaiters = false;
  }

  // Save changes if any features were disabled
  if (Object.keys(disableUpdates).length > 0) {
    await updateAdmin(admin.id, disableUpdates);
  }

  return isPlanActiveAt(requiredPlan);
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

// ==================== العملاء (adminId + phone فريدان) ====================

function getOrCreateCustomerInDb(
  db: Database,
  adminId: string,
  phone: string,
  name?: string,
  address?: string
): Customer {
  const normalized = String(phone).trim();
  if (!normalized) throw new Error('رقم العميل مطلوب');
  let customer = db.customers.find(c => c.adminId === adminId && c.phone === normalized);
  if (customer) {
    if (name !== undefined) customer.name = name;
    if (address !== undefined) customer.address = address;
    customer.orderCount = (customer.orderCount ?? 0) + 1;
    return customer;
  }
  customer = {
    adminId,
    phone: normalized,
    name: name ?? '',
    address: address ?? '',
    orderCount: 1,
  };
  db.customers.push(customer);
  return customer;
}

function decrementCustomerOrderCountInDb(db: Database, adminId: string, phone: string): void {
  const normalized = String(phone).trim();
  if (!normalized) return;
  const idx = db.customers.findIndex(c => c.adminId === adminId && c.phone === normalized);
  if (idx === -1) return;
  const customer = db.customers[idx];
  customer.orderCount = Math.max(0, (customer.orderCount ?? 1) - 1);
  if (customer.orderCount === 0) {
    db.customers.splice(idx, 1);
  }
}

function invalidateCustomerStatsCache(db: Database, adminId: string, phone: string): void {
  const p = String(phone).trim();
  if (!p || !db.customerStatsCache?.[adminId]) return;
  delete db.customerStatsCache[adminId][p];
}

// دوال إدارة الطلبات
export async function getOrders(
  adminId?: string,
  options?: {
    page?: number;
    limit?: number;
    status?: 'all' | 'pending' | 'read' | 'delivering' | 'delivered';
    orderType?: 'all' | 'website' | 'whatsapp';
    dateFilter?: 'all' | 'today' | 'week' | 'month';
    employeeId?: string;
  }
): Promise<{ orders: Order[]; total: number }> {
  const db = await readDB();

  // Filter by adminId
  let filtered = adminId
    ? db.orders.filter(order => order.adminId === adminId)
    : db.orders;

  // Apply status filter
  if (options?.status && options.status !== 'all') {
    filtered = filtered.filter(order => (order.status || 'pending') === options.status);
  }

  // Apply orderType filter
  if (options?.orderType && options.orderType !== 'all') {
    filtered = filtered.filter(order => order.orderType === options.orderType);
  }

  // Apply employeeId filter
  if (options?.employeeId !== undefined) {
    if (options.employeeId === '') {
      // Filter for orders with no assigned employee
      filtered = filtered.filter(order => !order.assignedTo);
    } else if (options.employeeId.startsWith('EMPLOYEE_ALL:')) {
      // Extract actual employee ID from EMPLOYEE_ALL:employeeId
      const actualEmployeeId = options.employeeId.substring(13); // Remove "EMPLOYEE_ALL:" prefix
      // Show orders assigned to this employee OR assigned to "ANY_DELIVERY"
      filtered = filtered.filter(order =>
        order.assignedTo === actualEmployeeId || order.assignedTo === 'ANY_DELIVERY'
      );
    } else if (options.employeeId === 'ANY_DELIVERY') {
      // Filter for orders assigned to ANY_DELIVERY only
      filtered = filtered.filter(order => order.assignedTo === 'ANY_DELIVERY');
    } else {
      // Filter for orders assigned to specific employee ONLY (no ANY_DELIVERY)
      // This is used for EMPLOYEE_MINE filter
      filtered = filtered.filter(order => order.assignedTo === options.employeeId);
    }
  }

  // Apply date filter
  if (options?.dateFilter && options.dateFilter !== 'all') {
    const now = new Date();
    const filterDate = new Date();

    if (options.dateFilter === 'today') {
      filterDate.setHours(0, 0, 0, 0);
    } else if (options.dateFilter === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (options.dateFilter === 'month') {
      filterDate.setDate(now.getDate() - 30);
    }

    filtered = filtered.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= filterDate;
    });
  }

  // Count total filtered orders
  const total = filtered.length;

  // Sort by createdAt descending (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Apply pagination if provided
  if (options?.page && options?.limit) {
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    filtered = filtered.slice(startIndex, endIndex);
  }

  // Add employee data to orders
  const ordersWithEmployees = filtered.map(order => {
    if (order.assignedTo) {
      const employee = db.employees.find(emp => emp.id === order.assignedTo);
      if (employee) {
        return {
          ...order,
          assignedEmployee: { id: employee.id, name: employee.name }
        };
      }
    }
    return order;
  });

  return { orders: ordersWithEmployees, total };
}

export async function getOrder(id: string): Promise<Order | null> {
  const db = await readDB();
  return db.orders.find(order => order.id === id) || null;
}

/** قائمة العملاء لأدمن مع pagination وبحث بالاسم/الرقم/العنوان */
export async function getCustomers(
  adminId: string,
  options: { page?: number; limit?: number; search?: string }
): Promise<{ customers: Customer[]; total: number }> {
  const db = await readDB();
  let list = db.customers.filter(c => c.adminId === adminId);
  const search = options.search?.trim().toLowerCase();
  if (search) {
    list = list.filter(
      c =>
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.phone && c.phone.toLowerCase().includes(search)) ||
        (c.address && c.address.toLowerCase().includes(search))
    );
  }
  const total = list.length;
  list = [...list].sort((a, b) => (b.orderCount ?? 0) - (a.orderCount ?? 0));
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, Math.min(50, options.limit ?? 10));
  const start = (page - 1) * limit;
  const customers = list.slice(start, start + limit);
  return { customers, total };
}

/** عميل واحد بالرقم والأدمن */
export async function getCustomerByPhone(adminId: string, phone: string): Promise<Customer | null> {
  const db = await readDB();
  const p = String(phone).trim();
  return db.customers.find(c => c.adminId === adminId && c.phone === p) || null;
}

/** إحصائيات عميل (باقة Business) — من الكاش أو محسوبة ثم تخزين في الكاش */
export async function getOrComputeCustomerBusinessStats(
  adminId: string,
  phone: string
): Promise<{ data: CustomerBusinessStats; fromCache: boolean }> {
  const db = await readDB();
  const p = String(phone).trim();
  if (!db.customerStatsCache) db.customerStatsCache = {};
  if (!db.customerStatsCache[adminId]) db.customerStatsCache[adminId] = {};
  const cached = db.customerStatsCache[adminId][p];
  if (cached?.data) {
    return { data: cached.data, fromCache: true };
  }
  const orders = db.orders.filter(o => o.adminId === adminId && (o.customerPhone ?? '').trim() === p);
  const itemCounts: Record<string, number> = {};
  let totalPaid = 0;
  let totalSaved = 0;
  let lastOrderAt: string | null = null;
  for (const o of orders) {
    totalPaid += o.totalPrice ?? 0;
    totalSaved += o.totalDiscount ?? 0;
    if (o.createdAt && (!lastOrderAt || o.createdAt > lastOrderAt)) lastOrderAt = o.createdAt;
    for (const it of o.items || []) {
      const name = it.name || '';
      if (name) itemCounts[name] = (itemCounts[name] || 0) + (it.quantity || 1);
    }
  }
  const topItems = Object.entries(itemCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  const data: CustomerBusinessStats = {
    orders,
    topItems,
    lastOrderAt,
    totalPaid,
    totalSaved
  };
  db.customerStatsCache[adminId][p] = { cachedAt: new Date().toISOString(), data };
  await writeDB(db);
  return { data, fromCache: false };
}

/** تحديث بيانات عميل الطلب (اسم، رقم، عنوان) مع ضبط عدادات العملاء */
export async function updateOrderDetails(
  orderId: string,
  updates: { customerName?: string; customerPhone?: string; customerAddress?: string }
): Promise<Order | null> {
  const db = await readDB();
  const orderIndex = db.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) return null;

  const order = db.orders[orderIndex];
  const adminId = order.adminId;
  const oldPhone = (order.customerPhone ?? '').trim();
  const newPhone = updates.customerPhone !== undefined ? String(updates.customerPhone).trim() : oldPhone;
  const newName = updates.customerName !== undefined ? String(updates.customerName).trim() : (order.customerName ?? '');
  const newAddress = updates.customerAddress !== undefined ? String(updates.customerAddress).trim() : (order.customerAddress ?? '');

  if (newPhone !== oldPhone) {
    if (oldPhone) {
      decrementCustomerOrderCountInDb(db, adminId, oldPhone);
      invalidateCustomerStatsCache(db, adminId, oldPhone);
    }
    if (newPhone) {
      getOrCreateCustomerInDb(db, adminId, newPhone, newName || undefined, newAddress || undefined);
      invalidateCustomerStatsCache(db, adminId, newPhone);
    }
  } else if (newPhone) {
    const cust = db.customers.find(c => c.adminId === adminId && c.phone === newPhone);
    if (cust) {
      if (updates.customerName !== undefined) cust.name = newName;
      if (updates.customerAddress !== undefined) cust.address = newAddress;
    }
  }

  db.orders[orderIndex] = {
    ...order,
    ...(updates.customerName !== undefined && { customerName: newName }),
    ...(updates.customerPhone !== undefined && { customerPhone: newPhone || undefined }),
    ...(updates.customerAddress !== undefined && { customerAddress: newAddress || undefined }),
  };
  await writeDB(db);
  return db.orders[orderIndex];
}

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const db = await readDB();
  let customerName = order.customerName;
  let customerPhone = order.customerPhone;
  let customerAddress = order.customerAddress;
  if (customerPhone && customerPhone.trim()) {
    const customer = getOrCreateCustomerInDb(
      db,
      order.adminId,
      customerPhone.trim(),
      customerName?.trim(),
      customerAddress?.trim()
    );
    customerName = customer.name;
    customerPhone = customer.phone;
    customerAddress = customer.address;
  }
  const newOrder: Order = {
    ...order,
    id: `order_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: order.status || 'pending',
    ...(customerName !== undefined && { customerName }),
    ...(customerPhone !== undefined && { customerPhone }),
    ...(customerAddress !== undefined && { customerAddress }),
  };
  db.orders.push(newOrder);

  if (customerPhone && customerPhone.trim()) {
    invalidateCustomerStatsCache(db, order.adminId, customerPhone);
  }

  // عدّادات الأدمن (باقة البزنس فقط): مصدر الطلب + نوع التعيين عند الإنشاء
  const adminIndex = db.admins.findIndex(a => a.id === order.adminId);
  if (adminIndex !== -1) {
    const admin = db.admins[adminIndex];
    if (isBusinessPlanActive(admin)) {
      if (order.orderType === 'website') admin.websiteOrdersCount = (admin.websiteOrdersCount ?? 0) + 1;
      else if (order.orderType === 'whatsapp') admin.whatsappOrdersCount = (admin.whatsappOrdersCount ?? 0) + 1;

      const assignedTo = order.assignedTo;
      if (!assignedTo || assignedTo === '') {
        admin.WithoutDeliveryOrdersCount = (admin.WithoutDeliveryOrdersCount ?? 0) + 1;
      } else if (assignedTo === 'ANY_DELIVERY') {
        admin.AnyDeliveryOrdersCount = (admin.AnyDeliveryOrdersCount ?? 0) + 1;
      } else {
        const empIndex = db.employees.findIndex(emp => emp.id === assignedTo);
        if (empIndex !== -1) {
          const e = db.employees[empIndex];
          e.deliveryAssignedCount = (e.deliveryAssignedCount ?? 0) + 1;
          db.employees[empIndex] = e;
        }
      }
      const itemStats = getOrInitItemSalesStats(admin);
      applyItemSalesDelta(itemStats, order.items, 1);
      db.admins[adminIndex] = admin;
    }

    // عداد طلبات التوصيل وجامع السعر والخصم (واتساب/موقع) — باقة Basic فأعلى
    if (isBasicPlanActive(admin)) {
      const stats = getOrInitProOrderStats(admin);
      if (order.orderType === 'whatsapp') {
        stats.countWhatsapp += 1;
        stats.sumPriceWhatsapp += order.totalPrice ?? 0;
        stats.sumDiscountWhatsapp += order.totalDiscount ?? 0;
      } else if (order.orderType === 'website') {
        stats.countWebsite += 1;
        stats.sumPriceWebsite += order.totalPrice ?? 0;
        stats.sumDiscountWebsite += order.totalDiscount ?? 0;
      }
      db.admins[adminIndex].proOrderStats = stats;
    }
  }

  await writeDB(db);
  return newOrder;
}

const DELIVERY_STATUS_NUM: Record<string, number> = { pending: 1, read: 2, delivering: 3, delivered: 4 };
const TABLE_STATUS_NUM: Record<string, number> = { pending: 1, read: 2, served: 3, completed: 4 };

/** الباقة Basic فأعلى نشطة (عدّ وجمع طلبات التوصيل واتساب/موقع) */
function isBasicPlanActive(admin: Admin): boolean {
  if (!admin.plan || admin.plan === 'free') return false;
  if (!admin.subscriptionEndsAt) return false;
  return new Date(admin.subscriptionEndsAt) >= new Date();
}

/** الباقة Pro فأعلى نشطة (عدّ الطاولة وجوامعها وعدادات "تمت") */
function isProPlanActive(admin: Admin): boolean {
  if (!admin.plan || admin.plan === 'free' || admin.plan === 'basic') return false;
  if (!admin.subscriptionEndsAt) return false;
  return new Date(admin.subscriptionEndsAt) >= new Date();
}

/** الباقة البزنس نشطة (للتحقق قبل تحديث عدادات نقل الحالات والتعيين) */
function isBusinessPlanActive(admin: Admin): boolean {
  return admin.plan === 'business' && !!admin.subscriptionEndsAt && new Date(admin.subscriptionEndsAt) >= new Date();
}

function getOrInitItemSalesStats(admin: Admin): NonNullable<Admin['itemSalesStats']> {
  if (!admin.itemSalesStats) admin.itemSalesStats = {};
  return admin.itemSalesStats;
}

function applyItemSalesDelta(
  stats: Record<string, { quantity: number; revenue: number }>,
  items: OrderItem[],
  sign: 1 | -1
): void {
  for (const item of items) {
    const key = (item.name || '').trim() || '__unknown__';
    const q = item.quantity * sign;
    const rev = (item.discountedPrice ?? item.price ?? 0) * item.quantity * sign;
    const cur = stats[key] ?? { quantity: 0, revenue: 0 };
    const quantity = Math.max(0, cur.quantity + q);
    const revenue = Math.max(0, cur.revenue + rev);
    if (quantity === 0 && revenue === 0) delete stats[key];
    else stats[key] = { quantity, revenue };
  }
}

const DELIVERY_FINAL_STATUS = 4;
const TABLE_FINAL_STATUS = 4;

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function getOrInitOrdersOverTimeCache(admin: Admin): NonNullable<Admin['ordersOverTimeCache']> {
  if (!admin.ordersOverTimeCache) {
    admin.ordersOverTimeCache = {
      cachedAt: new Date(0).toISOString(),
      delivery: {},
      table: {},
    };
    return admin.ordersOverTimeCache;
  }
  if (!admin.ordersOverTimeCache.delivery) admin.ordersOverTimeCache.delivery = {};
  if (!admin.ordersOverTimeCache.table) admin.ordersOverTimeCache.table = {};
  return admin.ordersOverTimeCache;
}

/** لكل يوم: نعد كل طلب مرة واحدة فقط (آخر إكمال للطلب في ذلك اليوم). */
function appendDeliveryCompletionsToOrdersOverTime(
  db: Database,
  adminIndex: number,
  fromDate: Date,
  toDate: Date
): void {
  const admin = db.admins[adminIndex];
  const cache = getOrInitOrdersOverTimeCache(admin);
  const fromTime = fromDate.getTime();
  const toTime = toDate.getTime();
  const logs = db.deliveryOrderStatusLogs.filter(
    (log) => log.adminId === admin.id && log.toStatus === DELIVERY_FINAL_STATUS && log.createdAt
  );
  const orderById = new Map(db.orders.map((o) => [o.id, o]));

  const byDateThenOrder = new Map<string, Map<string, { createdAt: string }>>();
  for (const log of logs) {
    const t = new Date(log.createdAt).getTime();
    if (t < fromTime || t > toTime) continue;
    const dateKey = toDateKey(log.createdAt);
    if (!byDateThenOrder.has(dateKey)) byDateThenOrder.set(dateKey, new Map());
    const byOrder = byDateThenOrder.get(dateKey)!;
    const existing = byOrder.get(log.orderId);
    if (!existing || new Date(log.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      byOrder.set(log.orderId, { createdAt: log.createdAt });
    }
  }

  for (const [dateKey, byOrder] of byDateThenOrder) {
    for (const orderId of byOrder.keys()) {
      const order = orderById.get(orderId);
      if (!order) continue;
      const revenue = order.totalPrice ?? 0;
      const customerSaved = order.totalDiscount ?? 0;
      const cur = cache.delivery[dateKey] ?? { completedCount: 0, revenue: 0, customerSaved: 0 };
      cache.delivery[dateKey] = {
        completedCount: cur.completedCount + 1,
        revenue: cur.revenue + revenue,
        customerSaved: cur.customerSaved + customerSaved,
      };
    }
  }
  db.admins[adminIndex] = admin;
}

/** لكل يوم: نعد كل طلب طاولة مرة واحدة فقط (آخر إكمال للطلب في ذلك اليوم). */
function appendTableCompletionsToOrdersOverTime(
  db: Database,
  adminIndex: number,
  fromDate: Date,
  toDate: Date
): void {
  const admin = db.admins[adminIndex];
  const cache = getOrInitOrdersOverTimeCache(admin);
  const fromTime = fromDate.getTime();
  const toTime = toDate.getTime();
  const logs = db.tableOrderStatusLogs.filter(
    (log) => log.adminId === admin.id && log.toStatus === TABLE_FINAL_STATUS && log.createdAt
  );
  const orderById = new Map(db.tableOrders.map((o) => [o.id, o]));

  const byDateThenOrder = new Map<string, Map<string, { createdAt: string }>>();
  for (const log of logs) {
    const t = new Date(log.createdAt).getTime();
    if (t < fromTime || t > toTime) continue;
    const dateKey = toDateKey(log.createdAt);
    if (!byDateThenOrder.has(dateKey)) byDateThenOrder.set(dateKey, new Map());
    const byOrder = byDateThenOrder.get(dateKey)!;
    const existing = byOrder.get(log.orderId);
    if (!existing || new Date(log.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      byOrder.set(log.orderId, { createdAt: log.createdAt });
    }
  }

  for (const [dateKey, byOrder] of byDateThenOrder) {
    for (const orderId of byOrder.keys()) {
      const order = orderById.get(orderId);
      if (!order) continue;
      const revenue = order.totalPrice ?? 0;
      const customerSaved = order.totalDiscount ?? 0;
      const cur = cache.table[dateKey] ?? { completedCount: 0, revenue: 0, customerSaved: 0 };
      cache.table[dateKey] = {
        completedCount: cur.completedCount + 1,
        revenue: cur.revenue + revenue,
        customerSaved: cur.customerSaved + customerSaved,
      };
    }
  }
  db.admins[adminIndex] = admin;
}

/** أول تاريخ YYYY-MM-DD يظهر في لوجز التوصيل أو الطاولة لهذا الأدمن؛ إن لم يوجد أي لوج يُرجع null. */
function getEarliestLogDateKey(db: Database, adminId: string): string | null {
  let earliest: string | null = null;
  for (const log of db.deliveryOrderStatusLogs) {
    if (log.adminId !== adminId || !log.createdAt) continue;
    const key = toDateKey(log.createdAt);
    if (!earliest || key < earliest) earliest = key;
  }
  for (const log of db.tableOrderStatusLogs) {
    if (log.adminId !== adminId || !log.createdAt) continue;
    const key = toDateKey(log.createdAt);
    if (!earliest || key < earliest) earliest = key;
  }
  return earliest;
}

/** توقيت التقرير لتحديد «أمس»: يُستخدم حتى عند تشغيل السيرفر في UTC (مثلاً 1:45 ص مصر = لا يزال يوم 10 في UTC). */
const REPORTING_TIMEZONE = 'Africa/Cairo';
const REPORTING_UTC_OFFSET_HOURS = 2;

/** كل تواريخ YYYY-MM-DD (UTC) من start إلى end شاملة. */
function getDateKeysInRange(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const d = new Date(start);
  d.setUTCHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setUTCHours(0, 0, 0, 0);
  while (d.getTime() <= endDay.getTime()) {
    keys.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return keys;
}

/** آخر لحظة من يوم معيّن (YYYY-MM-DD) في توقيت التقرير، كـ Date (UTC timestamp). */
function endOfDayInReportingTZ(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const hourUTC = 23 - REPORTING_UTC_OFFSET_HOURS;
  return new Date(Date.UTC(y, m - 1, d, hourUTC, 59, 59, 999));
}

/** إذا مرّ يوم على cachedAt يُلحَق التمام منذ اليوم التالي لآخر تاريخ موجود في الكاش حتى أمس (استبعاد اليوم). باقة Business فقط. */
export function ensureOrdersOverTimeCacheRecomputed(db: Database, adminIndex: number): void {
  const admin = db.admins[adminIndex];
  if (!isBusinessPlanActive(admin)) return;
  const cache = getOrInitOrdersOverTimeCache(admin);
  const now = new Date();
  const cachedAt = new Date(cache.cachedAt);
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (now.getTime() - cachedAt.getTime() < oneDayMs) return;

  // نهاية النطاق: آخر لحظة من «أمس» بتوقيت التقرير (مصر)
  const todayInReportingTZ = now.toLocaleDateString('en-CA', { timeZone: REPORTING_TIMEZONE });
  const [y, mo, day] = todayInReportingTZ.split('-').map(Number);
  const yesterdayDate = new Date(Date.UTC(y, mo - 1, day - 1));
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);
  const end = endOfDayInReportingTZ(yesterdayStr);

  // بداية النطاق: اليوم التالي لآخر تاريخ له بيانات في الكاش؛ إن كان الكاش فارغاً نعتمد أول يوم يظهر في اللوجز (لا نستخدم cachedAt فقد يكون 1970)
  const allDateKeys = [...Object.keys(cache.delivery), ...Object.keys(cache.table)];
  let start: Date;
  if (allDateKeys.length > 0) {
    const lastKey = allDateKeys.sort().pop()!;
    start = new Date(lastKey + 'T00:00:00.000Z');
    start.setUTCDate(start.getUTCDate() + 1);
  } else {
    const earliestKey = getEarliestLogDateKey(db, admin.id);
    if (earliestKey) {
      start = new Date(earliestKey + 'T00:00:00.000Z');
    } else {
      start = new Date(end.getTime() + 1);
    }
  }

  // سقف 31 يوماً للبَكفِل: لو الفجوة (انتهاء الباقة ثم تجديد) أكبر من 31 يوماً، نملأ آخر 31 يوماً فقط
  // ونترك الأيام الأقدم من الفجوة فارغة (الرسم يتخطّاها بدلاً من تصفيرها — أكثر صدقاً)
  const BACKFILL_CAP_DAYS = 31;
  const earliestAllowed = new Date(end);
  earliestAllowed.setUTCDate(earliestAllowed.getUTCDate() - (BACKFILL_CAP_DAYS - 1));
  earliestAllowed.setUTCHours(0, 0, 0, 0);
  if (start.getTime() < earliestAllowed.getTime()) {
    start = earliestAllowed;
  }

  if (start.getTime() > end.getTime()) {
    cache.cachedAt = now.toISOString();
    db.admins[adminIndex] = admin;
    return;
  }
  appendDeliveryCompletionsToOrdersOverTime(db, adminIndex, start, end);
  appendTableCompletionsToOrdersOverTime(db, adminIndex, start, end);

  // أي يوم في النطاق بدون طلبات لا يُضاف من اللوجز — نملأه صراحة كيوم صفري
  const dateKeysInRange = getDateKeysInRange(start, end);
  const zeroDay = { completedCount: 0, revenue: 0, customerSaved: 0 };
  for (const key of dateKeysInRange) {
    if (!cache.delivery[key]) cache.delivery[key] = { ...zeroDay };
    if (!cache.table[key]) cache.table[key] = { ...zeroDay };
  }

  const admin2 = db.admins[adminIndex];
  if (admin2.ordersOverTimeCache) admin2.ordersOverTimeCache.cachedAt = now.toISOString();
  db.admins[adminIndex] = admin2;
}

/** يجلب كاش الطلبات عبر الزمن مع إعادة حساب عند انتهاء الصلاحية. يرجع null إذا لم تكن الباقة Business أو الأدمن غير موجود. */
export async function getOrdersOverTimeForAdmin(adminId: string): Promise<Admin['ordersOverTimeCache'] | null> {
  const admin = await getAdmin(adminId);
  if (!admin || !isBusinessPlanActive(admin)) return null;
  const db = await readDB();
  const adminIndex = db.admins.findIndex(a => a.id === adminId);
  if (adminIndex === -1) return null;
  ensureOrdersOverTimeCacheRecomputed(db, adminIndex);
  await writeDB(db);
  return db.admins[adminIndex].ordersOverTimeCache ?? null;
}

function subtractDeliveryCompletionFromOrdersOverTime(
  db: Database,
  adminIndex: number,
  orderId: string,
  revenue: number,
  customerSaved: number
): void {
  if (!isBusinessPlanActive(db.admins[adminIndex])) return;
  const logs = db.deliveryOrderStatusLogs.filter(
    (l) => l.orderId === orderId && l.toStatus === DELIVERY_FINAL_STATUS
  );
  if (logs.length === 0) return;
  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const dateKey = toDateKey(logs[0].createdAt);
  const admin = db.admins[adminIndex];
  const cache = getOrInitOrdersOverTimeCache(admin);
  const cur = cache.delivery[dateKey];
  if (!cur) return;
  const next = {
    completedCount: Math.max(0, cur.completedCount - 1),
    revenue: Math.max(0, cur.revenue - revenue),
    customerSaved: Math.max(0, cur.customerSaved - customerSaved),
  };
  if (next.completedCount === 0 && next.revenue === 0 && next.customerSaved === 0) delete cache.delivery[dateKey];
  else cache.delivery[dateKey] = next;
  db.admins[adminIndex] = admin;
}

function subtractTableCompletionFromOrdersOverTime(
  db: Database,
  adminIndex: number,
  orderId: string,
  revenue: number,
  customerSaved: number
): void {
  if (!isBusinessPlanActive(db.admins[adminIndex])) return;
  const logs = db.tableOrderStatusLogs.filter(
    (l) => l.orderId === orderId && l.toStatus === TABLE_FINAL_STATUS
  );
  if (logs.length === 0) return;
  logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const dateKey = toDateKey(logs[0].createdAt);
  const admin = db.admins[adminIndex];
  const cache = getOrInitOrdersOverTimeCache(admin);
  const cur = cache.table[dateKey];
  if (!cur) return;
  const next = {
    completedCount: Math.max(0, cur.completedCount - 1),
    revenue: Math.max(0, cur.revenue - revenue),
    customerSaved: Math.max(0, cur.customerSaved - customerSaved),
  };
  if (next.completedCount === 0 && next.revenue === 0 && next.customerSaved === 0) delete cache.table[dateKey];
  else cache.table[dateKey] = next;
  db.admins[adminIndex] = admin;
}

function getOrInitProOrderStats(admin: Admin): NonNullable<Admin['proOrderStats']> {
  const s = admin.proOrderStats;
  const def = {
    countWhatsapp: 0,
    countWebsite: 0,
    countTable: 0,
    sumPriceWhatsapp: 0,
    sumPriceWebsite: 0,
    sumPriceTable: 0,
    sumDiscountWhatsapp: 0,
    sumDiscountWebsite: 0,
    sumDiscountTable: 0,
    completedDeliveryWhatsapp: 0,
    completedDeliveryWebsite: 0,
    completedTable: 0,
    sumCompletedPriceWhatsapp: 0,
    sumCompletedPriceWebsite: 0,
    sumCompletedPriceTable: 0,
    sumCompletedDiscountWhatsapp: 0,
    sumCompletedDiscountWebsite: 0,
    sumCompletedDiscountTable: 0,
  };
  if (!s) return def;
  return {
    ...def,
    ...s,
    sumDiscountWhatsapp: s.sumDiscountWhatsapp ?? 0,
    sumDiscountWebsite: s.sumDiscountWebsite ?? 0,
    sumDiscountTable: s.sumDiscountTable ?? 0,
    sumCompletedPriceWhatsapp: s.sumCompletedPriceWhatsapp ?? 0,
    sumCompletedPriceWebsite: s.sumCompletedPriceWebsite ?? 0,
    sumCompletedPriceTable: s.sumCompletedPriceTable ?? 0,
    sumCompletedDiscountWhatsapp: s.sumCompletedDiscountWhatsapp ?? 0,
    sumCompletedDiscountWebsite: s.sumCompletedDiscountWebsite ?? 0,
    sumCompletedDiscountTable: s.sumCompletedDiscountTable ?? 0,
  };
}

export async function updateOrderStatus(id: string, status: 'pending' | 'read' | 'delivering' | 'delivered'): Promise<Order | null> {
  try {
    const db = await readDB();
    const index = db.orders.findIndex(order => order.id === id);
    if (index === -1) {
      console.log('Order not found in updateOrderStatus:', id);
      return null;
    }

    console.log('Updating order:', id, 'to status:', status);
    db.orders[index] = { ...db.orders[index], status };
    await writeDB(db);
    console.log('Order updated successfully');
    return db.orders[index];
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    throw error;
  }
}

/** تحديث حالة طلب توصيل + لوج + عدّاد (باقة البزنس، atomic) */
export async function updateOrderStatusWithLogAndCounters(
  orderId: string,
  status: 'pending' | 'read' | 'delivering' | 'delivered',
  actor: { adminId: string; userId: string; userType: 'admin' | 'employee' }
): Promise<Order | null> {
  const db = await readDB();
  const orderIndex = db.orders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) return null;

  const order = db.orders[orderIndex];
  const fromStatus = DELIVERY_STATUS_NUM[order.status || 'pending'] ?? 1;
  const toStatus = DELIVERY_STATUS_NUM[status] ?? 1;

  db.orders[orderIndex] = { ...order, status };
  const log: DeliveryOrderStatusLog = {
    id: `log_del_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    adminId: order.adminId,
    userId: actor.userId,
    userType: actor.userType,
    orderId,
    fromStatus,
    toStatus,
    createdAt: new Date().toISOString(),
  };
  db.deliveryOrderStatusLogs.push(log);

  if (fromStatus === DELIVERY_FINAL_STATUS && toStatus !== DELIVERY_FINAL_STATUS) {
    const ai = db.admins.findIndex(a => a.id === order.adminId);
    if (ai !== -1) subtractDeliveryCompletionFromOrdersOverTime(db, ai, orderId, order.totalPrice ?? 0, order.totalDiscount ?? 0);
  }

  // عدادات نقل الحالات (باقة البزنس فقط) — لا نعد إن لم تكن الباقة مفعلة
  const adminForPlan = db.admins.find(a => a.id === order.adminId);
  if (adminForPlan && isBusinessPlanActive(adminForPlan) && fromStatus !== toStatus) {
    const list = actor.userType === 'admin' ? db.admins : db.employees;
    const userIndex = list.findIndex((u: { id: string }) => u.id === actor.userId);
    if (userIndex !== -1) {
      const u = list[userIndex] as Admin | Employee;
      const rec = u as unknown as Record<string, number>;
      if (toStatus > fromStatus) {
        const key = `deliveryForward${fromStatus}${toStatus}`;
        rec[key] = (rec[key] ?? 0) + 1;
      } else {
        const key = `deliveryDowngrade${fromStatus}${toStatus}`;
        rec[key] = (rec[key] ?? 0) + 1;
      }
      list[userIndex] = u;
    }
  }

    // إحصائيات Pro: عدّاد طلبات التوصيل التي "تمت" + الأسعار والخصومات التامة (باقة Pro فقط)
    const adminIndex = db.admins.findIndex(a => a.id === order.adminId);
    if (adminIndex !== -1) {
      const admin = db.admins[adminIndex];
      if (isProPlanActive(admin)) {
        const stats = getOrInitProOrderStats(admin);
        const FINAL_DELIVERY = 4;
        const price = order.totalPrice ?? 0;
        const discount = order.totalDiscount ?? 0;
        if (toStatus === FINAL_DELIVERY && fromStatus !== FINAL_DELIVERY) {
          if (order.orderType === 'whatsapp') {
            stats.completedDeliveryWhatsapp += 1;
            stats.sumCompletedPriceWhatsapp += price;
            stats.sumCompletedDiscountWhatsapp += discount;
          } else if (order.orderType === 'website') {
            stats.completedDeliveryWebsite += 1;
            stats.sumCompletedPriceWebsite += price;
            stats.sumCompletedDiscountWebsite += discount;
          }
        } else if (fromStatus === FINAL_DELIVERY && toStatus !== FINAL_DELIVERY) {
          if (order.orderType === 'whatsapp') {
            stats.completedDeliveryWhatsapp = Math.max(0, stats.completedDeliveryWhatsapp - 1);
            stats.sumCompletedPriceWhatsapp = Math.max(0, stats.sumCompletedPriceWhatsapp - price);
            stats.sumCompletedDiscountWhatsapp = Math.max(0, stats.sumCompletedDiscountWhatsapp - discount);
          } else if (order.orderType === 'website') {
            stats.completedDeliveryWebsite = Math.max(0, stats.completedDeliveryWebsite - 1);
            stats.sumCompletedPriceWebsite = Math.max(0, stats.sumCompletedPriceWebsite - price);
            stats.sumCompletedDiscountWebsite = Math.max(0, stats.sumCompletedDiscountWebsite - discount);
          }
        }
        db.admins[adminIndex].proOrderStats = stats;
      }
    }

  await writeDB(db);
  return db.orders[orderIndex];
}

export async function deleteOrder(id: string): Promise<boolean> {
  const db = await readDB();
  const orderToDelete = db.orders.find(order => order.id === id);
  if (!orderToDelete) return false;

  const adminIndex = db.admins.findIndex(a => a.id === orderToDelete.adminId);
  if (adminIndex !== -1 && (orderToDelete.status || '') === 'delivered') {
    subtractDeliveryCompletionFromOrdersOverTime(
      db,
      adminIndex,
      orderToDelete.id,
      orderToDelete.totalPrice ?? 0,
      orderToDelete.totalDiscount ?? 0
    );
  }
  if (adminIndex !== -1) {
    const admin = db.admins[adminIndex];
    if (isBusinessPlanActive(admin)) {
      if (orderToDelete.orderType === 'website') admin.websiteOrdersCount = Math.max(0, (admin.websiteOrdersCount ?? 0) - 1);
      else if (orderToDelete.orderType === 'whatsapp') admin.whatsappOrdersCount = Math.max(0, (admin.whatsappOrdersCount ?? 0) - 1);

      const assignedTo = orderToDelete.assignedTo;
      if (!assignedTo || assignedTo === '') {
        admin.WithoutDeliveryOrdersCount = Math.max(0, (admin.WithoutDeliveryOrdersCount ?? 0) - 1);
      } else if (assignedTo === 'ANY_DELIVERY') {
        admin.AnyDeliveryOrdersCount = Math.max(0, (admin.AnyDeliveryOrdersCount ?? 0) - 1);
      } else {
        const empIndex = db.employees.findIndex(emp => emp.id === assignedTo);
        if (empIndex !== -1) {
          const e = db.employees[empIndex];
          e.deliveryAssignedCount = Math.max(0, (e.deliveryAssignedCount ?? 0) - 1);
          db.employees[empIndex] = e;
        }
      }
      const itemStats = getOrInitItemSalesStats(admin);
      applyItemSalesDelta(itemStats, orderToDelete.items, -1);
      db.admins[adminIndex] = admin;
    }

    // إنقاص عداد وجامع وخصم التوصيل (واتساب/موقع) — باقة Basic فأعلى؛ إنقاص "تمت" والأسعار/الخصومات التامة — باقة Pro فأعلى
    if (isBasicPlanActive(admin)) {
      const stats = getOrInitProOrderStats(admin);
      const price = orderToDelete.totalPrice ?? 0;
      const discount = orderToDelete.totalDiscount ?? 0;
      const wasDelivered = (orderToDelete.status || '') === 'delivered';
      if (orderToDelete.orderType === 'whatsapp') {
        stats.countWhatsapp = Math.max(0, stats.countWhatsapp - 1);
        stats.sumPriceWhatsapp = Math.max(0, stats.sumPriceWhatsapp - price);
        stats.sumDiscountWhatsapp = Math.max(0, stats.sumDiscountWhatsapp - discount);
        if (isProPlanActive(admin) && wasDelivered) {
          stats.completedDeliveryWhatsapp = Math.max(0, stats.completedDeliveryWhatsapp - 1);
          stats.sumCompletedPriceWhatsapp = Math.max(0, stats.sumCompletedPriceWhatsapp - price);
          stats.sumCompletedDiscountWhatsapp = Math.max(0, stats.sumCompletedDiscountWhatsapp - discount);
        }
      } else if (orderToDelete.orderType === 'website') {
        stats.countWebsite = Math.max(0, stats.countWebsite - 1);
        stats.sumPriceWebsite = Math.max(0, stats.sumPriceWebsite - price);
        stats.sumDiscountWebsite = Math.max(0, stats.sumDiscountWebsite - discount);
        if (isProPlanActive(admin) && wasDelivered) {
          stats.completedDeliveryWebsite = Math.max(0, stats.completedDeliveryWebsite - 1);
          stats.sumCompletedPriceWebsite = Math.max(0, stats.sumCompletedPriceWebsite - price);
          stats.sumCompletedDiscountWebsite = Math.max(0, stats.sumCompletedDiscountWebsite - discount);
        }
      }
      db.admins[adminIndex].proOrderStats = stats;
    }
  }

  if (orderToDelete.customerPhone && orderToDelete.customerPhone.trim()) {
    decrementCustomerOrderCountInDb(db, orderToDelete.adminId, orderToDelete.customerPhone);
    invalidateCustomerStatsCache(db, orderToDelete.adminId, orderToDelete.customerPhone);
  }

  db.orders = db.orders.filter(order => order.id !== id);
  await writeDB(db);
  return true;
}

// دوال إدارة طلبات الطاولة
export async function getTableOrders(adminId?: string, tableNumber?: number): Promise<TableOrder[]> {
  const db = await readDB();
  let orders = db.tableOrders;

  if (adminId) {
    orders = orders.filter(order => order.adminId === adminId);
  }

  if (tableNumber !== undefined) {
    orders = orders.filter(order => order.tableNumber === tableNumber);
  }

  // Add employee data to table orders
  const ordersWithEmployees = orders.map(order => {
    if (order.assignedTo) {
      const employee = db.employees.find(emp => emp.id === order.assignedTo);
      if (employee) {
        return {
          ...order,
          assignedEmployee: { id: employee.id, name: employee.name }
        };
      }
    }
    return order;
  });

  return ordersWithEmployees;
}

export async function getTableOrder(id: string): Promise<TableOrder | null> {
  const db = await readDB();
  return db.tableOrders.find(order => order.id === id) || null;
}

export async function createTableOrder(order: Omit<TableOrder, 'id' | 'createdAt'>): Promise<TableOrder> {
  const db = await readDB();
  const newOrder: TableOrder = {
    ...order,
    id: `table_order_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: order.status || 'pending', // Default status is 'pending'
  };
  db.tableOrders.push(newOrder);

  const adminIndex = db.admins.findIndex(a => a.id === order.adminId);
  if (adminIndex !== -1) {
    const admin = db.admins[adminIndex];
    if (isProPlanActive(admin)) {
      const stats = getOrInitProOrderStats(admin);
      stats.countTable += 1;
      stats.sumPriceTable += order.totalPrice ?? 0;
      stats.sumDiscountTable += order.totalDiscount ?? 0;
      db.admins[adminIndex].proOrderStats = stats;
    }
    if (isBusinessPlanActive(admin)) {
      const itemStats = getOrInitItemSalesStats(admin);
      applyItemSalesDelta(itemStats, order.items, 1);
      db.admins[adminIndex] = admin;
    }
  }

  await writeDB(db);
  return newOrder;
}

export async function deleteTableOrder(id: string): Promise<boolean> {
  const db = await readDB();
  const orderToDelete = db.tableOrders.find(order => order.id === id);
  if (!orderToDelete) return false;

  const adminIndex = db.admins.findIndex(a => a.id === orderToDelete.adminId);
  if (adminIndex !== -1 && (orderToDelete.status || '') === 'completed') {
    subtractTableCompletionFromOrdersOverTime(
      db,
      adminIndex,
      orderToDelete.id,
      orderToDelete.totalPrice ?? 0,
      orderToDelete.totalDiscount ?? 0
    );
  }
  if (adminIndex !== -1) {
    const admin = db.admins[adminIndex];
    if (isProPlanActive(admin)) {
      const stats = getOrInitProOrderStats(admin);
      const price = orderToDelete.totalPrice ?? 0;
      const discount = orderToDelete.totalDiscount ?? 0;
      const wasCompleted = (orderToDelete.status || '') === 'completed';
      stats.countTable = Math.max(0, stats.countTable - 1);
      stats.sumPriceTable = Math.max(0, stats.sumPriceTable - price);
      stats.sumDiscountTable = Math.max(0, stats.sumDiscountTable - discount);
      if (wasCompleted) {
        stats.completedTable = Math.max(0, stats.completedTable - 1);
        stats.sumCompletedPriceTable = Math.max(0, stats.sumCompletedPriceTable - price);
        stats.sumCompletedDiscountTable = Math.max(0, stats.sumCompletedDiscountTable - discount);
      }
      db.admins[adminIndex].proOrderStats = stats;
    }
    if (isBusinessPlanActive(admin)) {
      const itemStats = getOrInitItemSalesStats(admin);
      applyItemSalesDelta(itemStats, orderToDelete.items, -1);
      db.admins[adminIndex] = admin;
    }
  }

  db.tableOrders = db.tableOrders.filter(order => order.id !== id);
  await writeDB(db);
  return true;
}

export async function updateTableOrderStatus(
  id: string,
  status: 'pending' | 'read' | 'served' | 'completed'
): Promise<TableOrder | null> {
  const db = await readDB();
  const order = db.tableOrders.find(o => o.id === id);

  if (!order) return null;

  order.status = status;
  await writeDB(db);
  return order;
}

/** تحديث حالة طلب طاولة + لوج + عدّاد (باقة البزنس، atomic) */
export async function updateTableOrderStatusWithLogAndCounters(
  orderId: string,
  status: 'pending' | 'read' | 'served' | 'completed',
  actor: { adminId: string; userId: string; userType: 'admin' | 'employee' }
): Promise<TableOrder | null> {
  const db = await readDB();
  const orderIndex = db.tableOrders.findIndex(o => o.id === orderId);
  if (orderIndex === -1) return null;

  const order = db.tableOrders[orderIndex];
  const fromStatus = TABLE_STATUS_NUM[order.status || 'pending'] ?? 1;
  const toStatus = TABLE_STATUS_NUM[status] ?? 1;

  db.tableOrders[orderIndex] = { ...order, status };
  const log: TableOrderStatusLog = {
    id: `log_tbl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    adminId: order.adminId,
    userId: actor.userId,
    userType: actor.userType,
    orderId,
    fromStatus,
    toStatus,
    createdAt: new Date().toISOString(),
  };
  db.tableOrderStatusLogs.push(log);

  if (fromStatus === TABLE_FINAL_STATUS && toStatus !== TABLE_FINAL_STATUS) {
    const ai = db.admins.findIndex(a => a.id === order.adminId);
    if (ai !== -1) subtractTableCompletionFromOrdersOverTime(db, ai, orderId, order.totalPrice ?? 0, order.totalDiscount ?? 0);
  }

  // عدادات نقل الحالات (باقة البزنس فقط) — لا نعد إن لم تكن الباقة مفعلة
  const adminForPlan = db.admins.find(a => a.id === order.adminId);
  if (adminForPlan && isBusinessPlanActive(adminForPlan) && fromStatus !== toStatus) {
    const list = actor.userType === 'admin' ? db.admins : db.employees;
    const userIndex = list.findIndex((u: { id: string }) => u.id === actor.userId);
    if (userIndex !== -1) {
      const u = list[userIndex] as Admin | Employee;
      const rec = u as unknown as Record<string, number>;
      if (toStatus > fromStatus) {
        const key = `tableForward${fromStatus}${toStatus}`;
        rec[key] = (rec[key] ?? 0) + 1;
      } else {
        const key = `tableDowngrade${fromStatus}${toStatus}`;
        rec[key] = (rec[key] ?? 0) + 1;
      }
      list[userIndex] = u;
    }
  }

  // إحصائيات Pro: عدّاد طلبات الطاولة التي "تمت" + الأسعار والخصومات التامة (باقة Pro فقط)
  const adminIndex = db.admins.findIndex(a => a.id === order.adminId);
  if (adminIndex !== -1) {
    const admin = db.admins[adminIndex];
    if (isProPlanActive(admin)) {
      const stats = getOrInitProOrderStats(admin);
      const FINAL_TABLE = 4;
      const price = order.totalPrice ?? 0;
      const discount = order.totalDiscount ?? 0;
      if (toStatus === FINAL_TABLE && fromStatus !== FINAL_TABLE) {
        stats.completedTable += 1;
        stats.sumCompletedPriceTable += price;
        stats.sumCompletedDiscountTable += discount;
      } else if (fromStatus === FINAL_TABLE && toStatus !== FINAL_TABLE) {
        stats.completedTable = Math.max(0, stats.completedTable - 1);
        stats.sumCompletedPriceTable = Math.max(0, stats.sumCompletedPriceTable - price);
        stats.sumCompletedDiscountTable = Math.max(0, stats.sumCompletedDiscountTable - discount);
      }
      db.admins[adminIndex].proOrderStats = stats;
    }
  }

  await writeDB(db);
  return db.tableOrders[orderIndex];
}

// ==================== Employee Functions ====================

/** لون hex عشوائي للعامل عندما لا يُرسل من الفرونت (غير باقة البزنس) */
function randomHexColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.floor(Math.random() * 30);
  const l = 45 + Math.floor(Math.random() * 25);
  const a = (s * Math.min(l, 100 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const r = Math.round(f(0) * 255);
  const g = Math.round(f(8) * 255);
  const b = Math.round(f(4) * 255);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

export async function createEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
  const db = await readDB();

  // التحقق من عدم وجود username مكرر
  const existing = db.employees.find(e => e.username === employee.username);
  if (existing) {
    throw new Error('اسم المستخدم موجود بالفعل');
  }

  const color = employee.color && /^#[0-9A-Fa-f]{6}$/.test(employee.color) ? employee.color : randomHexColor();
  const newEmployee: Employee = {
    ...employee,
    id: `employee_${Date.now()}`,
    createdAt: new Date().toISOString(),
    color,
  };

  db.employees.push(newEmployee);
  await writeDB(db);
  return newEmployee;
}

export async function getEmployees(
  adminId: string,
  options?: { page?: number; limit?: number }
): Promise<{ employees: Employee[]; total: number }> {
  const db = await readDB();
  let filtered = db.employees.filter(e => e.adminId === adminId);

  // Sort by createdAt descending if it exists, otherwise use id
  filtered.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const total = filtered.length;

  if (options?.page && options?.limit) {
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;
    filtered = filtered.slice(startIndex, endIndex);
  }

  return { employees: filtered, total };
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const db = await readDB();
  return db.employees.find(e => e.id === id) || null;
}

export async function getEmployeeByUsername(username: string): Promise<Employee | null> {
  const db = await readDB();
  return db.employees.find(e => e.username === username) || null;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const db = await readDB();
  const index = db.employees.findIndex(e => e.id === id);

  if (index === -1) return false;

  db.employees.splice(index, 1);
  await writeDB(db);
  return true;
}

export async function updateEmployee(id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'adminId'>>): Promise<Employee | null> {
  const db = await readDB();
  const index = db.employees.findIndex(e => e.id === id);

  if (index === -1) return null;

  db.employees[index] = {
    ...db.employees[index],
    ...updates,
  };
  await writeDB(db);
  return db.employees[index];
}

// ==================== Order Assignment Functions ====================

export async function assignOrderToEmployee(
  orderId: string,
  employeeId: string | null,
  options?: { incrementAssignedCount?: boolean }
): Promise<Order | null> {
  const db = await readDB();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) return null;

  const previousAssignedTo = order.assignedTo;
  const newAssignedTo = employeeId || undefined;

  const adminIndex = db.admins.findIndex(a => a.id === order.adminId);
  const admin = adminIndex !== -1 ? db.admins[adminIndex] : null;

  if (admin && isBusinessPlanActive(admin) && adminIndex !== -1) {
    // طرح 1 من العداد السابق (باقة البزنس فقط)
    const a = db.admins[adminIndex];
    if (!previousAssignedTo || previousAssignedTo === '') {
      a.WithoutDeliveryOrdersCount = Math.max(0, (a.WithoutDeliveryOrdersCount ?? 0) - 1);
    } else if (previousAssignedTo === 'ANY_DELIVERY') {
      a.AnyDeliveryOrdersCount = Math.max(0, (a.AnyDeliveryOrdersCount ?? 0) - 1);
    } else {
      const prevEmpIndex = db.employees.findIndex(emp => emp.id === previousAssignedTo);
      if (prevEmpIndex !== -1) {
        const e = db.employees[prevEmpIndex];
        e.deliveryAssignedCount = Math.max(0, (e.deliveryAssignedCount ?? 0) - 1);
        db.employees[prevEmpIndex] = e;
      }
    }
    db.admins[adminIndex] = a;
  }

  order.assignedTo = newAssignedTo;

  if (admin && isBusinessPlanActive(admin) && adminIndex !== -1) {
    // إضافة 1 للتعيين الجديد (باقة البزنس فقط)
    const a = db.admins[adminIndex];
    if (!newAssignedTo || newAssignedTo === '') {
      a.WithoutDeliveryOrdersCount = (a.WithoutDeliveryOrdersCount ?? 0) + 1;
    } else if (newAssignedTo === 'ANY_DELIVERY') {
      a.AnyDeliveryOrdersCount = (a.AnyDeliveryOrdersCount ?? 0) + 1;
    } else {
      const empIndex = db.employees.findIndex(emp => emp.id === newAssignedTo);
      if (empIndex !== -1) {
        const e = db.employees[empIndex];
        e.deliveryAssignedCount = (e.deliveryAssignedCount ?? 0) + 1;
        db.employees[empIndex] = e;
      }
    }
    db.admins[adminIndex] = a;
  }

  await writeDB(db);

  if (newAssignedTo) {
    const employee = db.employees.find(emp => emp.id === newAssignedTo);
    if (employee) {
      return {
        ...order,
        assignedEmployee: { id: employee.id, name: employee.name }
      };
    }
  }

  return order;
}

export async function assignTableOrderToEmployee(
  orderId: string,
  employeeId: string | null,
  options?: { incrementAssignedCount?: boolean }
): Promise<TableOrder | null> {
  const db = await readDB();
  const order = db.tableOrders.find(o => o.id === orderId);

  if (!order) return null;

  order.assignedTo = employeeId || undefined;

  // عدّاد تعيين الطاولة (باقة البزنس فقط)
  const admin = db.admins.find(a => a.id === order.adminId);
  if (admin && isBusinessPlanActive(admin) && options?.incrementAssignedCount && employeeId) {
    const empIndex = db.employees.findIndex(emp => emp.id === employeeId);
    if (empIndex !== -1) {
      const e = db.employees[empIndex];
      e.tableAssignedCount = (e.tableAssignedCount ?? 0) + 1;
      db.employees[empIndex] = e;
    }
  }

  await writeDB(db);

  if (employeeId) {
    const employee = db.employees.find(emp => emp.id === employeeId);
    if (employee) {
      return {
        ...order,
        assignedEmployee: { id: employee.id, name: employee.name }
      };
    }
  }

  return order;
}

// ==================== لوجز وإحصائيات (باقة البزنس) ====================

export async function getDeliveryOrderStatusLogsByUser(adminId: string, userId: string): Promise<DeliveryOrderStatusLog[]> {
  const db = await readDB();
  return db.deliveryOrderStatusLogs
    .filter(log => log.adminId === adminId && log.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getTableOrderStatusLogsByUser(adminId: string, userId: string): Promise<TableOrderStatusLog[]> {
  const db = await readDB();
  return db.tableOrderStatusLogs
    .filter(log => log.adminId === adminId && log.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** قائمة مفاتيح العدادات حسب الانتقال (تقديم/تأخير) — القيمة = مجموع الأوزان */
const DELIVERY_FORWARD_KEYS = ['deliveryForward12', 'deliveryForward13', 'deliveryForward14', 'deliveryForward23', 'deliveryForward24', 'deliveryForward34'] as const;
const DELIVERY_DOWNGRADE_KEYS = ['deliveryDowngrade43', 'deliveryDowngrade42', 'deliveryDowngrade41', 'deliveryDowngrade32', 'deliveryDowngrade31', 'deliveryDowngrade21'] as const;
const TABLE_FORWARD_KEYS = ['tableForward12', 'tableForward13', 'tableForward14', 'tableForward23', 'tableForward24', 'tableForward34'] as const;
const TABLE_DOWNGRADE_KEYS = ['tableDowngrade43', 'tableDowngrade42', 'tableDowngrade41', 'tableDowngrade32', 'tableDowngrade31', 'tableDowngrade21'] as const;

export type UserStats = {
  deliveryAssignedCount: number;
  deliveryForward12: number;
  deliveryForward13: number;
  deliveryForward14: number;
  deliveryForward23: number;
  deliveryForward24: number;
  deliveryForward34: number;
  deliveryDowngrade43: number;
  deliveryDowngrade42: number;
  deliveryDowngrade41: number;
  deliveryDowngrade32: number;
  deliveryDowngrade31: number;
  deliveryDowngrade21: number;
  tableAssignedCount: number;
  tableForward12: number;
  tableForward13: number;
  tableForward14: number;
  tableForward23: number;
  tableForward24: number;
  tableForward34: number;
  tableDowngrade43: number;
  tableDowngrade42: number;
  tableDowngrade41: number;
  tableDowngrade32: number;
  tableDowngrade31: number;
  tableDowngrade21: number;
  /** للأدمن فقط: طلبات بدون عامل توصيل / أي عامل يمكنه التوصيل */
  WithoutDeliveryOrdersCount?: number;
  AnyDeliveryOrdersCount?: number;
};

const ZERO_STATS: UserStats = {
  deliveryAssignedCount: 0,
  deliveryForward12: 0, deliveryForward13: 0, deliveryForward14: 0, deliveryForward23: 0, deliveryForward24: 0, deliveryForward34: 0,
  deliveryDowngrade43: 0, deliveryDowngrade42: 0, deliveryDowngrade41: 0, deliveryDowngrade32: 0, deliveryDowngrade31: 0, deliveryDowngrade21: 0,
  tableAssignedCount: 0,
  tableForward12: 0, tableForward13: 0, tableForward14: 0, tableForward23: 0, tableForward24: 0, tableForward34: 0,
  tableDowngrade43: 0, tableDowngrade42: 0, tableDowngrade41: 0, tableDowngrade32: 0, tableDowngrade31: 0, tableDowngrade21: 0,
};

export async function getUserStats(userId: string, userType: 'admin' | 'employee'): Promise<UserStats> {
  const db = await readDB();
  const u = userType === 'admin'
    ? db.admins.find(a => a.id === userId)
    : db.employees.find(e => e.id === userId);
  if (!u) return ZERO_STATS;
  const raw = u as Admin | Employee;
  const base: UserStats = {
    deliveryAssignedCount: raw.deliveryAssignedCount ?? 0,
    deliveryForward12: raw.deliveryForward12 ?? 0, deliveryForward13: raw.deliveryForward13 ?? 0, deliveryForward14: raw.deliveryForward14 ?? 0,
    deliveryForward23: raw.deliveryForward23 ?? 0, deliveryForward24: raw.deliveryForward24 ?? 0, deliveryForward34: raw.deliveryForward34 ?? 0,
    deliveryDowngrade43: raw.deliveryDowngrade43 ?? 0, deliveryDowngrade42: raw.deliveryDowngrade42 ?? 0, deliveryDowngrade41: raw.deliveryDowngrade41 ?? 0,
    deliveryDowngrade32: raw.deliveryDowngrade32 ?? 0, deliveryDowngrade31: raw.deliveryDowngrade31 ?? 0, deliveryDowngrade21: raw.deliveryDowngrade21 ?? 0,
    tableAssignedCount: raw.tableAssignedCount ?? 0,
    tableForward12: raw.tableForward12 ?? 0, tableForward13: raw.tableForward13 ?? 0, tableForward14: raw.tableForward14 ?? 0,
    tableForward23: raw.tableForward23 ?? 0, tableForward24: raw.tableForward24 ?? 0, tableForward34: raw.tableForward34 ?? 0,
    tableDowngrade43: raw.tableDowngrade43 ?? 0, tableDowngrade42: raw.tableDowngrade42 ?? 0, tableDowngrade41: raw.tableDowngrade41 ?? 0,
    tableDowngrade32: raw.tableDowngrade32 ?? 0, tableDowngrade31: raw.tableDowngrade31 ?? 0, tableDowngrade21: raw.tableDowngrade21 ?? 0,
  };
  if (userType === 'admin') {
    const admin = raw as Admin;
    return {
      ...base,
      WithoutDeliveryOrdersCount: admin.WithoutDeliveryOrdersCount ?? 0,
      AnyDeliveryOrdersCount: admin.AnyDeliveryOrdersCount ?? 0,
    };
  }
  return base;
}
