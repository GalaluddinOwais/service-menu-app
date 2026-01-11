'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';
import AdGenerator from '@/components/AdGenerator';
import { FONTS } from '@/lib/fonts';

interface Admin {
  id: string;
  username: string;
  logoUrl?: string;
  backgroundUrl?: string;
  theme: 'ocean' | 'sunset' | 'forest' | 'royal' | 'rose' | 'midnight' | 'coral' | 'emerald' | 'lavender' | 'crimson' | 'coffee' | 'canary';
  welcomeMessage?: string;
  contactMessage?: string;
  whatsappNumber?: string;
  isAcceptingOrders?: boolean;
  isAcceptingOrdersViaWhatsapp?: boolean;
  isAcceptingTableOrders?: boolean;
  tablesCount?: number;
}

interface MenuList {
  id: string;
  name: string;
  itemType: string;
  adminId: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
  description?: string;
  listId: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  discountedPrice?: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  adminId: string;
  orderType: 'website' | 'whatsapp';
  items: OrderItem[];
  totalPrice: number;
  totalDiscount: number;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  status?: 'pending' | 'read' | 'delivering' | 'delivered';
}

const THEMES = {
  ocean: { name: 'المحيط', primary: '#0ea5e9', secondary: '#06b6d4' },
  sunset: { name: 'الغروب', primary: '#f97316', secondary: '#fb923c' },
  forest: { name: 'الغابة', primary: '#10b981', secondary: '#34d399' },
  royal: { name: 'الملكي', primary: '#8b5cf6', secondary: '#a78bfa' },
  rose: { name: 'الوردي', primary: '#ec4899', secondary: '#f472b6' },
  midnight: { name: 'منتصف الليل', primary: '#1e293b', secondary: '#475569' },
  coral: { name: 'المرجان', primary: '#ff6b6b', secondary: '#ff8787' },
  emerald: { name: 'الزمرد', primary: '#2dd4bf', secondary: '#5eead4' },
  lavender: { name: 'الخزامى', primary: '#a78bfa', secondary: '#c4b5fd' },
  crimson: { name: 'القرمزي', primary: '#dc2626', secondary: '#ef4444' },
  coffee: { name: 'القهوة', primary: '#92400e', secondary: '#b45309' },
  canary: { name: 'الكناري', primary: '#eab308', secondary: '#facc15' },
};

