import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Timeline as TimelineIcon,
  DirectionsCar as CarIcon,
  Home as CaravanIcon,
  Payment as PaymentIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  DirectionsCar as VehicleIcon,
  Scale as ScaleIcon,
  Assignment as AssignmentIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Settings,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsNone as NotificationsNoneIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { getUploadsUrl, getApiUrl } from '../utils/apiConfig';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Add a key for forcing re-renders
  const [renderKey, setRenderKey] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  // Force re-render when location changes
  useEffect(() => {
    setRenderKey(prev => prev + 1);
    console.log('Location changed to:', location.pathname);
  }, [location.pathname]);

  // Clear cache on mount and unmount
  useEffect(() => {
    queryClient.clear();
    return () => {
      queryClient.clear();
    };
  }, [queryClient]);

  // Monitor active tab changes and force re-render
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
    setRenderKey(prev => prev + 1);
  }, [activeTab]);

  // Map routes to tab indices
  const tabRoutes = [
    '/admin/overview',
    '/admin/users',
    '/admin/vehicles',
    '/admin/caravans',
    '/admin/weighs',
    '/admin/payments',
    '/admin/submissions',
    '/admin/reports',
    '/admin/settings'
  ];

  // Clear cache when component mounts to ensure fresh state
  useEffect(() => {
    // Clear any existing cache to ensure fresh data
    queryClient.clear();
  }, [queryClient]);

  // Use useEffect to handle route changes and sync tab state
  useEffect(() => {
    const tabIndex = tabRoutes.findIndex(route =>
      location.pathname.startsWith(route)
    );

    if (tabIndex >= 0) {
      setActiveTab(tabIndex);
    } else if (location.pathname === '/admin') {
      // Use setTimeout to defer navigation to avoid render conflicts
      const timer = setTimeout(() => {
        navigate(tabRoutes[0]);
      }, 0);
      return () => clearTimeout(timer);
    }
    console.log('Route changed to:', location.pathname);
    console.log('Current active tab index:', activeTab);
  }, [location.pathname, navigate, tabRoutes]);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Vehicle management states
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehiclePage, setVehiclePage] = useState(0);
  const [vehicleRowsPerPage, setVehicleRowsPerPage] = useState(10);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    series: '',
    variant: '',
    year: '',
    engine: '',
    transmission: '',
    tyreSize: '',
    subTank: false,
    brakes: '',
    registrationState: 'QLD',
    numberPlate: '',
    gvm: '',
    gcm: '',
    btc: '',
    tbm: '',
    frontAxleCapacity: '',
    rearAxleCapacity: '',
    bodyType: 'suv'
  });
  
  // Caravan management states
  const [caravanDialogOpen, setCaravanDialogOpen] = useState(false);
  const [selectedCaravan, setSelectedCaravan] = useState(null);
  const [caravanPage, setCaravanPage] = useState(0);
  const [caravanRowsPerPage, setCaravanRowsPerPage] = useState(10);
  const [caravanFormOpen, setCaravanFormOpen] = useState(false);
  const [newCaravan, setNewCaravan] = useState({
    make: '',
    model: '',
    variant: '',
    year: '',
    registrationState: 'QLD',
    numberPlate: '',
    length: '',
    atm: '',
    gtm: '',
    tbm: '',
    tbm2: '',
    axleGroupLoading: '',
    bodyType: 'caravan',
    axleCount: 1
  });

  // Weigh history states
  const [weighPage, setWeighPage] = useState(0);
  const [weighRowsPerPage, setWeighRowsPerPage] = useState(10);
  const [selectedWeigh, setSelectedWeigh] = useState(null);
  const [weighDetailDialogOpen, setWeighDetailDialogOpen] = useState(false);

  // Payment management states
  const [paymentPage, setPaymentPage] = useState(0);
  const [paymentRowsPerPage, setPaymentRowsPerPage] = useState(10);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentStatusDialogOpen, setPaymentStatusDialogOpen] = useState(false);
  const [paymentDetailsDialogOpen, setPaymentDetailsDialogOpen] = useState(false);

  // Submissions management states
  const [submissionPage, setSubmissionPage] = useState(0);
  const [submissionRowsPerPage, setSubmissionRowsPerPage] = useState(10);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissionDetailDialogOpen, setSubmissionDetailDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState('');

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [lastSubmissionCount, setLastSubmissionCount] = useState(0);
  const [notificationSound, setNotificationSound] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(false);

  // Ensure notifications is always an array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  // Fetch admin dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery(
    ['adminDashboard'],
    async () => {
      console.log('Fetching admin dashboard data...');
      console.log('User authenticated:', isAuthenticated, 'User type:', user?.userType);
      
      if (!isAuthenticated || user?.userType !== 'admin') {
        throw new Error('Not authenticated as admin');
      }
      
      const response = await axios.get('/api/admin/dashboard');
      console.log('Dashboard response:', response.data);
      return response.data.stats; // Backend returns data in 'stats' not 'data'
    },
    {
      enabled: isAuthenticated && user?.userType === 'admin',
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Calculate compliance dynamically using the same logic as getComplianceChip
  const calculateCompliance = (weigh) => {
    if (!weigh || !weigh.vehicleData || !weigh.caravanData) return false;
    
    // Calculate compliance dynamically based on actual data and limits
    const gvmOk = (weigh.vehicleWeightUnhitched || 0) <= (weigh.vehicleData?.gvm || 0);
    const tbmOk = (weigh.towBallWeight || 0) <= (weigh.vehicleData?.tbm || (weigh.caravanData?.atm * 0.1) || 0);
    const atmOk = ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0)) <= (weigh.caravanData?.atm || 0);
    const gcmOk = ((weigh.vehicleWeightUnhitched || 0) + ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0))) <= (weigh.vehicleData?.gcm || 0);
    
    // GTM check: GTM = Caravan weight on wheels
    const gtmOk = weigh.caravanData?.gtm > 0 ? 
      (weigh.caravanWeight || 0) <= (weigh.caravanData?.gtm || 0) : true;
    
    return gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
  };

  // Fetch all weighs for compliance calculation (not just paginated)
  const { data: allWeighsData } = useQuery(
    ['adminAllWeighs'],
    async () => {
      const response = await axios.get('/api/admin/weighs?page=1&limit=1000'); // Get all weighs
      return response.data;
    },
    {
      enabled: isAuthenticated && user?.userType === 'admin',
      staleTime: 60 * 1000, // Consider data stale after 1 minute
    }
  );

  // Calculate compliance statistics from all weighs data (same as Weigh History table)
  const totalWeighsDerived = dashboardData?.totalWeighs || 0;
  const compliantWeighs = allWeighsData?.weighs?.filter(weigh => calculateCompliance(weigh)).length || 0;
  const nonCompliantWeighs = totalWeighsDerived - compliantWeighs;

  // Fetch users data
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery(
    ['adminUsers', page, rowsPerPage],
    async () => {
      const response = await axios.get(`/api/admin/users?page=${page + 1}&limit=${rowsPerPage}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      retry: (failureCount, error) => {
        console.log('Users query retry attempt:', failureCount, 'Error:', error.message);
        return failureCount < 3;
      },
      onError: (error) => {
        console.error('Users query error:', error);
      }
    }
  );

  // Fetch vehicles data
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError } = useQuery(
    ['adminVehicles', vehiclePage, vehicleRowsPerPage],
    async () => {
      const response = await axios.get(`/api/admin/vehicles?page=${vehiclePage + 1}&limit=${vehicleRowsPerPage}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      retry: (failureCount, error) => {
        console.log('Vehicles query retry attempt:', failureCount, 'Error:', error.message);
        return failureCount < 3;
      },
      onError: (error) => {
        console.error('Vehicles query error:', error);
      }
    }
  );

  // Fetch caravans data
  const { data: caravansData, isLoading: caravansLoading, error: caravansError } = useQuery(
    ['adminCaravans', caravanPage, caravanRowsPerPage],
    async () => {
      const response = await axios.get(`/api/admin/caravans?page=${caravanPage + 1}&limit=${caravanRowsPerPage}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      retry: (failureCount, error) => {
        console.log('Caravans query retry attempt:', failureCount, 'Error:', error.message);
        return failureCount < 3;
      },
      onError: (error) => {
        console.error('Caravans query error:', error);
      }
    }
  );

  // Weigh history queries
  const { data: weighsData, isLoading: weighsLoading, error: weighsError } = useQuery(
    ['adminWeighs', weighPage, weighRowsPerPage],
    async () => {
      console.log('Fetching weighs data for page:', weighPage + 1, 'limit:', weighRowsPerPage);
      console.log('Auth token:', axios.defaults.headers.common['Authorization'] ? 'Present' : 'Missing');
      console.log('User authenticated:', isAuthenticated, 'User type:', user?.userType);
      
      if (!isAuthenticated || user?.userType !== 'admin') {
        throw new Error('Not authenticated as admin');
      }
      
      const response = await axios.get(`/api/admin/weighs?page=${weighPage + 1}&limit=${weighRowsPerPage}`);
      console.log('Weighs data response:', response.data);
      return response.data;
    },
    {
      enabled: isAuthenticated && user?.userType === 'admin',
      keepPreviousData: true,
      refetchOnWindowFocus: false, // Changed to false to match global config
      staleTime: 30 * 1000, // Consider data stale after 30 seconds
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: (failureCount, error) => {
        console.log('Weighs query retry attempt:', failureCount, 'Error:', error.message);
        return failureCount < 3;
      },
      onError: (error) => {
        console.error('Weighs query error:', error);
        console.error('Full error object:', error);
      }
    }
  );

  // Monitor authentication state
  useEffect(() => {
    console.log('AdminDashboard: User state changed', {
      isAuthenticated: user?.isAuthenticated,
      userType: user?.userType,
      hasToken: !!axios.defaults.headers.common['Authorization']
    });
    
    // If user is authenticated and we have a token, but queries are failing, try to refetch
    if (user?.isAuthenticated && axios.defaults.headers.common['Authorization']) {
      // Check if any queries have errors and refetch them
      if (weighsError || usersError || vehiclesError || caravansError) {
        console.log('Refetching queries due to authentication state change');
        queryClient.invalidateQueries();
      }
    }
  }, [user, weighsError, usersError, vehiclesError, caravansError, queryClient]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Reset state when component unmounts
      setSelectedUser(null);
      setSelectedVehicle(null);
      setSelectedCaravan(null);
      setSelectedWeigh(null);
      setUserDialogOpen(false);
      setVehicleDialogOpen(false);
      setCaravanDialogOpen(false);
      setWeighDetailDialogOpen(false);
      
      // Clear entire React Query cache to prevent stale data
      queryClient.clear();
    };
  }, [queryClient]);

  // Fetch payments data
  const { data: paymentsData, isLoading: paymentsLoading, error: paymentsError } = useQuery(
    ['adminPayments', paymentPage, paymentRowsPerPage],
    async () => {
      console.log('🔍 Fetching payments data...');
      const response = await axios.get(`/api/admin/payments?page=${paymentPage + 1}&limit=${paymentRowsPerPage}&t=${Date.now()}`);
      console.log('📊 Payments response:', response.data);
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 0, // Always consider data stale
      cacheTime: 0  // Don't cache
    }
  );

  // Fetch payment statistics
  const { data: paymentStats, error: paymentStatsError } = useQuery(
    ['adminPaymentStats'],
    async () => {
      const response = await axios.get('/api/admin/payment-stats');
      return response.data;
    }
  );

  // Fetch submissions data
  const { data: submissionsData, isLoading: submissionsLoading, error: submissionsError } = useQuery(
    ['adminSubmissions', submissionPage, submissionRowsPerPage],
    async () => {
      const response = await axios.get(`/api/submissions/pending?page=${submissionPage + 1}&limit=${submissionRowsPerPage}`);
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Fetch submission statistics
  const { data: submissionStats, error: submissionStatsError } = useQuery(
    ['adminSubmissionStats'],
    async () => {
      const response = await axios.get('/api/submissions/stats');
      return response.data;
    },
    {
      refetchInterval: 10000, // Check every 10 seconds for new submissions
      refetchIntervalInBackground: true, // Continue polling even when tab is not active
      staleTime: 5000, // Consider data stale after 5 seconds
    }
  );

  // Notification functions
  const playNotificationSound = () => {
    if (notificationSound) {
      try {
        const audio = new Audio('/notification.mp3'); // You can add a sound file to public folder
        audio.play().catch(e => console.log('Audio play failed:', e));
      } catch (error) {
        console.log('Audio not supported');
      }
    }
  };

  const showDesktopNotification = (title, body) => {
    if (desktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        });
      }
    }
  };

  const addNotification = (message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only last 10
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Check for new submissions and show notifications
  useEffect(() => {
    if (submissionStats?.data?.totalPending && submissionStats.data.totalPending > lastSubmissionCount) {
      if (lastSubmissionCount > 0) { // Don't show notification on initial load
        const newCount = submissionStats.data.totalPending - lastSubmissionCount;
        const message = `${newCount} new submission${newCount > 1 ? 's' : ''} require${newCount > 1 ? '' : 's'} approval`;
        
        addNotification(message, 'warning');
        playNotificationSound();
        showDesktopNotification('New Submissions', message);
        
        // Show immediate toast notification
        if (newCount > 0) {
          // Create a temporary toast notification
          const toastId = Date.now();
          const toastNotification = {
            id: toastId,
            message,
            type: 'warning',
            timestamp: new Date(),
            read: false
          };
          
          // Add to notifications and remove after 5 seconds
          setNotifications(prev => [toastNotification, ...prev]);
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== toastId));
          }, 5000);
        }
      }
      setLastSubmissionCount(submissionStats.data.totalPending);
    }
  }, [submissionStats?.data?.totalPending, lastSubmissionCount]);

  // Request desktop notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    console.log('Tab changed from', activeTab, 'to', newValue);
    console.log('User authenticated:', user?.isAuthenticated, 'User type:', user?.userType);
    
    // Navigate to the corresponding route
    navigate(tabRoutes[newValue]);
    
    // Force re-render
    setRenderKey(prev => prev + 1);
    
    // Check for errors in any tab and try to recover
    const hasErrors = weighsError || usersError || vehiclesError || caravansError;
    if (hasErrors) {
      console.log('Detected errors in queries, attempting to recover');
      queryClient.invalidateQueries();
    }
    
    // Only invalidate weighs queries if there's an error or if data is stale
    if (newValue === 4 && (weighsError || !weighsData)) {
      console.log('Switching to weigh history tab, invalidating queries due to error or missing data');
      console.log('Auth token present:', !!axios.defaults.headers.common['Authorization']);
      queryClient.invalidateQueries(['adminWeighs']);
    }
    
    // Invalidate payments queries when switching to payments tab
    if (newValue === 5) {
      console.log('Switching to payments tab, invalidating payments queries');
      queryClient.invalidateQueries(['adminPayments']);
    }
  };

  // User management mutations
  const updateUserMutation = useMutation(
    async ({ userId, userData }) => {
      const response = await axios.put(`/api/admin/users/${userId}`, userData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminUsers']);
        queryClient.invalidateQueries(['adminDashboard']);
        setUserDialogOpen(false);
        setSelectedUser(null);
      }
    }
  );

  const deleteUserMutation = useMutation(
    async (userId) => {
      await axios.delete(`/api/admin/users/${userId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminUsers']);
        queryClient.invalidateQueries(['adminDashboard']);
      }
    }
  );

  // Handle user update
  const handleUserUpdate = async (userData) => {
    setLoading(true);
    try {
      await updateUserMutation.mutateAsync({
        userId: selectedUser._id,
        userData
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle user delete
  const handleUserDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUserMutation.mutateAsync(userId);
    }
  };

  // Vehicle management mutations
  const updateVehicleMutation = useMutation(
    async ({ vehicleId, vehicleData }) => {
      const response = await axios.put(`/api/admin/vehicles/${vehicleId}`, vehicleData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminVehicles']);
        setVehicleDialogOpen(false);
      }
    }
  );

  const deleteVehicleMutation = useMutation(
    async (vehicleId) => {
      const response = await axios.delete(`/api/admin/vehicles/${vehicleId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminVehicles']);
      }
    }
  );

  const createVehicleMutation = useMutation(
    async (payload) => {
      const response = await axios.post('/api/vehicles', payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminVehicles']);
        setVehicleFormOpen(false);
        setNewVehicle({
          make: '', model: '', year: '', gvm: '', gcm: '', btc: '', tbm: '',
          frontAxleCapacity: '', rearAxleCapacity: '', bodyType: 'suv'
        });
      }
    }
  );

  // Caravan management mutations
  const updateCaravanMutation = useMutation(
    async ({ caravanId, caravanData }) => {
      const response = await axios.put(`/api/admin/caravans/${caravanId}`, caravanData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminCaravans']);
        setCaravanDialogOpen(false);
      }
    }
  );

  const deleteCaravanMutation = useMutation(
    async (caravanId) => {
      const response = await axios.delete(`/api/admin/caravans/${caravanId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminCaravans']);
      }
    }
  );

  const createCaravanMutation = useMutation(
    async (payload) => {
      const response = await axios.post('/api/caravans', payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminCaravans']);
        setCaravanFormOpen(false);
        setNewCaravan({
          make: '', model: '', variant: '', year: '', registrationState: 'QLD', length: '', atm: '', gtm: '', tbm: '', tbm2: '', axleGroupLoading: '',
          bodyType: 'caravan', axleCount: 1
        });
      }
    }
  );

  // Payment management mutations
  const updatePaymentStatusMutation = useMutation(
    async ({ paymentId, status }) => {
      const response = await axios.put(`/api/admin/payments/${paymentId}/status`, { status });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminPayments']);
        queryClient.invalidateQueries(['adminPaymentStats']);
        setPaymentStatusDialogOpen(false);
        setSelectedPayment(null);
      }
    }
  );

  // Submission management mutations
  const approveSubmissionMutation = useMutation(
    async ({ submissionId, type, reviewNotes }) => {
      const response = await axios.put(`/api/submissions/${type}/${submissionId}/approve`, { reviewNotes });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminSubmissions']);
        queryClient.invalidateQueries(['adminSubmissionStats']);
        setReviewDialogOpen(false);
        setSelectedSubmission(null);
        setReviewNotes('');
        setReviewAction('');
      }
    }
  );

  const rejectSubmissionMutation = useMutation(
    async ({ submissionId, type, reviewNotes }) => {
      const response = await axios.put(`/api/submissions/${type}/${submissionId}/reject`, { reviewNotes });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['adminSubmissions']);
        queryClient.invalidateQueries(['adminSubmissionStats']);
        setReviewDialogOpen(false);
        setSelectedSubmission(null);
        setReviewNotes('');
        setReviewAction('');
      }
    }
  );

  // Handle vehicle update
  const handleVehicleUpdate = async (vehicleData) => {
    setLoading(true);
    try {
      await updateVehicleMutation.mutateAsync({
        vehicleId: selectedVehicle._id,
        vehicleData
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle vehicle delete
  const handleVehicleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      await deleteVehicleMutation.mutateAsync(vehicleId);
    }
  };

  // Handle caravan update
  const handleCaravanUpdate = async (caravanData) => {
    setLoading(true);
    try {
      await updateCaravanMutation.mutateAsync({
        caravanId: selectedCaravan._id,
        caravanData
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle caravan delete
  const handleCaravanDelete = async (caravanId) => {
    if (window.confirm('Are you sure you want to delete this caravan?')) {
      await deleteCaravanMutation.mutateAsync(caravanId);
    }
  };

  // Handle payment status update
  const handlePaymentStatusUpdate = async (status) => {
    setLoading(true);
    try {
      await updatePaymentStatusMutation.mutateAsync({
        paymentId: selectedPayment._id,
        status
      });
    } finally {
      setLoading(false);
    }
  };

  // Get payment status chip
  const getPaymentStatusChip = (status) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'failed':
        return <Chip label="Failed" color="error" size="small" />;
      case 'refunded':
        return <Chip label="Refunded" color="info" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  // Get payment method chip
  const getPaymentMethodChip = (method) => {
    switch (method) {
      case 'card':
        return <Chip label="Card" color="primary" size="small" />;
      case 'cash':
        return <Chip label="Cash" color="secondary" size="small" />;
      case 'direct':
        return <Chip label="Direct" color="info" size="small" />;
      default:
        return <Chip label={method} color="default" size="small" />;
    }
  };

  // Handle export data
  const handleExportData = async (type) => {
    try {
      const response = await axios.get(`/api/admin/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Handle CSV import
  const handleCSVImport = async (type, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`/api/admin/${type}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        const imported = response.data.data?.imported || 0;
        const skipped = response.data.data?.skipped || 0;
        alert(`Import successful! ${imported} records imported, ${skipped} skipped.`);
        
        // Refresh data with more specific invalidation
        if (type === 'vehicles') {
          queryClient.invalidateQueries(['adminVehicles']);
          queryClient.refetchQueries(['adminVehicles']);
        } else if (type === 'caravans') {
          queryClient.invalidateQueries(['adminCaravans']);
          queryClient.refetchQueries(['adminCaravans']);
        }
        
        // Force component re-render to show updated data
        setRenderKey(prev => prev + 1);
      } else {
        alert('Import failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      alert('Import failed: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle file input change
  const handleFileInputChange = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      handleCSVImport(type, file);
    }
    // Reset input
    event.target.value = '';
  };

  // Download CSV template
  const downloadTemplate = async (type) => {
    try {
    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'vehicles':
        // Download from backend API instead of hardcoded content
        const response = await axios.get('/api/admin/vehicles/template', {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const blob = new Blob([response.data], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'vehicles_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
        filename = 'vehicles_template.csv';
        break;
      case 'caravans':
        // Download from backend API instead of hardcoded content
        const caravanResponse = await axios.get('/api/admin/caravans/template', {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const caravanBlob = new Blob([caravanResponse.data], { type: 'text/csv' });
        const caravanLink = document.createElement('a');
        caravanLink.href = URL.createObjectURL(caravanBlob);
        caravanLink.setAttribute('download', 'caravans_template.csv');
        document.body.appendChild(caravanLink);
        caravanLink.click();
        document.body.removeChild(caravanLink);
        return;
        filename = 'caravans_template.csv';
        break;
      case 'users':
        csvContent = 'name,email,phone,postcode,userType,businessName\nJohn Doe,john@example.com,+61412345678,2000,diy,\nJane Smith,jane@example.com,+61487654321,3000,professional,Smith Transport';
        filename = 'users_template.csv';
        break;
      default:
        return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Error downloading template. Please try again.');
    }
  };

  // Get user type chip
  const getUserTypeChip = (userType) => {
    switch (userType) {
      case 'professional':
        return <Chip label="Professional" color="primary" size="small" />;
      case 'diy':
        return <Chip label="DIY" color="secondary" size="small" />;
      case 'admin':
        return <Chip label="Admin" color="error" size="small" />;
      default:
        return <Chip label={userType} color="default" size="small" />;
    }
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'active':
        return <Chip label="Active" color="success" size="small" />;
      case 'inactive':
        return <Chip label="Inactive" color="error" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  // Get compliance chip - calculate dynamically based on actual data
  const getComplianceChip = (weigh) => {
    if (!weigh) return <Chip label="Unknown" color="default" size="small" />;
    
    // Calculate compliance dynamically based on actual data and limits
    const gvmOk = (weigh.vehicleWeightUnhitched || 0) <= (weigh.vehicleData?.gvm || 0);
    const tbmOk = (weigh.towBallWeight || 0) <= (weigh.vehicleData?.tbm || (weigh.caravanData?.atm * 0.1) || 0);
    const atmOk = ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0)) <= (weigh.caravanData?.atm || 0);
    const gcmOk = ((weigh.vehicleWeightUnhitched || 0) + ((weigh.caravanWeight || 0) + (weigh.towBallWeight || 0))) <= (weigh.vehicleData?.gcm || 0);
    
    // GTM check: GTM = Caravan weight on wheels
    const gtmOk = weigh.caravanData?.gtm > 0 ? 
      (weigh.caravanWeight || 0) <= (weigh.caravanData?.gtm || 0) : true;
    
    const overallOk = gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
    
    return overallOk ? 
      <Chip label="Compliant" color="success" size="small" icon={<CheckCircleIcon />} /> :
      <Chip label="Non-Compliant" color="error" size="small" icon={<ErrorIcon />} />;
  };

  // Handle download PDF (use existing report route)
  const handleDownloadPDF = async (weighId) => {
    try {
      const { data } = await axios.get(`/api/weighs/${weighId}`);
      const weigh = data?.weigh;
      if (!weigh) throw new Error('Weigh not found');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const green = [195, 230, 203];
      const yellow = [255, 244, 163];
      const red = [255, 205, 210];
      const grey = [240, 240, 240];
      const drawBox = (x, y, w, h, color) => { doc.setFillColor(color[0], color[1], color[2]); doc.rect(x, y, w, h, 'F'); doc.setDrawColor(0); doc.rect(x, y, w, h); };

      const comp = weigh.compliance || {}; const vehComp = comp.vehicle || {}; const cavComp = comp.caravan || {}; const combComp = comp.combination || {};
      const v = weigh.vehicle || weigh.vehicleData || {}; const c = weigh.caravan || weigh.caravanData || {}; const w = weigh.weights || {};
      const vehicleOnly = vehComp.gvm?.actual ?? (w.totalVehicle || weigh.vehicleWeightUnhitched || 0);
      const caravanOnly = cavComp.gtm?.actual ?? (w.totalCaravan || weigh.caravanWeight || 0);
      const gvmAttached = combComp.gcm?.actual ?? (w.grossCombination || 0);
      const tbm = w.tbm || weigh.towBallWeight || Math.max(0, gvmAttached - vehicleOnly);
      const measuredATM = cavComp.atm?.actual ?? (caravanOnly + tbm);
      const gtmMeasured = cavComp.gtm?.actual ?? caravanOnly;
      const gcmMeasured = combComp.gcm?.actual ?? (vehicleOnly + measuredATM);
      const gvmLimit = vehComp.gvm?.limit ?? (v.gvm || 0);
      const gcmLimit = combComp.gcm?.limit ?? (v.gcm || 0);
      const btcLimit = v.btc || 0; const tbmLimit = v.tbm || (c.atm ? (c.atm || 0) * 0.1 : 0);
      const atmLimit = cavComp.atm?.limit ?? (c.atm || 0); const gtmLimit = cavComp.gtm?.limit ?? (c.gtm || 0);
      const statusText = (measured, limit) => measured <= limit ? 'OK' : 'OVER';
      const statusColor = (measured, limit) => measured <= limit ? green : red;

      doc.setFontSize(18); doc.text('WeighBuddy • Detailed Compliance Report', 10, 15);
      doc.setFontSize(11); doc.text(`Report ID: ${weigh._id || '-'}`, 10, 22); doc.text(`Date: ${weigh.createdAt ? new Date(weigh.createdAt).toLocaleDateString('en-AU') : '-'}`, 90, 22); doc.text(`Customer: ${weigh.customer?.name || weigh.customerName || 'DIY User'}`, 170, 22);

      const startX = 10; const startY = 35; const colW = 40; const gap = 6;
      const drawMetric = (label, measured, limit, x) => { drawBox(x, startY, colW, 8, grey); doc.setFontSize(11); doc.text(label, x + 3, startY + 5.5); drawBox(x, startY + 9, colW, 9, yellow); doc.setFontSize(10); doc.text(`Compliance: ${limit || 0}`, x + 3, startY + 15); drawBox(x, startY + 19, colW, 9, grey); doc.text(`Measured: ${Math.round(measured)}`, x + 3, startY + 25); const diff = (limit || 0) - (measured || 0); drawBox(x, startY + 29, colW, 9, statusColor(measured || 0, limit || 0)); doc.text(`Result: ${diff}`, x + 3, startY + 35); doc.text(statusText(measured || 0, limit || 0), x + colW - 10, startY + 35); };

      const frontAxleMeasured = vehComp.frontAxle?.actual ?? (w.frontAxle || 0); const frontAxleLimit = vehComp.frontAxle?.limit ?? 0; const rearAxleMeasured = vehComp.rearAxle?.actual ?? (w.rearAxle || 0); const rearAxleLimit = vehComp.rearAxle?.limit ?? 0;
      let x = startX; drawMetric('Front Axle', frontAxleMeasured, frontAxleLimit, x); x += colW + gap; drawMetric('GVM', vehicleOnly, gvmLimit, x); x += colW + gap; drawMetric('Rear Axle', rearAxleMeasured, rearAxleLimit, x); x += colW + gap; drawMetric('TBM', tbm, tbmLimit, x); x += colW + gap; drawMetric('GCM', gcmMeasured, gcmLimit, x); x += colW + gap; drawMetric('GTM', gtmMeasured, gtmLimit, x); x += colW + gap;

      const axlesX = x; const axlesY = startY; const axlesW = colW; drawBox(axlesX, axlesY, axlesW, 8, grey); doc.setFontSize(11); doc.text('Axles', axlesX + 3, axlesY + 5.5); const cavFront = cavComp.frontAxleGroup?.actual ?? (w.frontAxleGroup || 0); const cavRear = cavComp.rearAxleGroup?.actual ?? (w.rearAxleGroup || 0); drawBox(axlesX, axlesY + 9, axlesW, 9, yellow); doc.setFontSize(10); doc.text(`${Math.round(cavFront)}   ${Math.round(cavRear)}`, axlesX + 3, axlesY + 15); drawBox(axlesX, axlesY + 19, axlesW, 9, grey); doc.text('Measured', axlesX + 3, axlesY + 25); drawBox(axlesX, axlesY + 29, axlesW, 9, green); doc.text('OK', axlesX + axlesW - 10, axlesY + 35); x += colW + gap;

      drawMetric('ATM', measuredATM, atmLimit, x); x += colW + gap; drawMetric('BTC', gtmMeasured, btcLimit, x); x += colW + gap;

      const advisoryX = startX; const advisoryY = startY + 42; const advisoryW = 2 * colW + gap; drawBox(advisoryX, advisoryY, advisoryW, 36, grey); doc.setFontSize(11); doc.text('Advisory Only', advisoryX + 3, advisoryY + 6); const vanToCar = vehicleOnly > 0 ? Math.round((caravanOnly / vehicleOnly) * 100) : 0; const tbmPct = atmLimit > 0 ? Math.round((tbm / atmLimit) * 100) : 0; doc.setFontSize(10); doc.text(`Van to Car Ratio <85%   ${vanToCar}%`, advisoryX + 3, advisoryY + 14); doc.text(`Tow Ball % 8 to 10%     ${tbmPct}%`, advisoryX + 3, advisoryY + 21); const possibleSpare = Math.max(0, atmLimit - measuredATM); doc.text(`Actual Axle Group      ${gtmMeasured}`, advisoryX + 3, advisoryY + 28); doc.text(`Possible Spare Capacity ${possibleSpare}`, advisoryX + 3, advisoryY + 35);
      const btcPanelX = advisoryX + advisoryW + gap; drawBox(btcPanelX, advisoryY, colW + 10, 36, grey); doc.setFontSize(11); doc.text('Advisory BTC Ratio', btcPanelX + 3, advisoryY + 6); const btcRatio = btcLimit > 0 ? Math.round((gtmMeasured / btcLimit) * 100) : 0; doc.setFontSize(10); doc.text('IDEAL < 80%', btcPanelX + 3, advisoryY + 14); doc.text(`${btcRatio}%`, btcPanelX + 3, advisoryY + 22);
      const defsX = btcPanelX + (colW + 10) + gap; const defsW = 260 - defsX; drawBox(defsX, advisoryY, defsW, 36, grey); doc.setFontSize(9); doc.text('IMPORTANT', defsX + 3, advisoryY + 6); doc.text('Information provided is true and correct at the time of weighing.', defsX + 3, advisoryY + 12); doc.text('This document is advisory only and cannot be used for licensing or insurance purposes.', defsX + 3, advisoryY + 17); doc.text('Resolve any overloading issues before driving the vehicle further.', defsX + 3, advisoryY + 22);
      doc.setFontSize(9); const legendY = advisoryY + 40; doc.text('(GVM) Gross Vehicle Mass: laden vehicle weight as measured under its wheels.', 10, legendY); doc.text('(TBM) Tow Ball Mass: weight imposed on the tow vehicle by coupling.', 10, legendY + 5); doc.text('(GTM) Gross Trailer Mass: weight of the laden caravan on its wheels.', 10, legendY + 10); doc.text('(ATM) Aggregate Trailer Mass: total of caravan including TBM.', 10, legendY + 15); doc.text('(GCM) Gross Combined Mass: total weight of both tow vehicle and caravan.', 10, legendY + 20); doc.text('(BTC) Braked Towing Capacity: maximum weight allowed to tow as per vehicle.', 10, legendY + 25);

      doc.save(`weigh-report-${weighId}.pdf`);
    } catch (error) {
      alert('Failed to download PDF report.');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading dashboard: {error.message}
      </Alert>
    );
  }

  // Add authentication check after all hooks are declared
  if (!user || !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box key={`admin-dashboard-${renderKey}-${location.pathname}`} sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
            <Typography variant="h4" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              System overview and management
            </Typography>
          </Box>
          
          {/* Quick Stats - Pending Approval Count */}
          {submissionStats?.data?.totalPending > 0 && (
            <Chip
              icon={<WarningIcon />}
              label={`${submissionStats.data.totalPending} Pending Approval`}
              color="warning"
              variant="outlined"
              sx={{ fontWeight: 'bold', cursor: 'pointer' }}
              onClick={() => {
                console.log('🚀 Quick Stats Chip clicked - navigating to Data Submissions');
                // Navigate to Data Submissions tab (index 6)
                setActiveTab(6);
                navigate('/admin/submissions');
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#fff3cd';
                e.target.style.borderColor = '#ffc107';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.borderColor = '#ffc107';
              }}
            />
          )}
        </Box>
      </motion.div>

      {/* Global Error Alert */}
      {(weighsError || usersError || vehiclesError || caravansError) && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                console.log('Refreshing all queries due to errors');
                queryClient.invalidateQueries();
              }}
            >
              Refresh All
            </Button>
          }
        >
          Some data failed to load. Click "Refresh All" to retry.
        </Alert>
      )}

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="admin dashboard tabs"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 64 }}
        >
          <Tab 
            icon={<DashboardIcon />} 
            label="Overview" 
            iconPosition="start"
          />
          <Tab 
            icon={<PeopleIcon />} 
            label="User Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<CarIcon />} 
            label="Vehicle Database" 
            iconPosition="start"
          />
          <Tab 
            icon={<CaravanIcon />} 
            label="Caravan Database" 
            iconPosition="start"
          />
          <Tab 
            icon={<HistoryIcon />} 
            label="Weigh History" 
            iconPosition="start"
          />
          <Tab 
            icon={<PaymentIcon />} 
            label="Payment Management" 
            iconPosition="start"
          />
          <Tab 
            icon={
              <Box sx={{ position: 'relative' }}>
                <AssignmentIcon />
                {submissionStats?.data?.totalPending > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      backgroundColor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      border: '2px solid white'
                    }}
                  >
                    {submissionStats.data.totalPending > 99 ? '99+' : submissionStats.data.totalPending}
                  </Box>
                )}
              </Box>
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Data Submissions
                {submissionStats?.data?.totalPending > 0 && (
                  <Chip
                    label={`${submissionStats.data.totalPending} Pending`}
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            }
            iconPosition="start"
            sx={{ 
              minWidth: 'auto',
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          />
          <Tab 
            icon={<AssessmentIcon />} 
            label="Reports" 
            iconPosition="start"
          />
          <Tab 
            icon={<Settings />} 
            label="Settings" 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
                          {location.pathname === '/admin' || location.pathname === '/admin/overview' ? (
            <Box key={`overview-${renderKey}`}>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {dashboardData?.totalUsers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Weighs</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {totalWeighsDerived}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Weigh entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Compliant</Typography>
              </Box>
              <Typography variant="h4" color="success">
                {compliantWeighs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Compliant weighs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Non-Compliant</Typography>
              </Box>
              <Typography variant="h4" color="warning">
                {nonCompliantWeighs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Non-compliant weighs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

          {/* Recent Activity */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
        <Typography variant="h6" gutterBottom>
                Recent Activity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                Dashboard overview content will be displayed here.
                  </Typography>
                </CardContent>
              </Card>
                  </Box>
                ) : location.pathname === '/admin/users' ? (
            <Box key={`users-${renderKey}`}>
          {/* User Management Content */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">User Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedUser({});
              setUserDialogOpen(true);
            }}
          >
            Add User
          </Button>
        </Box>

          {usersError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading users: {usersError.message}
            </Alert>
          )}

          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                <TableCell>User Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                    {usersData?.users?.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                  <TableCell>
                          {getUserTypeChip(user.userType)}
                  </TableCell>
                  <TableCell>
                          {getStatusChip(user.isActive === false ? 'inactive' : 'active')}
                  </TableCell>
                  <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setUserDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleUserDelete(user._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
          component="div"
                count={usersData?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
            </Card>
          )}
        </Box>
                ) : location.pathname === '/admin/vehicles' ? (
            <Box key={`vehicles-${renderKey}`}>
          {/* Vehicle Management Content */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Vehicle Database</Typography>
            <Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ mr: 1 }}
                  onClick={() => setVehicleFormOpen(true)}
                >
                  Add Vehicle
                </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => downloadTemplate('vehicles')}
                sx={{ mr: 1 }}
              >
                Download Template
              </Button>
          <Button
            variant="contained"
                component="label"
            startIcon={<AddIcon />}
              >
                Import Vehicles
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={(e) => handleFileInputChange('vehicles', e)}
                />
          </Button>
            </Box>
        </Box>

          {vehiclesError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading vehicles: {vehiclesError.message}
            </Alert>
          )}

          {vehiclesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Card>
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 80 }}>Make</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Model</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Series</TableCell>
                <TableCell sx={{ minWidth: 60 }}>Year</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Variant</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Engine</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Transmission</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Tyre Size</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Sub Tank</TableCell>
                <TableCell sx={{ minWidth: 80 }}>FAWR (kg)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>RAWR (kg)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>GVM (kg)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>BTC (kg)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>TBM (kg)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>GCM (kg)</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                    {vehiclesData?.data?.vehicles?.map((vehicle) => (
                      <TableRow key={vehicle._id}>
                  <TableCell>{vehicle.make}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.series || 'N/A'}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.variant || 'N/A'}</TableCell>
                  <TableCell>{vehicle.engine || 'N/A'}</TableCell>
                  <TableCell>{vehicle.transmission || 'N/A'}</TableCell>
                  <TableCell>{vehicle.tyreSize || 'N/A'}</TableCell>
                  <TableCell>{vehicle.hasSubTank ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{vehicle.fawr || 'N/A'}</TableCell>
                  <TableCell>{vehicle.rawr || 'N/A'}</TableCell>
                  <TableCell>{vehicle.gvm}</TableCell>
                  <TableCell>{vehicle.btc}</TableCell>
                  <TableCell>{vehicle.tbm || 'N/A'}</TableCell>
                  <TableCell>{vehicle.gcm}</TableCell>
                  <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setVehicleDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleVehicleDelete(vehicle._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={vehiclesData?.total || 0}
                rowsPerPage={vehicleRowsPerPage}
          page={vehiclePage}
          onPageChange={(event, newPage) => setVehiclePage(newPage)}
          onRowsPerPageChange={(event) => {
            setVehicleRowsPerPage(parseInt(event.target.value, 10));
            setVehiclePage(0);
          }}
        />
            </Card>
          )}
        </Box>
                        ) : location.pathname === '/admin/caravans' ? (
            <Box key={`caravans-${renderKey}`}>
            {/* Caravan Management Content */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">Caravan Database</Typography>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ mr: 1 }}
                  onClick={() => setCaravanFormOpen(true)}
                >
                  Add Caravan
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadTemplate('caravans')}
                  sx={{ mr: 1 }}
                >
                  Download Template
                </Button>
          <Button
            variant="contained"
                  component="label"
            startIcon={<AddIcon />}
                >
                  Import Caravans
                  <input
                    type="file"
                    hidden
                    accept=".csv"
                    onChange={(e) => handleFileInputChange('caravans', e)}
                  />
          </Button>
              </Box>
        </Box>

            {caravansError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading caravans: {caravansError.message}
              </Alert>
            )}

            {caravansLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Card>
        <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 80 }}>Make</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Model</TableCell>
                <TableCell sx={{ minWidth: 60 }}>Year</TableCell>
                <TableCell sx={{ minWidth: 80 }}>ATM (kg)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>GTM (kg)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Axle Capacity (kg)</TableCell>
                <TableCell sx={{ minWidth: 80 }}>Number of Axles</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                      {caravansData?.data?.caravans?.map((caravan) => (
                        <TableRow key={caravan._id}>
                  <TableCell>{caravan.make}</TableCell>
                  <TableCell>{caravan.model}</TableCell>
                  <TableCell>{caravan.year}</TableCell>
                  <TableCell>{caravan.atm}</TableCell>
                  <TableCell>{caravan.gtm}</TableCell>
                  <TableCell>{caravan.axleCapacity}</TableCell>
                  <TableCell>{caravan.numberOfAxles}</TableCell>
                  <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedCaravan(caravan);
                            setCaravanDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCaravanDelete(caravan._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={caravansData?.total || 0}
                  rowsPerPage={caravanRowsPerPage}
          page={caravanPage}
          onPageChange={(event, newPage) => setCaravanPage(newPage)}
          onRowsPerPageChange={(event) => {
            setCaravanRowsPerPage(parseInt(event.target.value, 10));
            setCaravanPage(0);
          }}
        />
              </Card>
            )}
          </Box>
                        ) : location.pathname === '/admin/weighs' ? (
            <Box key={`weighs-${renderKey}`}>
            {/* Weigh History Content */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">Weigh History</Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportData('weighs')}
              >
                Export Data
              </Button>
            </Box>

            {weighsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading weighs: {weighsError.message}
              </Alert>
            )}

            {weighsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>User Type</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Caravan</TableCell>
                        <TableCell>Total Weight</TableCell>
                        <TableCell>Compliance</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {weighsData?.weighs?.length > 0 ? (
                        weighsData.weighs.map((weigh) => (
                          <TableRow key={weigh._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon sx={{ mr: 1, fontSize: 'small' }} />
                                {new Date(weigh.createdAt).toLocaleDateString('en-AU', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1, fontSize: 'small' }} />
                                {weigh.customer?.name || weigh.customerName || 'N/A'}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {weigh.userId?.email || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {getUserTypeChip(weigh.userId?.userType || 'N/A')}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <VehicleIcon sx={{ mr: 1, fontSize: 'small' }} />
                                {weigh.vehicleData?.make} {weigh.vehicleData?.model} ({weigh.vehicleData?.numberPlate})
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CaravanIcon sx={{ mr: 1, fontSize: 'small' }} />
                                {weigh.caravanData?.make} {weigh.caravanData?.model} ({weigh.caravanData?.numberPlate})
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {parseFloat((weigh.vehicleWeightHitched || 0) + (weigh.caravanWeight || 0)).toFixed(1)}kg
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {getComplianceChip(weigh)}
                            </TableCell>
                            <TableCell>
                              {getStatusChip(weigh.status)}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      console.log('Dialog selectedWeigh:', weigh);
                                      console.log('Dialog complianceResults:', weigh.complianceResults);
                                      setSelectedWeigh(weigh);
                                      setWeighDetailDialogOpen(true);
                                    }}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Download Report">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDownloadPDF(weigh._id)}
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No weigh entries found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                No weigh entries have been created yet.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={weighsData?.total || 0}
                  rowsPerPage={weighRowsPerPage}
                  page={weighPage}
                  onPageChange={(event, newPage) => setWeighPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setWeighRowsPerPage(parseInt(event.target.value, 10));
                    setWeighPage(0);
                  }}
                />
              </Card>
            )}
          </Box>
                        ) : location.pathname === '/admin/payments' ? (
            <Box key={`payments-${renderKey}`}>
            {/* Payment Management Content */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
              <Typography variant="h4">Payment Management</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage payments for weigh compliance services
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    console.log('🔄 Manually refreshing payments data...');
                    queryClient.invalidateQueries(['adminWeighs']);
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportData('payments')}
                >
                  Export Data
                </Button>
              </Box>
            </Box>

            {weighsError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading payments: {weighsError.message}
              </Alert>
            )}

            {weighsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Card>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {weighsData?.weighs?.length > 0 ? (
                        weighsData.weighs.map((payment) => (
                        <TableRow key={payment._id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1, fontSize: 'small' }} />
                                {payment.customerName || 'N/A'}
                              </Box>
                            </TableCell>
                                                      <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <ScaleIcon sx={{ mr: 1, mt: 0.5, fontSize: 'small', color: 'primary.main' }} />
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="body2" fontWeight="medium" color="primary.main">
                                  Caravan Weigh Compliance Service
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  <strong>Vehicle:</strong> {payment.vehicleData?.make} {payment.vehicleData?.model} {payment.vehicleData?.year}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  <strong>Caravan:</strong> {payment.caravanData?.make} {payment.caravanData?.model} {payment.caravanData?.year}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  <strong>Service ID:</strong> #{payment._id?.slice(-8)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  <strong>Compliance Status:</strong> {(() => {
                                    // Calculate compliance dynamically based on actual data and limits
                                    const gvmOk = (payment.vehicleWeightUnhitched || 0) <= (payment.vehicleData?.gvm || 0);
                                    const tbmOk = (payment.towBallWeight || 0) <= (payment.vehicleData?.tbm || (payment.caravanData?.atm * 0.1) || 0);
                                    const atmOk = (payment.caravanWeight || 0) <= (payment.caravanData?.atm || 0);
                                    const gcmOk = ((payment.vehicleWeightUnhitched || 0) + (payment.caravanWeight || 0)) <= (payment.vehicleData?.gcm || 0);
                                    
                                    // GTM check: Calculate based on actual GTM limit if available
                                    const calculatedGTM = (payment.caravanWeight || 0) - (payment.towBallWeight || 0);
                                    const gtmOk = payment.caravanData?.gtm > 0 ? 
                                      calculatedGTM <= (payment.caravanData?.gtm || 0) : true;
                                    
                                    const overallOk = gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
                                    
                                    return overallOk ? (
                                      <Chip 
                                        label="Compliant" 
                                        size="small" 
                                        color="success" 
                                        sx={{ height: 16, fontSize: '0.7rem', ml: 0.5 }}
                                      />
                                    ) : (
                                      <Chip 
                                        label="Non-Compliant" 
                                        size="small" 
                                        color="error" 
                                        sx={{ height: 16, fontSize: '0.7rem', ml: 0.5 }}
                                      />
                                    );
                                  })()}
                                </Typography>
                                {payment.vehicleWeightHitched && payment.caravanWeight && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    <strong>Total Weight:</strong> {(payment.vehicleWeightHitched + payment.caravanWeight)}kg
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  <strong>User Type:</strong> {payment.userId?.userType?.toUpperCase() || 'N/A'}
                                  {payment.reportUrl && (
                                    <Chip 
                                      label="Report Generated" 
                                      size="small" 
                                      color="info" 
                                      variant="outlined"
                                      sx={{ height: 16, fontSize: '0.7rem', ml: 1 }}
                                    />
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium" color="success.main">
                                ${payment.payment?.amount?.toFixed(2)}
                              </Typography>
                            </TableCell>
                          <TableCell>
                            {getPaymentStatusChip(payment.payment?.status)}
                          </TableCell>
                          <TableCell>
                            {getPaymentMethodChip(payment.payment?.method)}
                          </TableCell>
                          <TableCell>
                              <Typography variant="body2">
                                {new Date(payment.createdAt).toLocaleDateString('en-AU', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      console.log('=== FRONTEND DEBUG ===');
                                      console.log('Payment object received:', payment);
                                      console.log('Vehicle data:', payment.vehicleData);
                                      console.log('Caravan data:', payment.caravanData);
                                      console.log('=== END DEBUG ===');
                                      setSelectedPayment(payment);
                                      setPaymentDetailsDialogOpen(true);
                                    }}
                                  >
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Update Status">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setPaymentStatusDialogOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                                </Tooltip>
                              </Box>
                          </TableCell>
                        </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" color="text.secondary" gutterBottom>
                                No payment records found
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Payment records for caravan weigh compliance services will appear here.
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Each payment represents a completed weigh compliance check service.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={weighsData?.total || 0}
                  rowsPerPage={weighRowsPerPage}
                  page={weighPage}
                  onPageChange={(event, newPage) => setWeighPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setWeighRowsPerPage(parseInt(event.target.value, 10));
                    setWeighPage(0);
                  }}
                />
              </Card>
            )}
          </Box>
                ) : location.pathname === '/admin/submissions' ? (
            <Box key={`submissions-${renderKey}`}>
              {/* Submissions Management Content */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h4">Data Submissions for Review</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review and approve/reject DIY user submissions
                  </Typography>
                </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`${submissionStats?.data?.totalPending || 0} Pending`} 
                  color="warning" 
                  variant="outlined"
                />
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={async () => {
                    try {
                      // Get all pending submissions
                      const response = await axios.get('/api/submissions/pending?page=1&limit=50');
                      const vehicleSubmissions = response.data?.data?.vehicles || [];
                      const caravanSubmissions = response.data?.data?.caravans || [];
                      
                      if (vehicleSubmissions.length === 0 && caravanSubmissions.length === 0) {
                        alert('No pending submissions to clear.');
                        return;
                      }
                      
                      if (window.confirm(`This will delete ${vehicleSubmissions.length} vehicle and ${caravanSubmissions.length} caravan submissions from the database. Are you sure?`)) {
                        // Delete submissions with undefined values from database
                        for (const submission of vehicleSubmissions) {
                          if (submission.numberPlate === 'UNDEFINED' || submission.state === 'UNDEFINED') {
                            try {
                              await axios.delete(`/api/submissions/vehicle/${submission._id}`);
                              console.log('Deleted corrupted vehicle submission:', submission._id);
                            } catch (error) {
                              console.error('Error deleting vehicle submission:', error);
                            }
                          }
                        }
                        
                        for (const submission of caravanSubmissions) {
                          if (submission.numberPlate === 'UNDEFINED' || submission.state === 'UNDEFINED') {
                            try {
                              await axios.delete(`/api/submissions/caravan/${submission._id}`);
                              console.log('Deleted corrupted caravan submission:', submission._id);
                            } catch (error) {
                              console.error('Error deleting caravan submission:', error);
                            }
                          }
                        }
                        
                        alert('Corrupted submissions deleted from database. You can now submit new vehicle and caravan data.');
                        
                        // Refresh the data
                        queryClient.invalidateQueries(['adminSubmissions']);
                        queryClient.invalidateQueries(['adminSubmissionStats']);
                      }
                    } catch (error) {
                      console.error('Error clearing submissions:', error);
                      alert('Error clearing submissions. Check console for details.');
                    }
                  }}
                >
                  Delete Corrupted Submissions
                </Button>
              </Box>
              </Box>

              {submissionsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Error loading submissions: {submissionsError.message}
                </Alert>
              )}

              {submissionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : !submissionsData || !submissionsData.data ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No submission data available
                  </Typography>
                </Box>
              ) : (
                <Card>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Vehicle/Caravan Details</TableCell>
                          <TableCell>Number Plate</TableCell>
                          <TableCell>Compliance Ratings</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const vehicleSubmissions = submissionsData?.data?.vehicles || [];
                          const caravanSubmissions = submissionsData?.data?.caravans || [];
                          const hasSubmissions = vehicleSubmissions.length > 0 || caravanSubmissions.length > 0;
                          
                          if (!hasSubmissions) {
                            return (
                              <TableRow>
                                <TableCell colSpan={7} align="center">
                                  <Typography variant="body2" color="text.secondary">
                                    No pending submissions found
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          }
                          
                          return (
                            <>
                              {/* Vehicle Submissions */}
                              {vehicleSubmissions.filter(submission => submission && submission.vehicleData).map((submission) => (
                                <TableRow key={`vehicle-${submission._id}`}>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {submission.submittedBy?.name || 'N/A'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {submission.submittedBy?.email || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label="Vehicle" color="primary" size="small" />
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {submission.vehicleData?.make || 'N/A'} {submission.vehicleData?.model || 'N/A'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {submission.vehicleData?.year || 'N/A'} • {submission.vehicleData?.variant || 'N/A'}
                                      </Typography>
                                      {submission.vehicleData?.series && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          Series: {submission.vehicleData.series}
                                        </Typography>
                                      )}
                                      {submission.vehicleData?.engine && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                          Engine: {submission.vehicleData.engine}
                                        </Typography>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {submission.numberPlate || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {submission.state || 'N/A'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="caption" display="block">
                                        GVM: {submission.vehicleData?.gvm || 'N/A'}kg
                                      </Typography>
                                      <Typography variant="caption" display="block">
                                        GCM: {submission.vehicleData?.gcm || 'N/A'}kg
                                      </Typography>
                                      <Typography variant="caption" display="block">
                                        BTC: {submission.vehicleData?.btc || 'N/A'}kg
                                      </Typography>
                                      <Typography variant="caption" display="block">
                                        FAWR: {submission.vehicleData?.fawr || 'N/A'}kg
                                      </Typography>
                                      <Typography variant="caption" display="block">
                                        RAWR: {submission.vehicleData?.rawr || 'N/A'}kg
                                      </Typography>
                                    </Box>
                                  </TableCell>

                                  <TableCell>
                                    <Typography variant="caption" display="block">
                                      {new Date(submission.createdAt).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(submission.createdAt).toLocaleTimeString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => {
                                          setSelectedSubmission({ ...submission, type: 'vehicle' });
                                          setSubmissionDetailDialogOpen(true);
                                        }}
                                      >
                                        View
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<ThumbUpIcon />}
                                        onClick={() => {
                                          setSelectedSubmission({ ...submission, type: 'vehicle' });
                                          setReviewAction('approve');
                                          setReviewDialogOpen(true);
                                        }}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="error"
                                        startIcon={<ThumbDownIcon />}
                                        onClick={() => {
                                          setSelectedSubmission({ ...submission, type: 'vehicle' });
                                          setReviewAction('reject');
                                          setReviewDialogOpen(true);
                                        }}
                                      >
                                        Reject
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {/* Caravan Submissions */}
                              {caravanSubmissions.filter(submission => submission && submission.caravanData).map((submission) => (
                                <TableRow key={`caravan-${submission._id}`}>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {submission.submittedBy?.name || 'N/A'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {submission.submittedBy?.email || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Chip label="Caravan" color="secondary" size="small" />
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="medium">
                                        {submission.caravanData?.make || 'N/A'} {submission.caravanData?.model || 'N/A'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {submission.caravanData?.year || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {submission.numberPlate || 'N/A'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {submission.state || 'N/A'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="caption" display="block">
                                        ATM: {submission.caravanData?.atm || 'N/A'}kg
                                      </Typography>
                                      <Typography variant="caption" display="block">
                                        GTM: {submission.caravanData?.gtm || 'N/A'}kg
                                      </Typography>
                                      <Typography variant="caption" display="block">
                                        Axle: {submission.caravanData?.axleCapacity || 'N/A'}kg
                                      </Typography>
                                    </Box>
                                  </TableCell>

                                  <TableCell>
                                    <Typography variant="caption" display="block">
                                      {new Date(submission.createdAt).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(submission.createdAt).toLocaleTimeString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<VisibilityIcon />}
                                        onClick={() => {
                                          setSelectedSubmission({ ...submission, type: 'caravan' });
                                          setSubmissionDetailDialogOpen(true);
                                        }}
                                      >
                                        View
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<ThumbUpIcon />}
                                        onClick={() => {
                                          setSelectedSubmission({ ...submission, type: 'caravan' });
                                          setReviewAction('approve');
                                          setReviewDialogOpen(true);
                                        }}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="error"
                                        startIcon={<ThumbDownIcon />}
                                        onClick={() => {
                                          setSelectedSubmission({ ...submission, type: 'caravan' });
                                          setReviewAction('reject');
                                          setReviewDialogOpen(true);
                                        }}
                                      >
                                        Reject
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={submissionsData?.data?.pagination?.total || 0}
                    rowsPerPage={submissionRowsPerPage}
                    page={submissionPage}
                    onPageChange={(event, newPage) => setSubmissionPage(newPage)}
                    onRowsPerPageChange={(event) => {
                      setSubmissionRowsPerPage(parseInt(event.target.value, 10));
                      setSubmissionPage(0);
                    }}
                  />
                </Card>
              )}
            </Box>
                ) : location.pathname === '/admin/reports' ? (
            <Box key={`reports-${renderKey}`}>
              <Typography variant="h4" gutterBottom>
                Reports
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Export and download system-wide reports.
              </Typography>
              <Grid container spacing={2}>
                <Grid item>
                  <Button variant="contained" onClick={() => handleExportData('users')} startIcon={<DownloadIcon />}>Export Users CSV</Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" onClick={() => handleExportData('vehicles')} startIcon={<DownloadIcon />}>Export Vehicles CSV</Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" onClick={() => handleExportData('caravans')} startIcon={<DownloadIcon />}>Export Caravans CSV</Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" onClick={() => handleExportData('weighs')} startIcon={<DownloadIcon />}>Export Weighs CSV</Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" onClick={() => handleExportData('payments')} startIcon={<DownloadIcon />}>Export Payments CSV</Button>
                </Grid>
              </Grid>
            </Box>
                ) : location.pathname === '/admin/settings' ? (
            <Box key={`settings-${renderKey}`}>
              <Typography variant="h4" gutterBottom>
                Settings
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Manage admin preferences and system configuration.
              </Typography>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>General</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Support Email" placeholder="support@example.com" />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Business Name" placeholder="WeighBuddy" />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Notification Settings</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={notificationSound}
                            onChange={(e) => setNotificationSound(e.target.checked)}
                          />
                        }
                        label="Sound Notifications"
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        Play sound when new submissions arrive
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={desktopNotifications}
                            onChange={(e) => setDesktopNotifications(e.target.checked)}
                          />
                        }
                        label="Desktop Notifications"
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        Show browser notifications for new submissions
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.dark">
                      <strong>Current Status:</strong> {safeNotifications.length} total notifications, {safeNotifications.filter(n => !n.read).length} unread
                    </Typography>
                    {safeNotifications.length > 0 && (
                      <Button
                        size="small"
                        onClick={clearAllNotifications}
                        sx={{ mt: 1 }}
                      >
                        Clear All Notifications
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
                ) : (
            <Box key={`default-${renderKey}`}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body1">
            Select a tab to view the content.
          </Typography>
        </Box>
      )}

      {/* User Detail Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => {
          setUserDialogOpen(false);
          setSelectedUser(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedUser?._id ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  defaultValue={selectedUser.name}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  defaultValue={selectedUser.email}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  defaultValue={selectedUser.phone}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Postcode"
                  defaultValue={selectedUser.postcode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>User Type</InputLabel>
                  <Select
                    defaultValue={selectedUser.userType || 'diy'}
                    label="User Type"
                  >
                    <MenuItem value="diy">DIY</MenuItem>
                    <MenuItem value="professional">Professional</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    defaultValue={selectedUser.status || 'active'}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {selectedUser.userType === 'professional' && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    defaultValue={selectedUser.businessName}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUserDialogOpen(false);
            setSelectedUser(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleUserUpdate(selectedUser)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Vehicle Dialog */}
      <Dialog open={vehicleFormOpen} onClose={() => setVehicleFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Vehicle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              ['Make','make'],['Model','model'],['Series','series'],['Year','year','number'],['Variant','variant'],
              ['Engine','engine'],['Transmission','transmission'],['Tyre Size','tyreSize'],
              ['Front Axle Weight Rating (kg)','fawr','number'],['Rear Axle Weight Rating (kg)','rawr','number'],
              ['GVM (kg)','gvm','number'],['BTC (kg)','btc','number'],['GCM (kg)','gcm','number']
            ].map(([label,key,type='text']) => (
              <Grid item xs={12} md={6} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  type={type}
                  value={newVehicle[key]}
                  onChange={(e)=>setNewVehicle(v=>({...v,[key]: e.target.value}))}
                />
              </Grid>
            ))}
            {/* Sub Tank Checkbox */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newVehicle.hasSubTank || false}
                      onChange={(e) => setNewVehicle(v => ({...v, hasSubTank: e.target.checked}))}
                    />
                  }
                  label="Has Sub Tank"
                />
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setVehicleFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>createVehicleMutation.mutate({
            ...newVehicle,
            year: Number(newVehicle.year)||0,
            gvm: Number(newVehicle.gvm)||0,
            gcm: Number(newVehicle.gcm)||0,
            btc: Number(newVehicle.btc)||0,
            fawr: Number(newVehicle.fawr)||0,
            rawr: Number(newVehicle.rawr)||0,
            hasSubTank: Boolean(newVehicle.hasSubTank)
          })}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Caravan Dialog */}
      <Dialog open={caravanFormOpen} onClose={() => setCaravanFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Caravan</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[
              ['Make','make'],['Model','model'],['Year','year','number'],
              ['ATM (kg)','atm','number'],['GTM (kg)','gtm','number'],
              ['Axle Capacity (kg)','axleCapacity','number']
            ].map(([label,key,type='text']) => (
              <Grid item xs={12} md={6} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  type={type}
                  value={newCaravan[key]}
                  onChange={(e)=>setNewCaravan(v=>({...v,[key]: e.target.value}))}
                />
              </Grid>
            ))}
            {/* Number of Axles Dropdown */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Number of Axles</InputLabel>
                <Select
                  value={newCaravan.numberOfAxles || 'Single'}
                  label="Number of Axles"
                  onChange={(e) => setNewCaravan(v => ({...v, numberOfAxles: e.target.value}))}
                >
                  <MenuItem value="Single">Single</MenuItem>
                  <MenuItem value="Dual">Dual</MenuItem>
                  <MenuItem value="Triple">Triple</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setCaravanFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>createCaravanMutation.mutate({
            ...newCaravan,
            year: Number(newCaravan.year)||0,
            atm: Number(newCaravan.atm)||0,
            gtm: Number(newCaravan.gtm)||0,
            axleCapacity: Number(newCaravan.axleCapacity)||0,
            numberOfAxles: newCaravan.numberOfAxles || 'Single'
          })}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Vehicle Detail Dialog */}
      <Dialog
        open={vehicleDialogOpen}
        onClose={() => {
          setVehicleDialogOpen(false);
          setSelectedVehicle(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedVehicle?._id ? 'Edit Vehicle' : 'Add New Vehicle'}
        </DialogTitle>
        <DialogContent>
          {selectedVehicle && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Make"
                  defaultValue={selectedVehicle.make}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model"
                  defaultValue={selectedVehicle.model}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  defaultValue={selectedVehicle.year}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GVM (kg)"
                  type="number"
                  defaultValue={selectedVehicle.gvm}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GCM (kg)"
                  type="number"
                  defaultValue={selectedVehicle.gcm}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="BTC (kg)"
                  type="number"
                  defaultValue={selectedVehicle.btc}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="TBM (kg)"
                  type="number"
                  defaultValue={selectedVehicle.tbm}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Front Axle Capacity (kg)"
                  type="number"
                  defaultValue={selectedVehicle.frontAxleCapacity}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rear Axle Capacity (kg)"
                  type="number"
                  defaultValue={selectedVehicle.rearAxleCapacity}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Body Type"
                  defaultValue={selectedVehicle.bodyType}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Axle Count"
                  type="number"
                  defaultValue={selectedVehicle.axleCount}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setVehicleDialogOpen(false);
            setSelectedVehicle(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleVehicleUpdate(selectedVehicle)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Caravan Detail Dialog */}
      <Dialog
        open={caravanDialogOpen}
        onClose={() => {
          setCaravanDialogOpen(false);
          setSelectedCaravan(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCaravan?._id ? 'Edit Caravan' : 'Add New Caravan'}
        </DialogTitle>
        <DialogContent>
          {selectedCaravan && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Make"
                  defaultValue={selectedCaravan.make}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Model"
                  defaultValue={selectedCaravan.model}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Year"
                  type="number"
                  defaultValue={selectedCaravan.year}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Length (m)"
                  type="number"
                  defaultValue={selectedCaravan.length}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ATM (kg)"
                  type="number"
                  defaultValue={selectedCaravan.atm}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GTM (kg)"
                  type="number"
                  defaultValue={selectedCaravan.gtm}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Axle Group Loading (kg)"
                  type="number"
                  defaultValue={selectedCaravan.axleGroupLoading}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Body Type"
                  defaultValue={selectedCaravan.bodyType}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Axle Count"
                  type="number"
                  defaultValue={selectedCaravan.axleCount}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCaravanDialogOpen(false);
            setSelectedCaravan(null);
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleCaravanUpdate(selectedCaravan)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Weigh Detail Dialog */}
      <Dialog
        open={weighDetailDialogOpen}
        onClose={() => {
          setWeighDetailDialogOpen(false);
          setSelectedWeigh(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5">WeighBuddy • Caravan Compliance Report</Typography>
            <Typography variant="body2" color="text.secondary">
              Report ID: {selectedWeigh?._id}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedWeigh && (
            <Box>
              {/* Report Meta */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Date: {new Date(selectedWeigh.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Customer: {selectedWeigh.customerName || selectedWeigh.customer?.name || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Phone: {selectedWeigh.customerPhone || selectedWeigh.customer?.phone || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Email: {selectedWeigh.customerEmail || selectedWeigh.customer?.email || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Vehicle/Caravan Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Vehicle</Typography>
                      <Typography variant="body2">
                        Make/Model: {selectedWeigh.vehicleData?.make || ''} {selectedWeigh.vehicleData?.model || ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Year: {selectedWeigh.vehicleData?.year || '-'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Number Plate: {selectedWeigh.vehicleData?.numberPlate || selectedWeigh.vehicleData?.plate || selectedWeigh.vehicleData?.registration || selectedWeigh.vehicleRegistryId?.numberPlate || 'Not Available'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        GVM limit: {selectedWeigh.vehicleData?.gvm || 0} kg
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        GCM limit: {selectedWeigh.vehicleData?.gcm || 0} kg
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        BTC limit: {selectedWeigh.vehicleData?.btc || 0} kg
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {selectedWeigh.caravanData && (
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Caravan</Typography>
                        <Typography variant="body2">
                          Make/Model: {selectedWeigh.caravanData?.make || ''} {selectedWeigh.caravanData?.model || ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Year: {selectedWeigh.caravanData?.year || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Number Plate: {selectedWeigh.caravanData?.numberPlate || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ATM limit: {selectedWeigh.caravanData?.atm || 0} kg
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          GTM limit: {selectedWeigh.caravanData?.gtm || 0} kg
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>

              {/* Compliance Summary Table */}
              <Typography variant="h6" gutterBottom>Compliance Summary</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell>Measured</TableCell>
                      <TableCell>Compliance</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      {
                        name: 'Vehicle Load (GVM Unhooked)',
                        actual: selectedWeigh.vehicleWeightUnhitched || 0,
                        limit: selectedWeigh.vehicleData?.gvm || 0,
                        ok: (selectedWeigh.vehicleWeightUnhitched || 0) <= (selectedWeigh.vehicleData?.gvm || 0)
                      },
                      {
                        name: 'Tow Ball Load (TBM)',
                        actual: selectedWeigh.towBallWeight || 0,
                        limit: selectedWeigh.vehicleData?.tbm || (selectedWeigh.caravanData?.atm * 0.1) || 0,
                        ok: (selectedWeigh.towBallWeight || 0) <= (selectedWeigh.vehicleData?.tbm || (selectedWeigh.caravanData?.atm * 0.1) || 0)
                      },
                      {
                        name: 'Caravan Load (ATM)',
                        actual: (selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0),
                        limit: selectedWeigh.caravanData?.atm || 0,
                        ok: ((selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0)) <= (selectedWeigh.caravanData?.atm || 0)
                      },
                      {
                        name: 'Combined Load (GCM)',
                        actual: (selectedWeigh.vehicleWeightUnhitched || 0) + ((selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0)),
                        limit: selectedWeigh.vehicleData?.gcm || 0,
                        ok: ((selectedWeigh.vehicleWeightUnhitched || 0) + ((selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0))) <= (selectedWeigh.vehicleData?.gcm || 0)
                      },
                      {
                        name: 'Caravan Axle Load (GTM)',
                        actual: selectedWeigh.caravanWeight || 0,
                        limit: selectedWeigh.caravanData?.gtm || 0,
                        ok: selectedWeigh.caravanData?.gtm > 0 ? 
                          (selectedWeigh.caravanWeight || 0) <= (selectedWeigh.caravanData?.gtm || 0) : true
                      }
                    ].map((row) => {
                      const diff = (row.limit || 0) - (row.actual || 0);
                      return (
                        <TableRow key={row.name}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.limit.toFixed ? row.limit.toFixed(0) : row.limit} kg</TableCell>
                          <TableCell>{row.actual.toFixed ? row.actual.toFixed(0) : row.actual} kg</TableCell>
                          <TableCell>{diff >= 0 ? '+' : ''}{diff} kg</TableCell>
                          <TableCell>
                            <Chip
                              label={row.ok ? 'OK' : 'OVER'}
                              color={row.ok ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Advisory Section */}
              <Typography variant="h6" gutterBottom>Advisory (Informational)</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableBody>
                    {(() => {
                      const towBallPct = selectedWeigh.caravanWeight > 0 ? (selectedWeigh.towBallWeight / selectedWeigh.caravanWeight) * 100 : 0;
                      const vanToCarRatio = (selectedWeigh.vehicleWeightUnhitched || 0) > 0 ? (selectedWeigh.caravanWeight / (selectedWeigh.vehicleWeightUnhitched || 0)) * 100 : 0;
                      const btcPct = selectedWeigh.vehicleData?.btc ? (((selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0)) / selectedWeigh.vehicleData.btc) * 100 : 0;

                      return [
                        { label: 'Van to Car Ratio (< 85% ideal)', value: `${vanToCarRatio.toFixed(0)}%`, ok: vanToCarRatio < 85 },
                        { label: 'Tow Ball % (8%–10% ideal)', value: `${towBallPct.toFixed(0)}%`, ok: towBallPct >= 8 && towBallPct <= 10 },
                        { label: 'BTC Ratio - ATM (< 80% ideal)', value: `${btcPct.toFixed(0)}%`, ok: btcPct < 80 }
                      ].map((row) => (
                        <TableRow key={row.label}>
                          <TableCell>{row.label}</TableCell>
                          <TableCell>{row.value}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.ok ? 'IDEAL' : 'CHECK'}
                              color={row.ok ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Overall Status */}
              <Box sx={{ mb: 3 }}>
                {(() => {
                  // Calculate overall compliance dynamically based on actual data and limits
                  const gvmOk = (selectedWeigh.vehicleWeightUnhitched || 0) <= (selectedWeigh.vehicleData?.gvm || 0);
                  const tbmOk = (selectedWeigh.towBallWeight || 0) <= (selectedWeigh.vehicleData?.tbm || (selectedWeigh.caravanData?.atm * 0.1) || 0);
                  const atmOk = ((selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0)) <= (selectedWeigh.caravanData?.atm || 0);
                  const gcmOk = ((selectedWeigh.vehicleWeightUnhitched || 0) + ((selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0))) <= (selectedWeigh.vehicleData?.gcm || 0);
                  
                  // GTM check: GTM = Caravan weight on wheels
                  const gtmOk = selectedWeigh.caravanData?.gtm > 0 ? 
                    (selectedWeigh.caravanWeight || 0) <= (selectedWeigh.caravanData?.gtm || 0) : true;
                  
                  const overallOk = gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
                  
                  return (
                    <Chip
                      label={overallOk ? 'OVERALL: COMPLIANT' : 'OVERALL: NON-COMPLIANT'}
                      color={overallOk ? 'success' : 'error'}
                      size="large"
                      sx={{ fontSize: '1.1rem', py: 1 }}
                    />
                  );
                })()}
              </Box>

              {/* Notes */}
              {selectedWeigh.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Typography variant="body2">{selectedWeigh.notes}</Typography>
                </Box>
              )}

              {/* Footer */}
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Generated by WeighBuddy - Caravan Compliance System
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Generated on: {new Date().toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setWeighDetailDialogOpen(false);
            setSelectedWeigh(null);
          }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Status Update Dialog */}
      <Dialog
        open={paymentStatusDialogOpen}
        onClose={() => {
          setPaymentStatusDialogOpen(false);
          setSelectedPayment(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Payment Status
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Update payment status for: {selectedPayment?.customer?.name || 'N/A'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Amount: ${selectedPayment?.payment?.amount?.toFixed(2) || '0.00'}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Status: {selectedPayment?.payment?.status || 'N/A'}
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              New Status:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={selectedPayment?.payment?.status === 'completed' ? 'contained' : 'outlined'}
                  color="success"
                  onClick={() => handlePaymentStatusUpdate('completed')}
                  disabled={loading}
                >
                  Completed
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={selectedPayment?.payment?.status === 'pending' ? 'contained' : 'outlined'}
                  color="warning"
                  onClick={() => handlePaymentStatusUpdate('pending')}
                  disabled={loading}
                >
                  Pending
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={selectedPayment?.payment?.status === 'failed' ? 'contained' : 'outlined'}
                  color="error"
                  onClick={() => handlePaymentStatusUpdate('failed')}
                  disabled={loading}
                >
                  Failed
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant={selectedPayment?.payment?.status === 'refunded' ? 'contained' : 'outlined'}
                  color="info"
                  onClick={() => handlePaymentStatusUpdate('refunded')}
                  disabled={loading}
                >
                  Refunded
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPaymentStatusDialogOpen(false);
            setSelectedPayment(null);
          }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Details View Dialog */}
      <Dialog
        open={paymentDetailsDialogOpen}
        onClose={() => {
          setPaymentDetailsDialogOpen(false);
          setSelectedPayment(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScaleIcon color="primary" />
            <Typography variant="h6">
              Payment Details - Service #{selectedPayment?._id?.slice(-8)}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Service Information */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Service Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Service Type
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            Caravan Weigh Compliance Check
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Service Date
                          </Typography>
                          <Typography variant="body1">
                            {new Date(selectedPayment.createdAt).toLocaleDateString('en-AU', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Compliance Status
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {(() => {
                              // Calculate compliance dynamically based on actual data and limits
                              const gvmOk = (selectedPayment.vehicleWeightUnhitched || 0) <= (selectedPayment.vehicleData?.gvm || 0);
                              const tbmOk = (selectedPayment.towBallWeight || 0) <= (selectedPayment.vehicleData?.tbm || (selectedPayment.caravanData?.atm * 0.1) || 0);
                              const atmOk = (selectedPayment.caravanWeight || 0) <= (selectedPayment.caravanData?.atm || 0);
                              const gcmOk = ((selectedPayment.vehicleWeightUnhitched || 0) + (selectedPayment.caravanWeight || 0)) <= (selectedPayment.vehicleData?.gcm || 0);
                              
                              // GTM check: Calculate based on actual GTM limit if available
                              const calculatedGTM = (selectedPayment.caravanWeight || 0) - (selectedPayment.towBallWeight || 0);
                              const gtmOk = selectedPayment.caravanData?.gtm > 0 ? 
                                calculatedGTM <= (selectedPayment.caravanData?.gtm || 0) : true;
                              
                              const overallOk = gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
                              
                              return overallOk ? (
                                <Chip label="Compliant" color="success" size="small" />
                              ) : (
                                <Chip label="Non-Compliant" color="error" size="small" />
                              );
                            })()}
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Report Generated
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {selectedPayment.reportGenerated ? (
                              <Chip label="Yes" color="success" variant="outlined" size="small" />
                            ) : (
                              <Chip label="No" color="default" variant="outlined" size="small" />
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Customer Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Customer Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Name</Typography>
                          <Typography variant="body1">
                            {selectedPayment.customerName || selectedPayment.userId?.name || selectedPayment.customer?.name || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Email</Typography>
                          <Typography variant="body1">
                            {selectedPayment.customerEmail || selectedPayment.userId?.email || selectedPayment.customer?.email || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Phone</Typography>
                          <Typography variant="body1">
                            {selectedPayment.customerPhone || selectedPayment.userId?.phone || selectedPayment.customer?.phone || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">User Type</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const userType = selectedPayment.userId?.userType || 
                                             selectedPayment.user?.userType || 
                                             selectedPayment.customer?.userType || 
                                             selectedPayment.userType ||
                                             selectedPayment.customerType;
                              return userType ? userType.toUpperCase() : 'N/A';
                            })()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Business Name</Typography>
                          <Typography variant="body1">
                            {selectedPayment.userId?.businessName || selectedPayment.user?.businessName || selectedPayment.customer?.businessName || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Payment Information */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Payment Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Amount</Typography>
                          <Typography variant="h6" color="success.main">
                            ${selectedPayment.payment?.amount?.toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                          <Typography variant="body1">{selectedPayment.payment?.method?.toUpperCase() || 'N/A'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            {getPaymentStatusChip(selectedPayment.payment?.status)}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Vehicle Details */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Vehicle Details
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Make & Model</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const make = selectedPayment.vehicleData?.make || selectedPayment.vehicle?.make;
                              const model = selectedPayment.vehicleData?.model || selectedPayment.vehicle?.model;
                              return make && model ? `${make} ${model}` : 'Data not available';
                            })()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Year</Typography>
                          <Typography variant="body1">
                            {selectedPayment.vehicleData?.year || selectedPayment.vehicle?.year || 'Data not available'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Number Plate</Typography>
                          <Typography variant="body1">
                            {selectedPayment.vehicleNumberPlate || 
                             selectedPayment.vehicleData?.numberPlate || 
                             selectedPayment.vehicle?.numberPlate || 
                             selectedPayment.vehicleRegistryId?.numberPlate || 'Data not available'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">GVM</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const gvm = selectedPayment.vehicleData?.gvm || selectedPayment.vehicle?.gvm;
                              return gvm ? `${gvm}kg` : 'Data not available';
                            })()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">GCM</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const gcm = selectedPayment.vehicleData?.gcm || selectedPayment.vehicle?.gcm;
                              return gcm ? `${gcm}kg` : 'Data not available';
                            })()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">BTC</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const btc = selectedPayment.vehicleData?.btc || selectedPayment.vehicle?.btc;
                              return btc ? `${btc}kg` : 'Data not available';
                            })()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Caravan Details */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Caravan Details
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Make & Model</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const make = selectedPayment.caravanData?.make || selectedPayment.caravan?.make;
                              const model = selectedPayment.caravanData?.model || selectedPayment.caravan?.model;
                              return make && model ? `${make} ${model}` : 'Data not available';
                            })()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Year</Typography>
                          <Typography variant="body1">
                            {selectedPayment.caravanData?.year || selectedPayment.caravan?.year || 'Data not available'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Number Plate</Typography>
                          <Typography variant="body1">
                            {selectedPayment.caravanNumberPlate || 
                             selectedPayment.caravanData?.numberPlate || 
                             selectedPayment.caravan?.numberPlate || 
                             selectedPayment.caravanRegistryId?.numberPlate || 'Data not available'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">ATM</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const atm = selectedPayment.caravanData?.atm || selectedPayment.caravan?.atm;
                              return atm ? `${atm}kg` : 'Data not available';
                            })()}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">GTM</Typography>
                          <Typography variant="body1">
                            {(() => {
                              const gtm = selectedPayment.caravanData?.gtm || selectedPayment.caravan?.gtm;
                              return gtm ? `${gtm}kg` : 'Data not available';
                            })()}
                          </Typography>
                        </Box>

                      </Box>
                    </CardContent>
                  </Card>
                </Grid>



                {/* Compliance Details */}
                {selectedPayment.compliance && (
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          Compliance Results
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">Overall Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {(() => {
                                // Calculate compliance dynamically based on actual data and limits
                                const gvmOk = (selectedPayment.vehicleWeightUnhitched || 0) <= (selectedPayment.vehicleData?.gvm || 0);
                                const tbmOk = (selectedPayment.towBallWeight || 0) <= (selectedPayment.vehicleData?.tbm || (selectedPayment.caravanData?.atm * 0.1) || 0);
                                const atmOk = (selectedPayment.caravanWeight || 0) <= (selectedPayment.caravanData?.atm || 0);
                                const gcmOk = ((selectedPayment.vehicleWeightUnhitched || 0) + (selectedPayment.caravanWeight || 0)) <= (selectedPayment.vehicleData?.gcm || 0);
                                
                                // GTM check: Calculate based on actual GTM limit if available
                                const calculatedGTM = (selectedPayment.caravanWeight || 0) - (selectedPayment.towBallWeight || 0);
                                const gtmOk = selectedPayment.caravanData?.gtm > 0 ? 
                                  calculatedGTM <= (selectedPayment.caravanData?.gtm || 0) : true;
                                
                                const overallOk = gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
                                
                                return overallOk ? (
                                  <Chip label="Compliant" color="success" size="small" />
                                ) : (
                                  <Chip label="Non-Compliant" color="error" size="small" />
                                );
                              })()}
                            </Box>
                          </Grid>
                          {selectedPayment.compliance?.gvm && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">GVM Compliance</Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <Chip 
                                  label={selectedPayment.compliance.gvm.compliant ? 'Compliant' : 'Non-Compliant'} 
                                  color={selectedPayment.compliance.gvm.compliant ? 'success' : 'error'} 
                                  size="small" 
                                />
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  {selectedPayment.compliance.gvm.actual}kg / {selectedPayment.compliance.gvm.limit}kg
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {selectedPayment.compliance?.atm && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">ATM Compliance</Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <Chip 
                                  label={selectedPayment.compliance.atm.compliant ? 'Compliant' : 'Non-Compliant'} 
                                  color={selectedPayment.compliance.atm.compliant ? 'success' : 'error'} 
                                  size="small" 
                                />
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  {selectedPayment.compliance.atm.actual}kg / {selectedPayment.compliance.atm.limit}kg
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {selectedPayment.compliance?.gcm && (
                            <Grid item xs={12} sm={6}>
                              <Typography variant="body2" color="text.secondary">GCM Compliance</Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <Chip 
                                  label={selectedPayment.compliance.gcm.compliant ? 'Compliant' : 'Non-Compliant'} 
                                  color={selectedPayment.compliance.gcm.compliant ? 'success' : 'error'} 
                                  size="small" 
                                />
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  {selectedPayment.compliance.gcm.actual}kg / {selectedPayment.compliance.gcm.limit}kg
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPaymentDetailsDialogOpen(false);
              setSelectedPayment(null);
            }}
          >
            Close
          </Button>
          {selectedPayment?.reportGenerated && (
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => {
                // Handle report download
                window.open(getApiUrl(`/weighs/${selectedPayment._id}/report`), '_blank');
              }}
            >
              Download Report
            </Button>
          )}
        </DialogActions>
      </Dialog>

            {/* Submission Detail Dialog */}
      <Dialog
        open={submissionDetailDialogOpen && selectedSubmission !== null}
        onClose={() => {
          setSubmissionDetailDialogOpen(false);
          setSelectedSubmission(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSubmission?.type === 'vehicle' 
            ? `Vehicle Submission Details - ${selectedSubmission?.vehicleData?.year || 'N/A'} ${selectedSubmission?.vehicleData?.make || 'N/A'} ${selectedSubmission?.vehicleData?.model || 'N/A'}`
            : `Caravan Submission Details - ${selectedSubmission?.caravanData?.year || 'N/A'} ${selectedSubmission?.caravanData?.make || 'N/A'} ${selectedSubmission?.caravanData?.model || 'N/A'}`
          }
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && selectedSubmission !== null ? (
            <Grid container spacing={3}>
              {/* User Information */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      User Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Name</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedSubmission.submittedBy?.name || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedSubmission.submittedBy?.email || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">User Type</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedSubmission.submittedBy?.userType || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Submitted</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {new Date(selectedSubmission.createdAt).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Vehicle/Caravan Details */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      {selectedSubmission.type === 'vehicle' ? 'Vehicle' : 'Caravan'} Details
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedSubmission?.type === 'vehicle' && selectedSubmission?.vehicleData ? (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Make</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.make || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Model</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.model || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Year</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.year || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Variant</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.variant || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Series</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.series || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Engine</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.engine || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Transmission</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.transmission || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Tyre Size</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.tyreSize || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Sub Tank</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.hasSubTank ? 'Yes' : 'No'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Full Vehicle Description</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.year || 'N/A'} {selectedSubmission.vehicleData?.make || 'N/A'} {selectedSubmission.vehicleData?.model || 'N/A'} {selectedSubmission.vehicleData?.variant || 'N/A'} {selectedSubmission.vehicleData?.series ? `(${selectedSubmission.vehicleData.series})` : ''}
                            </Typography>
                          </Grid>
                        </>
                      ) : selectedSubmission?.type === 'caravan' && selectedSubmission?.caravanData ? (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Make</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.caravanData?.make || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Model</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.caravanData?.model || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Year</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.caravanData?.year || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Number of Axles</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.caravanData?.numberOfAxles || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Full Caravan Description</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.caravanData?.year || 'N/A'} {selectedSubmission.caravanData?.make || 'N/A'} {selectedSubmission.caravanData?.model || 'N/A'}
                            </Typography>
                          </Grid>
                        </>
                      ) : (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            No vehicle/caravan data available
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Compliance Ratings */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Compliance Ratings
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedSubmission?.type === 'vehicle' && selectedSubmission?.vehicleData ? (
                        <>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">GVM</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.gvm || 'N/A'}kg
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">GCM</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.gcm || 'N/A'}kg
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">BTC</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.btc || 'N/A'}kg
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">FAWR</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.fawr || 'N/A'}kg
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">RAWR</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.vehicleData?.rawr || 'N/A'}kg
                            </Typography>
                          </Grid>
                        </>
                      ) : selectedSubmission?.type === 'caravan' && selectedSubmission?.caravanData ? (
                        <>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">ATM</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.caravanData?.atm || 'N/A'}kg
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">GTM</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.caravanData?.gtm || 'N/A'}kg
                            </Typography>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Typography variant="body2" color="text.secondary">Axle Capacity</Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {selectedSubmission.caravanData?.axleCapacity || 'N/A'}kg
                            </Typography>
                          </Grid>
                        </>
                      ) : (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            No compliance ratings available
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Number Plate Information */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Number Plate Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Number Plate</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedSubmission?.numberPlate || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">State</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedSubmission?.state || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Vehicle/Caravan Photo */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      {selectedSubmission?.type === 'vehicle' ? 'Vehicle' : 'Caravan'} Photo - Compliance Plate
                    </Typography>
                    <Box sx={{ textAlign: 'center' }}>
                      {selectedSubmission?.compliancePlatePhoto ? (
                        <>
                          <img
                            src={selectedSubmission.compliancePlatePhoto.startsWith('http') 
                              ? selectedSubmission.compliancePlatePhoto 
                              : selectedSubmission.compliancePlatePhoto.startsWith('/uploads/')
                              ? `${window.location.origin}${selectedSubmission.compliancePlatePhoto}`
                              : getUploadsUrl(selectedSubmission.compliancePlatePhoto)}
                            alt={`${selectedSubmission?.type === 'vehicle' ? 'Vehicle' : 'Caravan'} Compliance Plate`}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '400px',
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            onError={(e) => {
                              console.error('Image failed to load:', e.target.src);
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'block';
                            }}
                          />
                          <div style={{ display: 'none', color: '#f44336', textAlign: 'center', padding: '20px' }}>
                            <Typography variant="body2" color="error">
                              Image failed to load. This might be a mock URL or the file is not accessible.
                            </Typography>
                          </div>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {selectedSubmission?.type === 'vehicle' 
                              ? `${selectedSubmission?.vehicleData?.year || 'N/A'} ${selectedSubmission?.vehicleData?.make || 'N/A'} ${selectedSubmission?.vehicleData?.model || 'N/A'} - Compliance Plate`
                              : `${selectedSubmission?.caravanData?.year || 'N/A'} ${selectedSubmission?.caravanData?.make || 'N/A'} ${selectedSubmission?.caravanData?.model || 'N/A'} - Compliance Plate`
                            }
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No {selectedSubmission?.type === 'vehicle' ? 'vehicle' : 'caravan'} photo available
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">
              No submission selected
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSubmissionDetailDialogOpen(false);
              setSelectedSubmission(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compliance Plate Photo Dialog */}
      <Dialog
        open={imageDialogOpen && selectedSubmission !== null}
        onClose={() => {
          setImageDialogOpen(false);
          setSelectedSubmission(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSubmission?.type === 'vehicle' 
            ? `Vehicle Compliance Plate Photo - ${selectedSubmission?.vehicleData?.year || 'N/A'} ${selectedSubmission?.vehicleData?.make || 'N/A'} ${selectedSubmission?.vehicleData?.model || 'N/A'}`
            : `Caravan Compliance Plate Photo - ${selectedSubmission?.caravanData?.year || 'N/A'} ${selectedSubmission?.caravanData?.make || 'N/A'} ${selectedSubmission?.caravanData?.model || 'N/A'}`
          }
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && selectedSubmission?.compliancePlatePhoto ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedSubmission?.type === 'vehicle' 
                  ? `${selectedSubmission?.vehicleData?.year || 'N/A'} ${selectedSubmission?.vehicleData?.make || 'N/A'} ${selectedSubmission?.vehicleData?.model || 'N/A'} ${selectedSubmission?.vehicleData?.variant || 'N/A'} ${selectedSubmission?.vehicleData?.series ? `(${selectedSubmission.vehicleData.series})` : ''}`
                  : `${selectedSubmission?.caravanData?.year || 'N/A'} ${selectedSubmission?.caravanData?.make || 'N/A'} ${selectedSubmission?.caravanData?.model || 'N/A'}`
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Number Plate: {selectedSubmission?.numberPlate} ({selectedSubmission?.state})
              </Typography>
              <Box sx={{ mt: 2, mb: 2 }}>
                <img
                  src={selectedSubmission.compliancePlatePhoto.startsWith('http') 
                    ? selectedSubmission.compliancePlatePhoto 
                    : selectedSubmission.compliancePlatePhoto.startsWith('/uploads/')
                    ? `${window.location.origin}${selectedSubmission.compliancePlatePhoto}`
                    : getUploadsUrl(selectedSubmission.compliancePlatePhoto)}
                  alt="Compliance Plate"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '500px',
                    objectFit: 'contain',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', e.target.src);
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'block';
                  }}
                />
                <div style={{ display: 'none', color: '#f44336', textAlign: 'center', padding: '20px' }}>
                  <Typography variant="body2" color="error">
                    Image failed to load. This might be a mock URL or the file is not accessible.
                  </Typography>
                </div>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Uploaded by: {selectedSubmission?.submittedBy?.name} on {new Date(selectedSubmission?.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          ) : selectedSubmission ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="error">
                No compliance plate photo available
              </Typography>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setImageDialogOpen(false);
              setSelectedSubmission(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen && selectedSubmission !== null}
        onClose={() => {
          setReviewDialogOpen(false);
          setSelectedSubmission(null);
          setReviewNotes('');
          setReviewAction('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewAction === 'approve' ? 'Approve' : 'Reject'} Submission
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && selectedSubmission !== null ? (
            <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              {selectedSubmission?.type === 'vehicle' ? 'Vehicle' : 'Caravan'}: {selectedSubmission?.type === 'vehicle' 
                ? `${selectedSubmission?.vehicleData?.year || 'N/A'} ${selectedSubmission?.vehicleData?.make || 'N/A'} ${selectedSubmission?.vehicleData?.model || 'N/A'} ${selectedSubmission?.vehicleData?.variant || 'N/A'} ${selectedSubmission?.vehicleData?.series ? `(${selectedSubmission.vehicleData.series})` : ''}`
                : `${selectedSubmission?.caravanData?.year || 'N/A'} ${selectedSubmission?.caravanData?.make || 'N/A'} ${selectedSubmission?.caravanData?.model || 'N/A'}`
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Number Plate: {selectedSubmission?.numberPlate} ({selectedSubmission?.state})
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Submitted by: {selectedSubmission?.submittedBy?.name} ({selectedSubmission?.submittedBy?.email})
            </Typography>
            
            {/* Compliance Ratings Summary */}
            {selectedSubmission?.type === 'vehicle' && selectedSubmission?.vehicleData && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Compliance Ratings:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">GVM: {selectedSubmission.vehicleData?.gvm || 'N/A'}kg</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">GCM: {selectedSubmission.vehicleData?.gcm || 'N/A'}kg</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">BTC: {selectedSubmission.vehicleData?.btc || 'N/A'}kg</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">FAWR: {selectedSubmission.vehicleData?.fawr || 'N/A'}kg</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">RAWR: {selectedSubmission.vehicleData?.rawr || 'N/A'}kg</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {selectedSubmission?.type === 'caravan' && selectedSubmission?.caravanData && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Compliance Ratings:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">ATM: {selectedSubmission.caravanData?.atm || 'N/A'}kg</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">GTM: {selectedSubmission.caravanData?.gtm || 'N/A'}kg</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Axle Capacity: {selectedSubmission.caravanData?.axleCapacity || 'N/A'}kg</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Axles: {selectedSubmission.caravanData?.numberOfAxles || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Review Notes"
              placeholder={reviewAction === 'approve' 
                ? "Add any notes about this approval (optional)"
                : "Please provide a reason for rejection (required)"
              }
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              sx={{ mt: 2 }}
              required={reviewAction === 'reject'}
            />
          </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setReviewDialogOpen(false);
              setSelectedSubmission(null);
              setReviewNotes('');
              setReviewAction('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={reviewAction === 'approve' ? 'success' : 'error'}
            startIcon={reviewAction === 'approve' ? <ThumbUpIcon /> : <ThumbDownIcon />}
            onClick={async () => {
              if (reviewAction === 'reject' && !reviewNotes.trim()) {
                alert('Please provide a reason for rejection');
                return;
              }
              
              try {
                if (reviewAction === 'approve') {
                  await approveSubmissionMutation.mutateAsync({
                    submissionId: selectedSubmission._id,
                    type: selectedSubmission.type,
                    reviewNotes: reviewNotes.trim()
                  });
                } else {
                  await rejectSubmissionMutation.mutateAsync({
                    submissionId: selectedSubmission._id,
                    type: selectedSubmission.type,
                    reviewNotes: reviewNotes.trim()
                  });
                }
              } catch (error) {
                console.error('Error processing submission:', error);
                alert('Error processing submission. Please try again.');
              }
            }}
            disabled={reviewAction === 'reject' && !reviewNotes.trim()}
          >
            {reviewAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Center Dialog */}
      <Dialog
        open={notificationDialogOpen}
        onClose={() => setNotificationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        onEnter={() => {
          console.log('🚪 Dialog opening...');
          console.log('📊 Notifications state:', notifications);
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Notification Center</Typography>
            <Button
              size="small"
              onClick={clearAllNotifications}
              disabled={notifications.length === 0}
            >
              Clear All
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Debug Information */}
          <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '0.75rem' }}>
            <Typography variant="caption" color="text.secondary">
              Debug: notifications.length = {safeNotifications.length} | 
              Array type: {Array.isArray(notifications) ? 'Array' : typeof notifications} |
              Dialog open: {notificationDialogOpen ? 'Yes' : 'No'} |
              Safe notifications: {safeNotifications.length}
            </Typography>
          </Box>
          
          {safeNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No notifications available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When new submissions arrive, you'll see notifications here.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  // Add a test notification for debugging
                  addNotification('Test notification - ' + new Date().toLocaleTimeString(), 'info');
                }}
                sx={{ mt: 2 }}
              >
                Add Test Notification
              </Button>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {safeNotifications.map((notification, index) => (
                <Box
                  key={notification.id || index}
                  sx={{
                    p: 2,
                    mb: 1,
                    border: 1,
                    borderColor: notification.read ? 'divider' : 'primary.main',
                    borderRadius: 1,
                    backgroundColor: notification.read ? 'transparent' : 'primary.light',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: notification.read ? 'grey.50' : 'primary.light'
                    }
                  }}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: notification.read ? 'normal' : 'bold',
                          color: notification.read ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {notification.message || 'No message content'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'No timestamp'}
                      </Typography>
                    </Box>
                    {!notification.read && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                          ml: 1
                        }}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;