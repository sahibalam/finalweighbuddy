import React, { useState, useEffect } from 'react';
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
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
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

    let inferredWeighingSelection = null;
    if (w.weightsType === 'diy_caravan_only_registered') {
      inferredWeighingSelection = 'caravan_only_registered';
    } else if (w.weightsType === 'diy_vehicle_only') {
      inferredWeighingSelection = 'vehicle_only';
    } else if (w.weightsType === 'diy_tow_caravan') {
      inferredWeighingSelection = 'tow_vehicle_and_caravan';
    }

    const diyWeighingSelection =
      weigh.diyWeighingSelection ||
      raw?.diyWeighingSelection ||
      w.diyWeighingSelection ||
      '';

    const weighingSelection =
      diyWeighingSelection || inferredWeighingSelection || (hasCaravan ? 'tow_vehicle_and_caravan' : 'vehicle_only');

    const towSetupType =
      weigh.towSetupType ||
      raw?.towSetupType ||
      w.towSetupType ||
      (diyWeighingSelection === 'tow_vehicle_and_trailer'
        ? 'trailer'
        : diyWeighingSelection === 'tow_vehicle_and_boat'
          ? 'boat'
          : weighingSelection === 'tow_vehicle_and_caravan'
            ? 'caravan'
            : '');

    const preWeigh =
      weigh.preWeigh && typeof weigh.preWeigh === 'object'
        ? weigh.preWeigh
        : raw?.preWeigh && typeof raw.preWeigh === 'object'
          ? raw.preWeigh
          : null;

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

    // For DIY/fleet portable flows, the method is often persisted as
    // weights.diyMethodSelection rather than weights.methodSelection.
    const methodSelection =
      w.diyMethodSelection || w.methodSelection || weigh.methodSelection || '';

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
      weighingSelection === 'caravan_only_registered'
        ? safeNum(w.totalCaravan) ??
          (cavComp.gtm?.actual != null ? safeNum(cavComp.gtm.actual) : null) ??
          caravanOnlyTotal
        : safeNum(w.totalCaravan) ??
          (cavComp.gtm?.actual != null ? safeNum(cavComp.gtm.actual) : null) ??
          caravanOnlyTotal;

    const atmOverall =
      weighingSelection === 'caravan_only_registered'
        ? safeNum(w.grossCombination) ??
          (cavComp.atm?.actual != null ? safeNum(cavComp.atm.actual) : null) ??
          (gtmOverall + tbmOverall)
        : (cavComp.atm?.actual != null ? safeNum(cavComp.atm.actual) : null) ??
          (gtmOverall + tbmOverall);

    const gcmOverall =
      weighingSelection === 'caravan_only_registered'
        ? 0
        : safeNum(w.grossCombination) ??
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

    const rawPortableTyreWeigh = raw?.tyreWeigh || null;
    const hasPortablePayload = Boolean(rawPortableTyreWeigh || raw?.vci01 || raw?.vci02 || w.tyreWeigh || weigh.tyreWeigh);
    const isTowPortableHistory =
      (weighingSelection === 'tow_vehicle_and_caravan' ||
        weighingSelection === 'tow_vehicle_and_trailer' ||
        weighingSelection === 'tow_vehicle_and_boat') &&
      (methodSelection === 'Portable Scales - Individual Tyre Weights' || (!methodSelection && hasPortablePayload));

    const derivedUnhitchedFront = measuredFrontAxle != null ? safeNum(measuredFrontAxle) : null;
    const derivedUnhitchedRear = measuredRearAxle != null ? safeNum(measuredRearAxle) : null;
    const derivedUnhitchedGvm = measuredGvm != null ? safeNum(measuredGvm) : null;

    const resolvedUnhitchedFront =
      unhitchedFrontAxleRaw != null ? unhitchedFrontAxleRaw : isTowPortableHistory ? derivedUnhitchedFront : null;
    const resolvedUnhitchedRear =
      unhitchedRearAxleRaw != null ? unhitchedRearAxleRaw : isTowPortableHistory ? derivedUnhitchedRear : null;
    const resolvedUnhitchedGvm =
      unhitchedGvmRaw != null ? unhitchedGvmRaw : isTowPortableHistory ? derivedUnhitchedGvm : null;

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
      if (fromWeightsTbm != null) return fromWeightsTbm;

      // 2) TBM measured/persisted on caravanData (tbmMeasured)
      const fromCaravanMeasured = safeNum(c.tbmMeasured);
      if (fromCaravanMeasured != null) return fromCaravanMeasured;

      // 3) Legacy top-level towBallWeight
      const legacy = safeNum(weigh.towBallWeight);
      if (legacy != null) return legacy;

      // 4) Computed fallback: for some professional tow+caravan weighbridge
      // methods, TBM may not be persisted even though ATM/GTM/GCM are.
      // Derive TBM from the same overall values used for embedded history.
      const computed =
        gcmOverall != null && vehicleOnlyTotal != null && gtmOverall != null
          ? Math.max(0, (gcmOverall || 0) - (vehicleOnlyTotal || 0) - (gtmOverall || 0))
          : Math.max(0, (gcmOverall || 0) - (vehicleOnlyTotal || 0));
      return computed;
    };

    let resolvedTowBallMass = resolveTowBallMass();

    // Vehicle-only results do not use TBM
    if (weighingSelection === 'vehicle_only') {
      resolvedTowBallMass = null;
    }

    const axleWeigh =
      w.axleWeigh || weigh.axleWeigh || null;

    const measuredCaravanAtm =
      safeNum(w.grossCombination) ??
      safeNum(c.atmMeasured) ??
      safeNum(cavComp.atm?.actual) ??
      (atmOverall != null ? atmOverall : 0);
    const measuredCaravanGtm =
      safeNum(w.totalCaravan) ??
      safeNum(c.gtmMeasured) ??
      safeNum(cavComp.gtm?.actual) ??
      (gtmOverall != null ? gtmOverall : 0);
    const measuredCaravanTbm =
      safeNum(w.tbm) ??
      safeNum(weigh.towBallWeight) ??
      safeNum(c.tbmMeasured) ??
      (tbmOverall != null ? tbmOverall : 0);

    const overrideState = {
      weighId: weigh._id,
      methodSelection,
      weighingSelection,
      diyWeighingSelection,
      towSetupType,

      unhitchedFrontAxle: resolvedUnhitchedFront,
      unhitchedRearAxle: resolvedUnhitchedRear,
      unhitchedGvm: resolvedUnhitchedGvm,

      measuredFrontAxle,
      measuredRearAxle,
      measuredGvm,

      // Basic vehicle identity
      rego: v.numberPlate || v.rego || weigh.vehicleNumberPlate || '',
      state: v.state || weigh.vehicleState || '',
      description,
      vin: v.vin || weigh.vehicleVin || '',
      frontAxleLoading: v.fawr || v.frontAxleCapacity || '',
      rearAxleLoading: v.rawr || v.rearAxleCapacity || '',
      gvm: v.gvm || '',
      gcm: v.gcm || '',
      btc: v.btc || '',
      tbmCapacity: v.tbm || '',
      fuelLevel: preWeigh?.fuelLevel ?? '',
      passengersFront: preWeigh?.passengersFront ?? '',
      passengersRear: preWeigh?.passengersRear ?? '',

      // Capacity values from Info-Agent / lookup / compliance
      frontAxleCapacity: v.fawr || v.frontAxleCapacity || vehComp.frontAxle?.limit || '',
      rearAxleCapacity: v.rawr || v.rearAxleCapacity || vehComp.rearAxle?.limit || '',
      gvmCapacity: v.gvm || '',
      gcmCapacity: v.gcm || '',
      btcCapacity: v.btc || '',

      // Measured axle / GVM values
      measuredFrontAxle: measuredFrontAxle != null ? measuredFrontAxle : 0,
      measuredRearAxle: measuredRearAxle != null ? measuredRearAxle : 0,
      measuredGvm: measuredGvm != null ? measuredGvm : 0,

      // Persisted measured totals so embedded tow+caravan/trailer can render
      // the hitched + trailer sections even when individual axle fields are 0.
      gvmHitched: vehicleOnlyTotal != null ? vehicleOnlyTotal : 0,
      tbmMeasuredOverall: tbmOverall != null ? tbmOverall : 0,

      // Overall caravan / combination measured values derived above.
      atmMeasuredOverall: atmOverall != null ? atmOverall : 0,
      gtmMeasuredOverall: gtmOverall != null ? gtmOverall : 0,
      gcmMeasuredOverall: gcmOverall != null ? gcmOverall : 0,

      // Unhitched values forwarded from vehicleData/weights when present
      unhitchedGvm: resolvedUnhitchedGvm != null ? resolvedUnhitchedGvm : 0,
      unhitchedFrontAxle: resolvedUnhitchedFront != null ? resolvedUnhitchedFront : 0,
      unhitchedRearAxle: resolvedUnhitchedRear != null ? resolvedUnhitchedRear : 0,

      // Customer details forwarded for the Client Details box
      customerName: normalizedCustomerName,
      customerPhone: normalizedCustomerPhone,
      customerEmail: normalizedCustomerEmail,

      // Selection metadata
      weighingSelection,

      // Caravan / trailer capacities and identifiers
      caravan: {
        make: c.make || '',
        model: c.model || '',
        year: c.year || '',
        atm: c.atm || 0,
        gtm: c.gtm || 0,
        axleGroups: c.axleCapacity || c.axleGroups || 0,

        // Ensure any static caravan details (like tare) are preserved for the
        // embedded results modal, even when the history record stores them only
        // under caravanData.
        tare: c.tare != null && c.tare !== '' ? c.tare : 0,

        // Persist any measured caravan values so embedded history can
        // reconstruct ATM/GTM/TBM without raw tyre/axle payloads. Prefer
        // explicit caravanData measured fields, then fall back to
        // compliance.caravan actuals when available.
        atmMeasured: measuredCaravanAtm,
        gtmMeasured: measuredCaravanGtm,
        tbmMeasured: measuredCaravanTbm,
        rego: weigh.caravanNumberPlate || c.numberPlate || c.plate || '',
        state: c.state || weigh.caravanRegistryId?.state || weigh.caravanState || ''
      },

      // Misc metadata
      preWeigh: weigh.preWeigh || null,
      notes: weigh.notes || '',

      // Detailed axle / tyre payloads used by the results component
      axleWeigh: axleWeigh || raw?.axleWeigh || null,
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
      unhitchedFrontAxle: overrideState.unhitchedFrontAxle,
      unhitchedRearAxle: overrideState.unhitchedRearAxle,
      unhitchedGvm: overrideState.unhitchedGvm,
      measuredFrontAxle: overrideState.measuredFrontAxle,
      measuredRearAxle: overrideState.measuredRearAxle,
      measuredGvm: overrideState.measuredGvm,
      towBallMass: overrideState.towBallMass,
      hasAxleWeigh: Boolean(overrideState.axleWeigh),
      hasVci01: Boolean(overrideState.vci01),
      hasVci02: Boolean(overrideState.vci02)
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

      const triggerPdfDownload = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      };

      const safeNum = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      const raw =
        (weigh.rawWeighData && typeof weigh.rawWeighData === 'object' ? weigh.rawWeighData : null) ||
        (weigh.raw && typeof weigh.raw === 'object' ? weigh.raw : null) ||
        (weigh.weights && typeof weigh.weights === 'object' && weigh.weights.raw && typeof weigh.weights.raw === 'object'
          ? weigh.weights.raw
          : null) ||
        null;
      const methodSelection =
        weigh.methodSelection || weigh.method || raw?.methodSelection || raw?.method || '';
      const diyWeighingSelection = weigh.diyWeighingSelection || raw?.diyWeighingSelection || '';
      const weightsType = weigh.weightsType || raw?.weightsType || '';

      const inferredWeighingSelection =
        weightsType === 'diy_tow_caravan'
          ? 'tow_vehicle_and_caravan'
          : weightsType === 'diy_vehicle_only'
            ? 'vehicle_only'
            : weightsType === 'diy_caravan_only'
              ? 'caravan_only_registered'
              : '';

      const hasCaravan = Boolean(weigh.caravan || weigh.caravanData || weigh.caravanNumberPlate);
      const weighingSelection =
        diyWeighingSelection || inferredWeighingSelection || (hasCaravan ? 'tow_vehicle_and_caravan' : 'vehicle_only');

      const tyreWeigh = raw?.tyreWeigh || weigh.tyreWeigh || null;
      const axleConfigLabel = tyreWeigh?.axleConfig;
      const vci01Candidate = raw?.vci01 || weigh.vci01 || null;
      const vci02Candidate = raw?.vci02 || weigh.vci02 || null;
      const preWeigh =
        weigh.preWeigh && typeof weigh.preWeigh === 'object'
          ? weigh.preWeigh
          : raw?.preWeigh && typeof raw.preWeigh === 'object'
            ? raw.preWeigh
            : null;

      const isTowCaravanPortable =
        (weighingSelection === 'tow_vehicle_and_caravan' || weighingSelection === 'tow_vehicle_and_trailer') &&
        methodSelection === 'Portable Scales - Individual Tyre Weights';

      const isTowCaravanWeighbridgePdf =
        (weighingSelection === 'tow_vehicle_and_caravan' ||
          weighingSelection === 'tow_vehicle_and_trailer' ||
          weighingSelection === 'tow_vehicle_and_boat') &&
        (
          methodSelection ===
            'Weighbridge - In Ground - Tow Vehicle and Trailer are level and Individual Axle Weights can be recorded' ||
          methodSelection === 'Weighbridge - goweigh' ||
          methodSelection ===
            'Weighbridge - Above Ground - Single Cell - Tow Vehicle and Trailer are no level limiting the ability to record individual axle weights.'
        );

      const isTowCaravanWeighbridgePdfHeuristic =
        (weighingSelection === 'tow_vehicle_and_caravan' ||
          weighingSelection === 'tow_vehicle_and_trailer' ||
          weighingSelection === 'tow_vehicle_and_boat') &&
        Boolean(preWeigh?.towedAxleConfig || raw?.preWeigh?.towedAxleConfig || weigh?.towedAxleConfig || raw?.towedAxleConfig) &&
        (Boolean(weigh?.weights) || Boolean(raw?.weights) || Boolean(raw?.vci01) || Boolean(raw?.vci02) || Boolean(weigh?.vci01) || Boolean(weigh?.vci02));

      const effectiveIsTowCaravanWeighbridgePdf =
        isTowCaravanWeighbridgePdf || isTowCaravanWeighbridgePdfHeuristic;

      const isTowCaravanPortableHeuristic =
        (weighingSelection === 'tow_vehicle_and_caravan' ||
          weighingSelection === 'tow_vehicle_and_trailer' ||
          weighingSelection === 'tow_vehicle_and_boat') &&
        Boolean(tyreWeigh) &&
        (methodSelection === 'Portable Scales - Individual Tyre Weights' ||
          Boolean(raw?.tyreWeigh) ||
          Boolean(raw?.vci01) ||
          Boolean(raw?.vci02) ||
          Boolean(vci01Candidate) ||
          Boolean(vci02Candidate));
      const isSingleOrDualOrTripleAxle =
        axleConfigLabel === 'Single Axle' ||
        axleConfigLabel === 'Dual Axle' ||
        axleConfigLabel === 'Triple Axle';

      if (
        weighingSelection === 'tow_vehicle_and_caravan' &&
        !isTowCaravanPortable &&
        !isTowCaravanPortableHeuristic
      ) {
        setSelectedWeigh(weigh);
        setDetailDialogOpen(true);
        return;
      }

      // eslint-disable-next-line no-console
      console.log('WeighHistory download detection', {
        weighId,
        weightsType,
        diyWeighingSelection,
        inferredWeighingSelection,
        weighingSelection,
        methodSelection,
        axleConfigLabel,
        hasTyreWeigh: Boolean(tyreWeigh),
        hasRawTyreWeigh: Boolean(raw?.tyreWeigh),
        hasVci01: Boolean(vci01Candidate),
        hasVci02: Boolean(vci02Candidate),
        isTowCaravanPortable,
        isTowCaravanPortableHeuristic,
        isSingleOrDualOrTripleAxle,
        isTowCaravanWeighbridgePdf,
        isTowCaravanWeighbridgePdfHeuristic,
        effectiveIsTowCaravanWeighbridgePdf,
      });

      if ((isTowCaravanPortable || isTowCaravanPortableHeuristic) && isSingleOrDualOrTripleAxle) {
        const v = weigh.vehicle || weigh.vehicleData || {};
        const c = weigh.caravan || weigh.caravanData || {};
        const w = weigh.weights || {};

        const vci01 = vci01Candidate;
        const vci02 = vci02Candidate;

        const gvmHitched = safeNum(w.totalVehicle) || safeNum(weigh.vehicleWeightHitched) || 0;

        const frontMeasured = safeNum(w.frontAxle) || safeNum(weigh.frontAxle) || 0;
        const rearMeasured = safeNum(w.rearAxle) || safeNum(weigh.rearAxle) || 0;

        const gvmAttached = safeNum(w.grossCombination) || safeNum(weigh.grossCombination) || 0;
        const tbmMeasured = safeNum(w.tbm) || safeNum(weigh.towBallWeight) || 0;
        const gtmMeasured = safeNum(w.totalCaravan) || safeNum(weigh.caravanWeight) || 0;
        const atmMeasured = Math.max(0, gtmMeasured + tbmMeasured);
        const gcmMeasured = gvmAttached || Math.max(0, gvmHitched + gtmMeasured);

        const gvmCapacity = safeNum(v.gvm) || 0;
        const frontCapacity = safeNum(v.fawr) || safeNum(v.frontAxleCapacity) || 0;
        const rearCapacity = safeNum(v.rawr) || safeNum(v.rearAxleCapacity) || 0;
        const tbmCapacity = safeNum(v.tbm) || 0;
        const gcmCapacity = safeNum(v.gcm) || 0;
        const btcCapacity = safeNum(v.btc) || 0;
        const atmCapacity = safeNum(c.atm) || 0;
        const gtmCapacity = safeNum(c.gtm) || 0;

        const vanToCarRatioPctForPdf = gvmHitched > 0 ? (gtmMeasured / gvmHitched) * 100 : null;
        const towBallPctForPdf = atmMeasured > 0 ? (tbmMeasured / atmMeasured) * 100 : null;
        const btcPctForPdf = btcCapacity > 0 ? (atmMeasured / btcCapacity) * 100 : null;

        const frontCapacityDiff = frontCapacity - frontMeasured;
        const rearCapacityDiff = rearCapacity - rearMeasured;
        const gvmCapacityDiff = gvmCapacity - gvmHitched;
        const gcmCapacityDiff = gcmCapacity - gcmMeasured;
        const btcCapacityDiff = btcCapacity - atmMeasured;
        const tbmCapacityDiff = tbmCapacity - tbmMeasured;
        const atmCapacityDiff = atmCapacity - atmMeasured;
        const gtmCapacityDiff = gtmCapacity - gtmMeasured;

        const reportPayload = {
          weighingSelection,
          diyWeighingSelection,
          header: {
            date: weigh.createdAt ? new Date(weigh.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            customerName: weigh.customer?.name || weigh.customerName || '',
            time: weigh.createdAt ? new Date(weigh.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            carRego: weigh.vehicleNumberPlate || v.numberPlate || v.rego || '',
            carMake: v.make || v.description || v.vehicleDescription || '',
            carModel: v.model || '',
            caravanRego: weigh.caravanNumberPlate || c.numberPlate || c.plate || '',
            caravanMake: c.make || '',
            caravanModel: c.model || '',
            location: '',
          },
          compliance: {
            frontAxle: frontCapacity,
            gvm: gvmCapacity,
            rearAxle: rearCapacity,
            tbm: tbmCapacity,
            atm: atmCapacity,
            gtm: gtmCapacity,
            gcm: gcmCapacity,
            btc: btcCapacity,
          },
          weightsRecorded: {
            frontAxle: frontMeasured,
            gvm: gvmHitched,
            rearAxle: rearMeasured,
            tbm: tbmMeasured,
            atm: atmMeasured,
            gtm: gtmMeasured,
            gcm: gcmMeasured,
            btc: atmMeasured,
          },
          capacity: {
            frontAxle: frontCapacityDiff || 0,
            gvm: gvmCapacityDiff || 0,
            rearAxle: rearCapacityDiff || 0,
            tbm: tbmCapacityDiff || 0,
            atm: atmCapacityDiff || 0,
            gtm: gtmCapacityDiff || 0,
            gcm: gcmCapacityDiff || 0,
            btc: btcCapacityDiff || 0,
          },
          result: {
            frontAxle: frontCapacity > 0 ? frontMeasured <= frontCapacity : true,
            gvm: gvmCapacity > 0 ? gvmHitched <= gvmCapacity : true,
            rearAxle: rearCapacity > 0 ? rearMeasured <= rearCapacity : true,
            tbm: tbmCapacity > 0 ? tbmMeasured <= tbmCapacity : true,
            atm: atmCapacity > 0 ? atmMeasured <= atmCapacity : true,
            gtm: gtmCapacity > 0 ? gtmMeasured <= gtmCapacity : true,
            gcm: gcmCapacity > 0 ? gcmMeasured <= gcmCapacity : true,
            btc: btcCapacity > 0 ? atmMeasured <= btcCapacity : true,
          },
          carInfo: {
            fuelLevel: preWeigh?.fuelLevel ?? null,
            passengersFront: preWeigh?.passengersFront ?? 0,
            passengersRear: preWeigh?.passengersRear ?? 0,
          },
          advisory: {
            vanToCarRatioPct: vanToCarRatioPctForPdf != null ? Number(vanToCarRatioPctForPdf) : null,
            towBallPct: towBallPctForPdf != null ? Number(towBallPctForPdf) : null,
            btcPct: btcPctForPdf != null ? Number(btcPctForPdf) : null,
          },
          tyreWeigh,
          vci01,
          vci02,
          notes:
            raw?.notes != null
              ? String(raw.notes)
              : weigh.notes != null
                ? String(weigh.notes)
                : weigh.additionalNotes != null
                  ? String(weigh.additionalNotes)
                  : weigh.notesText != null
                    ? String(weigh.notesText)
                    : '',
          additionalNotes:
            raw?.notes != null
              ? String(raw.notes)
              : weigh.notes != null
                ? String(weigh.notes)
                : weigh.additionalNotes != null
                  ? String(weigh.additionalNotes)
                  : weigh.notesText != null
                    ? String(weigh.notesText)
                    : '',
        };

        const endpoints = [
          '/api/weighs/diy-tow-caravan-portable-single-axle/report-1',
          '/api/weighs/diy-tow-caravan-portable-single-axle/report-2',
          '/api/weighs/diy-tow-caravan-portable-single-axle/report-3',
        ];

        const mergedPdf = await PDFDocument.create();
        for (const url of endpoints) {
          const resp = await axios.post(url, reportPayload, { responseType: 'arraybuffer' });
          const srcPdf = await PDFDocument.load(resp.data);
          const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          pages.forEach((p) => mergedPdf.addPage(p));
        }

        const mergedBytes = await mergedPdf.save();
        const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });
        triggerPdfDownload(mergedBlob, `diy-tow-caravan-portable-${weighId}.pdf`);
        return;
      }

      const towedAxleConfig =
        raw?.preWeigh?.towedAxleConfig ||
        weigh?.preWeigh?.towedAxleConfig ||
        raw?.towedAxleConfig ||
        weigh?.towedAxleConfig ||
        '';

      const effectiveTowedAxleConfig =
        (isTowCaravanWeighbridgePdf || isTowCaravanWeighbridgePdfHeuristic) && !towedAxleConfig
          ? 'Single Axle'
          : towedAxleConfig;

      const towedAxleConfigIsValid =
        effectiveTowedAxleConfig === 'Single Axle' ||
        effectiveTowedAxleConfig === 'Dual Axle' ||
        effectiveTowedAxleConfig === 'Triple Axle';

      if (effectiveIsTowCaravanWeighbridgePdf && towedAxleConfigIsValid) {
        const v = weigh.vehicle || weigh.vehicleData || {};
        const c = weigh.caravan || weigh.caravanData || {};
        const w = weigh.weights || {};

        const gvmHitched = safeNum(w.totalVehicle) || safeNum(weigh.vehicleWeightHitched) || 0;

        const frontMeasured = safeNum(w.frontAxle) || safeNum(weigh.frontAxle) || 0;
        const rearMeasured = safeNum(w.rearAxle) || safeNum(weigh.rearAxle) || 0;

        const gvmAttached = safeNum(w.grossCombination) || safeNum(weigh.grossCombination) || 0;
        const tbmMeasured = safeNum(w.tbm) || safeNum(weigh.towBallWeight) || 0;
        const gtmMeasured = safeNum(w.totalCaravan) || safeNum(weigh.caravanWeight) || 0;
        const atmMeasured = Math.max(0, gtmMeasured + tbmMeasured);
        const gcmMeasured = gvmAttached || Math.max(0, gvmHitched + gtmMeasured);

        const gvmCapacity = safeNum(v.gvm) || 0;
        const frontCapacity = safeNum(v.fawr) || safeNum(v.frontAxleCapacity) || 0;
        const rearCapacity = safeNum(v.rawr) || safeNum(v.rearAxleCapacity) || 0;
        const tbmCapacity = safeNum(v.tbm) || 0;
        const gcmCapacity = safeNum(v.gcm) || 0;
        const btcCapacity = safeNum(v.btc) || 0;
        const atmCapacity = safeNum(c.atm) || 0;
        const gtmCapacity = safeNum(c.gtm) || 0;

        const vanToCarRatioPctForPdf = gvmHitched > 0 ? (gtmMeasured / gvmHitched) * 100 : null;
        const towBallPctForPdf = atmMeasured > 0 ? (tbmMeasured / atmMeasured) * 100 : null;
        const btcPctForPdf = btcCapacity > 0 ? (atmMeasured / btcCapacity) * 100 : null;

        const reportPayload = {
          weighingSelection,
          diyWeighingSelection,
          report2RenderMode: 'A_ONLY',
          header: {
            date: weigh.createdAt ? new Date(weigh.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
            customerName: weigh.customer?.name || weigh.customerName || '',
            time: weigh.createdAt ? new Date(weigh.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            carRego: weigh.vehicleNumberPlate || v.numberPlate || v.rego || '',
            carMake: v.make || v.description || v.vehicleDescription || '',
            carModel: v.model || '',
            caravanRego: weigh.caravanNumberPlate || c.numberPlate || c.plate || '',
            caravanMake: c.make || '',
            caravanModel: c.model || '',
            location: '',
          },
          compliance: {
            frontAxle: frontCapacity,
            gvm: gvmCapacity,
            rearAxle: rearCapacity,
            tbm: tbmCapacity,
            atm: atmCapacity,
            gtm: gtmCapacity,
            gcm: gcmCapacity,
            btc: btcCapacity,
          },
          weightsRecorded: {
            frontAxle: frontMeasured,
            gvm: gvmHitched,
            rearAxle: rearMeasured,
            tbm: tbmMeasured,
            atm: atmMeasured,
            gtm: gtmMeasured,
            gcm: gcmMeasured,
            btc: atmMeasured,
          },
          capacity: {
            frontAxle: frontCapacity - frontMeasured,
            gvm: gvmCapacity - gvmHitched,
            rearAxle: rearCapacity - rearMeasured,
            tbm: tbmCapacity - tbmMeasured,
            atm: atmCapacity - atmMeasured,
            gtm: gtmCapacity - gtmMeasured,
            gcm: gcmCapacity - gcmMeasured,
            btc: btcCapacity - atmMeasured,
          },
          result: {
            frontAxle: frontCapacity > 0 ? frontMeasured <= frontCapacity : true,
            gvm: gvmCapacity > 0 ? gvmHitched <= gvmCapacity : true,
            rearAxle: rearCapacity > 0 ? rearMeasured <= rearCapacity : true,
            tbm: tbmCapacity > 0 ? tbmMeasured <= tbmCapacity : true,
            atm: atmCapacity > 0 ? atmMeasured <= atmCapacity : true,
            gtm: gtmCapacity > 0 ? gtmMeasured <= gtmCapacity : true,
            gcm: gcmCapacity > 0 ? gcmMeasured <= gcmCapacity : true,
            btc: btcCapacity > 0 ? atmMeasured <= btcCapacity : true,
          },
          carInfo: {
            fuelLevel: preWeigh?.fuelLevel ?? null,
            passengersFront: preWeigh?.passengersFront ?? 0,
            passengersRear: preWeigh?.passengersRear ?? 0,
          },
          advisory: {
            vanToCarRatioPct: vanToCarRatioPctForPdf != null ? Number(vanToCarRatioPctForPdf) : null,
            towBallPct: towBallPctForPdf != null ? Number(towBallPctForPdf) : null,
            btcPct: btcPctForPdf != null ? Number(btcPctForPdf) : null,
          },
          tyreWeigh: {
            axleConfig: effectiveTowedAxleConfig,
          },
          vci01: vci01Candidate,
          vci02: vci02Candidate,
          notes:
            raw?.notes != null
              ? String(raw.notes)
              : weigh.notes != null
                ? String(weigh.notes)
                : '',
          additionalNotes:
            raw?.notes != null
              ? String(raw.notes)
              : weigh.notes != null
                ? String(weigh.notes)
                : '',
        };

        const endpoints = [
          '/api/weighs/diy-tow-caravan-portable-single-axle/report-1',
          '/api/weighs/diy-tow-caravan-portable-single-axle/report-2',
        ];

        const mergedPdf = await PDFDocument.create();
        for (const url of endpoints) {
          const resp = await axios.post(url, reportPayload, { responseType: 'arraybuffer' });
          const srcPdf = await PDFDocument.load(resp.data);
          const pages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
          pages.forEach((p) => mergedPdf.addPage(p));
        }

        const mergedBytes = await mergedPdf.save();
        const mergedBlob = new Blob([mergedBytes], { type: 'application/pdf' });
        triggerPdfDownload(mergedBlob, `diy-tow-caravan-weighbridge-${weighId}.pdf`);
        return;
      }

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