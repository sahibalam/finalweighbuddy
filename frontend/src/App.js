import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StripeProvider } from './contexts/StripeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewWeigh from './pages/NewWeigh';
import DIYNewWeigh from './pages/DIYNewWeigh';
import DIYWelcome from './pages/DIYWelcome';
import DIYTowCaravanInfo from './pages/DIYTowCaravanInfo';
import DIYTowCaravanPortableTyres from './pages/DIYTowCaravanPortableTyres';
import DIYTowCaravanWeighbridgeInGround from './pages/DIYTowCaravanWeighbridgeInGround';
import DIYTowCaravanWeighbridgeGoWeigh from './pages/DIYTowCaravanWeighbridgeGoWeigh';
import DIYTowCaravanWeighbridgeAboveGround from './pages/DIYTowCaravanWeighbridgeAboveGround';
import DIYTowCaravanWeighbridgeCaravanRego from './pages/DIYTowCaravanWeighbridgeCaravanRego';
import DIYTowCaravanWeighbridgeCaravanConfirm from './pages/DIYTowCaravanWeighbridgeCaravanConfirm';
import DIYTowCaravanUnhitchedWeighbridgeAxle from './pages/DIYTowCaravanUnhitchedWeighbridgeAxle';
import DIYVehicleOnlyInfo from './pages/DIYVehicleOnlyInfo';
import DIYVehicleOnlyWeighbridgeAxle from './pages/DIYVehicleOnlyWeighbridgeAxle';
import DIYVehicleOnlyWeighbridgeGoWeigh from './pages/DIYVehicleOnlyWeighbridgeGoWeigh';
import DIYVehicleOnlyWeighbridgeAboveGround from './pages/DIYVehicleOnlyWeighbridgeAboveGround';
import DIYVehicleOnlyPortableTyres from './pages/DIYVehicleOnlyPortableTyres';
import DIYVehicleOnlyWeighbridgeRego from './pages/DIYVehicleOnlyWeighbridgeRego';
import DIYVehicleOnlyWeighbridgeConfirm from './pages/DIYVehicleOnlyWeighbridgeConfirm';
import DIYVehicleOnlyWeighbridgeResults from './pages/DIYVehicleOnlyWeighbridgeResults';
import WeighHistory from './pages/WeighHistory';
import WeighDetail from './pages/WeighDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import VehicleSearch from './pages/VehicleSearch';
import CaravanSearch from './pages/CaravanSearch';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import SubscriptionManagement from './pages/SubscriptionManagement';
import PaymentHistory from './pages/PaymentHistory';

function App() {

  return (
    <AuthProvider>
      <StripeProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/new-weigh" element={
            <PrivateRoute>
              <Layout>
                <DIYWelcome />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/vehicle-only-info" element={
            <PrivateRoute>
              <Layout>
                <DIYVehicleOnlyInfo />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-info" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanInfo />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-portable-tyres" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanPortableTyres />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-weighbridge-in-ground" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanWeighbridgeInGround />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-weighbridge-goweigh" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanWeighbridgeGoWeigh />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-weighbridge-above-ground" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanWeighbridgeAboveGround />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-weighbridge-caravan-rego" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanWeighbridgeCaravanRego />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-weighbridge-caravan-confirm" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanWeighbridgeCaravanConfirm />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-unhitched-weighbridge-axle" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanUnhitchedWeighbridgeAxle />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/vehicle-only-weighbridge-axle" element={
            <PrivateRoute>
              <Layout>
                <DIYVehicleOnlyWeighbridgeAxle />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/vehicle-only-weighbridge-goweigh" element={
            <PrivateRoute>
              <Layout>
                <DIYVehicleOnlyWeighbridgeGoWeigh />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/vehicle-only-weighbridge-above-ground" element={
            <PrivateRoute>
              <Layout>
                <DIYVehicleOnlyWeighbridgeAboveGround />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/vehicle-only-portable-tyres" element={
            <PrivateRoute>
              <Layout>
                <DIYVehicleOnlyPortableTyres />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/vehicle-only-weighbridge-rego" element={
            <PrivateRoute>
              <Layout>
                <DIYVehicleOnlyWeighbridgeRego />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/vehicle-only-weighbridge-confirm" element={
            <PrivateRoute>
              <Layout>
                <DIYVehicleOnlyWeighbridgeConfirm />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/vehicle-only-weighbridge-results" element={
            <PrivateRoute>
              <Layout>
                <DIYVehicleOnlyWeighbridgeResults />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/diy-weigh" element={
            <PrivateRoute>
              <Layout>
                <DIYNewWeigh />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/professional-weigh" element={
            <PrivateRoute>
              <Layout>
                <NewWeigh />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/weigh-history" element={
            <PrivateRoute>
              <Layout>
                <WeighHistory />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/weigh/:id" element={
            <PrivateRoute>
              <Layout>
                <WeighDetail />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/payment-history" element={
            <PrivateRoute>
              <Layout>
                <PaymentHistory />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/subscription" element={
            <PrivateRoute>
              <Layout>
                <SubscriptionManagement />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/vehicle-search" element={
            <PrivateRoute>
              <Layout>
                <VehicleSearch />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/caravan-search" element={
            <PrivateRoute>
              <Layout>
                <CaravanSearch />
              </Layout>
            </PrivateRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <PrivateRoute adminOnly>
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="overview" element={<AdminDashboard />} />
            <Route path="users" element={<AdminDashboard />} />
            <Route path="vehicles" element={<AdminDashboard />} />
            <Route path="caravans" element={<AdminDashboard />} />
            <Route path="weighs" element={<AdminDashboard />} />
            <Route path="payments" element={<AdminDashboard />} />
            <Route path="submissions" element={<AdminDashboard />} />
          </Route>
          
          {/* Admin subroutes for reports and settings */}
          <Route path="/admin/reports" element={
            <PrivateRoute adminOnly>
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/admin/settings" element={
            <PrivateRoute adminOnly>
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/admin/submissions" element={
            <PrivateRoute adminOnly>
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          } />
        </Routes>
      </StripeProvider>
    </AuthProvider>
  );
}

export default App; 