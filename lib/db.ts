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
  showDeliveryEmployeesAnyway?: boolean; // إظهار عمال التوصيل في الطلبات حتى لو معطلين
  showWaitersAnyway?: boolean; // إظهار الندلاء في الطلبات حتى لو معطلين
  defaultDeliveryAssignment?: 'ANY_DELIVERY' | ''; // القيمة الافتراضية لعامل التوصيل في الطلبات الجديدة
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
  customerName?: string; // اسم العميل (للطلبات من الموقع)
  customerPhone?: string; // رقم العميل (للطلبات من الموقع)
  createdAt: string;
  status?: 'pending' | 'read' | 'delivering' | 'delivered'; // حالة الطلب
  assignedTo?: string; // معرف العامل المسؤول عن الطلب
  assignedEmployee?: { id: string; name: string }; // بيانات العامل المعيّن (يتم إضافتها عند الجلب)
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
}

interface Database {
  admins: Admin[];
  lists: MenuList[];
  items: MenuItem[];
  orders: Order[];
  tableOrders: TableOrder[];
  employees: Employee[];
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
      return { admins: [], lists: [], items: [], orders: [], tableOrders: [], employees: [] };
    }
    // للتوافق مع البيانات القديمة التي لا تحتوي على tableOrders أو employees
    if (!data.tableOrders) {
      data.tableOrders = [];
    }
    if (!data.employees) {
      data.employees = [];
    }
    return data;
  } catch (error) {
    console.error('Error reading from KV:', error);
    return { admins: [], lists: [], items: [], orders: [], tableOrders: [], employees: [] };
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

export async function createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
  const db = await readDB();
  const newOrder: Order = {
    ...order,
    id: `order_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: order.status || 'pending', // Default status is 'pending'
  };
  db.orders.push(newOrder);
  await writeDB(db);
  return newOrder;
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

export async function deleteOrder(id: string): Promise<boolean> {
  const db = await readDB();
  const filteredOrders = db.orders.filter(order => order.id !== id);
  if (filteredOrders.length === db.orders.length) return false;

  db.orders = filteredOrders;
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
  await writeDB(db);
  return newOrder;
}

export async function deleteTableOrder(id: string): Promise<boolean> {
  const db = await readDB();
  const filteredOrders = db.tableOrders.filter(order => order.id !== id);
  if (filteredOrders.length === db.tableOrders.length) return false;

  db.tableOrders = filteredOrders;
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

// ==================== Employee Functions ====================

export async function createEmployee(employee: Omit<Employee, 'id' | 'createdAt'>): Promise<Employee> {
  const db = await readDB();

  // التحقق من عدم وجود username مكرر
  const existing = db.employees.find(e => e.username === employee.username);
  if (existing) {
    throw new Error('اسم المستخدم موجود بالفعل');
  }

  const newEmployee: Employee = {
    ...employee,
    id: `employee_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  db.employees.push(newEmployee);
  await writeDB(db);
  return newEmployee;
}

export async function getEmployees(adminId: string): Promise<Employee[]> {
  const db = await readDB();
  return db.employees.filter(e => e.adminId === adminId);
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

// ==================== Order Assignment Functions ====================

export async function assignOrderToEmployee(orderId: string, employeeId: string | null): Promise<Order | null> {
  const db = await readDB();
  const order = db.orders.find(o => o.id === orderId);

  if (!order) return null;

  order.assignedTo = employeeId || undefined;
  await writeDB(db);

  // Add employee data if assigned
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

export async function assignTableOrderToEmployee(orderId: string, employeeId: string | null): Promise<TableOrder | null> {
  const db = await readDB();
  const order = db.tableOrders.find(o => o.id === orderId);

  if (!order) return null;

  order.assignedTo = employeeId || undefined;
  await writeDB(db);

  // Add employee data if assigned
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
