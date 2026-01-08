import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  DirectionsCar,
  Menu as MenuIcon,
  Close as CloseIcon,
  Login,
  RocketLaunch,
  Person,
  Logout,
  Dashboard
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/');
  };

  const drawer = (
    <Box sx={{ width: 280, height: '100%', bgcolor: '#0E1E32' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DirectionsCar sx={{ mr: 1, color: '#8BE0C3', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
            WeighBuddy
          </Typography>
        </Box>
        <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#FFFFFF' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List sx={{ pt: 2 }}>
        {navItems.map((item) => (
          <ListItem
            key={item.label}
            onClick={() => handleNavClick(item.path)}
            sx={{
              cursor: 'pointer',
              mx: 1,
              borderRadius: 2,
              mb: 0.5,
              bgcolor: location.pathname === item.path ? '#2DC5A1' : 'transparent',
              color: location.pathname === item.path ? '#0E1E32' : '#FFFFFF',
              '&:hover': {
                bgcolor: 'rgba(139, 224, 195, 0.15)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <ListItemText 
              primary={item.label} 
              sx={{ 
                fontWeight: location.pathname === item.path ? 600 : 400,
                '& .MuiTypography-root': {
                  fontSize: '1rem'
                }
              }} 
            />
          </ListItem>
        ))}
        {!user ? (
          <>
            <ListItem sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Login />}
                onClick={() => handleNavClick('/login')}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  borderWidth: 2,
                  fontWeight: 600,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }
                }}
              >
                Login
              </Button>
            </ListItem>
            <ListItem>
              <Button
                fullWidth
                variant="contained"
                startIcon={<RocketLaunch />}
                onClick={() => handleNavClick('/signup')}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                Get Started
              </Button>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Dashboard />}
                onClick={() => handleNavClick('/dashboard')}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  fontWeight: 600,
                  bgcolor: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)'
                  }
                }}
              >
                Dashboard
              </Button>
            </ListItem>
            <ListItem>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Logout />}
                onClick={handleLogout}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  borderWidth: 2,
                  fontWeight: 600,
                  color: 'error.main',
                  borderColor: 'error.main',
                  '&:hover': {
                    borderWidth: 2,
                    bgcolor: 'error.main',
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(244, 67, 54, 0.4)'
                  }
                }}
              >
                Logout
              </Button>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <AppBar
          position="fixed"
          sx={{
            background: scrolled 
              ? 'linear-gradient(135deg, rgba(14, 30, 50, 0.95) 0%, rgba(45, 197, 161, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(14, 30, 50, 0.90) 0%, rgba(45, 197, 161, 0.90) 100%)',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF',
            boxShadow: scrolled 
              ? '0 8px 32px rgba(14, 30, 50, 0.50)'
              : '0 2px 20px rgba(14, 30, 50, 0.35)',
            zIndex: theme.zIndex.drawer + 1,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
            height: '70px'
          }}
        >
          <Container maxWidth="lg">
            <Toolbar sx={{ 
              justifyContent: 'space-between', 
              height: '70px',
              px: { xs: 1, sm: 2 }
            }}>
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    position: 'relative'
                  }} 
                  onClick={() => navigate('/')}
                >
                  <Box
                    component="img"
                    src="/images/weighbuddy logo green background.png"
                    alt="WeighBuddy Logo"
                    sx={{
                      height: 44,
                      width: 'auto',
                      mr: 1.5,
                      borderRadius: 1,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}
                  />

                </Box>
              </motion.div
              >
              {/* Desktop Navigation */}
              {!isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ y: -2 }}
                    >
                      <Button
                        onClick={() => handleNavClick(item.path)}
                        sx={{
                          color: location.pathname === item.path ? '#2DC5A1' : '#FFFFFF',
                          fontWeight: location.pathname === item.path ? 700 : 500,
                          fontSize: '0.9rem',
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: location.pathname === item.path 
                              ? 'linear-gradient(135deg, rgba(139, 224, 195, 0.12) 0%, rgba(45, 197, 161, 0.12) 100%)'
                              : 'transparent',
                            borderRadius: 2,
                            transform: 'scaleX(0)',
                            transformOrigin: 'left',
                            transition: 'transform 0.3s ease'
                          },
                          '&:hover::before': {
                            transform: 'scaleX(1)'
                          },
                          '&:hover': {
                            color: '#8BE0C3',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(14, 30, 50, 0.30)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {item.label}
                      </Button>
                    </motion.div>
                  ))}
                </Box>
              )}

              {/* Desktop Auth Buttons */}
              {!isMobile && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  {!user ? (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outlined"
                          onClick={() => navigate('/login')}
                          startIcon={<Login />}
                          sx={{
                            fontWeight: 600,
                            borderRadius: 3,
                            px: 3,
                            py: 1,
                            borderWidth: 2,
                            fontSize: '0.85rem',
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                              borderWidth: 2,
                              bgcolor: 'primary.main',
                              color: 'white',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Login
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="contained"
                          onClick={() => navigate('/signup')}
                          startIcon={<RocketLaunch />}
                          sx={{
                            fontWeight: 700,
                            bgcolor: 'primary.main',
                            borderRadius: 3,
                            px: 3,
                            py: 1,
                            fontSize: '0.85rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Sign Up
                        </Button>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="contained"
                          onClick={() => navigate('/dashboard')}
                          startIcon={<Dashboard />}
                          sx={{
                            fontWeight: 600,
                            bgcolor: 'success.main',
                            borderRadius: 3,
                            px: 3,
                            py: 1,
                            fontSize: '0.85rem',
                            '&:hover': {
                              bgcolor: 'success.dark',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Dashboard
                        </Button>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconButton
                          onClick={handleProfileMenuOpen}
                          sx={{
                            bgcolor: 'background.paper',
                            border: '2px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              borderColor: 'primary.main',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                        </IconButton>
                      </motion.div>
                    </>
                  )}
                </Box>
              )}

              {/* Mobile Menu Button */}
              {isMobile && (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    onClick={() => setMobileOpen(true)}
                    sx={{
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <MenuIcon />
                  </IconButton>
                </motion.div>
              )}
            </Toolbar>
          </Container>
        </AppBar>
      </motion.div>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box'
          }
        }}
      >
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {drawer}
            </motion.div>
          )}
        </AnimatePresence>
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 150,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
          <Person sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      <Toolbar /> {/* Spacer */}
    </>
  );
};

export default Navbar;