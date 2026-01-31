'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import ImageUploader, { type ImageUploaderRef } from '@/components/ImageUploader';
import AdGenerator from '@/components/AdGenerator';
import UpgradeModal from '@/components/UpgradeModal';
import LimitReachedModal from '@/components/LimitReachedModal';
import { FONTS } from '@/lib/fonts';

interface Admin {
  id: string;
  name?: string;
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
  enableDeliveryEmployees?: boolean;
  enableWaiters?: boolean;
  showDeliveryEmployeesAnyway?: boolean;
  showWaitersAnyway?: boolean;
  defaultDeliveryAssignment?: 'ANY_DELIVERY' | '';
  plan?: 'free' | 'basic' | 'pro' | 'business';
  subscriptionStatus?: 'active' | 'inactive' | 'expired' | 'trial';
  subscriptionEndsAt?: string;
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

function AdminPageContent() {
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
  type TabType = 'summary' | 'lists' | 'settings' | 'delivery' | 'orders' | 'tableOrders' | 'employees' | 'workersActivity';
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const tabParam = searchParams.get('tab');
  const TAB_VALUES: TabType[] = ['summary', 'lists', 'settings', 'delivery', 'orders', 'tableOrders', 'employees', 'workersActivity'];
  const activeTab: TabType = TAB_VALUES.includes(tabParam as TabType) ? (tabParam as TabType) : 'summary';
  const setActiveTab = (tab: TabType) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const listFormRef = useRef<HTMLDivElement>(null);
  const itemFormRef = useRef<HTMLDivElement>(null);
  const itemImageUploadRef = useRef<ImageUploaderRef>(null);
  const employeeFormRef = useRef<HTMLDivElement>(null);

  // ملخص النشاط (باقة البزنس): إحصائيات الفريق للأدمن — استجابة واحدة من عدة قد تكون لاحقاً
  type TeamStatsUser = { id: string; name: string; userType: 'admin' | 'employee'; stats: Record<string, number> };
  const [teamStatsUsers, setTeamStatsUsers] = useState<TeamStatsUser[]>([]);
  const [teamStatsLoading, setTeamStatsLoading] = useState(false);
  const [teamStatsError, setTeamStatsError] = useState<string | null>(null);
  const [teamStatsCachedAt, setTeamStatsCachedAt] = useState<string | null>(null);

  // إحصائيات الطلبات (باقة Pro): عدادات وجوامع وتمت — للعرض في ملخص النشاط
  type OrderStats = {
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
    sumCompletedPriceWhatsapp?: number;
    sumCompletedPriceWebsite?: number;
    sumCompletedPriceTable?: number;
    sumCompletedDiscountWhatsapp?: number;
    sumCompletedDiscountWebsite?: number;
    sumCompletedDiscountTable?: number;
  };
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [orderStatsLoading, setOrderStatsLoading] = useState(false);
  const [orderStatsError, setOrderStatsError] = useState<string | null>(null);

  // نشاط العمال: كاردات فقط + تفاصيل المُختار في قسم أسفل (باقة البزنس للتفاصيل)
  type WorkerCard = {
    id: string;
    name: string;
    imageUrl?: string;
    username?: string;
    phone?: string;
    isDelivery?: boolean;
    isWaiter?: boolean;
    deliveryForward?: number;
    deliveryDowngrade?: number;
    tableForward?: number;
    tableDowngrade?: number;
    createdAt?: string;
  };

  const EMPLOYEE_RATING_STORAGE_KEY = 'admin-employee-rating-settings';
  const defaultEmployeeRatingSettings = {
    enableEmployeeRating: false,
    scaleDeliveryForward: 0 as number,
    scaleDeliveryBackward: 0 as number,
    scaleTableForward: 0 as number,
    scaleTableBackward: 0 as number,
    tendencyX: 0.5 as number,
  };
  const [employeeRatingSettings, setEmployeeRatingSettings] = useState(() => {
    if (typeof window === 'undefined') return defaultEmployeeRatingSettings;
    try {
      const raw = localStorage.getItem(EMPLOYEE_RATING_STORAGE_KEY);
      if (!raw) return defaultEmployeeRatingSettings;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        enableEmployeeRating: !!parsed.enableEmployeeRating,
        scaleDeliveryForward: typeof parsed.scaleDeliveryForward === 'number' ? parsed.scaleDeliveryForward : 0,
        scaleDeliveryBackward: typeof parsed.scaleDeliveryBackward === 'number' ? parsed.scaleDeliveryBackward : 0,
        scaleTableForward: typeof parsed.scaleTableForward === 'number' ? parsed.scaleTableForward : 0,
        scaleTableBackward: typeof parsed.scaleTableBackward === 'number' ? parsed.scaleTableBackward : 0,
        tendencyX: typeof parsed.tendencyX === 'number' && parsed.tendencyX >= 0 && parsed.tendencyX <= 1 ? parsed.tendencyX : 0.5,
      };
    } catch {
      return defaultEmployeeRatingSettings;
    }
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(EMPLOYEE_RATING_STORAGE_KEY, JSON.stringify(employeeRatingSettings));
    } catch {}
  }, [employeeRatingSettings]);
  const [isSavingRatingSettings, setIsSavingRatingSettings] = useState(false);
  const [workersActivityList, setWorkersActivityList] = useState<WorkerCard[]>([]);
  const [workersActivityListLoading, setWorkersActivityListLoading] = useState(false);
  const [workersActivitySearchQuery, setWorkersActivitySearchQuery] = useState('');
  const [workersActivityRoleFilter, setWorkersActivityRoleFilter] = useState<'all' | 'delivery' | 'waiter' | 'deliveryOnly' | 'waiterOnly'>('all');
  const [workersActivityPage, setWorkersActivityPage] = useState(1);
  const WORKERS_ACTIVITY_PAGE_SIZE = 8;
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);
  const workerDetailsRef = useRef<HTMLDivElement>(null);
  const [expandedWorkerProfile, setExpandedWorkerProfile] = useState<Record<string, unknown> | null>(null);
  const [expandedWorkerStats, setExpandedWorkerStats] = useState<Record<string, number> | null>(null);
  const [expandedWorkerDeliveryLogs, setExpandedWorkerDeliveryLogs] = useState<{ logs: unknown[]; total: number; page: number; limit: number }>({ logs: [], total: 0, page: 1, limit: 10 });
  const [expandedWorkerTableLogs, setExpandedWorkerTableLogs] = useState<{ logs: unknown[]; total: number; page: number; limit: number }>({ logs: [], total: 0, page: 1, limit: 10 });
  const [expandedWorkerLoading, setExpandedWorkerLoading] = useState(false);

  // تقييم الموظف (نقاط، كفاءة، ترتيب عام، ترتيب توصيل، ترتيب ندلاء) — للموظف فقط (باقة البزنس)
  const [employeeRatingInfo, setEmployeeRatingInfo] = useState<{
    enabled: boolean;
    points?: number;
    efficiency?: number;
    rank?: number;
    rankAmongDelivery?: number;
    rankAmongWaiters?: number;
  } | null>(null);
  const [employeeRatingInfoLoading, setEmployeeRatingInfoLoading] = useState(false);

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
    name: '',
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

  const [employeeSettingsForm, setEmployeeSettingsForm] = useState({
    enableDeliveryEmployees: false,
    showDeliveryEmployeesAnyway: false,
    defaultDeliveryAssignment: '' as 'ANY_DELIVERY' | '',
    enableWaiters: false,
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState<{
    name: string;
    username: string;
    password: string;
    confirmPassword: string;
    isDelivery: boolean;
    isWaiter: boolean;
    phone: string;
    imageUrl?: string;
  }>({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    isDelivery: false,
    isWaiter: false,
    phone: '',
  });
  const employeeImageUploadRef = useRef<ImageUploaderRef>(null);
  const [isUploadingEmployeePhoto, setIsUploadingEmployeePhoto] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [isRefreshingTableOrders, setIsRefreshingTableOrders] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [expandedTableOrders, setExpandedTableOrders] = useState<Set<string>>(new Set());
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<{ orderId: string; status: string } | null>(null);
  const [updatingTableOrderStatus, setUpdatingTableOrderStatus] = useState<{ orderId: string; status: string } | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deletingTableOrderId, setDeletingTableOrderId] = useState<string | null>(null);
  const [assigningEmployee, setAssigningEmployee] = useState<string | null>(null); // orderId being assigned
  const [currentTime, setCurrentTime] = useState(new Date());

  // Upgrade Modal State
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [lockedFeatureName, setLockedFeatureName] = useState('');
  const [requiredPlan, setRequiredPlan] = useState<'basic' | 'pro' | 'business'>('basic');

  // Limit Modal State
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitModalConfig, setLimitModalConfig] = useState({ title: '', message: '' });

  // تنبيه "أحدهم حول الطلب الى هذه الحالة بالفعل" (باقة البزنس)
  const [alreadyInStatePopup, setAlreadyInStatePopup] = useState<{ open: boolean; orderId: string; statusLabel: string }>({ open: false, orderId: '', statusLabel: '' });
  const [statusDowngradePopup, setStatusDowngradePopup] = useState<{ open: boolean; orderId: string; previousStatusLabel: string; newStatusLabel: string }>({ open: false, orderId: '', previousStatusLabel: '', newStatusLabel: '' });

  const DELIVERY_STATUS_LABELS: Record<string, string> = { pending: 'جديد', read: 'مقروء', delivering: 'قيد التوصيل', delivered: 'تم' };
  const TABLE_STATUS_LABELS: Record<string, string> = { pending: 'جديد', read: 'مقروء', served: 'تم التقديم', completed: 'تم' };

  const HIDE_ALREADY_IN_STATE_POPUP = 'hide_already_in_state_popup';
  const HIDE_STATUS_DOWNGRADE_POPUP = 'hide_status_downgrade_popup';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // تحديث كل دقيقة
    return () => clearInterval(timer);
  }, []);

  // Filtering and pagination state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'read' | 'delivering' | 'delivered'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'website' | 'whatsapp'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all'); // 'all' or employee ID
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Employee pagination state
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalEmployeesPages, setTotalEmployeesPages] = useState(1);
  const employeesPerPage = 10;

  useEffect(() => {
    // Try admin data first
    const adminData = localStorage.getItem('admin_data');
    const employeeData = localStorage.getItem('employee_data');

    if (!adminData && !employeeData) {
      router.push('/login');
      return;
    }

    // Check for Admin Data FIRST
    if (adminData) {
      // Admin login - جلب البيانات المحدثة من الـ API
      const adminFromStorage = JSON.parse(adminData);
      setUserType('admin');

      // Fetch fresh admin data from API
      const token = localStorage.getItem('session_token');
      fetch(`/api/admins/${adminFromStorage.id}/info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
        .then(res => res.json())
        .then(admin => {
          setCurrentAdmin(admin);
          setSettingsFormData({
            name: admin.name || '',
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
          // Helper: check plan from admin object directly
          const adminPlanActive = (plan: 'basic' | 'pro' | 'business') => {
            if (!admin.plan || admin.plan === 'free') return false;
            if (!admin.subscriptionEndsAt) return false;
            if (new Date(admin.subscriptionEndsAt) < new Date()) return false;
            const levels: Record<string, number> = { free: 0, basic: 1, pro: 2, business: 3 };
            return levels[admin.plan] >= levels[plan];
          };
          setDeliveryFormData({
            whatsappNumber: admin.whatsappNumber || '',
            isAcceptingOrders: adminPlanActive('basic') ? (admin.isAcceptingOrders || false) : false,
            isAcceptingOrdersViaWhatsapp: admin.isAcceptingOrdersViaWhatsapp || false,
            isAcceptingTableOrders: adminPlanActive('pro') ? (admin.isAcceptingTableOrders || false) : false,
            tablesCount: admin.tablesCount || 0,
            showDeliveryStaff: admin.showDeliveryStaff || false,
            showWaiterStaff: admin.showWaiterStaff || false,
          });
          setEmployeeSettingsForm({
            enableDeliveryEmployees: adminPlanActive('basic') ? (admin.enableDeliveryEmployees || false) : false,
            showDeliveryEmployeesAnyway: admin.showDeliveryEmployeesAnyway || false,
            defaultDeliveryAssignment: admin.defaultDeliveryAssignment || '',
            enableWaiters: adminPlanActive('pro') ? (admin.enableWaiters || false) : false,
          });
          if (adminPlanActive('business') && (admin.employeeRatingEnable !== undefined || admin.employeeRatingTendencyX !== undefined)) {
            setEmployeeRatingSettings({
              enableEmployeeRating: !!admin.employeeRatingEnable,
              scaleDeliveryForward: typeof admin.employeeRatingScaleDeliveryForward === 'number' ? admin.employeeRatingScaleDeliveryForward : 0,
              scaleDeliveryBackward: typeof admin.employeeRatingScaleDeliveryBackward === 'number' ? admin.employeeRatingScaleDeliveryBackward : 0,
              scaleTableForward: typeof admin.employeeRatingScaleTableForward === 'number' ? admin.employeeRatingScaleTableForward : 0,
              scaleTableBackward: typeof admin.employeeRatingScaleTableBackward === 'number' ? admin.employeeRatingScaleTableBackward : 0,
              tendencyX: typeof admin.employeeRatingTendencyX === 'number' && admin.employeeRatingTendencyX >= 0 && admin.employeeRatingTendencyX <= 1 ? admin.employeeRatingTendencyX : 0.5,
            });
          }
          fetchData(admin.id);
        })
        .catch(error => {
          console.error('Error fetching admin data:', error);
          // Fallback to localStorage data
          const admin = adminFromStorage;
          setCurrentAdmin(admin);
          // Helper: check plan from admin object directly
          const adminPlanActive = (plan: 'basic' | 'pro' | 'business') => {
            if (!admin.plan || admin.plan === 'free') return false;
            if (!admin.subscriptionEndsAt) return false;
            if (new Date(admin.subscriptionEndsAt) < new Date()) return false;
            const levels: Record<string, number> = { free: 0, basic: 1, pro: 2, business: 3 };
            return levels[admin.plan] >= levels[plan];
          };
          setSettingsFormData({
            name: admin.name || '',
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
            isAcceptingOrders: adminPlanActive('basic') ? (admin.isAcceptingOrders || false) : false,
            isAcceptingOrdersViaWhatsapp: admin.isAcceptingOrdersViaWhatsapp || false,
            isAcceptingTableOrders: adminPlanActive('pro') ? (admin.isAcceptingTableOrders || false) : false,
            tablesCount: admin.tablesCount || 0,
            showDeliveryStaff: admin.showDeliveryStaff || false,
            showWaiterStaff: admin.showWaiterStaff || false,
          });
          setEmployeeSettingsForm({
            enableDeliveryEmployees: adminPlanActive('basic') ? (admin.enableDeliveryEmployees || false) : false,
            showDeliveryEmployeesAnyway: admin.showDeliveryEmployeesAnyway || false,
            defaultDeliveryAssignment: admin.defaultDeliveryAssignment || '',
            enableWaiters: adminPlanActive('pro') ? (admin.enableWaiters || false) : false,
          });
          if (adminPlanActive('business') && (admin.employeeRatingEnable !== undefined || admin.employeeRatingTendencyX !== undefined)) {
            setEmployeeRatingSettings({
              enableEmployeeRating: !!admin.employeeRatingEnable,
              scaleDeliveryForward: typeof admin.employeeRatingScaleDeliveryForward === 'number' ? admin.employeeRatingScaleDeliveryForward : 0,
              scaleDeliveryBackward: typeof admin.employeeRatingScaleDeliveryBackward === 'number' ? admin.employeeRatingScaleDeliveryBackward : 0,
              scaleTableForward: typeof admin.employeeRatingScaleTableForward === 'number' ? admin.employeeRatingScaleTableForward : 0,
              scaleTableBackward: typeof admin.employeeRatingScaleTableBackward === 'number' ? admin.employeeRatingScaleTableBackward : 0,
              tendencyX: typeof admin.employeeRatingTendencyX === 'number' && admin.employeeRatingTendencyX >= 0 && admin.employeeRatingTendencyX <= 1 ? admin.employeeRatingTendencyX : 0.5,
            });
          }
          fetchData(admin.id);
        });
      return;
    }

    // Only if NOT admin, check for Employee Data
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

  // Set default active tab for employee when URL has no valid tab (employees don't see summary)
  useEffect(() => {
    if (userType !== 'employee') return;
    const allowedTabs: TabType[] = isPlanActive('business') ? ['workersActivity'] : [];
    if (isDelivery) allowedTabs.push('orders');
    if (isWaiter) allowedTabs.push('tableOrders');
    const tabFromUrl = tabParam as TabType | null;
    const urlTabAllowed = tabFromUrl && TAB_VALUES.includes(tabFromUrl) && allowedTabs.includes(tabFromUrl);
    if (urlTabAllowed) return; // احترام التبويب في الرابط
    const defaultTab = isDelivery ? 'orders' : isWaiter ? 'tableOrders' : allowedTabs[0];
    if (defaultTab) setActiveTab(defaultTab);
  }, [userType, isDelivery, isWaiter, tabParam]);

  // إذا فُتح تبويب نشاط العاملين دون باقة البزنس (مثلاً من الرابط) — إعادة التوجيه
  useEffect(() => {
    if (activeTab !== 'workersActivity' || isPlanActive('business')) return;
    setActiveTab(userType === 'admin' ? 'summary' : isDelivery ? 'orders' : isWaiter ? 'tableOrders' : 'orders');
  }, [activeTab, userType, isDelivery, isWaiter, currentAdmin?.plan]);

  const handleLogout = () => {
    localStorage.removeItem('admin_data');
    localStorage.removeItem('employee_data');
    localStorage.removeItem('session_token');
    localStorage.removeItem(HIDE_ALREADY_IN_STATE_POPUP);
    localStorage.removeItem(HIDE_STATUS_DOWNGRADE_POPUP);
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
    const employeesPromise = fetch(`/api/employees?page=${currentEmployeePage}&limit=${employeesPerPage}`, {
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

    if (employeesData && Array.isArray(employeesData.employees)) {
      setEmployees(employeesData.employees);
      setTotalEmployees(employeesData.total || 0);
      setTotalEmployeesPages(employeesData.totalPages || 1);
    } else {
      setEmployees([]);
    }

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

  // دالة لتحديث العاملين فقط
  const refreshEmployees = async () => {
    if (!currentAdmin) return;
    try {
      const res = await fetch(`/api/employees?page=${currentEmployeePage}&limit=${employeesPerPage}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data && Array.isArray(data.employees)) {
        setEmployees(data.employees);
        setTotalEmployees(data.total || 0);
        setTotalEmployeesPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error refreshing employees:', error);
    }
  };

  // Refetch employees when page changes
  useEffect(() => {
    if (currentAdmin && activeTab === 'employees' && initialDataLoaded) {
      refreshEmployees();
    }
  }, [currentEmployeePage]);

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

  // Helper to check if a plan is active and not expired
  const isPlanActive = (plan: 'basic' | 'pro' | 'business' = 'basic') => {
    if (!currentAdmin || !currentAdmin.plan || currentAdmin.plan === 'free') return false;
    if (!currentAdmin.subscriptionEndsAt) return false;
    const expiryDate = new Date(currentAdmin.subscriptionEndsAt);
    if (expiryDate < new Date()) return false;

    const planLevels = { free: 0, basic: 1, pro: 2, business: 3 };
    return planLevels[currentAdmin.plan] >= planLevels[plan];
  };

  // Had a paid plan but subscription ended (for popup copy: "renew" vs "upgrade")
  const isSubscriptionExpired =
    !!currentAdmin &&
    !!currentAdmin.plan &&
    currentAdmin.plan !== 'free' &&
    (!currentAdmin.subscriptionEndsAt || new Date(currentAdmin.subscriptionEndsAt) < new Date());

  // جلب إحصائيات الفريق لتبويب ملخص النشاط (باقة البزنس فقط)
  const fetchTeamStats = async () => {
    setTeamStatsLoading(true);
    setTeamStatsError(null);
    try {
      const res = await fetch('/api/admin/stats/team', { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setTeamStatsError(data.error || 'فشل جلب الإحصائيات');
        setTeamStatsUsers([]);
        setTeamStatsCachedAt(null);
        return;
      }
      setTeamStatsUsers(data.users || []);
      setTeamStatsCachedAt(typeof data.cachedAt === 'string' ? data.cachedAt : null);
    } catch (e) {
      setTeamStatsError('خطأ في الاتصال');
      setTeamStatsUsers([]);
      setTeamStatsCachedAt(null);
    } finally {
      setTeamStatsLoading(false);
    }
  };

  useEffect(() => {
    if (userType === 'admin' && activeTab === 'summary' && isPlanActive('business')) {
      fetchTeamStats();
    }
  }, [userType, activeTab, currentAdmin?.id, currentAdmin?.plan, currentAdmin?.subscriptionEndsAt]);

  const fetchOrderStats = async () => {
    setOrderStatsLoading(true);
    setOrderStatsError(null);
    try {
      const res = await fetch('/api/admin/stats/orders', { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setOrderStatsError(data.error || 'فشل جلب إحصائيات الطلبات');
        setOrderStats(null);
        return;
      }
      setOrderStats(data);
    } catch (e) {
      setOrderStatsError('خطأ في الاتصال');
      setOrderStats(null);
    } finally {
      setOrderStatsLoading(false);
    }
  };

  useEffect(() => {
    if (userType === 'admin' && activeTab === 'summary' && isPlanActive('basic')) {
      fetchOrderStats();
    }
  }, [userType, activeTab, currentAdmin?.id, currentAdmin?.plan, currentAdmin?.subscriptionEndsAt]);

  const fetchWorkersActivityList = async () => {
    setWorkersActivityListLoading(true);
    try {
      if (userType === 'admin') {
        const [empRes, teamRes] = await Promise.all([
          fetch(`/api/employees?page=1&limit=100`, { headers: getAuthHeaders() }).then(r => r.json()),
          isPlanActive('business') ? fetch('/api/admin/stats/team', { headers: getAuthHeaders() }).then(r => r.json()) : Promise.resolve({ users: [] }),
        ]);
        type Emp = { id: string; name: string; imageUrl?: string; username?: string; phone?: string; isDelivery?: boolean; isWaiter?: boolean; createdAt?: string };
        const employees: WorkerCard[] = Array.isArray(empRes.employees) ? empRes.employees.map((e: Emp) => ({ id: e.id, name: e.name || e.id, imageUrl: e.imageUrl, username: e.username, phone: e.phone, isDelivery: e.isDelivery, isWaiter: e.isWaiter, createdAt: e.createdAt })) : [];
        const teamUsers = (teamRes.users || []) as TeamStatsUser[];
        // الكارد يعرض مجموع (العدد × الوزن)؛ الأسهم تعرض العدد كما هو
        const forwardWeight = (n: number) => (n % 10) - Math.floor(n / 10); // 12→1, 13→2, 14→3, 23→1, 24→2, 34→1
        const downgradeWeight = (n: number) => Math.floor(n / 10) - (n % 10); // 43→1, 42→2, 41→3, 32→1, 31→2, 21→1
        const sumForwardWeighted = (s: Record<string, number>, prefix: string) =>
          [12, 13, 14, 23, 24, 34].reduce((a, n) => a + (Number(s[`${prefix}Forward${Math.floor(n / 10)}${n % 10}`]) || 0) * forwardWeight(n), 0);
        const sumDowngradeWeighted = (s: Record<string, number>, prefix: string) =>
          [43, 42, 41, 32, 31, 21].reduce((a, n) => a + (Number(s[`${prefix}Downgrade${Math.floor(n / 10)}${n % 10}`]) || 0) * downgradeWeight(n), 0);
        const withStats = employees.map(emp => {
          const tu = teamUsers.find(u => u.id === emp.id);
          if (!tu || !tu.stats) return { ...emp };
          const s = tu.stats;
          const deliveryForward = sumForwardWeighted(s, 'delivery');
          const deliveryDowngrade = sumDowngradeWeighted(s, 'delivery');
          const tableForward = sumForwardWeighted(s, 'table');
          const tableDowngrade = sumDowngradeWeighted(s, 'table');
          return { ...emp, deliveryForward, deliveryDowngrade, tableForward, tableDowngrade };
        });
        // الأدمن مستخدم أيضاً ويمكنه تغيير الحالات — نضيفه كأول شخص في القائمة
        const adminTu = teamUsers.find(u => u.userType === 'admin') ?? teamUsers[0];
        if (currentAdmin) {
          const adminCard: WorkerCard = {
            id: currentAdmin.id,
            name: currentAdmin.name || currentAdmin.username || adminTu?.name || 'الأدمن',
            imageUrl: currentAdmin.logoUrl,
            username: currentAdmin.username,
            phone: undefined,
            isDelivery: false,
            isWaiter: false,
            deliveryForward: adminTu ? sumForwardWeighted(adminTu.stats, 'delivery') : undefined,
            deliveryDowngrade: adminTu ? sumDowngradeWeighted(adminTu.stats, 'delivery') : undefined,
            tableForward: adminTu ? sumForwardWeighted(adminTu.stats, 'table') : undefined,
            tableDowngrade: adminTu ? sumDowngradeWeighted(adminTu.stats, 'table') : undefined,
            createdAt: undefined,
          };
          setWorkersActivityList([adminCard, ...withStats]);
        } else {
          setWorkersActivityList(withStats);
        }
      } else {
        if (!currentEmployeeId) { setWorkersActivityList([]); return; }
        const profileRes = await fetch(`/api/employees/${currentEmployeeId}`, { headers: getAuthHeaders() }).then(r => r.json());
        const emp = profileRes.employee as Record<string, unknown> | undefined;
        const name = (emp?.name as string) || 'أنت';
        const isDelivery = !!emp?.isDelivery;
        const isWaiter = !!emp?.isWaiter;
        let deliveryForward: number | undefined;
        let deliveryDowngrade: number | undefined;
        let tableForward: number | undefined;
        let tableDowngrade: number | undefined;
        if (isPlanActive('business') && emp) {
          const n = (k: string) => Number(emp[k]) || 0;
          const fw = (a: number, b: number) => (b % 10) - Math.floor(b / 10);
          const dw = (a: number, b: number) => Math.floor(b / 10) - (b % 10);
          const sumF = (p: string) => [12, 13, 14, 23, 24, 34].reduce((a, b) => a + n(`${p}Forward${Math.floor(b / 10)}${b % 10}`) * fw(0, b), 0);
          const sumD = (p: string) => [43, 42, 41, 32, 31, 21].reduce((a, b) => a + n(`${p}Downgrade${Math.floor(b / 10)}${b % 10}`) * dw(0, b), 0);
          deliveryForward = sumF('delivery');
          deliveryDowngrade = sumD('delivery');
          tableForward = sumF('table');
          tableDowngrade = sumD('table');
        }
        setWorkersActivityList([{ id: currentEmployeeId, name, imageUrl: emp?.imageUrl as string | undefined, username: emp?.username as string | undefined, phone: emp?.phone as string | undefined, isDelivery, isWaiter, deliveryForward, deliveryDowngrade, tableForward, tableDowngrade, createdAt: emp?.createdAt as string | undefined }]);
      }
    } catch (e) {
      console.error(e);
      setWorkersActivityList([]);
    } finally {
      setWorkersActivityListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'workersActivity') fetchWorkersActivityList();
  }, [activeTab, userType, currentAdmin?.id, currentEmployeeId, currentAdmin?.plan]);

  // جلب تقييم الموظف (نقاط، كفاءة، ترتيب) عند فتح تبويب نشاطي — للموظف فقط
  useEffect(() => {
    if (userType !== 'employee' || activeTab !== 'workersActivity' || !isPlanActive('business')) {
      setEmployeeRatingInfo(null);
      return;
    }
    setEmployeeRatingInfoLoading(true);
    fetch('/api/employee/rating-info', { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setEmployeeRatingInfo(null);
        else setEmployeeRatingInfo({
          enabled: !!data.enabled,
          points: data.points,
          efficiency: data.efficiency,
          rank: data.rank,
          rankAmongDelivery: data.rankAmongDelivery,
          rankAmongWaiters: data.rankAmongWaiters,
        });
      })
      .catch(() => setEmployeeRatingInfo(null))
      .finally(() => setEmployeeRatingInfoLoading(false));
  }, [userType, activeTab, currentAdmin?.plan, currentAdmin?.subscriptionEndsAt]);

  /** استخراج أرقام العدادات من أي كائن (موظف/أدمن) — غير موجود = 0 */
  const countsFrom = (obj: Record<string, unknown> | null | undefined): Record<string, number> => {
    if (!obj) return {};
    const keys = ['deliveryAssignedCount', 'deliveryForward12', 'deliveryForward13', 'deliveryForward14', 'deliveryForward23', 'deliveryForward24', 'deliveryForward34', 'deliveryDowngrade43', 'deliveryDowngrade42', 'deliveryDowngrade41', 'deliveryDowngrade32', 'deliveryDowngrade31', 'deliveryDowngrade21', 'tableAssignedCount', 'tableForward12', 'tableForward13', 'tableForward14', 'tableForward23', 'tableForward24', 'tableForward34', 'tableDowngrade43', 'tableDowngrade42', 'tableDowngrade41', 'tableDowngrade32', 'tableDowngrade31', 'tableDowngrade21', 'WithoutDeliveryOrdersCount', 'AnyDeliveryOrdersCount'];
    return Object.fromEntries(keys.map(k => [k, Number(obj[k]) || 0]));
  };

  const fetchExpandedWorkerDetails = async (userId: string, pageDelivery = 1, pageTable = 1, logsOnly = false) => {
    if (!logsOnly) {
      setExpandedWorkerLoading(true);
      setExpandedWorkerProfile(null);
      setExpandedWorkerStats(null);
      setExpandedWorkerDeliveryLogs({ logs: [], total: 0, page: 1, limit: 10 });
      setExpandedWorkerTableLogs({ logs: [], total: 0, page: 1, limit: 10 });
    }
    try {
      const limit = 10;
      let employeeOrAdmin: Record<string, unknown> | null = null;
      if (!logsOnly) {
        if (userId === currentAdmin?.id) {
          employeeOrAdmin = { ...currentAdmin } as Record<string, unknown>;
          setExpandedWorkerProfile({ name: currentAdmin.name, username: currentAdmin.username, imageUrl: currentAdmin.logoUrl, phone: undefined, createdAt: undefined, isDelivery: false, isWaiter: false } as Record<string, unknown>);
        } else {
          const profileRes = await fetch(`/api/employees/${userId}`, { headers: getAuthHeaders() }).then(r => r.json());
          if (profileRes.employee) {
            employeeOrAdmin = profileRes.employee as Record<string, unknown>;
            setExpandedWorkerProfile(profileRes.employee as Record<string, unknown>);
          }
        }
        const [delRes, tblRes] = await Promise.all([
          fetch(`/api/admin/stats/delivery-logs?userId=${userId}&page=${pageDelivery}&limit=${limit}`, { headers: getAuthHeaders() }).then(r => r.json()),
          fetch(`/api/admin/stats/table-logs?userId=${userId}&page=${pageTable}&limit=${limit}`, { headers: getAuthHeaders() }).then(r => r.json()),
        ]);
        if (delRes.logs) setExpandedWorkerDeliveryLogs({ logs: delRes.logs, total: delRes.total ?? 0, page: delRes.page ?? 1, limit: delRes.limit ?? limit });
        if (tblRes.logs) setExpandedWorkerTableLogs({ logs: tblRes.logs, total: tblRes.total ?? 0, page: tblRes.page ?? 1, limit: tblRes.limit ?? limit });
        if (isPlanActive('business')) {
          const fromTeam = teamStatsUsers.find(u => u.id === userId)?.stats as Record<string, number> | undefined;
          const counts = fromTeam ?? (employeeOrAdmin ? countsFrom(employeeOrAdmin) : {});
          if (Object.keys(counts).length) setExpandedWorkerStats(counts);
        }
      } else {
        const [delRes, tblRes] = await Promise.all([
          fetch(`/api/admin/stats/delivery-logs?userId=${userId}&page=${pageDelivery}&limit=${limit}`, { headers: getAuthHeaders() }).then(r => r.json()),
          fetch(`/api/admin/stats/table-logs?userId=${userId}&page=${pageTable}&limit=${limit}`, { headers: getAuthHeaders() }).then(r => r.json()),
        ]);
        if (delRes.logs) setExpandedWorkerDeliveryLogs({ logs: delRes.logs, total: delRes.total ?? 0, page: delRes.page ?? 1, limit: delRes.limit ?? limit });
        if (tblRes.logs) setExpandedWorkerTableLogs({ logs: tblRes.logs, total: tblRes.total ?? 0, page: tblRes.page ?? 1, limit: tblRes.limit ?? limit });
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!logsOnly) setExpandedWorkerLoading(false);
    }
  };

  // للموظف: عند فتح تبويب نشاطي نعرض تفاصيله فوراً (بدون كاردات)
  useEffect(() => {
    if (activeTab === 'workersActivity' && userType === 'employee' && currentEmployeeId) {
      setExpandedWorkerId(currentEmployeeId);
    }
  }, [activeTab, userType, currentEmployeeId]);

  // جلب تفاصيل العامل — للموظف ننتظر currentAdmin حتى isPlanActive والإحصائيات تعمل (خصوصاً بعد ريلود)
  useEffect(() => {
    if (activeTab !== 'workersActivity' || !expandedWorkerId) {
      if (!expandedWorkerId) {
        setExpandedWorkerProfile(null);
        setExpandedWorkerStats(null);
        setExpandedWorkerDeliveryLogs({ logs: [], total: 0, page: 1, limit: 10 });
        setExpandedWorkerTableLogs({ logs: [], total: 0, page: 1, limit: 10 });
      }
      return;
    }
    if (userType === 'employee' && !currentAdmin) return;
    fetchExpandedWorkerDetails(expandedWorkerId);
  }, [activeTab, expandedWorkerId, userType, currentAdmin]);

  const checkPlan = (feature: string, plan: 'basic' | 'pro' | 'business' = 'basic') => {
    if (!isPlanActive(plan)) {
      setLockedFeatureName(feature);
      setRequiredPlan(plan);
      setIsUpgradeModalOpen(true);
      return false;
    }
    return true;
  };

  // Auto-disable features when plan is insufficient or expired
  useEffect(() => {
    if (!currentAdmin) return;

    const sessionToken = localStorage.getItem('session_token');
    if (!sessionToken) return;

    const disableUpdates: Record<string, boolean> = {};

    // Basic+ features - disable if plan is not active at basic level
    if (!isPlanActive('basic')) {
      if (currentAdmin.isAcceptingOrders) disableUpdates.isAcceptingOrders = false;
      if (currentAdmin.enableDeliveryEmployees) disableUpdates.enableDeliveryEmployees = false;
    }

    // Pro+ features - disable if plan is not active at pro level
    if (!isPlanActive('pro')) {
      if (currentAdmin.isAcceptingTableOrders) disableUpdates.isAcceptingTableOrders = false;
      if (currentAdmin.enableWaiters) disableUpdates.enableWaiters = false;
    }

    if (Object.keys(disableUpdates).length > 0) {
      fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify(disableUpdates),
      }).then(res => {
        if (res.ok) {
          setCurrentAdmin(prev => prev ? { ...prev, ...disableUpdates } : prev);
        }
      }).catch(() => { });
    }
  }, [currentAdmin?.id]);

  // Auto-refresh لطلبات التوصيل كل 5 دقائق
  useEffect(() => {
    if (!currentAdmin || activeTab !== 'orders') return;
    // لا تعمل auto-refresh إذا كانت طلبات التوصيل غير مفعلة أو الخطة غير سارية
    if (!isPlanActive('basic') || (!currentAdmin.isAcceptingOrders && !currentAdmin.isAcceptingOrdersViaWhatsapp)) return;

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
    setTimeout(() => listFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  const handleEditList = (list: MenuList) => {
    setEditingList(list);
    setListFormData({
      name: list.name,
    });
    setTimeout(() => listFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
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

  const handleSelectListForItems = (list: MenuList) => {
    setSelectedList(list);
    setTimeout(() => itemFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList || !currentAdmin) return;

    const url = editingItem ? `/api/menu/${editingItem.id}` : '/api/menu';
    const method = editingItem ? 'PUT' : 'POST';

    // التحقق من الصلاحيات والعدد عند الإضافة فقط
    if (!editingItem) {
      const active = isPlanActive('basic');

      // إذا كان فري أو منتهي
      if (!active) {
        // حساب عدد العناصر الحالية للأدمن
        const adminListIds = lists.map(l => l.id);
        const adminItemsCount = items.filter(item => adminListIds.includes(item.listId)).length;

        if (adminItemsCount >= 15) {
          if (!checkPlan('إضافة أكثر من 15 منتج', 'basic')) return;
        }
      }
    }

    // رفع صورة العنصر فقط عند الإرسال (إن وُجدت صورة معلقة)
    let imageUrlForItem: string | undefined = itemFormData.imageUrl || undefined;
    const pendingFile = itemImageUploadRef.current?.getPendingFile();
    if (pendingFile) {
      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('file', pendingFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('session_token')}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          alert(err.error || 'فشل رفع الصورة');
          setIsUploadingImage(false);
          return;
        }
        const uploadData = await uploadRes.json();
        imageUrlForItem = uploadData.url;
      } catch {
        alert('فشل رفع الصورة');
        setIsUploadingImage(false);
        return;
      }
      setIsUploadingImage(false);
    }

    const payload = {
      name: itemFormData.name,
      price: itemFormData.price,
      discountedPrice: itemFormData.discountedPrice || undefined,
      imageUrl: imageUrlForItem ?? null,
      description: itemFormData.description,
      listId: selectedList.id,
    };

    setIsSubmittingItem(true);
    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 403) {
          const errorData = await res.json();
          if (confirm(errorData.error + '\n\nهل تريد عرض خطط الاشتراك للترقية؟')) {
            setLockedFeatureName('إضافة أكثر من 15 منتج');
            setRequiredPlan('basic');
            setIsUpgradeModalOpen(true);
          }
        }
        fetchData(currentAdmin.id);
        return;
      }

      // النجاح: مسح النموذج وتحديث البيانات
      setItemFormData({ name: '', price: '', discountedPrice: '', imageUrl: '', description: '' });
      setEditingItem(null);
      itemImageUploadRef.current?.clearPendingFile();
      fetchData(currentAdmin.id);
      setTimeout(() => itemFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
    } finally {
      setIsSubmittingItem(false);
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
    itemImageUploadRef.current?.clearPendingFile(false);
    setTimeout(() => itemFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
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
      body: JSON.stringify({
        isAcceptingOrders: deliveryFormData.isAcceptingOrders,
        isAcceptingOrdersViaWhatsapp: deliveryFormData.isAcceptingOrdersViaWhatsapp,
        whatsappNumber: deliveryFormData.whatsappNumber,
      }),
    });

    if (res.ok) {
      const updatedAdmin = await res.json();
      const newAdminData = { ...currentAdmin, ...updatedAdmin };
      setCurrentAdmin(newAdminData);
      localStorage.setItem('admin_data', JSON.stringify(newAdminData));

      alert('تم حفظ إعدادات طلبات التوصيل بنجاح!');
    } else {
      const error = await res.json();
      if (res.status === 403 && confirm(error.error + '\n\nهل تريد عرض خطط الاشتراك للترقية؟')) {
        setLockedFeatureName('الطلب من الموقع وعمال التوصيل');
        setRequiredPlan('basic');
        setIsUpgradeModalOpen(true);
      } else if (res.status !== 403) {
        alert(`فشل حفظ الإعدادات: ${error.error || 'خطأ غير معروف'}`);
      }
    }
  };

  const handleTableSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    const res = await fetch(`/api/admins/${currentAdmin.id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        isAcceptingTableOrders: deliveryFormData.isAcceptingTableOrders,
        tablesCount: deliveryFormData.tablesCount,
      }),
    });

    if (res.ok) {
      const updatedAdmin = await res.json();
      const newAdminData = { ...currentAdmin, ...updatedAdmin };
      setCurrentAdmin(newAdminData);
      localStorage.setItem('admin_data', JSON.stringify(newAdminData));

      alert('تم حفظ إعدادات الطاولة بنجاح!');
    } else {
      const error = await res.json();
      if (res.status === 403 && confirm(error.error + '\n\nهل تريد عرض خطط الاشتراك للترقية؟')) {
        setLockedFeatureName('طلبات الطاولة والندلاء');
        setRequiredPlan('pro');
        setIsUpgradeModalOpen(true);
      } else if (res.status !== 403) {
        alert(`فشل حفظ الإعدادات: ${error.error || 'خطأ غير معروف'}`);
      }
    }
  };

  const handleEmployeeSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    const token = localStorage.getItem('session_token');
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(employeeSettingsForm),
    });

    if (res.ok) {
      const data = await res.json();
      setCurrentAdmin(prev => prev ? { ...prev, ...data.admin } : null);
      alert('تم حفظ إعدادات العاملين بنجاح!');
    } else {
      const error = await res.json();
      if (res.status === 403 && confirm(error.error + '\n\nهل تريد عرض خطط الاشتراك للترقية؟')) {
        setLockedFeatureName('إدارة العاملين');
        setRequiredPlan('basic');
        setIsUpgradeModalOpen(true);
      } else if (res.status !== 403) {
        alert(`فشل حفظ الإعدادات: ${error.error || 'خطأ غير معروف'}`);
      }
    }
  };

  const handleSaveRatingSettings = async () => {
    if (!currentAdmin || !isPlanActive('business')) return;
    setIsSavingRatingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employeeRatingEnable: employeeRatingSettings.enableEmployeeRating,
          employeeRatingScaleDeliveryForward: employeeRatingSettings.scaleDeliveryForward,
          employeeRatingScaleDeliveryBackward: employeeRatingSettings.scaleDeliveryBackward,
          employeeRatingScaleTableForward: employeeRatingSettings.scaleTableForward,
          employeeRatingScaleTableBackward: employeeRatingSettings.scaleTableBackward,
          employeeRatingTendencyX: employeeRatingSettings.tendencyX,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentAdmin(prev => prev ? { ...prev, ...data.admin } : null);
        alert('تم حفظ إعدادات التقييم بنجاح.');
      } else {
        const err = await res.json();
        if (res.status !== 403) alert(err.error || 'فشل حفظ إعدادات التقييم');
      }
    } finally {
      setIsSavingRatingSettings(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'read' | 'delivering' | 'delivered') => {
    try {
      setUpdatingOrderStatus({ orderId, status: newStatus });
      const order = orders.find(o => o.id === orderId);
      const previousStatus = (order?.status || 'pending') as string;
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus, previousStatus }),
      });

      if (res.ok) {
        const data = await res.json();
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
        if (data.alreadyInState && typeof window !== 'undefined' && localStorage.getItem(HIDE_ALREADY_IN_STATE_POPUP) !== 'true') {
          setAlreadyInStatePopup({ open: true, orderId, statusLabel: DELIVERY_STATUS_LABELS[newStatus] || newStatus });
        }
        if (data.statusDowngrade && data.previousStatus && typeof window !== 'undefined' && localStorage.getItem(HIDE_STATUS_DOWNGRADE_POPUP) !== 'true') {
          setStatusDowngradePopup({ open: true, orderId, previousStatusLabel: DELIVERY_STATUS_LABELS[data.previousStatus] || data.previousStatus, newStatusLabel: DELIVERY_STATUS_LABELS[newStatus] || newStatus });
        }
      } else {
        if (res.status === 403) {
          const data = await res.json();
          if (confirm(data.error + '\n\nهل تريد عرض خطط الاشتراك للترقية؟')) {
            setLockedFeatureName('تحديث حالات طلبات التوصيل');
            setRequiredPlan('basic');
            setIsUpgradeModalOpen(true);
          }
        } else {
          alert('فشل تحديث حالة الطلب');
        }
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
      const order = tableOrders.find(o => o.id === orderId);
      const previousStatus = (order?.status || 'pending') as string;
      const token = localStorage.getItem('session_token');
      const res = await fetch(`/api/table-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, previousStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setTableOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        if (data.alreadyInState && typeof window !== 'undefined' && localStorage.getItem(HIDE_ALREADY_IN_STATE_POPUP) !== 'true') {
          setAlreadyInStatePopup({ open: true, orderId, statusLabel: TABLE_STATUS_LABELS[newStatus] || newStatus });
        }
        if (data.statusDowngrade && data.previousStatus && typeof window !== 'undefined' && localStorage.getItem(HIDE_STATUS_DOWNGRADE_POPUP) !== 'true') {
          setStatusDowngradePopup({ open: true, orderId, previousStatusLabel: TABLE_STATUS_LABELS[data.previousStatus] || data.previousStatus, newStatusLabel: TABLE_STATUS_LABELS[newStatus] || newStatus });
        }
      } else {
        const data = await res.json();
        if (res.status === 403 && confirm(data.error + '\n\nهل تريد عرض خطط الاشتراك للترقية؟')) {
          setLockedFeatureName('تحديث حالات طلبات الطاولة');
          setRequiredPlan('pro');
          setIsUpgradeModalOpen(true);
        } else if (res.status !== 403) {
          alert('فشل تحديث حالة الطلب: ' + (data.error || 'خطأ غير معروف'));
        }
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

    // التحقق من تطابق كلمة المرور (فقط إذا تم إدخال كلمة مرور)
    if (employeeFormData.password || employeeFormData.confirmPassword) {
      if (employeeFormData.password !== employeeFormData.confirmPassword) {
        alert('كلمة المرور غير متطابقة');
        return;
      }
      if (employeeFormData.password.length < 6) {
        alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
      }
    }

    // في وضع الإنشاء، كلمة المرور مطلوبة
    if (!editingEmployeeId && !employeeFormData.password) {
      alert('كلمة المرور مطلوبة');
      return;
    }

    // التحقق من الصلاحيات والعدد عند الإضافة فقط
    if (!editingEmployeeId) {
      const active = isPlanActive('basic');

      // إذا كان فري أو منتهي
      if (!active) {
        if (!checkPlan('إضافة العاملين', 'basic')) return;
      }
      // إذا كان أساسي (نشط) ووصل للحد للأقصى
      else if (currentAdmin?.plan === 'basic' && totalEmployees >= 15) {
        if (!checkPlan('زيادة حد العاملين إلى 25', 'pro')) return;
      }
      // إذا كانت باقة مطاعم ووصل للحد للأقصى
      else if (currentAdmin?.plan === 'pro' && totalEmployees >= 25) {
        if (!checkPlan('زيادة حد العاملين إلى 50', 'business')) return;
      }
      // إذا كانت باقة الأعمال ووصل للحد للأقصى
      else if (currentAdmin?.plan === 'business' && totalEmployees >= 50) {
        setLimitModalConfig({
          title: 'وصلت للحد الأقصى',
          message: 'لقد وصلت للحد الأقصى للعاملين في باقة الأعمال (50). يرجى التواصل مع الدعم إذا كنت بحاجة لزيادة هذا الحد.'
        });
        setIsLimitModalOpen(true);
        return;
      }
    }

    // رفع الصورة عند الإرسال فقط (اختياري)
      let imageUrlToSend: string | undefined;
      const photoFile = employeeImageUploadRef.current?.getPendingFile();
      if (photoFile) {
        setIsUploadingEmployeePhoto(true);
        try {
          const formData = new FormData();
          formData.append('file', photoFile);
          const token = localStorage.getItem('session_token');
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            alert(`فشل رفع الصورة: ${err.error || 'خطأ غير معروف'}`);
            setIsUploadingEmployeePhoto(false);
            return;
          }
          const { url } = await uploadRes.json();
          imageUrlToSend = url;
        } catch {
          alert('فشل رفع الصورة');
          setIsUploadingEmployeePhoto(false);
          return;
        }
        setIsUploadingEmployeePhoto(false);
      }

      setIsSubmittingEmployee(true);
      try {

      if (editingEmployeeId) {
        // وضع التحديث
        const updates: Record<string, unknown> = {
          name: employeeFormData.name,
          isDelivery: employeeFormData.isDelivery,
          isWaiter: employeeFormData.isWaiter,
          phone: employeeFormData.phone.trim() || undefined,
        };
        if (imageUrlToSend !== undefined) {
          updates.imageUrl = imageUrlToSend;
        } else if (editingEmployeeId && employeeFormData.imageUrl !== undefined) {
          updates.imageUrl = employeeFormData.imageUrl === '' ? '' : employeeFormData.imageUrl;
        }
        if (employeeFormData.password) {
          updates.password = employeeFormData.password;
        }

        const res = await fetch(`/api/employees/${editingEmployeeId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(updates),
        });

        if (res.ok) {
          await refreshEmployees();
          setEditingEmployeeId(null);
          setEmployeeFormData({
            name: '',
            username: '',
            password: '',
            confirmPassword: '',
            isDelivery: false,
            isWaiter: false,
            phone: '',
            imageUrl: undefined,
          });
          employeeImageUploadRef.current?.clearPendingFile();
          setTimeout(() => employeeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
        } else {
          const error = await res.json();
          alert(`فشل تحديث العامل: ${error.error || 'خطأ غير معروف'}`);
        }
      } else {
        // وضع الإنشاء
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: employeeFormData.name,
            username: employeeFormData.username,
            password: employeeFormData.password,
            isDelivery: employeeFormData.isDelivery,
            isWaiter: employeeFormData.isWaiter,
            ...(imageUrlToSend && { imageUrl: imageUrlToSend }),
            ...(employeeFormData.phone.trim() && { phone: employeeFormData.phone.trim() }),
          }),
        });

      if (res.ok) {
        await refreshEmployees();
        setEmployeeFormData({
          name: '',
          username: '',
          password: '',
          confirmPassword: '',
          isDelivery: false,
          isWaiter: false,
          phone: '',
          imageUrl: undefined,
        });
        employeeImageUploadRef.current?.clearPendingFile();
        setTimeout(() => employeeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      } else {
        const error = await res.json();
        if (res.status === 403 && confirm(error.error + '\n\nهل تريد عرض خطط الاشتراك للترقية؟')) {
          setLockedFeatureName('إضافة العاملين');
          setRequiredPlan('basic');
          setIsUpgradeModalOpen(true);
        } else if (res.status !== 403) {
          alert(`فشل إضافة العامل: ${error.error || 'خطأ غير معروف'}`);
        }
      }
    }
  } finally {
        setIsSubmittingEmployee(false);
      }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العامل؟')) return;

    const res = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.ok) {
      await refreshEmployees();
      alert('تم حذف العامل بنجاح');
    } else {
      alert('فشل حذف العامل');
    }
  };

  const handleEditEmployee = (employee: any) => {
    setEditingEmployeeId(employee.id);
    setEmployeeFormData({
      name: employee.name,
      username: employee.username,
      password: '',
      confirmPassword: '',
      isDelivery: employee.isDelivery || false,
      isWaiter: employee.isWaiter || false,
      phone: employee.phone ?? '',
      imageUrl: employee.imageUrl ?? undefined,
    });
    employeeImageUploadRef.current?.clearPendingFile(false);
    setTimeout(() => employeeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  const handleCancelEditEmployee = () => {
    setEditingEmployeeId(null);
    setEmployeeFormData({
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      isDelivery: false,
      isWaiter: false,
      phone: '',
      imageUrl: undefined,
    });
    employeeImageUploadRef.current?.clearPendingFile();
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


      {/* Top Bar with Greeting and Clock */}
      {userType === 'admin' && (
        <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            {currentTime.getHours() >= 12 ? 'مساء الخير' : 'صباح الخير'}
            {' '}
            <span >{currentAdmin.name ? `يا ${currentAdmin.name.split(' ')[0]}` : ''}</span>
          </h1>
          <div className="text-gray-600 font-mono text-lg md:text-xl font-bold bg-gray-100 px-4 py-2 rounded-lg" dir="ltr">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">
              لوحة التحكم
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                قائمة التحكم
              </button>
              <Link
                href={`/menu/${currentAdmin.username}`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                عرض صفحة العميل
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

        </div>

        {/* Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-800">التحكم</h3>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="p-2 space-y-1">
            {/* ملخص النشاط - للأدمن فقط، أول تبويب افتراضي */}
            {userType === 'admin' && (
              <button
                onClick={() => { setActiveTab('summary'); setIsSidebarOpen(false); }}
                className={`w-full text-right px-4 py-3 rounded-lg font-bold transition-colors ${activeTab === 'summary'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                ملخص النشاط
              </button>
            )}

            {/* نشاط العاملين / نشاطي — يظهر للبزنس فقط، مباشرة بعد ملخص النشاط */}
            {(userType === 'admin' || userType === 'employee') && isPlanActive('business') && (
              <button
                onClick={() => { setActiveTab('workersActivity'); setIsSidebarOpen(false); }}
                className={`w-full text-right px-4 py-3 rounded-lg font-bold transition-colors ${activeTab === 'workersActivity'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {userType === 'admin' ? 'نشاط العاملين' : 'نشاطي'}
              </button>
            )}

            {/* إدارة القوائم - للأدمن فقط */}
            {userType === 'admin' && (
              <button
                onClick={() => { setActiveTab('lists'); setIsSidebarOpen(false); }}
                className={`w-full text-right px-4 py-3 rounded-lg font-bold transition-colors ${activeTab === 'lists'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                إدارة القوائم
              </button>
            )}

            {/* إدارة العاملين - للأدمن فقط */}
            {userType === 'admin' && (
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveTab('employees');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-right px-4 py-3 rounded-lg font-bold transition-colors flex items-center justify-between ${activeTab === 'employees'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <span>إدارة العاملين</span>
                  {/* Info Badge - Not a lock */}
                  {!isPlanActive('basic') && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-bold ml-2">basic</span>
                  )}
                </button>
              </div>
            )}

            {/* طلبات التوصيل - للأدمن وعمال التوصيل فقط */}
            {(userType === 'admin' || isDelivery) && (
              <button
                onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
                className={`w-full text-right px-4 py-3 rounded-lg font-bold transition-colors ${activeTab === 'orders'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                طلبات التوصيل
              </button>
            )}

            {/* طلبات الطاولات - للأدمن والنوادل فقط */}
            {(userType === 'admin' || isWaiter) && (
              <button
                onClick={() => { setActiveTab('tableOrders'); setIsSidebarOpen(false); }}
                className={`w-full text-right px-4 py-3 rounded-lg font-bold transition-colors ${activeTab === 'tableOrders'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                طلبات الطاولة
              </button>
            )}

            {/* إعدادات الطلبات - للأدمن فقط */}
            {userType === 'admin' && (
              <button
                onClick={() => { setActiveTab('delivery'); setIsSidebarOpen(false); }}
                className={`w-full text-right px-4 py-3 rounded-lg font-bold transition-colors ${activeTab === 'delivery'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                إعدادات الطلبات
              </button>
            )}

            {/* إعدادات الحساب - للأدمن فقط */}
            {userType === 'admin' && (
              <button
                onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                className={`w-full text-right px-4 py-3 rounded-lg font-bold transition-colors ${activeTab === 'settings'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                إعدادات الحساب
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'summary' && (
          <div className="w-full max-w-6xl mx-auto p-4">
            {userType !== 'admin' ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                لا يوجد محتوى لملخص النشاط لهذا الحساب.
              </div>
            ) : (
              <div className="space-y-10">
                {/* عدد المنتجات وتوزيع العدد على كل قائمة — تظهر للجميع بما فيها Free، أول واحدة في الأعلى */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">عدد المنتجات وتوزيع العدد على كل قائمة</h2>
                  {(() => {
                    const listIds = lists.map(l => l.id);
                    const adminItems = items.filter(i => listIds.includes(i.listId));
                    const segments = lists.map(list => ({
                      name: list.name,
                      value: adminItems.filter(item => item.listId === list.id).length,
                    })).filter(s => s.value > 0);
                    const total = segments.reduce((sum, s) => sum + s.value, 0);
                    const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
                    let cumulative = 0;
                    const conicParts = segments.map((s, i) => {
                      const pct = total ? (s.value / total) * 100 : 0;
                      const part = `${PIE_COLORS[i % PIE_COLORS.length]} ${cumulative}% ${cumulative + pct}%`;
                      cumulative += pct;
                      return part;
                    });
                    return (
                      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 max-w-md">
                        <div className="flex flex-col items-center">
                          {total === 0 ? (
                            <div className="w-44 h-44 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">لا منتجات بعد</div>
                          ) : (
                            <>
                              <div className="w-44 h-44 rounded-full flex-shrink-0" style={{ background: `conic-gradient(${conicParts.join(', ')})` }} title={segments.map(s => `${s.name}: ${s.value}`).join('\n')} />
                              <p className="mt-3 text-sm font-bold text-gray-700">المجموع: {total} منتج</p>
                              <ul className="mt-3 w-full space-y-2 text-sm">
                                {segments.map((s, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="truncate">{s.name}</span>
                                    <span className="text-gray-600 font-medium flex-shrink-0">{s.value}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </section>

                {!isPlanActive('basic') ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    ملخص النشاط متاح ضمن باقة Basic أو أعلى.
                  </div>
                ) : (
                  <>
                {/* إحصائيات الطلبات — أشرطة مقسومة (Pro+) وأشرطة كاملة تحت كل واحد (Basic+ للموقع/واتساب، Pro+ للطاولة/المجموع) */}
                <section>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">إحصائيات الطلبات</h2>
                  {orderStatsLoading ? (
                    <p className="text-gray-500">جاري تحميل إحصائيات الطلبات...</p>
                  ) : orderStatsError ? (
                    <p className="text-red-600">{orderStatsError}</p>
                  ) : orderStats ? (
                    <div className="space-y-6">
                      {(() => {
                        const isPro = isPlanActive('pro');
                        const OrderProgressBar = ({
                          label,
                          totalCount,
                          completedCount,
                          sumPrice,
                          sumDiscount,
                          sumCompletedPrice,
                          sumCompletedDiscount,
                        }: {
                          label: string;
                          totalCount: number;
                          completedCount: number;
                          sumPrice: number;
                          sumDiscount: number;
                          sumCompletedPrice: number;
                          sumCompletedDiscount: number;
                        }) => {
                          if (totalCount < 1) return null;
                          const remainingCount = totalCount - completedCount;
                          const completedPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
                          const remainingPct = 100 - completedPct;
                          const remainingPrice = Math.max(0, sumPrice - sumCompletedPrice);
                          const remainingDiscount = Math.max(0, sumDiscount - sumCompletedDiscount);
                          return (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
                              <div className="flex w-full overflow-hidden rounded-lg border border-gray-300" dir="ltr">
                                {remainingPct > 0 && (
                                  <div
                                    className="flex flex-col items-center justify-center min-w-0 py-3 px-2 bg-amber-400 text-gray-900"
                                    style={{ width: `${remainingPct}%` }}
                                  >
                                    <span className="font-bold text-sm">{remainingCount} طلب</span>
                                    <span className="text-xs mt-1">المبلغ: {remainingPrice}</span>
                                    <span className="text-xs">سيوفر المشتري: {remainingDiscount}</span>
                                  </div>
                                )}
                                {completedPct > 0 && (
                                  <div
                                    className="flex flex-col items-center justify-center min-w-0 py-3 px-2 bg-emerald-500 text-white"
                                    style={{ width: `${completedPct}%` }}
                                  >
                                    <span className="font-bold text-sm">{completedCount} طلب</span>
                                    <span className="text-xs mt-1 opacity-95">المبلغ: {sumCompletedPrice}</span>
                                    <span className="text-xs opacity-95">وفر المشتري: {sumCompletedDiscount}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        };
                        const FullBar = ({ count, sumPrice, sumDiscount }: { count: number; sumPrice: number; sumDiscount: number }) => {
                          if (count < 1) return null;
                          return (
                            <div className="flex w-full overflow-hidden rounded-lg border border-gray-300 bg-slate-200 mt-2" dir="ltr">
                              <div className="flex flex-col items-center justify-center flex-1 py-3 px-2 text-gray-900">
                                <span className="font-bold text-sm">{count} طلب</span>
                                <span className="text-xs mt-1">المبلغ: {sumPrice}</span>
                                <span className="text-xs">وفر المشتري: {sumDiscount}</span>
                              </div>
                            </div>
                          );
                        };
                        const totalCount = (orderStats.countWebsite ?? 0) + (orderStats.countWhatsapp ?? 0) + (orderStats.countTable ?? 0);
                        const totalPrice = (orderStats.sumPriceWebsite ?? 0) + (orderStats.sumPriceWhatsapp ?? 0) + (orderStats.sumPriceTable ?? 0);
                        const totalDiscount = (orderStats.sumDiscountWebsite ?? 0) + (orderStats.sumDiscountWhatsapp ?? 0) + (orderStats.sumDiscountTable ?? 0);
                        const totalCompletedPrice = (orderStats.sumCompletedPriceWebsite ?? 0) + (orderStats.sumCompletedPriceWhatsapp ?? 0) + (orderStats.sumCompletedPriceTable ?? 0);
                        const totalCompletedDiscount = (orderStats.sumCompletedDiscountWebsite ?? 0) + (orderStats.sumCompletedDiscountWhatsapp ?? 0) + (orderStats.sumCompletedDiscountTable ?? 0);
                        const totalCompletedCount = (orderStats.completedDeliveryWebsite ?? 0) + (orderStats.completedDeliveryWhatsapp ?? 0) + (orderStats.completedTable ?? 0);
                        const cWeb = orderStats.countWebsite ?? 0;
                        const cWa = orderStats.countWhatsapp ?? 0;
                        const cTbl = orderStats.countTable ?? 0;
                        return (
                          <>
                            <div>
                              {isPro && (
                                <OrderProgressBar
                                  label="طلبات الموقع"
                                  totalCount={cWeb}
                                  completedCount={orderStats.completedDeliveryWebsite ?? 0}
                                  sumPrice={orderStats.sumPriceWebsite ?? 0}
                                  sumDiscount={orderStats.sumDiscountWebsite ?? 0}
                                  sumCompletedPrice={orderStats.sumCompletedPriceWebsite ?? 0}
                                  sumCompletedDiscount={orderStats.sumCompletedDiscountWebsite ?? 0}
                                />
                              )}
                              {!isPro && cWeb >= 1 && <p className="text-sm font-medium text-gray-700 mb-2">طلبات الموقع</p>}
                              <FullBar count={cWeb} sumPrice={orderStats.sumPriceWebsite ?? 0} sumDiscount={orderStats.sumDiscountWebsite ?? 0} />
                            </div>
                            <div>
                              {isPro && (
                                <OrderProgressBar
                                  label="طلبات واتساب"
                                  totalCount={cWa}
                                  completedCount={orderStats.completedDeliveryWhatsapp ?? 0}
                                  sumPrice={orderStats.sumPriceWhatsapp ?? 0}
                                  sumDiscount={orderStats.sumDiscountWhatsapp ?? 0}
                                  sumCompletedPrice={orderStats.sumCompletedPriceWhatsapp ?? 0}
                                  sumCompletedDiscount={orderStats.sumCompletedDiscountWhatsapp ?? 0}
                                />
                              )}
                              {!isPro && cWa >= 1 && <p className="text-sm font-medium text-gray-700 mb-2">طلبات واتساب</p>}
                              <FullBar count={cWa} sumPrice={orderStats.sumPriceWhatsapp ?? 0} sumDiscount={orderStats.sumDiscountWhatsapp ?? 0} />
                            </div>
                            <div>
                              {isPro && (
                                <OrderProgressBar
                                  label="طلبات الطاولة"
                                  totalCount={cTbl}
                                  completedCount={orderStats.completedTable ?? 0}
                                  sumPrice={orderStats.sumPriceTable ?? 0}
                                  sumDiscount={orderStats.sumDiscountTable ?? 0}
                                  sumCompletedPrice={orderStats.sumCompletedPriceTable ?? 0}
                                  sumCompletedDiscount={orderStats.sumCompletedDiscountTable ?? 0}
                                />
                              )}
                              {isPro && <FullBar count={cTbl} sumPrice={orderStats.sumPriceTable ?? 0} sumDiscount={orderStats.sumDiscountTable ?? 0} />}
                            </div>
                            {isPro && totalCount >= 1 && (
                              <div>
                                <OrderProgressBar
                                  label="المجموع"
                                  totalCount={totalCount}
                                  completedCount={totalCompletedCount}
                                  sumPrice={totalPrice}
                                  sumDiscount={totalDiscount}
                                  sumCompletedPrice={totalCompletedPrice}
                                  sumCompletedDiscount={totalCompletedDiscount}
                                />
                                <FullBar count={totalCount} sumPrice={totalPrice} sumDiscount={totalDiscount} />
                              </div>
                            )}
                            {!isPro && (cWeb + cWa) >= 1 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">المجموع</p>
                                <FullBar count={cWeb + cWa} sumPrice={(orderStats.sumPriceWebsite ?? 0) + (orderStats.sumPriceWhatsapp ?? 0)} sumDiscount={(orderStats.sumDiscountWebsite ?? 0) + (orderStats.sumDiscountWhatsapp ?? 0)} />
                              </div>
                            )}
                            {/* Pies: Basic+ (موقع + واتساب)، Pro+ (موقع + واتساب + طاولة) */}
                            {(() => {
                              const PIE_COLORS_ORDER = { موقع: '#3b82f6', واتساب: '#22c55e', طاولة: '#f59e0b' };
                              const OrderPie = ({ label, segments }: { label: string; segments: { name: string; value: number }[] }) => {
                                const withColor = segments.filter(s => s.value > 0).map(s => ({ ...s, color: PIE_COLORS_ORDER[s.name as keyof typeof PIE_COLORS_ORDER] ?? '#94a3b8' }));
                                const total = withColor.reduce((sum, s) => sum + s.value, 0);
                                let cumulative = 0;
                                const conicParts = withColor.map(s => {
                                  const pct = total ? (s.value / total) * 100 : 0;
                                  const part = `${s.color} ${cumulative}% ${cumulative + pct}%`;
                                  cumulative += pct;
                                  return part;
                                });
                                return (
                                  <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">{label}</h3>
                                    <div className="flex flex-col items-center">
                                      {total === 0 ? (
                                        <div className="w-36 h-36 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">لا نشاط</div>
                                      ) : (
                                        <>
                                          <div className="w-36 h-36 rounded-full flex-shrink-0" style={{ background: `conic-gradient(${conicParts.join(', ')})` }} title={withColor.map(s => `${s.name}: ${s.value}`).join('\n')} />
                                          <p className="mt-2 text-xs text-gray-500">المجموع: {total}</p>
                                          <ul className="mt-2 w-full space-y-1 text-xs">
                                            {withColor.map((s, i) => (
                                              <li key={i} className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                                <span>{s.name}</span>
                                                <span className="text-gray-600 font-medium">{s.value}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              };
                              const segBasicCount = [{ name: 'موقع', value: cWeb }, { name: 'واتساب', value: cWa }];
                              const segBasicPrice = [{ name: 'موقع', value: orderStats.sumPriceWebsite ?? 0 }, { name: 'واتساب', value: orderStats.sumPriceWhatsapp ?? 0 }];
                              const segBasicDiscount = [{ name: 'موقع', value: orderStats.sumDiscountWebsite ?? 0 }, { name: 'واتساب', value: orderStats.sumDiscountWhatsapp ?? 0 }];
                              const segProCount = [{ name: 'موقع', value: cWeb }, { name: 'واتساب', value: cWa }, { name: 'طاولة', value: cTbl }];
                              const segProPrice = [{ name: 'موقع', value: orderStats.sumPriceWebsite ?? 0 }, { name: 'واتساب', value: orderStats.sumPriceWhatsapp ?? 0 }, { name: 'طاولة', value: orderStats.sumPriceTable ?? 0 }];
                              const segProDiscount = [{ name: 'موقع', value: orderStats.sumDiscountWebsite ?? 0 }, { name: 'واتساب', value: orderStats.sumDiscountWhatsapp ?? 0 }, { name: 'طاولة', value: orderStats.sumDiscountTable ?? 0 }];
                              return (
                                <div className="mt-8 space-y-6">
                                  <h3 className="text-lg font-bold text-gray-700">توزيع حسب المصدر</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <OrderPie label="العدد (موقع + واتساب)" segments={segBasicCount} />
                                    <OrderPie label="المبلغ (موقع + واتساب)" segments={segBasicPrice} />
                                    <OrderPie label="وفر المشتري (موقع + واتساب)" segments={segBasicDiscount} />
                                  </div>
                                  {isPro && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                      <OrderPie label="العدد (مع الطاولة)" segments={segProCount} />
                                      <OrderPie label="المبلغ (مع الطاولة)" segments={segProPrice} />
                                      <OrderPie label="وفر المشتري (مع الطاولة)" segments={segProDiscount} />
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                </section>

                {/* إحصائيات الفريق (Business فقط) */}
                {!isPlanActive('business') ? null : teamStatsLoading ? (
                  <p className="text-gray-500">جاري تحميل إحصائيات الفريق...</p>
                ) : teamStatsError ? (
                  <p className="text-red-600">{teamStatsError}</p>
                ) : (
              (() => {
                const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

                const getSegments = (keyOrKeys: string | string[]) => {
                  const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
                  if (keys.length === 1 && keys[0] === 'deliveryAssignedCount') {
                    const out: { name: string; value: number; color: string }[] = [];
                    teamStatsUsers.forEach((u, i) => {
                      const v = Number(u.stats.deliveryAssignedCount) || 0;
                      if (v > 0) out.push({ name: u.name, value: v, color: PIE_COLORS[i % PIE_COLORS.length] });
                    });
                    const adminUser = teamStatsUsers.find(u => u.userType === 'admin');
                    if (adminUser) {
                      const w = Number((adminUser.stats as Record<string, number>).WithoutDeliveryOrdersCount) || 0;
                      const a = Number((adminUser.stats as Record<string, number>).AnyDeliveryOrdersCount) || 0;
                      if (w > 0) out.push({ name: 'بدون عامل', value: w, color: PIE_COLORS[teamStatsUsers.length % PIE_COLORS.length] });
                      if (a > 0) out.push({ name: 'أي عامل', value: a, color: PIE_COLORS[(teamStatsUsers.length + 1) % PIE_COLORS.length] });
                    }
                    return out;
                  }
                  return teamStatsUsers
                    .map((u, i) => ({
                      name: u.name,
                      value: keys.reduce((sum, k) => sum + (Number((u.stats as Record<string, number>)[k]) || 0), 0),
                      color: PIE_COLORS[i % PIE_COLORS.length],
                    }))
                    .filter(s => s.value > 0);
                };

                const PieCard = ({ statKey, statKeys, label }: { statKey?: string; statKeys?: string[]; label: string }) => {
                  const segments = getSegments(statKeys ?? statKey ?? '');
                  const total = segments.reduce((sum, s) => sum + s.value, 0);
                  let cumulative = 0;
                  const conicParts = segments.map(s => {
                    const pct = total ? (s.value / total) * 100 : 0;
                    const part = `${s.color} ${cumulative}% ${cumulative + pct}%`;
                    cumulative += pct;
                    return part;
                  });
                  return (
                    <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                      <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">{label}</h3>
                      <div className="flex flex-col items-center">
                        {total === 0 ? (
                          <div className="w-40 h-40 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">لا نشاط</div>
                        ) : (
                          <>
                            <div
                              className="w-40 h-40 rounded-full flex-shrink-0"
                              style={{ background: `conic-gradient(${conicParts.join(', ')})` }}
                              title={segments.map(s => `${s.name}: ${s.value}`).join('\n')}
                            />
                            <p className="mt-2 text-xs text-gray-500">المجموع: {total}</p>
                            <ul className="mt-2 w-full space-y-1 text-xs">
                              {segments.map((s, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                                  <span className="truncate">{s.name}</span>
                                  <span className="text-gray-600 font-medium">{s.value}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>
                  );
                };

                const DELIVERY_ASSIGNMENT = [{ key: 'deliveryAssignedCount', label: 'تعيين عمال التوصيل للطلبات' }];
                /** تقديم: تجميع حسب الحالة الهدف (إلى 2، إلى 3، إلى 4) */
                const DELIVERY_PIES_FORWARD = [
                  { statKeys: ['deliveryForward12'] as const, label: 'تقديم إلى 2' },
                  { statKeys: ['deliveryForward13', 'deliveryForward23'] as const, label: 'تقديم إلى 3' },
                  { statKeys: ['deliveryForward14', 'deliveryForward24', 'deliveryForward34'] as const, label: 'تقديم إلى 4' },
                ];
                /** تأخير: تجميع حسب الحالة الهدف (إلى 1، إلى 2، إلى 3) */
                const DELIVERY_PIES_DOWNGRADE = [
                  { statKeys: ['deliveryDowngrade41', 'deliveryDowngrade31', 'deliveryDowngrade21'] as const, label: 'تأخير إلى 1' },
                  { statKeys: ['deliveryDowngrade42', 'deliveryDowngrade32'] as const, label: 'تأخير إلى 2' },
                  { statKeys: ['deliveryDowngrade43'] as const, label: 'تأخير إلى 3' },
                ];
                const TABLE_PIES_FORWARD = [
                  { statKeys: ['tableForward12'] as const, label: 'تقديم إلى 2' },
                  { statKeys: ['tableForward13', 'tableForward23'] as const, label: 'تقديم إلى 3' },
                  { statKeys: ['tableForward14', 'tableForward24', 'tableForward34'] as const, label: 'تقديم إلى 4' },
                ];
                const TABLE_PIES_DOWNGRADE = [
                  { statKeys: ['tableDowngrade41', 'tableDowngrade31', 'tableDowngrade21'] as const, label: 'تأخير إلى 1' },
                  { statKeys: ['tableDowngrade42', 'tableDowngrade32'] as const, label: 'تأخير إلى 2' },
                  { statKeys: ['tableDowngrade43'] as const, label: 'تأخير إلى 3' },
                ];

                const formatCachedAt = (iso: string) => {
                  try {
                    const d = new Date(iso);
                    return d.toLocaleDateString('ar-SA', { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
                  } catch {
                    return iso;
                  }
                };

                return (
                  <div className="space-y-10">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-800">ملخص النشاط</h2>
                      {teamStatsCachedAt && (
                        <span className="text-sm text-gray-500">
                          آخر تحديث: {formatCachedAt(teamStatsCachedAt)}
                        </span>
                      )}
                    </div>

                    <section>
                      <h3 className="text-lg font-bold text-gray-700 mb-4">تعيين عمال التوصيل للطلبات</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {DELIVERY_ASSIGNMENT.map(({ key, label }) => (
                          <PieCard key={key} statKey={key} label={label} />
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-gray-700 mb-4">التوصيل</h3>
                      <h4 className="text-base font-bold text-gray-600 mb-3">التقديم</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                        {DELIVERY_PIES_FORWARD.map(({ statKeys, label }, i) => (
                          <PieCard key={i} statKeys={[...statKeys]} label={label} />
                        ))}
                      </div>
                      <h4 className="text-base font-bold text-gray-600 mb-3">التأخير</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {DELIVERY_PIES_DOWNGRADE.map(({ statKeys, label }, i) => (
                          <PieCard key={i} statKeys={[...statKeys]} label={label} />
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-gray-700 mb-4">الطاولة</h3>
                      <h4 className="text-base font-bold text-gray-600 mb-3">التقديم</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                        {TABLE_PIES_FORWARD.map(({ statKeys, label }, i) => (
                          <PieCard key={i} statKeys={[...statKeys]} label={label} />
                        ))}
                      </div>
                      <h4 className="text-base font-bold text-gray-600 mb-3">التأخير</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {TABLE_PIES_DOWNGRADE.map(({ statKeys, label }, i) => (
                          <PieCard key={i} statKeys={[...statKeys]} label={label} />
                        ))}
                      </div>
                    </section>
                  </div>
                );
              })()
            )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'workersActivity' && (
          <div className="w-full max-w-5xl mx-auto p-4 space-y-8">
            {userType === 'admin' && (
              <>
                <h2 className="text-2xl font-bold text-gray-800">نشاط العاملين</h2>
                {!isPlanActive('business') && (
                  <p className="text-gray-500 text-sm">تفاصيل النشاط والإحصائيات واللوجات متاحة ضمن باقة البزنس فقط.</p>
                )}
                {workersActivityListLoading ? (
                  <p className="text-gray-500">جاري تحميل القائمة...</p>
                ) : (
                  <>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-medium text-gray-600">الفئة:</span>
                        {([
                          { value: 'all', label: 'الكل' },
                          { value: 'delivery', label: 'عامل توصيل' },
                          { value: 'deliveryOnly', label: 'عامل توصيل فقط' },
                          { value: 'waiter', label: 'نادل' },
                          { value: 'waiterOnly', label: 'نادل فقط' },
                        ] as const).map(({ value: role, label }) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              setWorkersActivityRoleFilter(role);
                              setWorkersActivityPage(1);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                              workersActivityRoleFilter === role
                                ? role === 'all'
                                  ? 'bg-gray-800 text-white'
                                  : role === 'delivery' || role === 'deliveryOnly'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-amber-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <input
                          type="search"
                          placeholder="بحث بالاسم أو اسم المستخدم أو رقم الهاتف..."
                          value={workersActivitySearchQuery}
                          onChange={(e) => {
                            setWorkersActivitySearchQuery(e.target.value);
                            setWorkersActivityPage(1);
                          }}
                          className="flex-1 min-w-0 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                        />
                      </div>
                    </div>
                    {(() => {
                      const q = workersActivitySearchQuery.trim().toLowerCase();
                      const byRole =
                        workersActivityRoleFilter === 'all'
                          ? workersActivityList
                          : workersActivityRoleFilter === 'delivery'
                            ? workersActivityList.filter((w) => w.isDelivery)
                            : workersActivityRoleFilter === 'deliveryOnly'
                              ? workersActivityList.filter((w) => w.isDelivery && !w.isWaiter)
                              : workersActivityRoleFilter === 'waiterOnly'
                                ? workersActivityList.filter((w) => w.isWaiter && !w.isDelivery)
                                : workersActivityList.filter((w) => w.isWaiter);
                      const filtered = q
                        ? byRole.filter(
                            (w) =>
                              (w.name || '').toLowerCase().includes(q) ||
                              (w.username || '').toLowerCase().includes(q) ||
                              (w.phone || '').toLowerCase().includes(q)
                          )
                        : byRole;
                      type CardWithRank = WorkerCard & { _rank?: number };
                      let ordered: CardWithRank[] = filtered.map((w) => ({ ...w, _rank: undefined as number | undefined }));
                      if (employeeRatingSettings.enableEmployeeRating && filtered.length > 0) {
                        const rs = employeeRatingSettings;
                        const roleFilter = workersActivityRoleFilter;
                        const withScore = filtered.map((w): CardWithRank & { _S: number; _R: number; _S_norm: number; _R_norm: number; _FinalScoreToRank: number } => {
                          const pointsDelivery = (rs.scaleDeliveryForward ?? 0) * (w.deliveryForward ?? 0) + (rs.scaleDeliveryBackward ?? 0) * (w.deliveryDowngrade ?? 0);
                          const pointsTable = (rs.scaleTableForward ?? 0) * (w.tableForward ?? 0) + (rs.scaleTableBackward ?? 0) * (w.tableDowngrade ?? 0);
                          const days = w.createdAt ? Math.max(1, Math.ceil((Date.now() - new Date(w.createdAt).getTime()) / 86400000)) : 1;
                          const STotal = pointsDelivery + pointsTable;
                          const RTotal = STotal / days;
                          const SDelivery = pointsDelivery;
                          const RDelivery = pointsDelivery / days;
                          const STable = pointsTable;
                          const RTable = pointsTable / days;
                          const useDelivery = roleFilter === 'delivery' || roleFilter === 'deliveryOnly';
                          const useWaiter = roleFilter === 'waiter' || roleFilter === 'waiterOnly';
                          const S = useDelivery ? SDelivery : useWaiter ? STable : STotal;
                          const R = useDelivery ? RDelivery : useWaiter ? RTable : RTotal;
                          return { ...w, _S: S, _R: R, _S_norm: 0, _R_norm: 0, _FinalScoreToRank: 0, _rank: undefined };
                        });
                        const maxS = Math.max(...withScore.map((x) => x._S), 1);
                        const maxR = Math.max(...withScore.map((x) => x._R), 1);
                        withScore.forEach((x) => {
                          x._S_norm = x._S / maxS;
                          x._R_norm = x._R / maxR;
                          x._FinalScoreToRank = (1 - rs.tendencyX) * x._S_norm + rs.tendencyX * x._R_norm;
                        });
                        const adminId = currentAdmin?.id;
                        const sorted = [...withScore].sort((a, b) => {
                          if (a.id === adminId) return -1;
                          if (b.id === adminId) return 1;
                          return b._FinalScoreToRank - a._FinalScoreToRank;
                        });
                        let rank = 0;
                        ordered = sorted.map((w) => (w.id === adminId ? { ...w, _rank: 0 } : { ...w, _rank: ++rank }));
                      }
                      const totalPages = Math.max(1, Math.ceil(ordered.length / WORKERS_ACTIVITY_PAGE_SIZE));
                      const page = Math.min(workersActivityPage, totalPages);
                      const start = (page - 1) * WORKERS_ACTIVITY_PAGE_SIZE;
                      const paginated = ordered.slice(start, start + WORKERS_ACTIVITY_PAGE_SIZE);
                      return (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {paginated.map((w) => (
                              <button
                                key={w.id}
                                type="button"
                                onClick={() => {
                                  setExpandedWorkerId(w.id);
                                  setTimeout(() => workerDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                                }}
                                className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center hover:bg-gray-50 transition-colors relative"
                              >
                                <div className="relative inline-block mb-3">
                                  {w.imageUrl ? (
                                    <img src={w.imageUrl} alt="" className="w-20 h-20 rounded-full object-cover border border-gray-200" />
                                  ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-2xl font-bold border border-gray-200">
                                      {(w.name || w.id).charAt(0)}
                                    </div>
                                  )}
                                  {w.id === currentAdmin?.id ? (
                                    <span className="absolute bottom-0 left-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-2 ring-white shadow">
                                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5.5L12 4l3.5 6.5L21 5l-2 11H5zm14 2c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1s.45-1 1-1h12c.55 0 1 .45 1 1z"/></svg>
                                    </span>
                                  ) : (w as CardWithRank)._rank != null && workersActivityRoleFilter !== 'deliveryOnly' && workersActivityRoleFilter !== 'waiterOnly' && (() => {
                                    const r = (w as CardWithRank)._rank!;
                                    const bg = r === 1 ? 'bg-amber-400' : r === 2 ? 'bg-gray-300' : r === 3 ? 'bg-amber-700' : 'bg-gray-800';
                                    const textColor = r === 2 ? 'text-gray-800' : 'text-white';
                                    return (
                                      <span className={`absolute bottom-0 left-0 w-6 h-6 rounded-full ${bg} ${textColor} text-xs font-bold flex items-center justify-center ring-2 ring-white shadow`}>
                                        {r}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <p className="font-bold text-gray-800 truncate mb-3 block w-full text-center">{w.name || w.id}</p>
                                {employeeRatingSettings.enableEmployeeRating && (w as CardWithRank & { _S?: number; _R?: number })._S != null ? (() => {
                                  const rs = employeeRatingSettings;
                                  const pointsDelivery = (rs.scaleDeliveryForward ?? 0) * (w.deliveryForward ?? 0) + (rs.scaleDeliveryBackward ?? 0) * (w.deliveryDowngrade ?? 0);
                                  const pointsTable = (rs.scaleTableForward ?? 0) * (w.tableForward ?? 0) + (rs.scaleTableBackward ?? 0) * (w.tableDowngrade ?? 0);
                                  const days = w.createdAt ? Math.max(1, Math.ceil((Date.now() - new Date(w.createdAt).getTime()) / 86400000)) : 1;
                                  const efficiencyDelivery = pointsDelivery / days;
                                  const efficiencyTable = pointsTable / days;
                                  const fmt = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));
                                  const S = (w as CardWithRank & { _S: number })._S;
                                  const R = (w as CardWithRank & { _R: number })._R;
                                  return (
                                    <div className="space-y-3 text-center">
                                      <div className="flex flex-wrap gap-1.5 justify-center">
                                        <span className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[10px] font-medium min-w-[3.5rem] leading-tight ${w.isDelivery ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                                          <span>توصيل</span>
                                          <span className="text-sm font-bold mt-0.5">{w.deliveryForward ?? '—'}</span>
                                          <span className="text-[9px] text-gray-500 mt-0">{w.deliveryDowngrade ?? '—'}</span>
                                        </span>
                                        <span className={`inline-flex flex-col items-center px-2 py-1 rounded-lg text-[10px] font-medium min-w-[3.5rem] leading-tight ${w.isWaiter ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400'}`}>
                                          <span>نادل</span>
                                          <span className="text-sm font-bold mt-0.5">{w.tableForward ?? '—'}</span>
                                          <span className="text-[9px] text-gray-500 mt-0">{w.tableDowngrade ?? '—'}</span>
                                        </span>
                                      </div>
                                      <div className="space-y-1 text-xs text-gray-600">
                                        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                                          <span className="text-gray-500 font-medium">النقاط:</span>
                                          <span className="font-semibold text-gray-800">{fmt(S)}</span>
                                          <span className="text-gray-400">·</span>
                                          <span className="font-semibold text-blue-700">{fmt(pointsDelivery)}</span>
                                          <span className="text-gray-400">·</span>
                                          <span className="font-semibold text-amber-700">{fmt(pointsTable)}</span>
                                        </p>
                                        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                                          <span className="text-gray-500 font-medium">الكفاءة:</span>
                                          <span className="font-semibold text-gray-800">{Math.round(R)}</span>
                                          <span className="text-gray-400">·</span>
                                          <span className="font-semibold text-blue-700">{Math.round(efficiencyDelivery)}</span>
                                          <span className="text-gray-400">·</span>
                                          <span className="font-semibold text-amber-700">{Math.round(efficiencyTable)}</span>
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })() : (
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    <span className={`inline-flex flex-col items-center px-1 py-0.5 rounded text-[10px] font-medium min-w-[3rem] leading-tight ${w.isWaiter ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-400'}`}>
                                      <span>نادل</span>
                                      <span className="text-sm font-bold mt-0">{w.tableForward ?? '—'}</span>
                                      <span className="text-[9px] text-left w-full text-gray-500 mt-0">{w.tableDowngrade ?? '—'}</span>
                                    </span>
                                    <span className={`inline-flex flex-col items-center px-1 py-0.5 rounded text-[10px] font-medium min-w-[3rem] leading-tight ${w.isDelivery ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                                      <span>توصيل</span>
                                      <span className="text-sm font-bold mt-0">{w.deliveryForward ?? '—'}</span>
                                      <span className="text-[9px] text-left w-full text-gray-500 mt-0">{w.deliveryDowngrade ?? '—'}</span>
                                    </span>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                          {ordered.length > WORKERS_ACTIVITY_PAGE_SIZE && (
                            <div className="mt-6 flex justify-center items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setWorkersActivityPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                السابق
                              </button>
                              <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setWorkersActivityPage(p)}
                                    className={`px-3 py-2 rounded-lg font-semibold transition flex-shrink-0 ${page === p ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => setWorkersActivityPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                التالي
                              </button>
                            </div>
                          )}
                          {/* فورم تقييم وترتيب العاملين - أسفل الليست، باقة البزنس فقط */}
                          {isPlanActive('business') && (
                            <div className="border-2 border-amber-200 bg-amber-50/50 rounded-xl p-6 mt-8">
                              <label className="flex items-center gap-3 cursor-pointer mb-4">
                                <input
                                  type="checkbox"
                                  checked={employeeRatingSettings.enableEmployeeRating}
                                  onChange={(e) => setEmployeeRatingSettings({ ...employeeRatingSettings, enableEmployeeRating: e.target.checked })}
                                  className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                                />
                                <span className="font-bold text-gray-800">تفعيل تقييم العاملين</span>
                              </label>
                              {employeeRatingSettings.enableEmployeeRating && (
                                <div className="space-y-6 mr-2">
                                  <p className="text-sm text-gray-600">كيف ترى كل نوع من التحويلات؟</p>
                                  {[
                                    { key: 'scaleDeliveryForward' as const, label: 'تقديم حالة طلب التوصيل للأمام' },
                                    { key: 'scaleDeliveryBackward' as const, label: 'تأخير حالة طلب التوصيل للخلف' },
                                    { key: 'scaleTableForward' as const, label: 'تقديم حالة طلب الطاولة للأمام' },
                                    { key: 'scaleTableBackward' as const, label: 'تأخير حالة طلب الطاولة للخلف' },
                                  ].map(({ key, label }) => {
                                    const opts = [{ v: 2, l: 'جيد جداً' }, { v: 1, l: 'جيد' }, { v: 0, l: 'شيء عادي' }, { v: -1, l: 'سئ' }, { v: -2, l: 'سئ جداً' }] as const;
                                    return (
                                      <div key={key} className="space-y-1">
                                        <label className="block text-sm font-bold text-gray-700">{label}</label>
                                        <div className="flex px-1">
                                          {opts.map(({ l }) => (
                                            <span key={l} className="flex-1 text-center text-xs text-gray-600">{l}</span>
                                          ))}
                                        </div>
                                        <div className="relative flex px-1 py-3">
                                          <div className="absolute left-[10%] right-[10%] top-1/2 h-0.5 bg-gray-200 rounded -translate-y-1/2" aria-hidden />
                                          {opts.map(({ v, l }) => (
                                            <div key={v} className="flex-1 flex justify-center">
                                              <button
                                                type="button"
                                                onClick={() => setEmployeeRatingSettings({ ...employeeRatingSettings, [key]: v })}
                                                className={`relative z-10 w-5 h-5 rounded-full shrink-0 transition ${employeeRatingSettings[key] === v ? 'bg-gray-800 ring-2 ring-gray-800 ring-offset-2' : 'bg-white ring-2 ring-gray-300 hover:ring-gray-400'}`}
                                                title={l}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div className="pt-4 mt-4 border-t border-amber-200/80 space-y-1">
                                    <label className="block text-sm font-bold text-gray-700">إلى من تميل أكثر؟</label>
                                    <div className="flex px-1 mb-1">
                                      <span className="flex-1 text-center text-xs text-gray-500">موظف قديم راكد  (النقاط)</span>
                                      <span className="flex-1 text-center text-xs text-gray-500" />
                                      <span className="flex-1 text-center text-xs text-gray-500" />
                                      <span className="flex-1 text-center text-xs text-gray-500" />
                                      <span className="flex-1 text-center text-xs text-gray-500">موظف جديد نشيط (الكفاءة)</span>
                                    </div>
                                    <div className="relative flex px-1 py-3">
                                      <div className="absolute left-[10%] right-[10%] top-1/2 h-0.5 bg-amber-200 rounded -translate-y-1/2" aria-hidden />
                                      {([{ v: 0, l: 'قديم' }, { v: 0.25, l: 'أقرب لقديم' }, { v: 0.5, l: 'متوسط' }, { v: 0.75, l: 'أقرب لجديد' }, { v: 1, l: 'جديد' }] as const).map(({ v, l }) => (
                                        <div key={v} className="flex-1 flex justify-center">
                                          <button
                                            type="button"
                                            onClick={() => setEmployeeRatingSettings({ ...employeeRatingSettings, tendencyX: v })}
                                            className={`relative z-10 w-5 h-5 rounded-full shrink-0 transition ${employeeRatingSettings.tendencyX === v ? 'bg-amber-600 ring-2 ring-amber-600 ring-offset-2' : 'bg-white ring-2 ring-amber-200 hover:ring-amber-300'}`}
                                            title={l}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={handleSaveRatingSettings}
                                disabled={isSavingRatingSettings}
                                className="mt-6 w-full py-3 px-4 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSavingRatingSettings ? 'جاري الحفظ...' : 'حفظ إعدادات التقييم'}
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </>
            )}

            {userType === 'employee' && !isPlanActive('business') && (
              <p className="text-gray-500 text-sm">تفاصيل النشاط والإحصائيات واللوجات متاحة ضمن باقة البزنس فقط.</p>
            )}

            {/* شريط النقاط / الكفاءة / الترتيب — للموظف فقط، 3 دوائر في المنتصف */}
            {userType === 'employee' && (
              <div className="pt-2 pb-2 flex justify-center">
                {employeeRatingInfoLoading ? (
                  <p className="text-gray-500 text-sm">جاري تحميل التقييم...</p>
                ) : employeeRatingInfo?.enabled ? (
                  <div className="flex flex-wrap gap-6 sm:gap-8 items-center justify-center">
                    {(() => {
                      const rankCircleClass = (r: number) =>
                        r === 1
                          ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-amber-950 ring-2 ring-amber-200/90 shadow-md'
                          : r === 2
                            ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 text-slate-800 ring-2 ring-slate-200/80 shadow-md'
                            : r === 3
                              ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-50 ring-2 ring-amber-500/50 shadow-md'
                              : 'bg-slate-600 text-white ring-2 ring-slate-400/50 shadow-sm';
                      return (
                        <>
                          {/* النقاط — دائرة */}
                          <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs font-medium mb-2">النقاط</span>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200/80 shadow-sm">
                              <span className="text-lg font-bold text-slate-800 tabular-nums">
                                {typeof employeeRatingInfo.points === 'number'
                                  ? (employeeRatingInfo.points % 1 === 0 ? employeeRatingInfo.points : employeeRatingInfo.points.toFixed(1))
                                  : '—'}
                              </span>
                            </div>
                          </div>
                          {/* الكفاءة — دائرة */}
                          <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs font-medium mb-2">الكفاءة</span>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200/80 shadow-sm">
                              <span className="text-lg font-bold text-slate-800 tabular-nums">
                                {typeof employeeRatingInfo.efficiency === 'number' ? Math.round(employeeRatingInfo.efficiency) : '—'}
                              </span>
                            </div>
                          </div>
                          {/* الترتيب العام — دائرة # */}
                          <div className="flex flex-col items-center">
                            <span className="text-slate-500 text-xs font-medium mb-2">الترتيب</span>
                            {typeof employeeRatingInfo.rank === 'number' ? (
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold ${rankCircleClass(employeeRatingInfo.rank)}`}>
                                #{employeeRatingInfo.rank}
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200/80">
                                <span className="text-slate-400 font-semibold">—</span>
                              </div>
                            )}
                          </div>
                          {/* ترتيب التوصيل — دائرة # (إن وُجد) */}
                          {typeof employeeRatingInfo.rankAmongDelivery === 'number' && (
                            <div className="flex flex-col items-center">
                              <span className="text-slate-500 text-xs font-medium mb-2">ترتيب التوصيل</span>
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold ${rankCircleClass(employeeRatingInfo.rankAmongDelivery)}`}>
                                #{employeeRatingInfo.rankAmongDelivery}
                              </div>
                            </div>
                          )}
                          {/* ترتيب الندلاء — دائرة # (إن وُجد) */}
                          {typeof employeeRatingInfo.rankAmongWaiters === 'number' && (
                            <div className="flex flex-col items-center">
                              <span className="text-slate-500 text-xs font-medium mb-2">ترتيب الندلاء</span>
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold ${rankCircleClass(employeeRatingInfo.rankAmongWaiters)}`}>
                                #{employeeRatingInfo.rankAmongWaiters}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </div>
            )}

            <div ref={workerDetailsRef} className="min-h-[200px] pt-4">
              {expandedWorkerId && (
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6 space-y-6">
                  {expandedWorkerLoading ? (
                    <p className="text-gray-500">جاري تحميل التفاصيل...</p>
                  ) : (
                    <>
                      {expandedWorkerProfile && (
                        <div className="border-b border-gray-100 pb-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            {/* الصورة أولاً */}
                            <div className="flex items-center justify-center shrink-0">
                              {(expandedWorkerProfile.imageUrl as string) ? (
                                <img src={expandedWorkerProfile.imageUrl as string} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                              ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                                  <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 min-w-0">
                              {/* الاسم (اسم المستخدم بين قوسين) */}
                              <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-lg font-bold text-gray-800">{String(expandedWorkerProfile.name ?? expandedWorkerId)} <span className="text-gray-500 font-normal">({String(expandedWorkerProfile.username ?? '—')})</span></span>
                              </div>
                              {/* رقم الهاتف إن وجد */}
                              {expandedWorkerProfile.phone ? (
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                  <span className="text-sm text-gray-600">{String(expandedWorkerProfile.phone)}</span>
                                </div>
                              ) : null}
                              {/* منذ + التاريخ */}
                              {expandedWorkerProfile.createdAt ? (
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  <span className="text-sm text-gray-600">منذ {new Date(String(expandedWorkerProfile.createdAt)).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                              ) : null}
                              {/* طلبات التوصيل المعينة إن وجدت وليست صفراً */}
                              {isPlanActive('business') && expandedWorkerStats != null && Number(expandedWorkerStats.deliveryAssignedCount) > 0 && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                                  <span className="text-sm text-gray-600">طلبات توصيل معينة: <span className="font-semibold text-gray-800">{Number(expandedWorkerStats.deliveryAssignedCount)}</span></span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {isPlanActive('business') && expandedWorkerStats && (
                        <>
                          {(() => {
                            const DEL_LABELS = ['جديد', 'مقروء', 'قيد التوصيل', 'تم'];
                            const TBL_LABELS = ['جديد', 'مقروء', 'تم التقديم', 'تم'];
                            const forwardPairs: [number, number][] = [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]];
                            const downgradePairs: [number, number][] = [[4, 3], [4, 2], [4, 1], [3, 2], [3, 1], [2, 1]];
                            const forwardKeys = ['Forward12', 'Forward13', 'Forward14', 'Forward23', 'Forward24', 'Forward34'];
                            const downgradeKeys = ['Downgrade43', 'Downgrade42', 'Downgrade41', 'Downgrade32', 'Downgrade31', 'Downgrade21'];
                            const stateX = (i: number) => 12.5 + (4 - i) * 25;
                            const ArrowDiagram = ({ title, labels, prefix }: { title: string; labels: string[]; prefix: 'delivery' | 'table' }) => {
                              const w = 100;
                              const hTop = 38;
                              const hBottom = 38;
                              const yBaseTop = 38;
                              const yBaseBottom = 52;
                              const totalH = 100;
                              const viewY = 2;
                              const viewH = 84;
                              const strokeWidth = 0.45;
                              const circleR = 2;
                              const bulge1 = 8;
                              const bulge2 = 19;
                              const bulge3 = 30;
                              const getYCurveTop = (dist: number) => {
                                if (dist === 1) return yBaseTop - bulge1;
                                if (dist === 2) return yBaseTop - bulge2;
                                return yBaseTop - bulge3;
                              };
                              const getYCurveBottom = (dist: number) => {
                                if (dist === 1) return yBaseBottom + bulge1;
                                if (dist === 2) return yBaseBottom + bulge2;
                                return yBaseBottom + bulge3;
                              };
                              const colorForward = '#0d9488';
                              const colorDowngrade = '#64748b';
                              return (
                                <div className="rounded-xl bg-slate-50/80 border border-slate-200/90 overflow-hidden shadow-sm">
                                  <h4 className="text-slate-600 font-semibold text-sm mb-1 px-3 pt-2">{title}</h4>
                                  <div className="relative w-full px-1 pb-1" style={{ minHeight: 130 }}>
                                    <svg className="w-full block" viewBox={`0 ${viewY} ${w} ${viewH}`} preserveAspectRatio="xMidYMid meet" style={{ minHeight: 130 }}>
                                      <defs>
                                        <marker id={`arrow-${prefix}-f`} markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                                          <path d="M0,0 L4,2 L0,4 Z" fill={colorForward} />
                                        </marker>
                                        <marker id={`arrow-${prefix}-d`} markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
                                          <path d="M0,0 L4,2 L0,4 Z" fill={colorDowngrade} />
                                        </marker>
                                      </defs>
                                      {forwardPairs.map(([from, to], idx) => {
                                        const key = `${prefix}${forwardKeys[idx]}`;
                                        const value = Number(expandedWorkerStats[key]) || 0;
                                        const dist = to - from;
                                        const x1 = stateX(from);
                                        const x2 = stateX(to);
                                        const xm = (x1 + x2) / 2;
                                        const yCurve = getYCurveTop(dist);
                                        const yBase = yBaseTop;
                                        const path = `M ${x1} ${yBase} Q ${xm} ${yCurve} ${x2} ${yBase}`;
                                        const yCircle = (yBase + yCurve) / 2;
                                        return (
                                          <g key={key}>
                                            <path d={path} fill="none" stroke={colorForward} strokeWidth={strokeWidth} markerEnd={`url(#arrow-${prefix}-f)`} />
                                            <circle cx={xm} cy={yCircle} r={circleR} fill="white" stroke={colorForward} strokeWidth={0.4} opacity={0.95} />
                                            <text x={xm} y={yCircle} textAnchor="middle" dominantBaseline="central" fontSize="2.3" fill="#475569" fontWeight="600">{value}</text>
                                          </g>
                                        );
                                      })}
                                      {downgradePairs.map(([from, to], idx) => {
                                        const key = `${prefix}${downgradeKeys[idx]}`;
                                        const value = Number(expandedWorkerStats[key]) || 0;
                                        const dist = from - to;
                                        const x1 = stateX(from);
                                        const x2 = stateX(to);
                                        const xm = (x1 + x2) / 2;
                                        const yCurve = getYCurveBottom(dist);
                                        const yBase = yBaseBottom;
                                        const path = `M ${x1} ${yBase} Q ${xm} ${yCurve} ${x2} ${yBase}`;
                                        const yCircle = (yBase + yCurve) / 2;
                                        return (
                                          <g key={key}>
                                            <path d={path} fill="none" stroke={colorDowngrade} strokeWidth={strokeWidth} markerEnd={`url(#arrow-${prefix}-d)`} />
                                            <circle cx={xm} cy={yCircle} r={circleR} fill="white" stroke={colorDowngrade} strokeWidth={0.4} opacity={0.95} />
                                            <text x={xm} y={yCircle} textAnchor="middle" dominantBaseline="central" fontSize="2.3" fill="#475569" fontWeight="600">{value}</text>
                                          </g>
                                        );
                                      })}
                                    </svg>
                                    <div className="absolute inset-x-0 flex justify-between px-[8%] gap-1" dir="rtl" style={{ top: '50%', transform: 'translateY(-50%)', marginTop: '-2px' }}>
                                      {labels.map((name, i) => (
                                        <span key={i} className="text-center text-[15px] font-medium text-slate-600 flex-1 bg-white/95 rounded-md px-2 py-1 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)]" style={{ maxWidth: '24%' }}>{name}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            };
                            return (
                              <>
                                <div className="space-y-4">
                                  <ArrowDiagram title="التوصيل" labels={DEL_LABELS} prefix="delivery" />
                                  <h4 className="font-bold text-gray-700 mb-2">لوجات التوصيل</h4>
                                  <div className="overflow-x-auto rounded-lg border border-slate-200/90 bg-white/80 shadow-sm">
                                    {(expandedWorkerDeliveryLogs.logs as { orderId?: string; fromStatus?: number; toStatus?: number; createdAt?: string }[])?.length ? (
                                      <table className="w-full text-sm">
                                        <thead><tr className="bg-slate-50/90 border-b border-slate-200"><th className="p-2 text-right">الطلب</th><th className="p-2 text-right">من</th><th className="p-2 text-right">إلى</th><th className="p-2 text-right">الوقت</th></tr></thead>
                                        <tbody>
                                          {(expandedWorkerDeliveryLogs.logs as { orderId?: string; fromStatus?: number; toStatus?: number; createdAt?: string }[]).map((log, i) => {
                                            const DEL_L: Record<number, string> = { 1: 'جديد', 2: 'مقروء', 3: 'قيد التوصيل', 4: 'تم' };
                                            const fromL = DEL_L[log.fromStatus ?? 1] ?? String(log.fromStatus);
                                            const toL = DEL_L[log.toStatus ?? 1] ?? String(log.toStatus);
                                            const isForward = (log.toStatus ?? 0) > (log.fromStatus ?? 0);
                                            return (
                                              <tr key={i} className={`border-b border-slate-100 last:border-0 ${isForward ? 'bg-teal-200/85' : 'bg-slate-300/80'}`}>
                                                <td className="p-2 text-sm text-gray-700">{String(log.orderId || '').replace('order_', '')}</td>
                                                <td className="p-2 text-sm text-gray-700">{fromL}</td>
                                                <td className="p-2 text-sm text-gray-700">{toL}</td>
                                                <td className="p-2 text-sm text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString('ar-SA') : ''}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <p className="p-4 text-center text-slate-500 text-sm">لا يوجد</p>
                                    )}
                                  </div>
                                  {expandedWorkerDeliveryLogs.total > expandedWorkerDeliveryLogs.limit && (
                                    <div className="mt-6 flex justify-center items-center gap-2">
                                      <button type="button" disabled={expandedWorkerDeliveryLogs.page <= 1} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => fetchExpandedWorkerDetails(expandedWorkerId!, expandedWorkerDeliveryLogs.page - 1, expandedWorkerTableLogs.page, true)}>السابق</button>
                                      <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
                                        {Array.from({ length: Math.ceil(expandedWorkerDeliveryLogs.total / expandedWorkerDeliveryLogs.limit) || 1 }, (_, i) => i + 1).map(page => (
                                          <button key={page} type="button" onClick={() => fetchExpandedWorkerDetails(expandedWorkerId!, page, expandedWorkerTableLogs.page, true)} className={`px-3 py-2 rounded-lg font-semibold transition flex-shrink-0 ${expandedWorkerDeliveryLogs.page === page ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>{page}</button>
                                        ))}
                                      </div>
                                      <button type="button" disabled={expandedWorkerDeliveryLogs.page >= Math.ceil(expandedWorkerDeliveryLogs.total / expandedWorkerDeliveryLogs.limit)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => fetchExpandedWorkerDetails(expandedWorkerId!, expandedWorkerDeliveryLogs.page + 1, expandedWorkerTableLogs.page, true)}>التالي</button>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-4">
                                  <ArrowDiagram title="الطاولة" labels={TBL_LABELS} prefix="table" />
                                  <h4 className="font-bold text-gray-700 mb-2">لوجات الطاولة</h4>
                                  <div className="overflow-x-auto rounded-lg border border-slate-200/90 bg-white/80 shadow-sm">
                                    {(expandedWorkerTableLogs.logs as { orderId?: string; fromStatus?: number; toStatus?: number; createdAt?: string }[])?.length ? (
                                      <table className="w-full text-sm">
                                        <thead><tr className="bg-slate-50/90 border-b border-slate-200"><th className="p-2 text-right">الطلب</th><th className="p-2 text-right">من</th><th className="p-2 text-right">إلى</th><th className="p-2 text-right">الوقت</th></tr></thead>
                                        <tbody>
                                          {(expandedWorkerTableLogs.logs as { orderId?: string; fromStatus?: number; toStatus?: number; createdAt?: string }[]).map((log, i) => {
                                            const TBL_L: Record<number, string> = { 1: 'جديد', 2: 'مقروء', 3: 'تم التقديم', 4: 'تم' };
                                            const fromL = TBL_L[log.fromStatus ?? 1] ?? String(log.fromStatus);
                                            const toL = TBL_L[log.toStatus ?? 1] ?? String(log.toStatus);
                                            const isForward = (log.toStatus ?? 0) > (log.fromStatus ?? 0);
                                            return (
                                              <tr key={i} className={`border-b border-slate-100 last:border-0 ${isForward ? 'bg-teal-200/85' : 'bg-slate-300/80'}`}>
                                                <td className="p-2 text-sm text-gray-700">{String(log.orderId || '').replace('table_order_', '')}</td>
                                                <td className="p-2 text-sm text-gray-700">{fromL}</td>
                                                <td className="p-2 text-sm text-gray-700">{toL}</td>
                                                <td className="p-2 text-sm text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString('ar-SA') : ''}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <p className="p-4 text-center text-slate-500 text-sm">لا يوجد</p>
                                    )}
                                  </div>
                                  {expandedWorkerTableLogs.total > expandedWorkerTableLogs.limit && (
                                    <div className="mt-6 flex justify-center items-center gap-2">
                                      <button type="button" disabled={expandedWorkerTableLogs.page <= 1} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => fetchExpandedWorkerDetails(expandedWorkerId!, expandedWorkerDeliveryLogs.page, expandedWorkerTableLogs.page - 1, true)}>السابق</button>
                                      <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
                                        {Array.from({ length: Math.ceil(expandedWorkerTableLogs.total / expandedWorkerTableLogs.limit) || 1 }, (_, i) => i + 1).map(page => (
                                          <button key={page} type="button" onClick={() => fetchExpandedWorkerDetails(expandedWorkerId!, expandedWorkerDeliveryLogs.page, page, true)} className={`px-3 py-2 rounded-lg font-semibold transition flex-shrink-0 ${expandedWorkerTableLogs.page === page ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>{page}</button>
                                        ))}
                                      </div>
                                      <button type="button" disabled={expandedWorkerTableLogs.page >= Math.ceil(expandedWorkerTableLogs.total / expandedWorkerTableLogs.limit)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => fetchExpandedWorkerDetails(expandedWorkerId!, expandedWorkerDeliveryLogs.page, expandedWorkerTableLogs.page + 1, true)}>التالي</button>
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'lists' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* قسم إدارة القوائم */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              {/* Add/Edit List Form */}
              <div ref={listFormRef} className={`border-2 rounded-lg p-6 mb-6 ${editingList ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {editingList ? 'تحديث قائمة' : 'إضافة قائمة جديدة'}
                </h3>
                <form onSubmit={handleListSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      اسم القائمة <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={listFormData.name}
                      onChange={(e) => setListFormData({ ...listFormData, name: e.target.value })}
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingList ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                      placeholder="مثال: أسعار المشروبات"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg text-white ${editingList
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        }`}
                    >
                      {editingList ? 'تحديث' : 'إضافة القائمة'}
                    </button>
                    {editingList && (
                      <button
                        type="button"
                        onClick={handleCancelList}
                        className="px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-700"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">القوائم ({lists.length})</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {lists.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">لا توجد قوائم بعد</p>
                  ) : (
                    lists.map((list) => (
                      <div
                        key={list.id}
                        className={`border rounded-lg p-3 transition ${selectedList?.id === list.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">{list.name}</h4>
                            <p className="text-xs text-gray-500">
                              {getListItems(list.id).length} عنصر
                            </p>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            <button
                              onClick={() => handleEditList(list)}
                              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition"
                            >
                              تحديث
                            </button>
                            <button
                              onClick={() => handleSelectListForItems(list)}
                              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 rounded text-xs transition"
                            >
                              تحديث العناصر
                            </button>
                            <button
                              onClick={() => handleDeleteList(list.id)}
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
                  {/* Add/Edit Item Form */}
                  <div ref={itemFormRef} className={`border-2 rounded-lg p-6 mb-6 ${editingItem ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {editingItem ? 'تحديث عنصر' : 'إضافة عنصر جديد'}
                    </h3>

                    <form onSubmit={handleItemSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            اسم العنصر <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={itemFormData.name}
                            onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingItem ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                            placeholder="أدخل اسم العنصر"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            السعر <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={itemFormData.price}
                            onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingItem ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          السعر بعد الخصم (اختياري)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={itemFormData.discountedPrice}
                          onChange={(e) => setItemFormData({ ...itemFormData, discountedPrice: e.target.value })}
                          placeholder="هل يوجد خصم؟ ضع السعر الجديد"
                          className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingItem ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                        />
                      </div>
                      <ImageUploader
                        ref={itemImageUploadRef}
                        deferUpload
                        currentImageUrl={itemFormData.imageUrl}
                        onImageUploaded={(url) => setItemFormData(prev => ({ ...prev, imageUrl: url }))}
                        onUploadStateChange={setIsUploadingImage}
                        label="صورة العنصر (اختياري)"
                      />
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          الوصف (اختياري)
                        </label>
                        <textarea
                          value={itemFormData.description}
                          onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                          rows={3}
                          placeholder="السطر الأول سيظهر بخط عريض، والباقي بخط عادي"
                          className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingItem ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isUploadingImage || isSubmittingItem}
                          className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${editingItem
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            }`}
                        >
                          {isUploadingImage ? 'جاري رفع الصورة...' : isSubmittingItem ? 'جاري الحفظ...' : editingItem ? 'تحديث' : 'إضافة العنصر'}
                        </button>
                        {editingItem && (
                          <button
                            type="button"
                            onClick={handleCancelItem}
                            className="px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-700"
                          >
                            إلغاء
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

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
                                      تحديث
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm transition"
                                    >
                                      حذف
                                    </button>
                                    {item.imageUrl && currentAdmin && isPlanActive('basic') && (
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
                                        onGenerate={() => { }}
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
              <h2 className="text-2xl font-bold text-gray-800">طلبات التوصيل</h2>
              {isPlanActive('basic') && (currentAdmin?.isAcceptingOrders || currentAdmin?.isAcceptingOrdersViaWhatsapp) && (
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
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${statusFilter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        جديد
                      </button>
                      <button
                        onClick={() => { setStatusFilter('read'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${statusFilter === 'read' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        مقروء
                      </button>
                      <button
                        onClick={() => { setStatusFilter('delivering'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${statusFilter === 'delivering' ? 'bg-teal-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        قيد التوصيل
                      </button>
                      <button
                        onClick={() => { setStatusFilter('delivered'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${statusFilter === 'delivered' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        تم
                      </button>
                    </div>
                  </div>

                  {/* Order Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الطلب</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => { setOrderTypeFilter('all'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${orderTypeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setOrderTypeFilter('website'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${orderTypeFilter === 'website' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { setOrderTypeFilter('whatsapp'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${orderTypeFilter === 'whatsapp' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${dateFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => { setDateFilter('today'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${dateFilter === 'today' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        اليوم
                      </button>
                      <button
                        onClick={() => { setDateFilter('week'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${dateFilter === 'week' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        أسبوع
                      </button>
                      <button
                        onClick={() => { setDateFilter('month'); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${dateFilter === 'month' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        شهر
                      </button>
                    </div>
                  </div>

                  {/* Employee Filter - للأدمن فقط */}
                  {userType === 'admin' && (currentAdmin?.enableDeliveryEmployees || currentAdmin?.showDeliveryEmployeesAnyway) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">عامل التوصيل</label>
                      <select
                        value={employeeFilter}
                        onChange={(e) => { setEmployeeFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full px-1.5 py-0.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white text-sm"
                      >
                        <option value="all">الكل</option>
                        <option value="">بدون عامل توصيل</option>
                        <option value="ANY_DELIVERY">أي عامل يمكنه التوصيل</option>
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
                      {isPlanActive('basic') && (currentAdmin?.isAcceptingOrders || currentAdmin?.isAcceptingOrdersViaWhatsapp)
                        ? 'لا توجد طلبات بعد'
                        : 'طلبات التوصيل غير مفعلة'}
                    </p>
                    {(!isPlanActive('basic') || (!currentAdmin?.isAcceptingOrders && !currentAdmin?.isAcceptingOrdersViaWhatsapp)) && (
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
                        <div className="absolute -top-0.5 -left-0.5 w-8 h-5 bg-blue-700 rounded-full flex items-center justify-center  border-2 border-grey" title="لأي عامل توصيل">
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
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
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
                              disabled={updatingOrderStatus?.orderId === order.id || (userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees)}
                              className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees && order.status !== 'pending'
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees && order.status === 'pending'
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                  : (order.status || 'pending') === 'pending'
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
                              disabled={updatingOrderStatus?.orderId === order.id || (userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees)}
                              className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees && order.status !== 'read'
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees && order.status === 'read'
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                  : order.status === 'read'
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
                              disabled={updatingOrderStatus?.orderId === order.id || (userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees)}
                              className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees && order.status !== 'delivering'
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees && order.status === 'delivering'
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                  : order.status === 'delivering'
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
                              disabled={updatingOrderStatus?.orderId === order.id || (userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees)}
                              className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees && order.status !== 'delivered'
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : userType === 'employee' && isDelivery && !currentAdmin?.enableDeliveryEmployees && order.status === 'delivered'
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                  : order.status === 'delivered'
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
                          {userType === 'admin' && (currentAdmin?.enableDeliveryEmployees || currentAdmin?.showDeliveryEmployeesAnyway) && (
                            <div className="w-full md:flex-1 md:mx-2">
                              <select
                                value={assigningEmployee === order.id ? '' : ((order as any).assignedTo || '')}
                                onChange={(e) => handleAssignEmployee(order.id, e.target.value || null)}
                                disabled={assigningEmployee === order.id}
                                className={`w-full px-3  border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 transition-colors ${assigningEmployee === order.id ? 'opacity-50 cursor-wait' : ''
                                  }`}
                              >
                                {assigningEmployee === order.id ? (
                                  <option value="">جاري التعيين...</option>
                                ) : (
                                  <>
                                    <option value="">بدون عامل توصيل</option>
                                    <option value="ANY_DELIVERY">أي عامل يمكنه التوصيل</option>
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

                          {/* Spacer - لدفع زر المسح إلى اليسار عندما لا يظهر dropdown العمال */}
                          {userType === 'admin' && !(currentAdmin?.enableDeliveryEmployees || currentAdmin?.showDeliveryEmployeesAnyway) && (
                            <div className="hidden md:block md:flex-1"></div>
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
                              className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium transition ${deletingOrderId === order.id
                                ? 'bg-red-100 text-gray-400 cursor-not-allowed'
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
                      className={`px-3 py-2 rounded-lg font-semibold transition ${currentPage === page
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
            <h2 className="text-2xl font-bold mb-6 text-gray-800">إعدادات الطلبات</h2>

            {/* نموذج إعدادات التوصيل */}
            <form onSubmit={handleDeliverySubmit} className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">إعدادات طلبات التوصيل</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryFormData.isAcceptingOrders}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (checkPlan('الطلب عبر الموقع', 'basic')) {
                        setDeliveryFormData({ ...deliveryFormData, isAcceptingOrders: true });
                      }
                    } else {
                      setDeliveryFormData({ ...deliveryFormData, isAcceptingOrders: false });
                    }
                  }}
                  className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">تفعيل الطلب عبر الموقع</span>
                    {!isPlanActive('basic') && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">basic</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">سيظهر زر "اطلب الآن عبر الموقع" في السلة</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryFormData.isAcceptingOrdersViaWhatsapp}
                  onChange={(e) => setDeliveryFormData({ ...deliveryFormData, isAcceptingOrdersViaWhatsapp: e.target.checked })}
                  className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <div className="flex-1">
                  <span className="font-bold text-gray-800">تفعيل الطلب عبر واتساب</span>
                  <p className="text-xs text-gray-500 mt-0.5">سيظهر زر "اطلب من خلال واتساب" في السلة</p>
                </div>
              </label>

              {deliveryFormData.isAcceptingOrdersViaWhatsapp && (
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
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">مع كود الدولة بدون +</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-bold transition-colors"
              >
                حفظ إعدادات طلبات التوصيل
              </button>
            </form>

            <div className="border-t-2 border-gray-200 my-6"></div>

            {/* نموذج إعدادات الطاولات */}
            <form onSubmit={handleTableSettingsSubmit} className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">إعدادات طلبات الطاولة</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deliveryFormData.isAcceptingTableOrders}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (checkPlan('طلبات الطاولة', 'pro')) {
                        setDeliveryFormData({ ...deliveryFormData, isAcceptingTableOrders: true });
                      }
                    } else {
                      setDeliveryFormData({ ...deliveryFormData, isAcceptingTableOrders: false });
                    }
                  }}
                  className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">تفعيل طلبات الطاولة</span>
                    {!isPlanActive('pro') && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap">pro</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">للمطاعم - يمكن للعملاء الطلب من الطاولة مباشرة</p>
                </div>
              </label>

              {deliveryFormData.isAcceptingTableOrders && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    عدد الطاولات
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryFormData({
                        ...deliveryFormData,
                        tablesCount: Math.max(0, deliveryFormData.tablesCount - 1)
                      })}
                      className="w-9 h-9 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-lg transition-colors"
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
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setDeliveryFormData({
                        ...deliveryFormData,
                        tablesCount: deliveryFormData.tablesCount + 1
                      })}
                      className="w-9 h-9 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold text-lg transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">سيتم إنشاء رابط و QR كود لكل طاولة</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-bold transition-colors"
              >
                حفظ إعدادات طلبات الطاولة
              </button>
            </form>

            <div className="border-t-2 border-gray-200 my-6"></div>

            {/* قسم إعدادات العاملين */}
            <form onSubmit={handleEmployeeSettingsSubmit} className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800">إعدادات العاملين</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={employeeSettingsForm.enableDeliveryEmployees}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (checkPlan('إدارة عمال التوصيل', 'basic')) {
                        setEmployeeSettingsForm({ ...employeeSettingsForm, enableDeliveryEmployees: true });
                      }
                    } else {
                      setEmployeeSettingsForm({ ...employeeSettingsForm, enableDeliveryEmployees: false });
                    }
                  }}
                  className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">تفعيل عمال التوصيل</span>
                    {!isPlanActive('basic') && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">basic</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">سيتمكن العمال من التحكم في حالة طلبات التوصيل</p>
                </div>
              </label>

              {employeeSettingsForm.enableDeliveryEmployees && (
                <div className="mr-6 pr-4 border-r-2 border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    القيمة الافتراضية للطلبات الجديدة
                  </label>
                  <select
                    value={employeeSettingsForm.defaultDeliveryAssignment}
                    onChange={(e) => setEmployeeSettingsForm({ ...employeeSettingsForm, defaultDeliveryAssignment: e.target.value as 'ANY_DELIVERY' | '' })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">بدون عامل توصيل</option>
                    <option value="ANY_DELIVERY">أي عامل يمكنه التوصيل</option>
                  </select>
                </div>
              )}

              {!employeeSettingsForm.enableDeliveryEmployees && (
                <div className="mr-6 pr-4 border-r-2 border-gray-200 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={employeeSettingsForm.showDeliveryEmployeesAnyway}
                      onChange={(e) => setEmployeeSettingsForm({ ...employeeSettingsForm, showDeliveryEmployeesAnyway: e.target.checked })}
                      className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">إظهار عمال التوصيل في الطلبات رغم عدم التفعيل</span>
                  </label>

                  {employeeSettingsForm.showDeliveryEmployeesAnyway && (
                    <div className="mr-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        القيمة الافتراضية للطلبات الجديدة
                      </label>
                      <select
                        value={employeeSettingsForm.defaultDeliveryAssignment}
                        onChange={(e) => setEmployeeSettingsForm({ ...employeeSettingsForm, defaultDeliveryAssignment: e.target.value as 'ANY_DELIVERY' | '' })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="">بدون عامل توصيل</option>
                        <option value="ANY_DELIVERY">أي عامل يمكنه التوصيل</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={employeeSettingsForm.enableWaiters}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (checkPlan('إدارة الندلاء', 'pro')) {
                        setEmployeeSettingsForm({ ...employeeSettingsForm, enableWaiters: true });
                      }
                    } else {
                      setEmployeeSettingsForm({ ...employeeSettingsForm, enableWaiters: false });
                    }
                  }}
                  className="w-5 h-5 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">تفعيل الندلاء</span>
                    {!isPlanActive('pro') && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap">pro</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">سيتمكن الندلاء من التحكم في حالة طلبات الطاولة</p>
                </div>
              </label>

              <button
                type="submit"
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-bold transition-colors"
              >
                حفظ إعدادات العاملين
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
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={settingsFormData.name}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="الاسم الكامل"
                />
                <p className="text-xs text-gray-500 mt-1">اسمك الذي سيظهر في لوحة التحكم</p>
              </div>

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
                  placeholder="أهلا وسهلا بكم. نحن متخصصون في تقديم أفضل أنواع الـ.."
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
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Add/Edit Employee Form */}
            <div ref={employeeFormRef} className={`border-2 rounded-lg p-6 mb-8 ${editingEmployeeId ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                {editingEmployeeId ? 'تحديث عامل' : (
                  <>
                    إضافة عامل جديد
                    {!isPlanActive('basic') && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">basic</span>
                    )}
                  </>
                )}
              </h3>
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
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingEmployeeId ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                    placeholder="أدخل اسم العامل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اسم المستخدم {!editingEmployeeId && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={!editingEmployeeId}
                    disabled={!!editingEmployeeId}
                    value={employeeFormData.username}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, username: e.target.value })}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingEmployeeId ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:border-green-500'}`}
                    placeholder="اسم مستخدم للتسجيل"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingEmployeeId ? 'لا يمكن تغيير اسم المستخدم' : 'سيستخدمه العامل لتسجيل الدخول'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    رقم الهاتف <span className="text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    type="text"
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingEmployeeId ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                    placeholder="مثال: 05xxxxxxxx"
                  />
                </div>

                <ImageUploader
                  ref={employeeImageUploadRef}
                  deferUpload
                  currentImageUrl={editingEmployeeId ? (employeeFormData.imageUrl !== undefined ? employeeFormData.imageUrl : (employees.find(e => e.id === editingEmployeeId) as any)?.imageUrl) : (employeeFormData.imageUrl ?? undefined)}
                  onImageUploaded={(url) => setEmployeeFormData(prev => ({ ...prev, imageUrl: url }))}
                  onUploadStateChange={setIsUploadingEmployeePhoto}
                  label="صورة العامل (اختياري)"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {editingEmployeeId ? 'كلمة مرور جديدة' : 'كلمة المرور'} {!editingEmployeeId && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      required={!editingEmployeeId}
                      value={employeeFormData.password}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingEmployeeId ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                      placeholder={editingEmployeeId ? 'اتركه فارغاً للإبقاء على كلمة المرور الحالية' : 'كلمة المرور'}
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {editingEmployeeId ? 'تأكيد كلمة المرور الجديدة' : 'تأكيد كلمة المرور'} {!editingEmployeeId && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      required={!editingEmployeeId}
                      value={employeeFormData.confirmPassword}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, confirmPassword: e.target.value })}
                      className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none transition-colors ${editingEmployeeId ? 'focus:border-blue-500' : 'focus:border-green-500'}`}
                      placeholder={editingEmployeeId ? 'تأكيد كلمة المرور الجديدة' : 'تأكيد كلمة المرور'}
                      minLength={6}
                    />
                  </div>
                </div>

                {/* Employee Type Checkboxes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">نوع الموظف</label>
                  <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={employeeFormData.isDelivery}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, isDelivery: e.target.checked })}
                        className={`w-5 h-5 border-gray-300 rounded transition-all ${editingEmployeeId ? 'text-blue-600 focus:ring-blue-500' : 'text-green-600 focus:ring-green-500'}`}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">عامل توصيل</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={employeeFormData.isWaiter}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, isWaiter: e.target.checked })}
                        className={`w-5 h-5 border-gray-300 rounded transition-all ${editingEmployeeId ? 'text-blue-600 focus:ring-blue-500' : 'text-green-600 focus:ring-green-500'}`}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">نادل (طلبات الطاولة)</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isUploadingEmployeePhoto || isSubmittingEmployee}
                    className={`flex-1 py-3 px-4 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${editingEmployeeId
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                      }`}
                  >
                    {isUploadingEmployeePhoto ? 'جاري رفع الصورة...' : isSubmittingEmployee ? 'جاري الحفظ...' : editingEmployeeId ? 'تحديث' : 'إضافة العامل'}
                  </button>
                  {editingEmployeeId && (
                    <button
                      type="button"
                      onClick={handleCancelEditEmployee}
                      disabled={isUploadingEmployeePhoto || isSubmittingEmployee}
                      className="px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 bg-gray-200 hover:bg-gray-300 text-gray-700"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Employees List */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">العاملون ({totalEmployees})</h3>
              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">لا يوجد عاملون بعد</p>
                  <p className="text-gray-400 text-sm mt-2">أضف عامل من النموذج أعلاه</p>
                </div>
              ) : (
                <>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-center px-4 py-3 text-sm font-bold text-gray-700">الصورة</th>
                          <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">الاسم</th>
                          <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">رقم الهاتف</th>
                          <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">اسم المستخدم</th>
                          <th className="text-right px-4 py-3 text-sm font-bold text-gray-700">النوع</th>
                          <th className="text-center px-4 py-3 text-sm font-bold text-gray-700">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(new Map(employees.map(emp => [emp.id, emp])).values()).map((employee) => (
                          <tr key={employee.id} className={`border-t hover:bg-gray-50 ${editingEmployeeId === employee.id ? 'bg-blue-50' : ''}`}>
                            <td className="px-4 py-3 text-center">
                              {employee.imageUrl ? (
                                <img src={employee.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 mx-auto" />
                              ) : (
                                <span className="inline-flex w-10 h-10 rounded-full bg-gray-200 items-center justify-center text-gray-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-800 font-medium">{employee.name}</td>
                            <td className="px-4 py-3 text-gray-500 text-sm">{employee.phone ?? '—'}</td>
                            <td className="px-4 py-3 text-gray-500 text-sm">{employee.username}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 flex-wrap">
                                {employee.isDelivery && (
                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                    عامل توصيل
                                  </span>
                                )}
                                {employee.isWaiter && (
                                  <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                                    نادل
                                  </span>
                                )}
                                {!employee.isDelivery && !employee.isWaiter && (
                                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                                    غير محدد
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleEditEmployee(employee)}
                                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm transition"
                                >
                                  تحديث
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployee(employee.id)}
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
                  </div>

                  {/* Employee Pagination */}
                  {totalEmployees > employeesPerPage && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <button
                        onClick={() => setCurrentEmployeePage(prev => Math.max(1, prev - 1))}
                        disabled={currentEmployeePage === 1}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        السابق
                      </button>
                      <div className="flex gap-1 overflow-x-auto max-w-[200px] md:max-w-none scrollbar-hide">
                        {Array.from({ length: totalEmployeesPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentEmployeePage(page)}
                            className={`px-3 py-2 rounded-lg font-semibold transition flex-shrink-0 ${currentEmployeePage === page
                              ? 'bg-gray-800 text-white shadow-md'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentEmployeePage(prev => Math.min(totalEmployeesPages, prev + 1))}
                        disabled={currentEmployeePage === totalEmployeesPages}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        التالي
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Table Orders Tab */}
        {activeTab === 'tableOrders' && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">طلبات الطاولة</h2>
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
            {!currentAdmin?.isAcceptingTableOrders && tableOrders.length === 0 ? (
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
                                            disabled={updatingTableOrderStatus?.orderId === order.id || (userType === 'employee' && !currentAdmin?.enableWaiters)}
                                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${userType === 'employee' && !currentAdmin?.enableWaiters && (order.status || 'pending') !== 'pending'
                                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                              : userType === 'employee' && !currentAdmin?.enableWaiters && (order.status || 'pending') === 'pending' ?
                                                'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : (order.status || 'pending') === 'pending'
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
                                            disabled={updatingTableOrderStatus?.orderId === order.id || (userType === 'employee' && !currentAdmin?.enableWaiters)}
                                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${userType === 'employee' && !currentAdmin?.enableWaiters && order.status !== 'read'
                                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                              : userType === 'employee' && !currentAdmin?.enableWaiters && order.status === 'read' ?
                                                'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : order.status === 'read'
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
                                            disabled={updatingTableOrderStatus?.orderId === order.id || (userType === 'employee' && !currentAdmin?.enableWaiters)}
                                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${userType === 'employee' && !currentAdmin?.enableWaiters && order.status !== 'served'
                                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                              : userType === 'employee' && !currentAdmin?.enableWaiters && order.status === 'served' ?
                                                'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : order.status === 'served'
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
                                            disabled={updatingTableOrderStatus?.orderId === order.id || (userType === 'employee' && !currentAdmin?.enableWaiters)}
                                            className={`px-2 py-1 rounded-lg text-sm font-semibold transition ${userType === 'employee' && !currentAdmin?.enableWaiters && order.status !== 'completed'
                                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                              : userType === 'employee' && !currentAdmin?.enableWaiters && order.status === 'completed' ?
                                                'bg-gray-400 text-gray-600 cursor-not-allowed'
                                                : order.status === 'completed'
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
                                            className={`w-full md:w-auto px-4 py-2 rounded-lg text-sm font-medium transition ${deletingTableOrderId === order.id
                                              ? 'bg-red-100 text-gray-400 cursor-not-allowed'
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        featureName={lockedFeatureName}
        requiredPlan={requiredPlan}
        isExpired={isSubscriptionExpired}
      />

      <LimitReachedModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        title={limitModalConfig.title}
        message={limitModalConfig.message}
      />

      {/* بوب أب تنبيه: أحدهم حول الطلب الى هذه الحالة بالفعل (باقة البزنس) */}
      {alreadyInStatePopup.open && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl" onClick={() => setAlreadyInStatePopup(prev => ({ ...prev, open: false }))}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-amber-50 border-b border-amber-100 px-5 py-5 flex flex-col items-center justify-center text-center">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">تنبيه صغير</h3>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-center mb-5">
                <span className="block">أحدهم حول حالة الطلب <span className="font-semibold text-gray-800">#{alreadyInStatePopup.orderId.replace(/^order_/, '')}</span></span>
                <span className="block mt-1">إلى «<span className="font-semibold text-gray-800">{alreadyInStatePopup.statusLabel}</span>» بالفعل</span>
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAlreadyInStatePopup(prev => ({ ...prev, open: false }))}
                  className="w-full py-2.5 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-700 transition"
                >
                  حسناً فهمت
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') localStorage.setItem(HIDE_ALREADY_IN_STATE_POPUP, 'true');
                    setAlreadyInStatePopup(prev => ({ ...prev, open: false }));
                  }}
                  className="w-full py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  حسناً، لا تخبرني مجدداً حتى أسجّل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* بوب أب تنبيه: تأخير الحالة (كانت X وقد قمت بتغييرها إلى Y) - باقة البزنس - يظهر بعد إغلاق بوب أب "أحدهم حول..." إن كان الاثنان مطلوبين */}
      {!alreadyInStatePopup.open && statusDowngradePopup.open && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl" onClick={() => setStatusDowngradePopup(prev => ({ ...prev, open: false }))}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-amber-50 border-b border-amber-100 px-5 py-5 flex flex-col items-center justify-center text-center">
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">تنبيه صغير</h3>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-center mb-5">
                <span className="block">حالة الطلب <span className="font-semibold text-gray-800">#{statusDowngradePopup.orderId.replace(/^order_/, '')}</span> كانت «<span className="font-semibold text-gray-800">{statusDowngradePopup.previousStatusLabel}</span>»</span>
                <span className="block mt-1">وقد قمت بتأخيرها إلى «<span className="font-semibold text-gray-800">{statusDowngradePopup.newStatusLabel}</span>»</span>
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setStatusDowngradePopup(prev => ({ ...prev, open: false }))}
                  className="w-full py-2.5 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-700 transition"
                >
                  حسناً
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') localStorage.setItem(HIDE_STATUS_DOWNGRADE_POPUP, 'true');
                    setStatusDowngradePopup(prev => ({ ...prev, open: false }));
                  }}
                  className="w-full py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                >
                  حسناً، لا تخبرني مجدداً حتى أسجّل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
        <p className="text-gray-600 font-medium">جاري التحميل...</p>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
