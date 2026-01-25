import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StripeProvider } from './contexts/StripeContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AccountTypeSelection from './pages/AccountTypeSelection';
import Dashboard from './pages/Dashboard';
import NewWeigh from './pages/NewWeigh';
import ProfessionalWeighStart from './pages/ProfessionalWeighStart';
import ProfessionalClientStart from './pages/ProfessionalClientStart';
import ProfessionalVehicleOnlyStart from './pages/ProfessionalVehicleOnlyStart';
import ProfessionalVehicleOnlyInfo from './pages/ProfessionalVehicleOnlyInfo';
import ProfessionalVehicleOnlyWeighbridgeInGround from './pages/ProfessionalVehicleOnlyWeighbridgeInGround';
import ProfessionalVehicleOnlyWeighbridgeInGroundUnhitched from './pages/ProfessionalVehicleOnlyWeighbridgeInGroundUnhitched';
import ProfessionalVehicleOnlyWeighbridgeInGroundPayment from './pages/ProfessionalVehicleOnlyWeighbridgeInGroundPayment';
import ProfessionalVehicleOnlyWeighbridgeInGroundRego from './pages/ProfessionalVehicleOnlyWeighbridgeInGroundRego';
import ProfessionalVehicleOnlyWeighbridgeInGroundConfirm from './pages/ProfessionalVehicleOnlyWeighbridgeInGroundConfirm';
import ProfessionalVehicleOnlyWeighbridgeGoWeigh from './pages/ProfessionalVehicleOnlyWeighbridgeGoWeigh';
import ProfessionalVehicleOnlyWeighbridgeGoWeighPayment from './pages/ProfessionalVehicleOnlyWeighbridgeGoWeighPayment';
import ProfessionalVehicleOnlyWeighbridgeGoWeighRego from './pages/ProfessionalVehicleOnlyWeighbridgeGoWeighRego';
import ProfessionalVehicleOnlyWeighbridgeGoWeighConfirm from './pages/ProfessionalVehicleOnlyWeighbridgeGoWeighConfirm';
import ProfessionalVehicleOnlyPortableTyres from './pages/ProfessionalVehicleOnlyPortableTyres';
import ProfessionalTowPortableTyresVCI01 from './pages/ProfessionalTowPortableTyresVCI01';
import ProfessionalTowPortableTyresVCI02 from './pages/ProfessionalTowPortableTyresVCI02';
import ProfessionalTowPortableTyresCaravanRego from './pages/ProfessionalTowPortableTyresCaravanRego';
import ProfessionalTowPortableTyresCaravanConfirm from './pages/ProfessionalTowPortableTyresCaravanConfirm';
import ProfessionalVehicleOnlyPortableTyresPayment from './pages/ProfessionalVehicleOnlyPortableTyresPayment';
import ProfessionalVehicleOnlyPortableTyresRego from './pages/ProfessionalVehicleOnlyPortableTyresRego';
import ProfessionalVehicleOnlyPortableTyresConfirm from './pages/ProfessionalVehicleOnlyPortableTyresConfirm';
import DIYNewWeigh from './pages/DIYNewWeigh';
import DIYWelcome from './pages/DIYWelcome';
import DIYTowCaravanInfo from './pages/DIYTowCaravanInfo';
import DIYTowCaravanPortableTyres from './pages/DIYTowCaravanPortableTyres';
import DIYTowCaravanPortableTyresVCI01 from './pages/DIYTowCaravanPortableTyresVCI01';
import DIYTowCaravanPortableTyresVCI02 from './pages/DIYTowCaravanPortableTyresVCI02';
import DIYTowCaravanWeighbridgeInGround from './pages/DIYTowCaravanWeighbridgeInGround';
import DIYTowCaravanWeighbridgeGoWeigh from './pages/DIYTowCaravanWeighbridgeGoWeigh';
import DIYTowCaravanWeighbridgeAboveGround from './pages/DIYTowCaravanWeighbridgeAboveGround';
import DIYTowCaravanWeighbridgeCaravanRego from './pages/DIYTowCaravanWeighbridgeCaravanRego';
import DIYTowCaravanWeighbridgeCaravanConfirm from './pages/DIYTowCaravanWeighbridgeCaravanConfirm';
import DIYTowCaravanUnhitchedWeighbridgeAxle from './pages/DIYTowCaravanUnhitchedWeighbridgeAxle';
import DIYCaravanOnlyInfo from './pages/DIYCaravanOnlyInfo';
import DIYCaravanOnlyPortableTyres from './pages/DIYCaravanOnlyPortableTyres';
import DIYCaravanOnlyWeighbridgeInGround from './pages/DIYCaravanOnlyWeighbridgeInGround';
import DIYCaravanOnlyWeighbridgeGoWeigh from './pages/DIYCaravanOnlyWeighbridgeGoWeigh';
import DIYCaravanOnlyWeighbridgeAboveGround from './pages/DIYCaravanOnlyWeighbridgeAboveGround';
import DIYCaravanOnlyRego from './pages/DIYCaravanOnlyRego';
import DIYCaravanOnlyConfirm from './pages/DIYCaravanOnlyConfirm';
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
          <Route path="/signup" element={<AccountTypeSelection />} />
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

          <Route path="/caravan-only-info" element={
            <PrivateRoute>
              <Layout>
                <DIYCaravanOnlyInfo />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/caravan-only-portable-tyres" element={
            <PrivateRoute>
              <Layout>
                <DIYCaravanOnlyPortableTyres />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/caravan-only-weighbridge-in-ground" element={
            <PrivateRoute>
              <Layout>
                <DIYCaravanOnlyWeighbridgeInGround />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/caravan-only-weighbridge-goweigh" element={
            <PrivateRoute>
              <Layout>
                <DIYCaravanOnlyWeighbridgeGoWeigh />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/caravan-only-weighbridge-above-ground" element={
            <PrivateRoute>
              <Layout>
                <DIYCaravanOnlyWeighbridgeAboveGround />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/caravan-only-rego" element={
            <PrivateRoute>
              <Layout>
                <DIYCaravanOnlyRego />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/caravan-only-confirm" element={
            <PrivateRoute>
              <Layout>
                <DIYCaravanOnlyConfirm />
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

          <Route path="/tow-caravan-portable-tyres-vci01" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanPortableTyresVCI01 />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/tow-caravan-portable-tyres-vci02" element={
            <PrivateRoute>
              <Layout>
                <DIYTowCaravanPortableTyresVCI02 />
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

          <Route path="/professional-clients" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalClientStart />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/professional-weigh-start" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalWeighStart />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/professional-weigh-vehicle-only" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyStart />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/professional-weigh" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalWeighStart />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/professional-vehicle-only-weighbridge-in-ground" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeInGround />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-weighbridge-in-ground-unhitched" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeInGroundUnhitched />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-weighbridge-in-ground-payment" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeInGroundPayment />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-weighbridge-in-ground-rego" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeInGroundRego />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-weighbridge-in-ground-confirm" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeInGroundConfirm />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/professional-vehicle-only-weighbridge-goweigh" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeGoWeigh />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-weighbridge-goweigh-payment" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeGoWeighPayment />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-weighbridge-goweigh-rego" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeGoWeighRego />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-weighbridge-goweigh-confirm" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyWeighbridgeGoWeighConfirm />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/professional-vehicle-only-portable-tyres" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyPortableTyres />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-portable-tyres-payment" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyPortableTyresPayment />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-portable-tyres-rego" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyPortableTyresRego />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-vehicle-only-portable-tyres-confirm" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyPortableTyresConfirm />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/professional-tow-portable-tyres-vci01" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalTowPortableTyresVCI01 />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-tow-portable-tyres-vci02" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalTowPortableTyresVCI02 />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/professional-tow-portable-tyres-caravan-rego" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalTowPortableTyresCaravanRego />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/professional-tow-portable-tyres-caravan-confirm" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalTowPortableTyresCaravanConfirm />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/professional-vehicle-only-info" element={
            <PrivateRoute>
              <Layout>
                <ProfessionalVehicleOnlyInfo />
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