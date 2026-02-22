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
import { useQuery } from 'react-query';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import DIYVehicleOnlyWeighbridgeResults from './DIYVehicleOnlyWeighbridgeResults';

const WeighHistory = () => {
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
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      staleTime: 0
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

  // Build results state from weigh data for the detail dialog
  const buildResultsStateFromWeigh = (weigh) => {
    const v = weigh.vehicle || weigh.vehicleData || {};
    const c = weigh.caravan || weigh.caravanData || {};
    const w = weigh.weights || {};
    const raw = w?.raw || {};
    const compliance = weigh.compliance || {};
    const vehComp = compliance.vehicle || {};
    const cavComp = compliance.caravan || {};
    const combComp = compliance.combination || {};

    const safeNum = (val) => {
      if (val == null || val === '') return null;
      const n = Number(val);
      return Number.isFinite(n) ? n : null;
    };

    const descriptionParts = [v.year, v.make, v.model, v.variant].filter(Boolean);
    const description = descriptionParts.length ? descriptionParts.join(' ') : (v.description || '');

    const hasCaravan =
      (c && Object.keys(c).length > 0) ||
      Boolean(
        weigh.caravanNumberPlate ||
        weigh.caravanState ||
        weigh.caravanRegistryId ||
        weigh.caravan
      );

    const weighingSelection =
      w.diyWeighingSelection || (hasCaravan ? 'tow_vehicle_and_caravan' : 'vehicle_only');

    // Measured values (hitched): prefer compliance.vehicle.*.actual, then weights.*
    const measuredFrontAxle =
      vehComp.frontAxle?.actual != null
        ? safeNum(vehComp.frontAxle.actual)
        : safeNum(w.frontAxle) || 0;
    const measuredRearAxle =
      vehComp.rearAxle?.actual != null
        ? safeNum(vehComp.rearAxle.actual)
        : safeNum(w.rearAxle) || 0;
    const measuredGvm =
      vehComp.gvm?.actual != null
        ? safeNum(vehComp.gvm.actual)
        : safeNum(w.totalVehicle) || 0;

    // Overall caravan / combination measured values used in multiple
    // flows (PDF, pro history, DIY embedded history).
    // IMPORTANT: for professional-created records, the authoritative measured
    // totals are often already persisted on weights.* (tbm, totalCaravan,
    // grossCombination). Prefer those first so pro history and DIY views match.
    const vehicleOnlyTotal =
      safeNum(w.totalVehicle) ?? safeNum(weigh.vehicleWeightUnhitched) ?? 0;
    const caravanOnlyTotal =
      safeNum(w.totalCaravan) ?? safeNum(weigh.caravanWeight) ?? 0;

    const tbmOverall =
      safeNum(w.tbm) ??
      safeNum(weigh.towBallWeight) ??
      safeNum(c.tbmMeasured) ??
      (vehComp.tbm?.actual != null ? safeNum(vehComp.tbm.actual) : null) ??
      0;

    const gtmOverall =
      safeNum(w.totalCaravan) ??
      (cavComp.gtm?.actual != null ? safeNum(cavComp.gtm.actual) : null) ??
      caravanOnlyTotal;

    const atmOverall =
      (cavComp.atm?.actual != null ? safeNum(cavComp.atm.actual) : null) ??
      (gtmOverall + (tbmOverall || 0));

    const gcmOverall =
      safeNum(w.grossCombination) ??
      (combComp.gcm?.actual != null ? safeNum(combComp.gcm.actual) : null) ??
      (vehicleOnlyTotal + atmOverall);

    // Unhitched values (used for Tow Vehicle Unhitched rows when available).
    const unhitchedGvmRaw =
      safeNum(v.gvmUnhitched) ??
      safeNum(w.vehicleOnlyTotal) ??
      safeNum(weigh.vehicleWeightUnhitched);

    // Professional in-ground individual axle weights frequently persist the
    // tow vehicle readings directly on weights.frontAxle/rearAxle/totalVehicle,
    // but do not populate the vehicleOnly* fields. For embedded history we
    // still want the Unhitched section to show those measured values instead
    // of 0.
    const unhitchedFrontAxleRaw =
      safeNum(v.frontAxleUnhitched) ??
      safeNum(w.vehicleOnlyFrontAxle) ??
      safeNum(w.frontAxle);
    const unhitchedRearAxleRaw =
      safeNum(v.rearAxleUnhitched) ??
      safeNum(w.vehicleOnlyRearAxle) ??
      safeNum(w.rearAxle);

    // Normalize customer fields
    const client = weigh.clientUserId || {};
    const normalizedCustomerName =
      client.name || weigh.customer?.name || weigh.customerName || '';
    const normalizedCustomerPhone =
      client.phone || weigh.customerPhone || weigh.customer?.phone || '';
    const normalizedCustomerEmail =
      client.email || weigh.customerEmail || weigh.customer?.email || '';

    // Resolve tow ball mass: prefer the same sources used in the
    // detailed compliance report and fleet flows, then fall back to
    // the legacy top-level towBallWeight.
    const resolveTowBallMass = () => {
      // 1) Explicit TBM saved on weights (common for DIY/fleet flows)
      const fromWeightsTbm = safeNum(w.tbm);
      if (fromWeightsTbm != null && fromWeightsTbm > 0) return fromWeightsTbm;

      // 2) TBM measured/persisted on caravanData (tbmMeasured)
      const fromCaravanMeasured = safeNum(c.tbmMeasured);
      if (fromCaravanMeasured != null && fromCaravanMeasured > 0) return fromCaravanMeasured;

      // 3) Legacy top-level towBallWeight (may be 0 on some records)
      const legacy = safeNum(weigh.towBallWeight);
      return legacy != null ? legacy : 0;
    };

    let resolvedTowBallMass = resolveTowBallMass();

    // Vehicle-only results do not use TBM
    if (weighingSelection === 'vehicle_only') {
      resolvedTowBallMass = null;
    }

    // Align the returned shape with what DIYVehicleOnlyWeighbridgeResults
    // expects as its resolvedState (top-level fields, not nested under vehicle).
    // For DIY/fleet portable flows, the method is often persisted as
    // weights.diyMethodSelection rather than weights.methodSelection.
    const methodSelection =
      w.diyMethodSelection || w.methodSelection || weigh.methodSelection || '';

    const axleWeigh =
      w.axleWeigh || weigh.axleWeigh || null;

    const overrideState = {
      // Persistence / identity
      weighId: weigh._id || null,
      alreadySaved: true,

      // Basic vehicle identity
      rego: weigh.vehicleNumberPlate || v.numberPlate || v.plate || '',
      state: v.state || weigh.vehicleRegistryId?.state || weigh.vehicleState || '',
      description,
      vin: v.vin || '',

      // Capacity values from Info-Agent / lookup / compliance
      frontAxleCapacity: v.fawr || v.frontAxleCapacity || vehComp.frontAxle?.limit || '',
      rearAxleCapacity: v.rawr || v.rearAxleCapacity || vehComp.rearAxle?.limit || '',
      gvmCapacity: v.gvm || '',
      gcmCapacity: v.gcm || '',
      btcCapacity: v.btc || '',
      tbmCapacity: v.tbm || '',

      // Measured axle / GVM values
      measuredFrontAxle: measuredFrontAxle != null ? measuredFrontAxle : 0,
      measuredRearAxle: measuredRearAxle != null ? measuredRearAxle : 0,
      measuredGvm: measuredGvm != null ? measuredGvm : 0,

      // Overall caravan / combination measured values derived above. These
      // are especially important for embedded professional tow+caravan
      // in-ground flows where axleWeigh may not be persisted.
      atmMeasuredOverall: atmOverall != null ? atmOverall : 0,
      gtmMeasuredOverall: gtmOverall != null ? gtmOverall : 0,
      gcmMeasuredOverall: gcmOverall != null ? gcmOverall : 0,

      // Unhitched values forwarded from vehicleData/weights when present
      unhitchedGvm: unhitchedGvmRaw != null ? unhitchedGvmRaw : 0,
      unhitchedFrontAxle: unhitchedFrontAxleRaw != null ? unhitchedFrontAxleRaw : 0,
      unhitchedRearAxle: unhitchedRearAxleRaw != null ? unhitchedRearAxleRaw : 0,

      // Customer details forwarded for the Client Details box
      customerName: normalizedCustomerName,
      customerPhone: normalizedCustomerPhone,
      customerEmail: normalizedCustomerEmail,

      // Selection metadata
      weighingSelection,
      methodSelection,

      // Caravan / trailer capacities and identifiers
      caravan: {
        make: c.make || '',
        model: c.model || '',
        year: c.year || '',
        atm: c.atm || 0,
        gtm: c.gtm || 0,
        axleGroups: c.axleCapacity || c.axleGroups || 0,
        // Persist any measured caravan values so embedded history can
        // reconstruct ATM/GTM/TBM without raw tyre/axle payloads. Prefer
        // explicit caravanData measured fields, then fall back to
        // compliance.caravan actuals when available.
        atmMeasured: c.atmMeasured != null && c.atmMeasured !== ''
          ? Number(c.atmMeasured) || 0
          : safeNum(cavComp.atm?.actual) ?? 0,
        gtmMeasured: c.gtmMeasured != null && c.gtmMeasured !== ''
          ? Number(c.gtmMeasured) || 0
          : safeNum(cavComp.gtm?.actual) ?? 0,
        tbmMeasured: c.tbmMeasured != null && c.tbmMeasured !== ''
          ? Number(c.tbmMeasured) || 0
          : safeNum(vehComp.tbm?.actual) ?? safeNum(w.tbm) ?? 0,
        rego: weigh.caravanNumberPlate || c.numberPlate || c.plate || '',
        state: c.state || weigh.caravanRegistryId?.state || weigh.caravanState || ''
      },

      // Misc metadata
      preWeigh: weigh.preWeigh || null,
      notes: weigh.notes || '',

      // Detailed axle / tyre payloads used by the results component
      axleWeigh,
      tyreWeigh: raw?.tyreWeigh || null,
      goweighData: raw?.goweighData || null,
      towBallMass: resolvedTowBallMass,
      towBallMassOverride: safeNum(raw?.towBallMass),
      vci01: raw.vci01 || null,
      vci02: raw.vci02 || null
    };

    // Debug: inspect the exact state passed into DIYVehicleOnlyWeighbridgeResults
    // for embedded history entries so we can compare fleet vs DIY behaviour.
    // eslint-disable-next-line no-console
    console.log('WeighHistory buildResultsStateFromWeigh overrideState', {
      weighId: overrideState.weighId,
      methodSelection: overrideState.methodSelection,
      weighingSelection: overrideState.weighingSelection,
      measuredFrontAxle: overrideState.measuredFrontAxle,
      measuredRearAxle: overrideState.measuredRearAxle,
      measuredGvm: overrideState.measuredGvm,
      towBallMass: overrideState.towBallMass,
      hasVci01: Boolean(overrideState.vci01),
      hasVci02: Boolean(overrideState.vci02),
      hasAxleWeigh: Boolean(overrideState.axleWeigh),
    });

    return overrideState;
  };

  // Open weigh detail dialog
  const handleViewDetail = async (weigh) => {
    try {
      const { data } = await axios.get(`/api/weighs/${weigh._id}`);
      const fullWeigh = data?.weigh || weigh;
      setSelectedWeigh(fullWeigh);
      setDetailDialogOpen(true);
    } catch (err) {
      console.error('Failed to fetch weigh details:', err);
      window.alert('Failed to load weigh details. Please try again.');
    }
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
                        {(() => {
                          // Prefer attached DIY client details when available (professional-created records)
                          const client = weigh.clientUserId || {};

                          // Debug logging to inspect how customer data is coming through
                          // so we can understand why some GoWeigh entries still show
                          // "Professional Client (N/A)" in the table.
                          // eslint-disable-next-line no-console
                          console.log('WeighHistory customer debug', {
                            _id: weigh._id,
                            methodSelection: weigh.weights?.methodSelection || weigh.methodSelection,
                            customerField: weigh.customer,
                            customerName: weigh.customerName,
                            customerPhone: weigh.customerPhone,
                            clientUserId: weigh.clientUserId,
                          });

                          const name =
                            client.name ||
                            weigh.customer?.name ||
                            weigh.customerName ||
                            'N/A';
                          const phone =
                            client.phone ||
                            weigh.customerPhone ||
                            weigh.customer?.phone ||
                            '';

                          if (phone && String(phone).trim() !== '') {
                            return `${name} (${phone})`;
                          }
                          return name;
                        })()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VehicleIcon sx={{ mr: 1, fontSize: 'small' }} />
                        {(() => {
                          const v = weigh?.vehicleData || {};
                          const rego =
                            weigh?.vehicleNumberPlate ||
                            v.numberPlate ||
                            v.plate ||
                            '';

                          const isPlaceholder = (val) => {
                            const s = String(val || '').trim().toLowerCase();
                            if (!s) return true;
                            return (
                              s === 'unknown' ||
                              s === 'base' ||
                              s === 'n/a' ||
                              s === 'na' ||
                              s === 'null' ||
                              s === 'undefined'
                            );
                          };

                          const preferredDescription =
                            !isPlaceholder(v.description) ? String(v.description).trim() : '';

                          const descriptionParts = [v.year, v.make, v.model, v.variant]
                            .filter((p) => !isPlaceholder(p))
                            .map(String);

                          const description =
                            preferredDescription ||
                            (descriptionParts.length > 0 ? descriptionParts.join(' ') : '');

                          const regoLabel = String(rego || '').trim();
                          const descLabel = String(description || '').trim();

                          if (regoLabel && descLabel) return `${regoLabel} - ${descLabel}`;
                          return regoLabel || descLabel || 'N/A';
                        })()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CaravanIcon sx={{ mr: 1, fontSize: 'small' }} />
                        {weigh.caravanData?.make} {weigh.caravanData?.model} ({weigh.caravanData?.numberPlate})
                      </Box>
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
            <DIYVehicleOnlyWeighbridgeResults
              embedded
              overrideState={buildResultsStateFromWeigh(selectedWeigh)}
            />
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