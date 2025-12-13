import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  DirectionsCar as VehicleIcon,
  Home as CaravanIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const WeighHistory = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [selectedWeigh, setSelectedWeigh] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch weigh history
  const { data: weighHistory, isLoading, error, refetch } = useQuery(
    ['weighHistory', page, rowsPerPage, searchTerm, statusFilter, complianceFilter],
    async () => {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(complianceFilter !== 'all' && { compliance: complianceFilter })
      });

      const response = await axios.get(`/api/weighs?${params}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  );

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle status filter
  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  // Handle compliance filter
  const handleComplianceFilter = (event) => {
    setComplianceFilter(event.target.value);
    setPage(0);
  };

  // Open weigh detail dialog
  const handleViewDetail = (weigh) => {
    setSelectedWeigh(weigh);
    setDetailDialogOpen(true);
  };

  // Navigate to weigh detail page
  const handleViewFullDetail = (weighId) => {
    navigate(`/weigh/${weighId}`);
  };

  // Handle download PDF
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
      const statusText = (measured, limit) => measured <= limit ? 'OK' : 'OVER'; const statusColor = (measured, limit) => measured <= limit ? green : red;

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
      alert('Error downloading PDF report');
    }
  };

  // Get compliance status chip - calculate dynamically based on actual data
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
      month: 'short',
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
        Error loading weigh history: {error.message}
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
        <Typography variant="h4" gutterBottom>
          Weigh History
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          View and manage your weigh entries
        </Typography>
      </motion.div>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by customer name, vehicle, or caravan..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilter}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Compliance</InputLabel>
              <Select
                value={complianceFilter}
                label="Compliance"
                onChange={handleComplianceFilter}
              >
                <MenuItem value="all">All Compliance</MenuItem>
                <MenuItem value="compliant">Compliant</MenuItem>
                <MenuItem value="non-compliant">Non-Compliant</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => refetch()}
              startIcon={<FilterListIcon />}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Weigh History Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Caravan</TableCell>
                <TableCell>Total Weight</TableCell>
                <TableCell>Compliance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {weighHistory?.weighs?.length > 0 ? (
                weighHistory.weighs.map((weigh) => (
                  <TableRow key={weigh._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ mr: 1, fontSize: 'small' }} />
                        {formatDate(weigh.createdAt)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, fontSize: 'small' }} />
                        {weigh.customer?.name || weigh.customerName || 'N/A'}
                      </Box>
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
                            onClick={() => handleViewDetail(weigh)}
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
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No weigh entries found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm || statusFilter !== 'all' || complianceFilter !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'Start by creating your first weigh entry'}
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
          count={weighHistory?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Weigh Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
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
                      <TableCell>Limit</TableCell>
                      <TableCell>Difference</TableCell>
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
                        ok: selectedWeigh.caravanData?.gtm > 0 ? (selectedWeigh.caravanWeight || 0) <= (selectedWeigh.caravanData?.gtm || 0) : true
                      }
                    ].map((row) => {
                      const diff = (row.limit || 0) - (row.actual || 0);
                      return (
                        <TableRow key={row.name}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.actual.toFixed ? row.actual.toFixed(0) : row.actual} kg</TableCell>
                          <TableCell>{row.limit.toFixed ? row.limit.toFixed(0) : row.limit} kg</TableCell>
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
                  // Calculate overall compliance based on individual checks (same as DIYComplianceReport.js)
                  const gvmOk = (selectedWeigh.vehicleWeightUnhitched || 0) <= (selectedWeigh.vehicleData?.gvm || 0);
                  const tbmOk = (selectedWeigh.towBallWeight || 0) <= (selectedWeigh.vehicleData?.tbm || (selectedWeigh.caravanData?.atm * 0.1) || 0);
                  const atmOk = ((selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0)) <= (selectedWeigh.caravanData?.atm || 0);
                  const gcmOk = ((selectedWeigh.vehicleWeightUnhitched || 0) + ((selectedWeigh.caravanWeight || 0) + (selectedWeigh.towBallWeight || 0))) <= (selectedWeigh.vehicleData?.gcm || 0);
                  const gtmOk = selectedWeigh.caravanData?.gtm > 0 ? (selectedWeigh.caravanWeight || 0) <= (selectedWeigh.caravanData?.gtm || 0) : true;
                  
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
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeighHistory;