import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  DirectionsCar as VehicleIcon,
  Home as CaravanIcon,
  Scale as ScaleIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { jsPDF } from 'jspdf';

const WeighDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch weigh detail
  const { data: weighResponse, isLoading, error } = useQuery(
    ['weighDetail', id],
    async () => {
      const response = await axios.get(`/api/weighs/${id}`);
      return response.data;
    },
    {
      refetchOnWindowFocus: false
    }
  );

  const weigh = weighResponse?.weigh;

  // Delete weigh mutation
  const deleteMutation = useMutation(
    async () => {
      await axios.delete(`/api/weighs/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['weighHistory']);
        navigate('/weigh-history');
      },
      onError: (error) => {
        console.error('Error deleting weigh:', error);
      }
    }
  );

  // Handle delete
  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMutation.mutateAsync();
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigate(`/edit-weigh/${id}`);
  };

  // Handle download PDF
  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      const weigh = weighResponse?.weigh;
      if (!weigh) throw new Error('Weigh data not loaded');

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const green = [195, 230, 203];
      const yellow = [255, 244, 163];
      const red = [255, 205, 210];
      const grey = [240, 240, 240];
      const drawBox = (x, y, w, h, color) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(x, y, w, h, 'F');
        doc.setDrawColor(0);
        doc.rect(x, y, w, h);
      };

      const comp = weigh.compliance || {};
      const vehComp = comp.vehicle || {};
      const cavComp = comp.caravan || {};
      const combComp = comp.combination || {};
      const v = weigh.vehicle || weigh.vehicleData || {};
      const c = weigh.caravan || weigh.caravanData || {};
      const w = weigh.weights || {};

      const vehicleOnly = vehComp.gvm?.actual ?? (w.totalVehicle || weigh.vehicleWeightUnhitched || 0);
      const caravanOnly = cavComp.gtm?.actual ?? (w.totalCaravan || weigh.caravanWeight || 0);
      const gvmAttached = combComp.gcm?.actual ?? (w.grossCombination || 0);
      const tbm = w.tbm || weigh.towBallWeight || Math.max(0, gvmAttached - vehicleOnly);
      const measuredATM = cavComp.atm?.actual ?? (caravanOnly + tbm);
      const gtmMeasured = cavComp.gtm?.actual ?? caravanOnly;
      const gcmMeasured = combComp.gcm?.actual ?? (vehicleOnly + measuredATM);

      const gvmLimit = vehComp.gvm?.limit ?? (v.gvm || 0);
      const gcmLimit = combComp.gcm?.limit ?? (v.gcm || 0);
      const btcLimit = v.btc || 0;
      const tbmLimit = v.tbm || (c.atm ? (c.atm || 0) * 0.1 : 0);
      const atmLimit = cavComp.atm?.limit ?? (c.atm || 0);
      const gtmLimit = cavComp.gtm?.limit ?? (c.gtm || 0);

      const statusText = (measured, limit) => measured <= limit ? 'OK' : 'OVER';
      const statusColor = (measured, limit) => measured <= limit ? green : red;

      doc.setFontSize(18);
      doc.text('WeighBuddy • Detailed Compliance Report', 10, 15);
      doc.setFontSize(11);
      doc.text(`Report ID: ${weigh._id || '-'}`, 10, 22);
      doc.text(`Date: ${weigh.createdAt ? new Date(weigh.createdAt).toLocaleDateString('en-AU') : '-'}`, 90, 22);
      doc.text(`Customer: ${weigh.customer?.name || weigh.customerName || 'DIY User'}`, 170, 22);

      const startX = 10;
      const startY = 35;
      const colW = 40;
      const gap = 6;
      const drawMetric = (label, measured, limit, x) => {
        drawBox(x, startY, colW, 8, grey);
        doc.setFontSize(11);
        doc.text(label, x + 3, startY + 5.5);
        drawBox(x, startY + 9, colW, 9, yellow);
        doc.setFontSize(10);
        doc.text(`Compliance: ${limit || 0}`, x + 3, startY + 15);
        drawBox(x, startY + 19, colW, 9, grey);
        doc.text(`Measured: ${Math.round(measured)}`, x + 3, startY + 25);
        const diff = (limit || 0) - (measured || 0);
        drawBox(x, startY + 29, colW, 9, statusColor(measured || 0, limit || 0));
        doc.text(`Result: ${diff}`, x + 3, startY + 35);
        doc.text(statusText(measured || 0, limit || 0), x + colW - 10, startY + 35);
      };

      const frontAxleMeasured = vehComp.frontAxle?.actual ?? (w.frontAxle || 0);
      const frontAxleLimit = vehComp.frontAxle?.limit ?? 0;
      const rearAxleMeasured = vehComp.rearAxle?.actual ?? (w.rearAxle || 0);
      const rearAxleLimit = vehComp.rearAxle?.limit ?? 0;

      let x = startX;
      drawMetric('Front Axle', frontAxleMeasured, frontAxleLimit, x);
      x += colW + gap;
      drawMetric('GVM', vehicleOnly, gvmLimit, x);
      x += colW + gap;
      drawMetric('Rear Axle', rearAxleMeasured, rearAxleLimit, x);
      x += colW + gap;
      drawMetric('TBM', tbm, tbmLimit, x);
      x += colW + gap;
      drawMetric('GCM', gcmMeasured, gcmLimit, x);
      x += colW + gap;
      drawMetric('GTM', gtmMeasured, gtmLimit, x);
      x += colW + gap;

      const axlesX = x;
      const axlesY = startY;
      const axlesW = colW;
      drawBox(axlesX, axlesY, axlesW, 8, grey);
      doc.setFontSize(11);
      doc.text('Axles', axlesX + 3, axlesY + 5.5);
      const cavFront = cavComp.frontAxleGroup?.actual ?? (w.frontAxleGroup || 0);
      const cavRear = cavComp.rearAxleGroup?.actual ?? (w.rearAxleGroup || 0);
      drawBox(axlesX, axlesY + 9, axlesW, 9, yellow);
      doc.setFontSize(10);
      doc.text(`${Math.round(cavFront)}   ${Math.round(cavRear)}`, axlesX + 3, axlesY + 15);
      drawBox(axlesX, axlesY + 19, axlesW, 9, grey);
      doc.text('Measured', axlesX + 3, axlesY + 25);
      drawBox(axlesX, axlesY + 29, axlesW, 9, green);
      doc.text('OK', axlesX + axlesW - 10, axlesY + 35);
      x += colW + gap;

      drawMetric('ATM', measuredATM, atmLimit, x);
      x += colW + gap;
      drawMetric('BTC', gtmMeasured, btcLimit, x);
      x += colW + gap;

      const advisoryX = startX;
      const advisoryY = startY + 42;
      const advisoryW = 2 * colW + gap;
      drawBox(advisoryX, advisoryY, advisoryW, 36, grey);
      doc.setFontSize(11);
      doc.text('Advisory Only', advisoryX + 3, advisoryY + 6);
      const vanToCar = vehicleOnly > 0 ? Math.round((caravanOnly / vehicleOnly) * 100) : 0;
      const tbmPct = atmLimit > 0 ? Math.round((tbm / atmLimit) * 100) : 0;
      doc.setFontSize(10);
      doc.text(`Van to Car Ratio <85%   ${vanToCar}%`, advisoryX + 3, advisoryY + 14);
      doc.text(`Tow Ball % 8 to 10%     ${tbmPct}%`, advisoryX + 3, advisoryY + 21);
      const possibleSpare = Math.max(0, atmLimit - measuredATM);
      doc.text(`Actual Axle Group      ${gtmMeasured}`, advisoryX + 3, advisoryY + 28);
      doc.text(`Possible Spare Capacity ${possibleSpare}`, advisoryX + 3, advisoryY + 35);

      const btcPanelX = advisoryX + advisoryW + gap;
      drawBox(btcPanelX, advisoryY, colW + 10, 36, grey);
      doc.setFontSize(11);
      doc.text('Advisory BTC Ratio', btcPanelX + 3, advisoryY + 6);
      const btcRatio = btcLimit > 0 ? Math.round((gtmMeasured / btcLimit) * 100) : 0;
      doc.setFontSize(10);
      doc.text('IDEAL < 80%', btcPanelX + 3, advisoryY + 14);
      doc.text(`${btcRatio}%`, btcPanelX + 3, advisoryY + 22);

      const defsX = btcPanelX + (colW + 10) + gap;
      const defsW = 260 - defsX;
      drawBox(defsX, advisoryY, defsW, 36, grey);
      doc.setFontSize(9);
      doc.text('IMPORTANT', defsX + 3, advisoryY + 6);
      doc.text('Information provided is true and correct at the time of weighing.', defsX + 3, advisoryY + 12);
      doc.text('This document is advisory only and cannot be used for licensing or insurance purposes.', defsX + 3, advisoryY + 17);
      doc.text('Resolve any overloading issues before driving the vehicle further.', defsX + 3, advisoryY + 22);

      doc.setFontSize(9);
      const legendY = advisoryY + 40;
      doc.text('(GVM) Gross Vehicle Mass: laden vehicle weight as measured under its wheels.', 10, legendY);
      doc.text('(TBM) Tow Ball Mass: weight imposed on the tow vehicle by coupling.', 10, legendY + 5);
      doc.text('(GTM) Gross Trailer Mass: weight of the laden caravan on its wheels.', 10, legendY + 10);
      doc.text('(ATM) Aggregate Trailer Mass: total of caravan including TBM.', 10, legendY + 15);
      doc.text('(GCM) Gross Combined Mass: total weight of both tow vehicle and caravan.', 10, legendY + 20);
      doc.text('(BTC) Braked Towing Capacity: maximum weight allowed to tow as per vehicle.', 10, legendY + 25);

      doc.save(`weigh-report-${id}.pdf`);
    } catch (error) {
      alert('Error downloading PDF report');
    } finally {
      setLoading(false);
    }
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get compliance status chip - calculate dynamically based on actual data
  const getComplianceChip = (weigh) => {
    if (!weigh) return <Chip label="Unknown" color="default" size="large" />;
    
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
      <Chip label="COMPLIANT" color="success" size="large" icon={<CheckCircleIcon />} /> :
      <Chip label="NON-COMPLIANT" color="error" size="large" icon={<ErrorIcon />} />;
  };

  // Get status chip
  const getStatusChip = (status) => {
    switch (status) {
      case 'completed':
        return <Chip label="Completed" color="success" size="small" />;
      case 'draft':
        return <Chip label="Draft" color="warning" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="info" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        Error loading weigh details: {error.message}
      </Alert>
    );
  }

  if (!weigh) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Weigh entry not found
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Weigh Entry Details
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Weigh ID: {weigh._id}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Download PDF">
              <IconButton onClick={handleDownloadPDF}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton onClick={handlePrint}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            {user?.userType === 'admin' && (
              <>
                <Tooltip title="Edit">
                  <IconButton onClick={handleEdit}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton 
                    color="error"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>

        {/* Compliance Status */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: (() => {
          // Calculate compliance dynamically for background color
          const gvmOk = (weigh.vehicleWeightUnhitched || 0) <= (weigh.vehicleData?.gvm || 0);
          const tbmOk = (weigh.towBallWeight || 0) <= (weigh.vehicleData?.tbm || (weigh.caravanData?.atm * 0.1) || 0);
          const atmOk = (weigh.caravanWeight || 0) <= (weigh.caravanData?.atm || 0);
          const gcmOk = ((weigh.vehicleWeightUnhitched || 0) + (weigh.caravanWeight || 0)) <= (weigh.vehicleData?.gcm || 0);
          const calculatedGTM = (weigh.caravanWeight || 0) - (weigh.towBallWeight || 0);
          const gtmOk = weigh.caravanData?.gtm > 0 ? calculatedGTM <= (weigh.caravanData?.gtm || 0) : true;
          const overallOk = gvmOk && tbmOk && atmOk && gcmOk && gtmOk;
          return overallOk ? 'success.light' : 'error.light';
        })() }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h5" gutterBottom>
                Compliance Status
              </Typography>
                                  {getComplianceChip(weigh)}
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(weigh.createdAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {getStatusChip(weigh.status)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Customer Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Customer Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">
                    {weigh.customer?.name || weigh.customerName || 'N/A'}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ mr: 1, fontSize: 'small' }} />
                    {weigh.customer?.phone || weigh.customerPhone || 'N/A'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1, fontSize: 'small' }} />
                    {weigh.customer?.email || weigh.customerEmail || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Equipment Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <VehicleIcon sx={{ mr: 1 }} />
                  Equipment Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Vehicle
                  </Typography>
                  <Typography variant="body1">
                    {weigh.vehicle?.make} {weigh.vehicle?.model} ({weigh.vehicle?.year})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    GVM: {weigh.vehicle?.gvm}kg | GCM: {weigh.vehicle?.gcm}kg
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Caravan
                  </Typography>
                  <Typography variant="body1">
                    {weigh.caravan?.make} {weigh.caravan?.model} ({weigh.caravan?.year})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ATM: {weigh.caravan?.atm}kg | GTM: {weigh.caravan?.gtm}kg
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Weight Measurements */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ScaleIcon sx={{ mr: 1 }} />
                  Weight Measurements
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Vehicle Weights
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Front Axle
                      </Typography>
                      <Typography variant="h6">
                        {weigh.weights.frontAxle}kg
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Rear Axle
                      </Typography>
                      <Typography variant="h6">
                        {weigh.weights.rearAxle}kg
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Vehicle Weight
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {weigh.weights.totalVehicle}kg
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Caravan Weights
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Front Axle Group
                      </Typography>
                      <Typography variant="h6">
                        {weigh.weights.frontAxleGroup}kg
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Rear Axle Group
                      </Typography>
                      <Typography variant="h6">
                        {weigh.weights.rearAxleGroup}kg
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Caravan Weight
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {weigh.weights.totalCaravan}kg
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Gross Combination Weight
                      </Typography>
                      <Typography variant="h4" color="primary" fontWeight="bold">
                        {weigh.weights.grossCombination}kg
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Compliance Analysis */}
          {weigh.compliance && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 1 }} />
                    Compliance Analysis
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Vehicle Compliance
                      </Typography>
                      {Object.entries(weigh.compliance.vehicle || {}).map(([key, value]) => (
                        <Box key={key} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">
                              {key === 'gvm' ? 'GVM' : key === 'frontAxle' ? 'Front Axle' : 'Rear Axle'}
                            </Typography>
                            {value.compliant ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <ErrorIcon color="error" />
                            )}
                          </Box>
                          <Typography variant="h6">
                            {value.actual}kg / {value.limit}kg
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {value.percentage}% of capacity
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Caravan Compliance
                      </Typography>
                      {Object.entries(weigh.compliance.caravan || {}).map(([key, value]) => (
                        <Box key={key} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">
                              {key === 'atm' ? 'ATM' : key === 'frontAxleGroup' ? 'Front Axle Group' : 'Rear Axle Group'}
                            </Typography>
                            {value.compliant ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <ErrorIcon color="error" />
                            )}
                          </Box>
                          <Typography variant="h6">
                            {value.actual}kg / {value.limit}kg
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {value.percentage}% of capacity
                          </Typography>
                        </Box>
                      ))}
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Combination Compliance
                        </Typography>
                        {Object.entries(weigh.compliance.combination || {}).map(([key, value]) => (
                          <Box key={key}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2">
                                {key === 'gcm' ? 'GCM' : key}
                              </Typography>
                              {value.compliant ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <ErrorIcon color="error" />
                              )}
                            </Box>
                            <Typography variant="h6">
                              {value.actual}kg / {value.limit}kg
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {value.percentage}% of capacity
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Notes */}
          {weigh.notes && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    {weigh.notes}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this weigh entry? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeighDetail;