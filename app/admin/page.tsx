'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/ImageUploader';

interface Admin {
  id: string;
  username: string;
  logoUrl?: string;
  backgroundUrl?: string;
  theme: 'ocean' | 'sunset' | 'forest' | 'royal' | 'rose' | 'midnight' | 'coral' | 'emerald' | 'lavender' | 'crimson' | 'coffee' | 'canary';
  welcomeMessage?: string;
  contactMessage?: string;
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
  const [selectedList, setSelectedList] = useState<MenuList | null>(null);
  const [editingList, setEditingList] = useState<MenuList | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeTab, setActiveTab] = useState<'lists' | 'settings'>('lists');

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
    logoUrl: '',
    backgroundUrl: '',
    welcomeMessage: '',
    contactMessage: '',
    currentPassword: '',
    newPassword: '',
  });

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
      logoUrl: admin.logoUrl || '',
      backgroundUrl: admin.backgroundUrl || '',
      welcomeMessage: admin.welcomeMessage || '',
      contactMessage: admin.contactMessage || '',
      currentPassword: '',
      newPassword: '',
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
  };

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
        {activeTab === 'lists' ? (
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
                                  <div className="flex gap-2 justify-center">
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
        ) : (
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
      </div>
    </div>
  );
}
