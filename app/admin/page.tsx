'use client';
import { useState, useEffect } from 'react';
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
  const [lists, setLists] = useState<MenuList[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<MenuList | null>(null);
  const [editingList, setEditingList] = useState<MenuList | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'lists' | 'settings' | 'delivery' | 'orders' | 'tableOrders'>('lists');

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
  });

  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isRefreshingTableOrders, setIsRefreshingTableOrders] = useState(false);

  useEffect(() => {
    const adminData = localStorage.getItem('admin_data');
    if (!adminData) {
      router.push('/login');
      return;
    }

    const admin = JSON.parse(adminData);
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
    });
    fetchData(admin.id);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_data');
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

  const fetchData = async (adminId: string) => {
    // جلب القوائم الخاصة بالأدمن الحالي
    const listsRes = await fetch(`/api/lists?adminId=${adminId}`);
    const listsData = await listsRes.json();
    setLists(Array.isArray(listsData) ? listsData : []);

    // جلب جميع العناصر
    const menuRes = await fetch('/api/menu');
    const menuData = await menuRes.json();
    setItems(Array.isArray(menuData.items) ? menuData.items : []);

    // جلب الطلبات الخاصة بالأدمن
    const ordersRes = await fetch(`/api/orders?adminId=${adminId}`);
    const ordersData = await ordersRes.json();
    setOrders(Array.isArray(ordersData) ? ordersData : []);

    // جلب طلبات الطاولات الخاصة بالأدمن
    const tableOrdersRes = await fetch(`/api/table-orders?adminId=${adminId}`);
    const tableOrdersData = await tableOrdersRes.json();
    setTableOrders(Array.isArray(tableOrdersData) ? tableOrdersData : []);
  };

  // دالة لتحديث طلبات التوصيل فقط
  const refreshOrders = async () => {
    if (!currentAdmin) return;
    setIsRefreshingOrders(true);
    try {
      const ordersRes = await fetch(`/api/orders?adminId=${currentAdmin.id}`);
      const ordersData = await ordersRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
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
      const tableOrdersRes = await fetch(`/api/table-orders?adminId=${currentAdmin.id}`);
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

    const interval = setInterval(() => {
      refreshOrders();
    }, 5 * 60 * 1000); // 5 دقائق

    return () => clearInterval(interval);
  }, [currentAdmin, activeTab]);

  // Auto-refresh لطلبات الطاولات كل دقيقة
  useEffect(() => {
    if (!currentAdmin || activeTab !== 'tableOrders') return;

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

    const res = await fetch(`/api/admins/${currentAdmin.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingsFormData),
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

      alert('تم حفظ الإعدادات بنجاح!');
    } else {
      const error = await res.json();
      alert(`فشل حفظ الإعدادات: ${error.error || 'خطأ غير معروف'}`);
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

  const getListItems = (listId: string) => {
    return items.filter(item => item.listId === listId);
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
          <div className="flex gap-2 mt-6 border-b">
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
            {currentAdmin?.isAcceptingTableOrders && (
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
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition"
                      >
                        {editingItem ? 'تحديث العنصر' : 'إضافة العنصر'}
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
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-gray-500 text-lg">لا توجد طلبات بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order) => (
                  <div key={order.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-800">طلب #{order.id.replace('order_', '')}</h3>
                          {order.orderType === 'whatsapp' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              واتساب
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {order.orderType === 'website' && order.customerName && order.customerPhone && (
                          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-sm font-bold text-gray-800">{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="text-sm font-bold text-gray-800">{order.customerPhone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-black text-blue-600">{order.totalPrice} جـ</p>
                        {order.totalDiscount > 0 && (
                          <p className="text-sm text-green-600 font-bold">وفر {order.totalDiscount} جـ</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t-2 border-gray-100 pt-4">
                      <h4 className="font-bold text-gray-700 mb-3">العناصر:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                              )}
                              <div>
                                <p className="font-bold text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-gray-800">
                                {(item.discountedPrice || item.price) * item.quantity} جـ
                              </p>
                              {item.discountedPrice && item.discountedPrice < item.price && (
                                <p className="text-xs text-gray-500 line-through">
                                  {item.price * item.quantity} جـ
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
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
                label="صورة الشعار"
                helperText="اختياري: شعارك الذي سيظهر في القائمة العامة - اتركه فارغاً ولن يظهر أي شعار"
              />

              <ImageUploader
                currentImageUrl={settingsFormData.backgroundUrl}
                onImageUploaded={(url) => setSettingsFormData({ ...settingsFormData, backgroundUrl: url })}
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

              <div className="border-t-2 border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">تغيير كلمة المرور (اختياري)</h3>

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
                      placeholder="اتركه فارغاً إذا لم ترد تغيير كلمة المرور"
                    />
                    <p className="text-xs text-gray-500 mt-1">اختياري: اتركه فارغاً للاحتفاظ بكلمة المرور الحالية</p>
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
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                حفظ الإعدادات
              </button>
            </form>
          </div>
        )}

        {/* Table Orders Tab */}
        {activeTab === 'tableOrders' && currentAdmin?.isAcceptingTableOrders && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">طلبات الطاولات</h2>
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
            </div>

            {/* Display tables with their orders */}
            {currentAdmin.tablesCount && currentAdmin.tablesCount > 0 ? (
              <div className="space-y-6">
                {Array.from({ length: currentAdmin.tablesCount }, (_, i) => i + 1).map(tableNum => {
                  const tableUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${currentAdmin.username}?table=${tableNum}`;
                  const tableOrdersForTable = tableOrders.filter(order => order.tableNumber === tableNum);

                  return (
                    <div key={tableNum} className="border-2 border-purple-200 rounded-xl p-6 bg-purple-50">
                      {/* Table Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-purple-800 mb-2">طاولة رقم {tableNum}</h3>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 font-medium">رابط الطاولة:</span>
                              <a
                                href={tableUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                              >
                                {tableUrl}
                              </a>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(tableUrl);
                                  alert('تم نسخ الرابط!');
                                }}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                نسخ
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className="text-center">
                          <div className="w-32 h-32 bg-white border-2 border-purple-300 rounded-lg p-2">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(tableUrl)}`}
                              alt={`QR Code للطاولة ${tableNum}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">QR كود</p>
                        </div>
                      </div>

                      {/* Orders for this table */}
                      <div className="mt-4">
                        <h4 className="font-bold text-gray-700 mb-3">
                          الطلبات الواردة ({tableOrdersForTable.length})
                        </h4>
                        {tableOrdersForTable.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">لا توجد طلبات لهذه الطاولة بعد</p>
                        ) : (
                          <div className="space-y-3">
                            {tableOrdersForTable
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((order) => (
                              <div key={order.id} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h5 className="font-bold text-gray-800">طلب #{order.id.replace('table_order_', '')}</h5>
                                    <p className="text-xs text-gray-500">
                                      {new Date(order.createdAt).toLocaleString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-xl font-black text-purple-600">{order.totalPrice} جـ</p>
                                    {order.totalDiscount > 0 && (
                                      <p className="text-xs text-green-600 font-bold">وفر {order.totalDiscount} جـ</p>
                                    )}
                                  </div>
                                </div>

                                <div className="border-t pt-2 mt-2">
                                  <p className="text-sm font-bold text-gray-700 mb-1">العناصر:</p>
                                  <ul className="text-sm text-gray-600 space-y-1">
                                    {order.items.map((item: any, idx: number) => (
                                      <li key={idx} className="flex justify-between">
                                        <span>• {item.name} × {item.quantity}</span>
                                        <span className="font-bold">{item.price} جـ</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <button
                                  onClick={async () => {
                                    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
                                      const token = localStorage.getItem('session_token');
                                      const res = await fetch(`/api/table-orders/${order.id}`, {
                                        method: 'DELETE',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                        },
                                      });

                                      if (res.ok) {
                                        setTableOrders(tableOrders.filter(o => o.id !== order.id));
                                        alert('تم حذف الطلب بنجاح!');
                                      } else {
                                        alert('فشل حذف الطلب');
                                      }
                                    }
                                  }}
                                  className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-sm transition-colors"
                                >
                                  حذف الطلب
                                </button>
                              </div>
                            ))}
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
                <p className="text-sm">قم بتفعيل طلبات الطاولة وإضافة عدد الطاولات من تبويب "إعدادات الطلبات"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