export default function AdminPage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [userType, setUserType] = useState<'admin' | 'employee'>('admin');
  const [isWaiter, setIsWaiter] = useState(false); // Track if employee is a waiter
  const [isDelivery, setIsDelivery] = useState(false); // Track if employee is delivery
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null); // Track current employee ID
  const [initialDataLoaded, setInitialDataLoaded] = useState(false); // Track if initial data fetch completed
  const [lists, setLists] = useState<MenuList[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<MenuList | null>(null);
  const [editingList, setEditingList] = useState<MenuList | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'lists' | 'settings' | 'delivery' | 'orders' | 'tableOrders' | 'employees'>('orders');

  const [listFormData, setListFormData] = useState({
    name: '',
  });

  const [itemFormData, setItemFormData] = useState({
    name: '',
    price: '',
    discountedPrice: '',
    imageUrl: '',
    description: '',
  });

  const [settingsFormData, setSettingsFormData] = useState({
    username: '',
    theme: 'ocean' as 'ocean' | 'sunset' | 'forest' | 'royal' | 'rose' | 'midnight' | 'coral' | 'emerald' | 'lavender' | 'crimson' | 'coffee' | 'canary',
    cardStyle: 'rounded' as 'rounded' | 'sharp' | 'bordered' | 'modern' | 'soft' | 'fancy',
    fontFamily: 'baloo-bhaijaan' as 'cairo' | 'baloo-bhaijaan' | 'zain',
    logoUrl: '',
    backgroundUrl: '',
    welcomeMessage: '',
    contactMessage: '',
    currentPassword: '',
    newPassword: '',
  });

  const [deliveryFormData, setDeliveryFormData] = useState({
    whatsappNumber: '',
    isAcceptingOrders: false,
    isAcceptingOrdersViaWhatsapp: false,
    isAcceptingTableOrders: false,
    tablesCount: 0,
    showDeliveryStaff: false,
    showWaiterStaff: false,
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    isDelivery: false,
    isWaiter: false,
  });

  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isRefreshingTableOrders, setIsRefreshingTableOrders] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [expandedTableOrders, setExpandedTableOrders] = useState<Set<string>>(new Set());
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<{ orderId: string; status: string } | null>(null);
  const [updatingTableOrderStatus, setUpdatingTableOrderStatus] = useState<{ orderId: string; status: string } | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingTableOrderId, setDeletingTableOrderId] = useState<string | null>(null);
  const [assigningEmployee, setAssigningEmployee] = useState<string | null>(null); // orderId being assigned

  // Filtering and pagination state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'read' | 'delivering' | 'delivered'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'website' | 'whatsapp'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all'); // 'all' or employee ID
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Try admin data first
    const adminData = localStorage.getItem('admin_data');
    const employeeData = localStorage.getItem('employee_data');

    if (!adminData && !employeeData) {
      router.push('/login');
      return;
    }

    if (employeeData) {
      // Employee login
      const employee = JSON.parse(employeeData);
      setUserType('employee');
      setCurrentEmployeeId(employee.id);

      // Track employee roles
      setIsWaiter(employee.isWaiter || false);
      setIsDelivery(employee.isDelivery || false);

      // Don't set employeeFilter here - it will trigger useEffect
      // We'll set it after fetchData completes

      // For employees, we still need the admin ID to fetch data
      // The employee object should have adminId
      if (!employee.adminId) {
        // If no adminId, logout and redirect
        localStorage.removeItem('employee_data');
        localStorage.removeItem('session_token');
        router.push('/login');
        return;
      }

      // Fetch full admin data for the employee's admin
      const token = localStorage.getItem('session_token');
      fetch(`/api/admins/${employee.adminId}/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
        .then(res => res.json())
        .then(adminData => {
          setCurrentAdmin(adminData);
          // Pass EMPLOYEE_ALL to show all employee's orders (assigned + ANY_DELIVERY)
          fetchData(employee.adminId, 'EMPLOYEE_ALL');
        })
        .catch(error => {
          console.error('Error fetching admin data:', error);
          // Fallback to minimal admin object
          setCurrentAdmin({ id: employee.adminId } as Admin);
          // Pass EMPLOYEE_ALL to show all employee's orders (assigned + ANY_DELIVERY)
          fetchData(employee.adminId, 'EMPLOYEE_ALL');
        });
      return;
    }

    if (!adminData) {
      router.push('/login');
      return;
    }

    // Admin login
    const admin = JSON.parse(adminData);
    setUserType('admin');
    setCurrentAdmin(admin);
    setSettingsFormData({
      username: admin.username || '',
      theme: admin.theme || 'ocean',
      cardStyle: admin.cardStyle || 'rounded',
      fontFamily: admin.fontFamily || 'baloo-bhaijaan',
      logoUrl: admin.logoUrl || '',
      backgroundUrl: admin.backgroundUrl || '',
      welcomeMessage: admin.welcomeMessage || '',
      contactMessage: admin.contactMessage || '',
      currentPassword: '',
      newPassword: '',
    });
    setDeliveryFormData({
      whatsappNumber: admin.whatsappNumber || '',
      isAcceptingOrders: admin.isAcceptingOrders || false,
      isAcceptingOrdersViaWhatsapp: admin.isAcceptingOrdersViaWhatsapp || false,
      isAcceptingTableOrders: admin.isAcceptingTableOrders || false,
      tablesCount: admin.tablesCount || 0,
      showDeliveryStaff: admin.showDeliveryStaff || false,
      showWaiterStaff: admin.showWaiterStaff || false,
    });
    fetchData(admin.id);
  }, [router]);

  // Refetch orders when filters or page changes
  useEffect(() => {
    if (currentAdmin) {
      // For employees with EMPLOYEE_ALL or EMPLOYEE_MINE filter, wait until currentEmployeeId is set
      if (userType === 'employee' && (employeeFilter === 'EMPLOYEE_ALL' || employeeFilter === 'EMPLOYEE_MINE') && !currentEmployeeId) {
        return;
      }
      refreshOrders();
    }
  }, [currentPage, statusFilter, orderTypeFilter, dateFilter, employeeFilter, currentEmployeeId]);

  // Set default active tab based on user type and employee role
  useEffect(() => {
    if (userType === 'employee') {
      // For employees, set the first available tab
      if (isDelivery && !isWaiter) {
        setActiveTab('orders'); // Delivery only -> delivery orders tab
      } else if (isWaiter && !isDelivery) {
        setActiveTab('tableOrders'); // Waiter only -> table orders tab
      } else if (isDelivery && isWaiter) {
        setActiveTab('orders'); // Both -> default to delivery orders
      }
    }
  }, [userType, isDelivery, isWaiter]);

  const handleLogout = () => {
    localStorage.removeItem('admin_data');
    localStorage.removeItem('employee_data');
    localStorage.removeItem('session_token');
    router.push('/login');
  };

  // دالة مساعدة للحصول على الـ session token
  const getAuthHeaders = () => {
    const token = localStorage.getItem('session_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  };

  const fetchData = async (adminId: string, employeeIdOverride?: string) => {
    // جلب العاملين أولاً - قبل أي شيء آخر
    const employeesPromise = fetch('/api/employees', {
      headers: getAuthHeaders(),
    }).then(res => res.json());

    // جلب القوائم والعناصر بالتوازي
    const [listsData, menuData, employeesData] = await Promise.all([
      fetch(`/api/lists?adminId=${adminId}`).then(res => res.json()),
      fetch('/api/menu').then(res => res.json()),
      employeesPromise
    ]);

    setLists(Array.isArray(listsData) ? listsData : []);
    setItems(Array.isArray(menuData.items) ? menuData.items : []);
    setEmployees(Array.isArray(employeesData) ? employeesData : []);

    // Determine which employeeId to use: override (for initial load) or state (for subsequent loads)
    let effectiveEmployeeFilter = employeeIdOverride !== undefined ? employeeIdOverride : employeeFilter;

    // Convert employee-specific filters to actual employee ID when needed
    if (currentEmployeeId && effectiveEmployeeFilter === 'EMPLOYEE_ALL') {
      // For EMPLOYEE_ALL, we'll send a special marker + actual employee ID
      effectiveEmployeeFilter = `EMPLOYEE_ALL:${currentEmployeeId}`;
    } else if (currentEmployeeId && effectiveEmployeeFilter === 'EMPLOYEE_MINE') {
      // For EMPLOYEE_MINE, send just the employee ID
      effectiveEmployeeFilter = currentEmployeeId;
    }

    // جلب الطلبات والطلبات الطاولات بالتوازي
    const params = new URLSearchParams({
      adminId,
      page: currentPage.toString(),
      limit: ordersPerPage.toString(),
      status: statusFilter,
      orderType: orderTypeFilter,
      dateFilter: dateFilter
    });

    // Add employeeId filter separately to handle empty string
    if (effectiveEmployeeFilter !== 'all') {
      params.append('employeeId', effectiveEmployeeFilter);
    }

    const [ordersData, tableOrdersData] = await Promise.all([
      fetch(`/api/orders?${params}`).then(res => res.json()),
      fetch(`/api/table-orders?adminId=${adminId}`, {
        headers: getAuthHeaders()
      }).then(res => res.json())
    ]);

    setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
    setTotalOrders(ordersData.total || 0);
    setTotalPages(ordersData.totalPages || 1);
    setTableOrders(Array.isArray(tableOrdersData) ? tableOrdersData : []);

    // Mark initial data as loaded
    setInitialDataLoaded(true);

    // Set employeeFilter after data is fetched (only if it was passed as override)
    if (employeeIdOverride !== undefined && employeeIdOverride !== employeeFilter) {
      setEmployeeFilter(employeeIdOverride);
    }
  };

  // دالة لتحديث طلبات التوصيل فقط
  const refreshOrders = async () => {
    if (!currentAdmin) return;

    // For employees with EMPLOYEE_ALL or EMPLOYEE_MINE filter, wait until currentEmployeeId is set
    if (userType === 'employee' && (employeeFilter === 'EMPLOYEE_ALL' || employeeFilter === 'EMPLOYEE_MINE') && !currentEmployeeId) {
      return;
    }

    setIsRefreshingOrders(true);
    try {
      // Convert employee-specific filters to actual employee ID when needed
      let effectiveEmployeeFilter = employeeFilter;
      if (currentEmployeeId && effectiveEmployeeFilter === 'EMPLOYEE_ALL') {
        effectiveEmployeeFilter = `EMPLOYEE_ALL:${currentEmployeeId}`;
      } else if (currentEmployeeId && effectiveEmployeeFilter === 'EMPLOYEE_MINE') {
        effectiveEmployeeFilter = currentEmployeeId;
      }

      const params = new URLSearchParams({
        adminId: currentAdmin.id,
        page: currentPage.toString(),
        limit: ordersPerPage.toString(),
        status: statusFilter,
        orderType: orderTypeFilter,
        dateFilter: dateFilter
      });

      // Add employeeId filter separately to handle empty string
      if (effectiveEmployeeFilter !== 'all') {
        params.append('employeeId', effectiveEmployeeFilter);
      }
      const ordersRes = await fetch(`/api/orders?${params}`);
      const ordersData = await ordersRes.json();
      setOrders(Array.isArray(ordersData.orders) ? ordersData.orders : []);
      setTotalOrders(ordersData.total || 0);
      setTotalPages(ordersData.totalPages || 1);
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  // دالة لتحديث طلبات الطاولات فقط
  const refreshTableOrders = async () => {
    if (!currentAdmin) return;
    setIsRefreshingTableOrders(true);
    try {
      const tableOrdersRes = await fetch(`/api/table-orders?adminId=${currentAdmin.id}`, {
        headers: getAuthHeaders()
      });
      const tableOrdersData = await tableOrdersRes.json();
      setTableOrders(Array.isArray(tableOrdersData) ? tableOrdersData : []);
    } catch (error) {
      console.error('Error refreshing table orders:', error);
    } finally {
      setIsRefreshingTableOrders(false);
    }
  };

  // Auto-refresh لطلبات التوصيل كل 5 دقائق
  useEffect(() => {
    if (!currentAdmin || activeTab !== 'orders') return;
    // لا تعمل auto-refresh إذا كانت طلبات التوصيل غير مفعلة
    if (!currentAdmin.isAcceptingOrders && !currentAdmin.isAcceptingOrdersViaWhatsapp) return;

    // Skip initial refresh if data was just loaded by fetchData
    if (!initialDataLoaded) return;

    // تحديث فوري عند فتح التاب
    refreshOrders();

    const interval = setInterval(() => {
      refreshOrders();
    }, 5 * 60 * 1000); // 5 دقائق

    return () => clearInterval(interval);
  }, [currentAdmin, activeTab]);

  // Auto-refresh لطلبات الطاولات كل دقيقة
  useEffect(() => {
    if (!currentAdmin || activeTab !== 'tableOrders') return;

    // تحديث فوري عند فتح التاب
    refreshTableOrders();

    const interval = setInterval(() => {
      refreshTableOrders();
    }, 60 * 1000); // دقيقة واحدة

    return () => clearInterval(interval);
  }, [currentAdmin, activeTab]);

  const handleListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    const url = editingList ? `/api/lists/${editingList.id}` : '/api/lists';
    const method = editingList ? 'PUT' : 'POST';

    // Optimistic Update: تحديث الواجهة فوراً
    if (editingList) {
      // تحديث قائمة موجودة
      setLists(lists.map(list =>
        list.id === editingList.id
          ? { ...list, name: listFormData.name }
          : list
      ));
    } else {
      // إضافة قائمة جديدة
      const tempList: MenuList = {
        id: 'temp-' + Date.now(),
        name: listFormData.name,
        itemType: 'عنصر',
        adminId: currentAdmin.id,
      };
      setLists([...lists, tempList]);
    }

    setListFormData({ name: '' });
    setEditingList(null);

    // إرسال الطلب للسيرفر في الخلفية
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...listFormData,
        adminId: currentAdmin.id,
      }),
    });

    // إذا فشل، استرجاع البيانات الحقيقية
    if (!res.ok) {
      fetchData(currentAdmin.id);
    } else {
      // تحديث بالبيانات الحقيقية من السيرفر
      fetchData(currentAdmin.id);
    }
  };

  const handleEditList = (list: MenuList) => {
    setEditingList(list);
    setListFormData({
      name: list.name,
    });
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('هل أنت متأكد؟ سيتم حذف جميع العناصر في هذه القائمة')) return;
    if (!currentAdmin) return;

    // Optimistic Update: حذف من الواجهة فوراً
    const oldLists = [...lists];
    const oldItems = [...items];

    setLists(lists.filter(list => list.id !== id));
    setItems(items.filter(item => item.listId !== id));

    if (selectedList?.id === id) {
      setSelectedList(null);
    }

    // إرسال الطلب للسيرفر في الخلفية
    const res = await fetch(`/api/lists/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    // إذا فشل، استرجاع البيانات القديمة
    if (!res.ok) {
      setLists(oldLists);
      setItems(oldItems);
    } else {
      // تحديث بالبيانات الحقيقية
      fetchData(currentAdmin.id);
    }
  };

  const handleCancelList = () => {
    setEditingList(null);
    setListFormData({ name: '' });
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList || !currentAdmin) return;

    const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
    const method = editingItem ? 'PUT' : 'POST';

    // Optimistic Update: تحديث الواجهة فوراً
    if (editingItem) {
      // تحديث عنصر موجود
      setItems(items.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              name: itemFormData.name,
              price: parseFloat(itemFormData.price),
              discountedPrice: itemFormData.discountedPrice ? parseFloat(itemFormData.discountedPrice) : undefined,
              imageUrl: itemFormData.imageUrl || undefined,
              description: itemFormData.description,
            }
          : item
      ));
    } else {
      // إضافة عنصر جديد
      const tempItem: MenuItem = {
        id: 'temp-' + Date.now(),
        name: itemFormData.name,
        price: parseFloat(itemFormData.price),
        discountedPrice: itemFormData.discountedPrice ? parseFloat(itemFormData.discountedPrice) : undefined,
        imageUrl: itemFormData.imageUrl || undefined,
        description: itemFormData.description,
        listId: selectedList.id,
      };
      setItems([...items, tempItem]);
    }

    setItemFormData({ name: '', price: '', discountedPrice: '', imageUrl: '', description: '' });
    setEditingItem(null);

    // إرسال الطلب للسيرفر في الخلفية
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...itemFormData,
        listId: selectedList.id,
      }),
    });

    // إذا فشل، استرجاع البيانات الحقيقية
    if (!res.ok) {
      fetchData(currentAdmin.id);
    } else {
      // تحديث بالبيانات الحقيقية من السيرفر
      fetchData(currentAdmin.id);
    }
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      price: item.price.toString(),
      discountedPrice: item.discountedPrice?.toString() || '',
      imageUrl: item.imageUrl || '',
      description: item.description || '',
    });
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('هل أنت متأكد؟')) return;
    if (!currentAdmin) return;

    // Optimistic Update: حذف من الواجهة فوراً
    const oldItems = [...items];
    setItems(items.filter(item => item.id !== id));

    // إرسال الطلب للسيرفر في الخلفية
    const res = await fetch(`/api/menu/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    // إذا فشل، استرجاع البيانات القديمة
    if (!res.ok) {
      setItems(oldItems);
    } else {
      // تحديث بالبيانات الحقيقية
      fetchData(currentAdmin.id);
    }
  };

  const handleCancelItem = () => {
    setEditingItem(null);
    setItemFormData({ name: '', price: '', discountedPrice: '', imageUrl: '', description: '' });
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    // إرسال الإعدادات فقط بدون كلمة المرور
    const { currentPassword, newPassword, ...otherData } = settingsFormData;

    const res = await fetch(`/api/admins/${currentAdmin.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(otherData),
    });

    if (res.ok) {
      const updatedAdmin = await res.json();
      const newAdminData = { ...currentAdmin, ...updatedAdmin };
      setCurrentAdmin(newAdminData);
      localStorage.setItem('admin_data', JSON.stringify(newAdminData));

      alert('تم حفظ الإعدادات بنجاح!');
    } else {
      const error = await res.json();
      alert(`فشل حفظ الإعدادات: ${error.error || 'خطأ غير معروف'}`);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentAdmin) return;

    // التحقق من إدخال كلمة المرور الجديدة
    if (!settingsFormData.newPassword) {
      alert('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (!settingsFormData.currentPassword) {
      alert('يرجى إدخال كلمة المرور الحالية');
      return;
    }

    // إرسال طلب PATCH لتغيير كلمة المرور فقط
    const res = await fetch(`/api/admins/${currentAdmin.id}/password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword: settingsFormData.currentPassword,
        newPassword: settingsFormData.newPassword,
      }),
    });

    if (res.ok) {
      const updatedAdmin = await res.json();
      const newAdminData = { ...currentAdmin, ...updatedAdmin };
      setCurrentAdmin(newAdminData);
      localStorage.setItem('admin_data', JSON.stringify(newAdminData));

      // إعادة تعيين حقول كلمة المرور
      setSettingsFormData({
        ...settingsFormData,
        currentPassword: '',
        newPassword: '',
      });

      alert('تم تغيير كلمة المرور بنجاح!');
    } else {
      const error = await res.json();
      alert(`فشل تغيير كلمة المرور: ${error.error || 'خطأ غير معروف'}`);
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    // التحقق من أن رقم الواتساب موجود إذا كان الطلب عبر الواتساب مفعل
    if (deliveryFormData.isAcceptingOrdersViaWhatsapp && !deliveryFormData.whatsappNumber.trim()) {
      alert('يجب إدخال رقم الواتساب لتفعيل الطلب عبر واتساب');
      return;
    }

    const res = await fetch(`/api/admins/${currentAdmin.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(deliveryFormData),
    });

    if (res.ok) {
      const updatedAdmin = await res.json();
      const newAdminData = { ...currentAdmin, ...updatedAdmin };
      setCurrentAdmin(newAdminData);
      localStorage.setItem('admin_data', JSON.stringify(newAdminData));

      alert('تم حفظ إعدادات التوصيل بنجاح!');
    } else {
      const error = await res.json();
      alert(`فشل حفظ الإعدادات: ${error.error || 'خطأ غير معروف'}`);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'read' | 'delivering' | 'delivered') => {
    try {
      setUpdatingOrderStatus({ orderId, status: newStatus });
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // If status filter is active, refetch to update the list
        if (statusFilter !== 'all') {
          await refreshOrders();
        } else {
          // Update local state only if no filter is active
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === orderId ? { ...order, status: newStatus } : order
            )
          );
        }
      } else {
        alert('فشل تحديث حالة الطلب');
      }
    } catch (error) {
      alert('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setUpdatingOrderStatus(null);
    }
  };

  const handleTableOrderStatusUpdate = async (orderId: string, newStatus: 'pending' | 'read' | 'served' | 'completed') => {
    try {
      setUpdatingTableOrderStatus({ orderId, status: newStatus });
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/table-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Update local state
        setTableOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      } else {
        const data = await res.json();
        alert('فشل تحديث حالة الطلب: ' + (data.error || 'خطأ غير معروف'));
      }
    } catch (error) {
      alert('حدث خطأ أثناء تحديث الحالة');
    } finally {
      setUpdatingTableOrderStatus(null);
    }
  };

  const getListItems = (listId: string) => {
    return items.filter(item => item.listId === listId);
  };

  // دالة تعيين عامل لطلب توصيل
  const handleAssignEmployee = async (orderId: string, employeeId: string | null) => {
    // Set loading state
    setAssigningEmployee(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ employeeId }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`فشل تعيين العامل: ${error.error || 'خطأ غير معروف'}`);
      } else {
        // Success - refresh orders to reflect filter changes
        await refreshOrders();
      }
    } catch (error) {
      alert('حدث خطأ أثناء تعيين العامل');
    } finally {
      setAssigningEmployee(null);
    }
  };

  // دوال إدارة العاملين
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    // التحقق من تطابق كلمة المرور
    if (employeeFormData.password !== employeeFormData.confirmPassword) {
      alert('كلمة المرور غير متطابقة');
      return;
    }

    // التحقق من طول كلمة المرور
    if (employeeFormData.password.length < 6) {
      alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: employeeFormData.name,
        username: employeeFormData.username,
        password: employeeFormData.password,
        isDelivery: employeeFormData.isDelivery,
        isWaiter: employeeFormData.isWaiter,
      }),
    });

    if (res.ok) {
      const newEmployee = await res.json();
      setEmployees([...employees, newEmployee]);
      setEmployeeFormData({
        name: '',
        username: '',
        password: '',
        confirmPassword: '',
        isDelivery: false,
        isWaiter: false,
      });
      alert('تم إضافة العامل بنجاح!');
    } else {
      const error = await res.json();
      alert(`فشل إضافة العامل: ${error.error || 'خطأ غير معروف'}`);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العامل؟')) return;

    const res = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      setEmployees(employees.filter(emp => emp.id !== id));
      alert('تم حذف العامل بنجاح');
    } else {
      alert('فشل حذف العامل');
    }
  };


  if (!currentAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">لوحة التحكم</h1>
              <p className="text-gray-600 mt-1">مرحباً، {currentAdmin.username}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/menu/${currentAdmin.username}`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                عرض قائمتي
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                تسجيل الخروج
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mt-6 border-b">
            {/* إدارة القوائم - للأدمن فقط */}
            {userType === 'admin' && (
              <button
                onClick={() => setActiveTab('lists')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'lists'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                إدارة القوائم
              </button>
            )}

            {/* طلبات التوصيل - للأدمن وعمال التوصيل فقط */}
            {(userType === 'admin' || isDelivery) && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                طلبات التوصيل
              </button>
            )}

            {/* طلبات الطاولات - للأدمن والنوادل فقط */}
            {(userType === 'admin' || isWaiter) && (
              <button
                onClick={() => setActiveTab('tableOrders')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'tableOrders'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                طلبات الطاولات
              </button>
            )}

            {/* إعدادات الطلبات - للأدمن فقط */}
            {userType === 'admin' && (
              <button
                onClick={() => setActiveTab('delivery')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'delivery'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                إعدادات الطلبات
              </button>
            )}

            {/* إدارة العاملين - للأدمن فقط */}
            {userType === 'admin' && (
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'employees'
                    ? 'border-b-2 border-green-600 text-green-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                إدارة العاملين
              </button>
            )}

            {/* إعدادات الحساب - للأدمن فقط */}
            {userType === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 font-bold transition-colors ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                إعدادات الحساب
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'lists' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* قسم إدارة القوائم */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {editingList ? 'تعديل قائمة' : 'إضافة قائمة جديدة'}
              </h2>
              <form onSubmit={handleListSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم القائمة</label>
                  <input
                    type="text"
                    required
                    value={listFormData.name}
                    onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: أسعار المشروبات"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
                  >
                    {editingList ? 'تحديث' : 'إضافة'}
                  </button>
                  {editingList && (
                    <button
                      type="button"
                      onClick={handleCancelList}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">القوائم ({lists.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {lists.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">لا توجد قوائم بعد</p>
                  ) : (
                    lists.map((list) => (
                      <div
                        key={list.id}
                        className={`border rounded-lg p-3 cursor-pointer transition ${
                          selectedList?.id === list.id
                            ? 'bg-blue-50 border-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedList(list)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{list.name}</h4>
                            <p className="text-xs text-gray-500">
                              {getListItems(list.id).length} عنصر
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditList(list);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteList(list.id);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs transition"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* قسم إدارة العناصر */}
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
              {selectedList ? (
                <>
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    {editingItem ? 'تعديل عنصر' : 'إضافة عنصر جديد'}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">القائمة: {selectedList.name}</p>

                  <form onSubmit={handleItemSubmit} className="space-y-4 mb-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          اسم العنصر
                        </label>
                        <input
                          type="text"
                          required
                          value={itemFormData.name}
                          onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">السعر</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={itemFormData.price}
                          onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        السعر بعد الخصم إن وجد
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemFormData.discountedPrice}
                        onChange={(e) => setItemFormData({ ...itemFormData, discountedPrice: e.target.value })}
                        placeholder="هل يوجد خصم؟ ضع السعر الجديد"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <ImageUploader
                      currentImageUrl={itemFormData.imageUrl}
                      onImageUploaded={(url) => setItemFormData({ ...itemFormData, imageUrl: url })}
                      onUploadStateChange={setIsUploadingImage}
                      label="صورة العنصر (اختياري)"
                      helperText="يمكنك رفع صورة من جهازك أو إدخال رابط صورة"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        الوصف (اختياري)
                      </label>
                      <textarea
                        value={itemFormData.description}
                        onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                        rows={3}
                        placeholder="السطر الأول سيظهر بخط عريض، والباقي بخط عادي"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isUploadingImage}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploadingImage ? 'جاري رفع الصورة...' : editingItem ? 'تحديث العنصر' : 'إضافة العنصر'}
                      </button>
                      {editingItem && (
                        <button
                          type="button"
                          onClick={handleCancelItem}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition"
                        >
                          إلغاء
                        </button>
                      )}
                    </div>
                  </form>

                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">
                      {selectedList.name} ({getListItems(selectedList.id).length} عنصر)
                    </h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {getListItems(selectedList.id).length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد عناصر في هذه القائمة بعد</p>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="text-right px-4 py-2 text-sm font-bold text-gray-700">
                                العنصر
                              </th>
                              <th className="text-right px-4 py-2 text-sm font-bold text-gray-700">السعر</th>
                              <th className="text-center px-4 py-2 text-sm font-bold text-gray-700">إجراءات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getListItems(selectedList.id).map((item) => (
                              <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-800">{item.name}</td>
                                <td className="px-4 py-3 text-green-600 font-bold">
                                 {Number(item.price).toFixed(2)} جـ  
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2 justify-center flex-wrap">
                                    <button
                                      onClick={() => handleEditItem(item)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition"
                                    >
                                      تعديل
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition"
                                    >
                                      حذف
                                    </button>
                                    {item.imageUrl && currentAdmin && (
                                      <AdGenerator
                                        itemName={item.name}
                                        itemPrice={item.price}
                                        discountedPrice={item.discountedPrice}
                                        imageUrl={item.imageUrl}
                                        contactMessage={currentAdmin.contactMessage || 'تواصل معنا الآن'}
                                        themeColors={{
                                          primary: THEMES[currentAdmin.theme].primary,
                                          secondary: THEMES[currentAdmin.theme].secondary,
                                        }}
                                        onGenerate={() => {}}
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                  <div className="text-center text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-lg">اضغط على قائمة من القوائم لإدارة العناصر فيها</p>
                    <p className="text-sm mt-2">أو أضف قائمة جديدة للبدء</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">الطلبات</h2>
              {(currentAdmin?.isAcceptingOrders || currentAdmin?.isAcceptingOrdersViaWhatsapp) && (
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={refreshOrders}
                    disabled={isRefreshingOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="تحديث الطلبات"
                  >
                    <svg
                      className={`w-5 h-5 ${isRefreshingOrders ? 'animate-spin' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isRefreshingOrders ? 'جاري التحديث...' : 'تحديث'}
                  </button>
                  <span className="text-xs text-gray-500">تحديث تلقائي كل 5 دقائق</span>
                </div>
              )}
            </div>

            {/* Filters */}
            {(totalOrders > 0 || statusFilter !== 'all' || orderTypeFilter !== 'all' || dateFilter !== 'all' || employeeFilter !== 'all') && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        جديد
                      </button>
                      <button
                        onClick={() => { setStatusFilter('read'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          statusFilter === 'read' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        مقروء
                      </button>
                      <button
                        onClick={() => { setStatusFilter('delivering'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          statusFilter === 'delivering' ? 'bg-teal-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        قيد التوصيل
                      </button>
                      <button
                        onClick={() => { setStatusFilter('delivered'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          statusFilter === 'delivered' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        تم التوصيل
                      </button>
                    </div>
                  </div>

                  {/* Order Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الطلب</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => { setOrderTypeFilter('all'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          orderTypeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setOrderTypeFilter('website'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                          orderTypeFilter === 'website' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setOrderTypeFilter('whatsapp'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                          orderTypeFilter === 'whatsapp' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">التاريخ</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => { setDateFilter('all'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          dateFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setDateFilter('today'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          dateFilter === 'today' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        اليوم
                      </button>
                      <button
                        onClick={() => { setDateFilter('week'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          dateFilter === 'week' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        أسبوع
                      </button>
                      <button
                        onClick={() => { setDateFilter('month'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                          dateFilter === 'month' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        شهر
                      </button>
                    </div>
                  </div>

                  {/* Employee Filter - للأدمن فقط */}
                  {userType === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">عامل التوصيل</label>
                      <select
                        value={employeeFilter}
                        onChange={(e) => { setEmployeeFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full px-1.5 py-0.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white text-sm"
                      >
                        <option value="all">الكل</option>
                        <option value="">بدون عامل توصيل محدد</option>
                        <option value="ANY_DELIVERY">عامل التوصيل أي عامل</option>
                        {employees.filter(emp => emp.isDelivery).map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Employee Filter - للموظفين */}
                  {userType === 'employee' && isDelivery && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلبات</label>
                      <select
                        value={employeeFilter}
                        onChange={(e) => { setEmployeeFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full px-1.5 py-0.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white text-sm"
                      >
                        <option value="EMPLOYEE_ALL">كل طلباتي</option>
                        <option value="EMPLOYEE_MINE">المعينة لي فقط</option>
                        <option value="ANY_DELIVERY">طلبات أي عامل فقط</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {orders.length === 0 && (
              <div className="text-center py-12">
                {totalOrders === 0 && statusFilter === 'all' && orderTypeFilter === 'all' && dateFilter === 'all' ? (
                  <>
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-gray-500 text-lg">
                      {currentAdmin?.isAcceptingOrders || currentAdmin?.isAcceptingOrdersViaWhatsapp
                        ? 'لا توجد طلبات بعد'
                        : 'طلبات التوصيل غير مفعلة'}
                    </p>
                    {!currentAdmin?.isAcceptingOrders && !currentAdmin?.isAcceptingOrdersViaWhatsapp && (
                      <p className="text-gray-400 text-sm mt-2">يمكنك تفعيل الطلبات من تبويب "إعدادات الطلبات"</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-lg">لا توجد طلبات تطابق الفلاتر المحددة</p>
                )}
              </div>
            )}

            {orders.length > 0 && (
              <div className="space-y-4">
                {orders.map((order) => {
                  const orderDate = new Date(order.createdAt);
                  const dateStr = orderDate.toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  });
                  const timeStr = orderDate.toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                  const isExpanded = expandedOrders.has(order.id);
                  const toggleExpand = () => {
                    const newExpanded = new Set(expandedOrders);
                    if (isExpanded) {
                      newExpanded.delete(order.id);
                    } else {
                      newExpanded.add(order.id);
                    }
                    setExpandedOrders(newExpanded);
                  };

                  return (
                  <div key={order.id} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow relative">
                    {/* ANY_DELIVERY Badge - Absolute positioned in top-left corner */}
                    {userType === 'employee' && isDelivery && (order as any).assignedTo === 'ANY_DELIVERY' && (
                      <div className="absolute -top-0.5 -left-0.5 w-8 h-5 bg-blue-700 rounded-full flex items-center justify-center  border-2 border-grey"  title="لأي عامل توصيل">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                    )}

                    {/* Responsive Grid Layout: Custom 2-column on small screens, custom columns on larger screens */}
                    <div className="grid grid-cols-2 md:grid-cols-[auto_1fr_auto_150px] gap-3 md:gap-4">
                      {/* Date/Time and Order ID - Row 1, Col 1 on small screens */}
                      <div className="flex flex-col justify-center">
                        <p className="text-xs text-gray-500">{dateStr} • {timeStr}</p>
                        <h3 className="text-lg font-bold text-gray-800">#{order.id.replace('order_', '')}</h3>
                      </div>

                      {/* Price - Row 1, Col 2 on small screens */}
                      <div className="flex flex-col justify-center items-end md:order-4 w-full max-w-full">
                        <p className="text-2xl font-black text-blue-600 whitespace-nowrap">{order.totalPrice} جـ</p>
                        {order.totalDiscount > 0 && (
                          <p className="text-sm text-green-600 font-bold whitespace-nowrap">وفر {order.totalDiscount} جـ</p>
                        )}
                      </div>

                      {/* Customer Info - Row 2, Full Width on small screens */}
                      <div className="col-span-2 md:col-span-1 md:order-2 flex items-center justify-start">
                        <div className="flex flex-wrap items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full max-w-full">
                          {order.orderType === 'whatsapp' ? (
                            <>
                              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              <span className="text-sm font-bold text-gray-800 break-words">واتساب</span>
                            </>
                          ) : order.customerName && order.customerPhone ? (
                            <>
                              <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm font-bold text-gray-800 break-words">{order.customerName}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm font-bold text-gray-800 break-words">{order.customerPhone}</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm text-gray-500 break-words">عميل</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expand/Collapse Button - Row 3, Full Width on small screens */}
                      <div className="col-span-2 md:col-span-1 md:order-3 flex items-center justify-center">
                        <button
                          onClick={toggleExpand}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
                        >
                          <svg
                            className={`w-5 h-5 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>العناصر ({order.items.length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Items Section */}
                    <div>

                      <div
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                          maxHeight: isExpanded ? '1000px' : '0',
                          opacity: isExpanded ? 1 : 0
                        }}
                      >
                        <div className="space-y-2 mt-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-3 flex-1">
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                                )}
                                <div>
                                  <p className="font-bold text-gray-800">{item.quantity} {item.name}</p>
                                </div>
                              </div>
                              <div className="border-r-2 border-gray-300 mx-3 self-stretch"></div>
                              <div className="text-left flex-shrink-0">
                                <p className="font-bold text-gray-800 whitespace-nowrap">
                                  {(item.discountedPrice || item.price) * item.quantity} جـ
                                </p>
                                {item.discountedPrice && item.discountedPrice < item.price && (
                                  <p className="text-xs text-gray-500 line-through whitespace-nowrap">
                                    {item.price * item.quantity} جـ
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Order Status Buttons */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex gap-2 flex-wrap md:flex-nowrap md:items-center">
                        {/* Status Buttons */}
                        <div className="flex flex-wrap gap-1 flex-1 md:flex-initial">
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'pending')}
                            disabled={updatingOrderStatus?.orderId === order.id}
                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                              (order.status || 'pending') === 'pending'
                                ? 'bg-blue-600 text-white shadow-md'
                                : updatingOrderStatus?.orderId === order.id && updatingOrderStatus?.status === 'pending'
                                ? 'bg-blue-100 text-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="جديد"
                          >
                            جديد
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'read')}
                            disabled={updatingOrderStatus?.orderId === order.id}
                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                              order.status === 'read'
                                ? 'bg-blue-500 text-white shadow-md'
                                : updatingOrderStatus?.orderId === order.id && updatingOrderStatus?.status === 'read'
                                ? 'bg-blue-100 text-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="مقروء"
                          >
                            مقروء
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'delivering')}
                            disabled={updatingOrderStatus?.orderId === order.id}
                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                              order.status === 'delivering'
                                ? 'bg-teal-500 text-white shadow-md'
                                : updatingOrderStatus?.orderId === order.id && updatingOrderStatus?.status === 'delivering'
                                ? 'bg-teal-100 text-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="قيد التوصيل"
                          >
                            قيد التوصيل
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            disabled={updatingOrderStatus?.orderId === order.id}
                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                              order.status === 'delivered'
                                ? 'bg-green-500 text-white shadow-md'
                                : updatingOrderStatus?.orderId === order.id && updatingOrderStatus?.status === 'delivered'
                                ? 'bg-green-100 text-gray-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title="تم"
                          >
                            تم
                          </button>
                        </div>

                        {/* Employee Assignment Dropdown - في المنتصف على الشاشات الواسعة */}
                        {userType === 'admin' && (
                          <div className="w-full md:flex-1 md:mx-2">
                            <select
                              value={assigningEmployee === order.id ? '' : ((order as any).assignedTo || '')}
                              onChange={(e) => handleAssignEmployee(order.id, e.target.value || null)}
                              disabled={assigningEmployee === order.id}
                              className={`w-full px-3  border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors ${
                                assigningEmployee === order.id ? 'opacity-50 cursor-wait' : ''
                              }`}
                            >
                              {assigningEmployee === order.id ? (
                                <option value="">جاري التعيين...</option>
                              ) : (
                                <>
                                  <option value="">بدون عامل توصيل محدد</option>
                                  <option value="ANY_DELIVERY">عامل التوصيل أي عامل</option>
                                  {(order as any).assignedEmployee && (
                                    <option value={(order as any).assignedEmployee.id}>
                                      عامل التوصيل {(order as any).assignedEmployee.name}
                                    </option>
                                  )}
                                  {employees.filter(emp => emp.isDelivery && emp.id !== (order as any).assignedTo).map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                      عامل التوصيل {emp.name}
                                    </option>
                                  ))}
                                </>
                              )}
                            </select>
                          </div>
                        )}

                        {/* Delete button - على اليسار تماماً في الشاشات الواسعة */}
                        {userType === 'admin' && (
                          <button
                            onClick={async () => {
                              setDeletingOrderId(order.id);
                              const token = localStorage.getItem('session_token');
                              const res = await fetch(`/api/orders/${order.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                },
                              });

                              if (res.ok) {
                                setOrders(orders.filter(o => o.id !== order.id));
                              }
                              setDeletingOrderId(null);
                            }}
                            disabled={deletingOrderId === order.id}
                          className={`w-full md:w-auto px-4 py-1 rounded-lg text-sm font-semibold transition ${
                            deletingOrderId === order.id
                              ? 'bg-red-100 text-gray-700 cursor-not-allowed'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                          >
                            مسح
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalOrders > ordersPerPage && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-semibold transition ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">إعدادات طلبات التوصيل</h2>
            <form onSubmit={handleDeliverySubmit} className="space-y-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryFormData.isAcceptingOrders}
                    onChange={(e) => setDeliveryFormData({ ...deliveryFormData, isAcceptingOrders: e.target.checked })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-base font-bold text-gray-800">تفعيل الطلب عبر الموقع</span>
                    <p className="text-xs text-gray-600 mt-1">عند التفعيل، سيظهر زر "اطلب الآن عبر الموقع" في السلة</p>
                  </div>
                </label>
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">إعدادات الواتساب</h3>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    رقم الواتساب
                  </label>
                  <input
                    type="tel"
                    value={deliveryFormData.whatsappNumber}
                    onChange={(e) => setDeliveryFormData({ ...deliveryFormData, whatsappNumber: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="مثال: 201234567890"
                  />
                  <p className="text-xs text-gray-500 mt-1">مطلوب لتفعيل الطلب عبر واتساب (مع كود الدولة بدون +)</p>
                </div>

                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryFormData.isAcceptingOrdersViaWhatsapp}
                      onChange={(e) => {
                        if (e.target.checked && !deliveryFormData.whatsappNumber.trim()) {
                          alert('يجب إدخال رقم الواتساب أولاً');
                          return;
                        }
                        setDeliveryFormData({ ...deliveryFormData, isAcceptingOrdersViaWhatsapp: e.target.checked });
                      }}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      disabled={!deliveryFormData.whatsappNumber.trim()}
                    />
                    <div className="flex-1">
                      <span className="text-base font-bold text-gray-800">تفعيل الطلب عبر واتساب</span>
                      <p className="text-xs text-gray-600 mt-1">
                        {deliveryFormData.whatsappNumber.trim()
                          ? 'عند التفعيل، سيظهر زر "اطلب من خلال واتساب" في السلة'
                          : 'يجب إدخال رقم الواتساب أولاً لتفعيل هذا الخيار'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">إعدادات طلبات الطاولة</h3>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deliveryFormData.isAcceptingTableOrders}
                      onChange={(e) => setDeliveryFormData({ ...deliveryFormData, isAcceptingTableOrders: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-base font-bold text-gray-800">تفعيل طلبات الطاولة</span>
                      <p className="text-xs text-gray-600 mt-1">للمطاعم - يمكن للعملاء الطلب من الطاولة مباشرة</p>
                    </div>
                  </label>
                </div>

                {deliveryFormData.isAcceptingTableOrders && (
                  <div className="mt-4">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      عدد الطاولات
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryFormData({
                          ...deliveryFormData,
                          tablesCount: Math.max(0, deliveryFormData.tablesCount - 1)
                        })}
                        className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-xl transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={deliveryFormData.tablesCount}
                        onChange={(e) => setDeliveryFormData({
                          ...deliveryFormData,
                          tablesCount: Math.max(0, parseInt(e.target.value) || 0)
                        })}
                        min="0"
                        className="w-24 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors text-center font-bold text-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setDeliveryFormData({
                          ...deliveryFormData,
                          tablesCount: deliveryFormData.tablesCount + 1
                        })}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xl transition-colors"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-600">طاولة</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">سيتم إنشاء رابط خاص و QR كود لكل طاولة</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                حفظ
              </button>
            </form>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">إعدادات الحساب</h2>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={settingsFormData.username}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, username: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="اسم المستخدم"
                />
                <p className="text-xs text-gray-500 mt-1">اسم المستخدم الخاص بك</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  السمة (Theme)
                </label>
                <select
                  value={settingsFormData.theme}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, theme: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                >
                  {Object.entries(THEMES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: THEMES[settingsFormData.theme].primary }}
                  ></div>
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: THEMES[settingsFormData.theme].secondary }}
                  ></div>
                  <span className="text-sm text-gray-600">معاينة الألوان</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  شكل الكارد
                </label>
                <select
                  value={settingsFormData.cardStyle || 'rounded'}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, cardStyle: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="rounded">مستدير - حواف دائرية</option>
                  <option value="sharp">حاد - حواف حادة مع إطار رمادي</option>
                  <option value="bordered">بإطار - إطار سميك بلون السمة المختارة</option>
                  <option value="modern">عصري - حواف دائرية بدون ظل</option>
                  <option value="soft">ناعم - حواف دائرية جداً</option>
                  <option value="fancy">مزخرف - إطار متقطع بلون السمة مع ظل مميز</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">شكل الكاردات للعناصر والرسائل</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  نوع الخط
                </label>
                <select
                  value={settingsFormData.fontFamily || 'baloo-bhaijaan'}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, fontFamily: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="cairo" className={FONTS.cairo}>هندسي قوي</option>
                  <option value="baloo-bhaijaan" className={FONTS['baloo-bhaijaan']}>لطيف ودود</option>
                  <option value="zain" className={FONTS.zain}>أنيق هادئ</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">نوع الخط المستخدم في القائمة</p>
              </div>

              <ImageUploader
                currentImageUrl={settingsFormData.logoUrl}
                onImageUploaded={(url) => setSettingsFormData({ ...settingsFormData, logoUrl: url })}
                onUploadStateChange={setIsUploadingImage}
                label="صورة الشعار"
                helperText="اختياري: شعارك الذي سيظهر في القائمة العامة - اتركه فارغاً ولن يظهر أي شعار"
              />

              <ImageUploader
                currentImageUrl={settingsFormData.backgroundUrl}
                onImageUploaded={(url) => setSettingsFormData({ ...settingsFormData, backgroundUrl: url })}
                onUploadStateChange={setIsUploadingImage}
                label="صورة الخلفية"
                helperText="اختياري: صورة خلفية لقائمتك - اتركه فارغاً وستظهر خلفية تلقائية بألوان السمة"
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  رسالة الترحيب
                </label>
                <textarea
                  value={settingsFormData.welcomeMessage}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, welcomeMessage: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder = "أهلا وسهلا بكم. نحن متخصصون في تقديم أفضل أنواع الـ.."
                />
                <p className="text-xs text-gray-500 mt-1">اختياري: رسالة تظهر في أول الصفحة بعد الشعار - اتركه فارغاً ولن تظهر أية رسالة</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  رسالة التواصل
                </label>
                <textarea
                  value={settingsFormData.contactMessage}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, contactMessage: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="مثال: لطلب طلب تواصل معنا من خلال&#10;015231231"
                />
                <p className="text-xs text-gray-500 mt-1">اختياري: رسالة تظهر بعد كل قائمة - اتركه فارغاً ولن تظهر أية رسالة</p>
              </div>

              <button
                type="submit"
                disabled={isUploadingImage}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingImage ? 'جاري رفع الصورة...' : 'حفظ الإعدادات'}
              </button>

              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">تغيير كلمة المرور</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      كلمة المرور الجديدة
                    </label>
                    <input
                      type="password"
                      value={settingsFormData.newPassword}
                      onChange={(e) => setSettingsFormData({ ...settingsFormData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="أدخل كلمة المرور الجديدة"
                    />
                  </div>

                  {settingsFormData.newPassword && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        كلمة المرور الحالية <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={settingsFormData.currentPassword}
                        onChange={(e) => setSettingsFormData({ ...settingsFormData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="أدخل كلمة المرور الحالية للتأكيد"
                      />
                      <p className="text-xs text-gray-500 mt-1">مطلوبة للتحقق من هويتك عند تغيير كلمة المرور</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={isUploadingImage}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingImage ? 'جاري رفع الصورة...' : 'تغيير كلمة المرور'}
              </button>
            </form>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">إدارة العاملين</h2>

            {/* Add Employee Form */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">إضافة عامل جديد</h3>
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.name}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="أدخل اسم العامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اسم المستخدم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.username}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                    placeholder="اسم مستخدم للتسجيل"
                  />
                  <p className="text-xs text-gray-500 mt-1">سيستخدمه العامل لتسجيل الدخول</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      كلمة المرور <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={employeeFormData.password}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                      placeholder="كلمة المرور"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      تأكيد كلمة المرور <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={employeeFormData.confirmPassword}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors"
                      placeholder="تأكيد كلمة المرور"
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Employee Type Checkboxes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">نوع الموظف</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={employeeFormData.isDelivery}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, isDelivery: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">موصل (طلبات التوصيل)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={employeeFormData.isWaiter}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, isWaiter: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">نادل (طلبات الطاولات)</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">يمكن اختيار أحدهما أو كليهما</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                >
                  إضافة عامل
                </button>
              </form>
            </div>

            {/* Employees List */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">العاملون ({employees.length})</h3>
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">لا يوجد عاملون بعد</p>
                  <p className="text-gray-400 text-sm mt-2">أضف عامل من النموذج أعلاه</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-800">{employee.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">اسم المستخدم:</span> {employee.username}
                          </p>
                          <div className="flex gap-2 mt-2">
                            {employee.isDelivery && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                                موصل
                              </span>
                            )}
                            {employee.isWaiter && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                                نادل
                              </span>
                            )}
                            {!employee.isDelivery && !employee.isWaiter && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded">
                                غير محدد
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            تاريخ الإضافة: {new Date(employee.createdAt).toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table Orders Tab */}
        {activeTab === 'tableOrders' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">طلبات الطاولات</h2>
              {currentAdmin?.isAcceptingTableOrders && (
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={refreshTableOrders}
                    disabled={isRefreshingTableOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="تحديث طلبات الطاولات"
                  >
                    <svg
                      className={`w-5 h-5 ${isRefreshingTableOrders ? 'animate-spin' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {isRefreshingTableOrders ? 'جاري التحديث...' : 'تحديث'}
                  </button>
                  <span className="text-xs text-gray-500">تحديث تلقائي كل دقيقة</span>
                </div>
              )}
            </div>

            {/* Display tables with their orders */}
            {!currentAdmin?.isAcceptingTableOrders ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-lg">طلبات الطاولة غير مفعلة</p>
                <p className="text-gray-400 text-sm mt-2">يمكنك تفعيل طلبات الطاولة من تبويب "إعدادات الطلبات"</p>
              </div>
            ) : currentAdmin.tablesCount && currentAdmin.tablesCount > 0 ? (
              <div className="space-y-6">
                {Array.from({ length: currentAdmin.tablesCount }, (_, i) => i + 1).map(tableNum => {
                  const tableUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${currentAdmin.username}?table=${tableNum}`;
                  const tableOrdersForTable = tableOrders.filter(order => order.tableNumber === tableNum);

                  return (
                    <div key={tableNum} className="border-2 border-purple-200 rounded-xl px-2 py-4 bg-purple-50">
                      {/* Table Header */}
                      <div className="flex flex-row justify-between items-start mb-4 gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-purple-800 mb-3">طاولة رقم {tableNum}</h3>
                          <div className="flex flex-col sm:flex-row gap-2 items-start">
                            <a
                              href={tableUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-auto px-2 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap text-center"
                            >
                              عرض الصفحة
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(tableUrl);
                                alert('تم نسخ الرابط!');
                              }}
                              className="w-auto px-2 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                            >
                              نسخ الرابط
                            </button>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex-shrink-0">
                          <div className="w-32 h-32 bg-white border-2 border-purple-300 rounded-lg p-2">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(tableUrl)}`}
                              alt={`QR Code للطاولة ${tableNum}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Orders for this table */}
                      <div className="mt-3">
                        <h4 className="font-bold text-gray-700 mb-2">
                          الطلبات الواردة ({tableOrdersForTable.length})
                        </h4>
                        {tableOrdersForTable.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">لا توجد طلبات لهذه الطاولة بعد</p>
                        ) : (
                          <div className="space-y-3">
                            {tableOrdersForTable
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((order) => {
                                const orderDate = new Date(order.createdAt);
                                const dateStr = orderDate.toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                });
                                const timeStr = orderDate.toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                });
                                const isExpanded = expandedTableOrders.has(order.id);
                                const toggleExpand = () => {
                                  const newExpanded = new Set(expandedTableOrders);
                                  if (isExpanded) {
                                    newExpanded.delete(order.id);
                                  } else {
                                    newExpanded.add(order.id);
                                  }
                                  setExpandedTableOrders(newExpanded);
                                };

                                return (
                              <div key={order.id} className="bg-white border-2 border-gray-200 rounded-lg p-3">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                  {/* Date & Order ID - Row 1, Left */}
                                  <div className="col-span-1 md:col-span-1">
                                    <p className="text-sm text-gray-500 whitespace-nowrap">{dateStr} • {timeStr}</p>
                                    <h5 className="text-lg font-bold text-gray-800">#{order.id.replace('table_order_', '')}</h5>
                                  </div>

                                  {/* Price & Discount - Row 1, Right on mobile, Far right on desktop */}
                                  <div className="col-span-1 md:col-span-1 md:order-3 text-left">
                                    <p className="text-2xl font-black text-purple-600">{order.totalPrice} جـ</p>
                                    {order.totalDiscount > 0 && (
                                      <p className="text-sm text-green-600 font-bold">وفر {order.totalDiscount} جـ</p>
                                    )}
                                  </div>

                                  {/* Expand/Collapse Button - Row 2 on mobile, Center on desktop */}
                                  <div className="col-span-2 md:col-span-1 md:order-2 flex items-center justify-center">
                                    <button
                                      onClick={toggleExpand}
                                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
                                    >
                                      <svg
                                        className={`w-5 h-5 ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                      <span>العناصر ({order.items.length})</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Collapsible Items Section */}
                                <div>
                                  <div
                                    className="overflow-hidden transition-all duration-300 ease-in-out"
                                    style={{
                                      maxHeight: isExpanded ? '1000px' : '0',
                                      opacity: isExpanded ? 1 : 0
                                    }}
                                  >
                                    <div className="space-y-2 mb-3">
                                      {order.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center bg-gray-50 p-3 rounded-lg">
                                          <div className="flex items-center gap-3 flex-1">
                                            {item.imageUrl && (
                                              <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                                            )}
                                            <div>
                                              <p className="font-bold text-gray-800">{item.quantity} {item.name}</p>
                                            </div>
                                          </div>
                                          <div className="border-r-2 border-gray-300 mx-3 self-stretch"></div>
                                          <div className="text-left flex-shrink-0">
                                            <p className="font-bold text-gray-800 whitespace-nowrap">
                                              {(item.discountedPrice || item.price) * item.quantity} جـ
                                            </p>
                                            {item.discountedPrice && item.discountedPrice < item.price && (
                                              <p className="text-xs text-gray-500 line-through whitespace-nowrap">
                                                {item.price * item.quantity} جـ
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Order Status Buttons */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex gap-2 flex-wrap md:flex-nowrap md:items-center">
                                    {/* Status Buttons */}
                                    <div className="flex flex-wrap gap-1 flex-1 md:flex-initial">
                                      <button
                                        onClick={() => handleTableOrderStatusUpdate(order.id, 'pending')}
                                        disabled={updatingTableOrderStatus?.orderId === order.id}
                                        className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                                          (order.status || 'pending') === 'pending'
                                            ? 'bg-purple-600 text-white shadow-md'
                                            : updatingTableOrderStatus?.orderId === order.id && updatingTableOrderStatus?.status === 'pending'
                                            ? 'bg-purple-200 text-gray-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                        title="جديد"
                                      >
                                        جديد
                                      </button>
                                      <button
                                        onClick={() => handleTableOrderStatusUpdate(order.id, 'read')}
                                        disabled={updatingTableOrderStatus?.orderId === order.id}
                                        className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                                          order.status === 'read'
                                            ? 'bg-fuchsia-600 text-white shadow-md'
                                            : updatingTableOrderStatus?.orderId === order.id && updatingTableOrderStatus?.status === 'read'
                                            ? 'bg-fuchsia-200 text-gray-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                        title="مقروء"
                                      >
                                        مقروء
                                      </button>
                                      <button
                                        onClick={() => handleTableOrderStatusUpdate(order.id, 'served')}
                                        disabled={updatingTableOrderStatus?.orderId === order.id}
                                        className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                                          order.status === 'served'
                                            ? 'bg-pink-600 text-white shadow-md'
                                            : updatingTableOrderStatus?.orderId === order.id && updatingTableOrderStatus?.status === 'served'
                                            ? 'bg-pink-200 text-gray-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                        title="تم التقديم"
                                      >
                                        تم التقديم
                                      </button>
                                      <button
                                        onClick={() => handleTableOrderStatusUpdate(order.id, 'completed')}
                                        disabled={updatingTableOrderStatus?.orderId === order.id}
                                        className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${
                                          order.status === 'completed'
                                            ? 'bg-rose-600 text-white shadow-md'
                                            : updatingTableOrderStatus?.orderId === order.id && updatingTableOrderStatus?.status === 'completed'
                                            ? 'bg-rose-200 text-gray-700'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                        title="تم"
                                      >
                                        تم
                                      </button>
                                    </div>

                                    {/* Spacer - لدفع زر المسح إلى اليسار في الشاشات الواسعة */}
                                    <div className="hidden md:block md:flex-1"></div>

                                    {/* Delete button - على اليسار تماماً في الشاشات الواسعة */}
                                    {userType === 'admin' && (
                                      <button
                                        onClick={async () => {
                                          setDeletingTableOrderId(order.id);
                                          const token = localStorage.getItem('session_token');
                                          const res = await fetch(`/api/table-orders/${order.id}`, {
                                            method: 'DELETE',
                                            headers: {
                                              'Authorization': `Bearer ${token}`,
                                            },
                                          });

                                          if (res.ok) {
                                            setTableOrders(tableOrders.filter(o => o.id !== order.id));
                                          }
                                          setDeletingTableOrderId(null);
                                        }}
                                        disabled={deletingTableOrderId === order.id}
                                        className={`w-full md:w-auto px-4 py-1 rounded-lg text-sm font-semibold transition ${
                                          deletingTableOrderId === order.id
                                            ? 'bg-red-100 text-gray-700 cursor-not-allowed'
                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                        }`}
                                      >
                                        مسح
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">لم يتم إضافة أي طاولات بعد</p>
                <p className="text-sm">أضف طاولة أو اكثر من خلال "إعدادات الطلبات"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
