import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Button,
  Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Add,
  History,
  Person,
  Search,
  AdminPanelSettings,
  Logout,
  AccountCircle,
  DirectionsCar,
  LocalShipping,
  Subscriptions,
  People,
  Payments,
  Assessment,
  Settings,
  Scale,
  Assignment
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleProfileMenuClose();
  };

  // Different menu items based on user type
  const getMenuItems = () => {
    if (user?.userType === 'admin') {
      return [
        { text: 'Overview', icon: <Dashboard />, path: '/admin/overview' },
        { text: 'Users', icon: <People />, path: '/admin/users' },
        { text: 'Vehicles', icon: <DirectionsCar />, path: '/admin/vehicles' },
        { text: 'Caravans', icon: <LocalShipping />, path: '/admin/caravans' },
        { text: 'Weighs', icon: <Scale />, path: '/admin/weighs' },
        { text: 'Payments', icon: <Payments />, path: '/admin/payments' },
        { text: 'Data Submissions', icon: <Assignment />, path: '/admin/submissions' },
        { text: 'Reports', icon: <Assessment />, path: '/admin/reports' },
        { text: 'Settings', icon: <Settings />, path: '/admin/settings' }
      ];
    }
    
    if (user?.userType === 'professional') {
      return [
        {
          text: 'Dashboard',
          icon: <Dashboard />,
          path: '/dashboard'
        },
        {
          text: 'Subscription',
          icon: <Subscriptions />,
          path: '/subscription'
        },
        {
          text: 'New Weigh',
          icon: <Add />,
          path: '/new-weigh'
        },
        {
          text: 'Weigh History',
          icon: <History />,
          path: '/weigh-history'
        },
        {
          text: 'Vehicle Search',
          icon: <DirectionsCar />,
          path: '/vehicle-search'
        },
        {
          text: 'Caravan Search',
          icon: <LocalShipping />,
          path: '/caravan-search'
        }
      ];
    }
    
    // DIY user navigation - reduced menu items as per specification
    return [
      {
        text: 'New Weigh',
        icon: <Add />,
        path: '/new-weigh'
      },
      {
        text: 'Weigh History',
        icon: <History />,
        path: '/weigh-history'
      },
      {
        text: 'Payment History',
        icon: <Payments />,
        path: '/payment-history'
      }
    ];
  };

  const menuItems = getMenuItems();

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          WeighBuddy
        </Typography>
      </Toolbar>
      <Divider />

      {user?.userType === 'professional' ? (
        <Box sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              fullWidth
              size="small"
              onClick={() => {
                navigate('/professional-clients');
                setMobileOpen(false);
              }}
            >
              New Weigh
            </Button>
            <Button
              variant="outlined"
              fullWidth
              size="small"
              onClick={() => {
                navigate('/weigh-history');
                setMobileOpen(false);
              }}
            >
              Weigh History
            </Button>
            <Button
              variant="outlined"
              fullWidth
              size="small"
              onClick={() => {
                navigate('/dashboard');
                setMobileOpen(false);
              }}
            >
              My WeighBuddy
            </Button>
          </Stack>
        </Box>
      ) : (
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.userType === 'diy' ? 'WeighBuddy Compliance Check' : 'Caravan Compliance Check'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Welcome, {user?.name}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => { navigate('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Layout; 