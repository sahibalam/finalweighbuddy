import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  TextField,
  Button,
  Grid,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogContent
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfessionalVehicleOnlyWeighbridgeInGroundConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [fieldErrors, setFieldErrors] = useState({});
  const [rego, setRego] = useState('');
  const [state, setState] = useState('');
  const [description, setDescription] = useState('');
  const [vin, setVin] = useState('');
  const [frontAxleLoading, setFrontAxleLoading] = useState('');
  const [rearAxleLoading, setRearAxleLoading] = useState('');
  const [gvm, setGvm] = useState('');
  const [gcm, setGcm] = useState('');
  const [btc, setBtc] = useState('');
  const [tbm, setTbm] = useState('');
  const [hasModifications, setHasModifications] = useState(false);
  const [modifiedImages, setModifiedImages] = useState([]);
  const [modifiedImagePreviews, setModifiedImagePreviews] = useState([]);
  const [modifiedPreviewOpen, setModifiedPreviewOpen] = useState(false);
  const [modifiedPreviewIndex, setModifiedPreviewIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Caravan-only specific fields (mirroring caravan confirm layout)
  const [caravanMake, setCaravanMake] = useState('');
  const [caravanModel, setCaravanModel] = useState('');
  const [caravanYear, setCaravanYear] = useState('');
  const [caravanGtm, setCaravanGtm] = useState('');
  const [caravanAtm, setCaravanAtm] = useState('');
  const [caravanAxleGroups, setCaravanAxleGroups] = useState('');
  const [caravanTare, setCaravanTare] = useState('');
  const [caravanComplianceImage, setCaravanComplianceImage] = useState('');
  const [caravanCompliancePreviewOpen, setCaravanCompliancePreviewOpen] = useState(false);
  const [caravanCompliancePreviewError, setCaravanCompliancePreviewError] = useState(false);
  const [caravanComplianceLocalPreviewUrl, setCaravanComplianceLocalPreviewUrl] = useState('');
  const [caravanComplianceLocalPreviewIsPdf, setCaravanComplianceLocalPreviewIsPdf] = useState(false);

  const weighingSelection = location.state?.weighingSelection || 'vehicle_only';
  const preWeigh = location.state?.preWeigh || null;

  // Hydrate from rego lookup state
  useEffect(() => {
    const stateData = location.state || {};
    const vehicle = stateData.vehicleFromLookup || {};
    const caravan = stateData.caravanFromLookup || {};

    console.log('🧭 confirm hydration (in-ground) state caravanFromLookup:', stateData.caravanFromLookup);
    console.log('🧭 confirm hydration (in-ground) resolved caravan.complianceImage:', caravan?.complianceImage);
    console.log('🧭 confirm hydration (in-ground) weighingSelection:', stateData.weighingSelection);

    if (stateData.rego) setRego(String(stateData.rego).toUpperCase());
    if (stateData.state) setState(String(stateData.state).toUpperCase());
    if (stateData.vin) setVin(String(stateData.vin).toUpperCase());

    if (vehicle.description) {
      setDescription(String(vehicle.description));
    } else if (vehicle.make || vehicle.model || vehicle.year || vehicle.variant) {
      const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.variant]
        .filter(Boolean)
        .map(String);
      setDescription(parts.join(' '));
    }

    if (vehicle.vin && !stateData.vin) {
      setVin(String(vehicle.vin).toUpperCase());
    }

    if (vehicle.fawr != null) setFrontAxleLoading(String(vehicle.fawr));
    if (vehicle.rawr != null) setRearAxleLoading(String(vehicle.rawr));
    if (vehicle.gvm != null) setGvm(String(vehicle.gvm));
    if (vehicle.gcm != null) setGcm(String(vehicle.gcm));
    if (vehicle.btc != null) setBtc(String(vehicle.btc));
    if (vehicle.tbm != null) setTbm(String(vehicle.tbm));

    if (weighingSelection === 'caravan_only_registered') {
      if (!caravanMake && caravan.make) setCaravanMake(String(caravan.make));
      if (!caravanModel && caravan.model) setCaravanModel(String(caravan.model));
      if (!caravanYear && caravan.year != null) setCaravanYear(String(caravan.year));

      if (!caravanGtm && caravan.gtm != null) setCaravanGtm(String(caravan.gtm));
      if (!caravanAtm && caravan.atm != null) setCaravanAtm(String(caravan.atm));

      if (!caravanTare && (caravan.tare != null || caravan.tareMass != null)) {
        setCaravanTare(String(caravan.tare != null ? caravan.tare : caravan.tareMass));
      }

      if (caravan.vin && (!stateData.vin || String(stateData.vin).trim() === '')) {
        setVin(String(caravan.vin).toUpperCase());
      }
    }

    if (
      !caravanComplianceImage &&
      (weighingSelection === 'caravan_only_registered' || weighingSelection === 'tow_vehicle_and_caravan') &&
      caravan.complianceImage
    ) {
      const url = String(caravan.complianceImage);

      console.log('✅ prefill complianceImage (in-ground)', url);
      setCaravanComplianceLocalPreviewUrl('');
      setCaravanComplianceLocalPreviewIsPdf(url.toLowerCase().endsWith('.pdf'));
      setCaravanCompliancePreviewError(false);
      setCaravanComplianceImage(url);
    }

    // For tow_vehicle_and_caravan flows, also hydrate Axle Group Loadings
    // from the caravan lookup so previously used caravans pre-fill this field.
    if (
      weighingSelection === 'tow_vehicle_and_caravan' &&
      !caravanAxleGroups &&
      (caravan.axleCapacity != null || caravan.axleGroupLoading != null)
    ) {
      setCaravanAxleGroups(
        String(
          caravan.axleCapacity != null
            ? caravan.axleCapacity
            : caravan.axleGroupLoading
        )
      );
    }
  }, [
    location.state,
    caravanAtm,
    caravanAxleGroups,
    caravanComplianceImage,
    caravanGtm,
    caravanMake,
    caravanModel,
    caravanTare,
    caravanYear,
    weighingSelection,
  ]);

  useEffect(() => {
    let cancelled = false;

    const fetchCaravanIfMissing = async () => {
      try {
        const stateData = location.state || {};
        const regoToLookup = stateData.rego || rego;
        const stateToLookup = stateData.state || state;

        if (weighingSelection !== 'caravan_only_registered') return;
        if (!regoToLookup) return;
        if (location.state?.caravanFromLookup) return;

        console.log('🌐 fallback caravan lookup (in-ground confirm)', {
          rego: regoToLookup,
          state: stateToLookup,
        });
        const response = await axios.get(`/api/caravans/by-plate/${encodeURIComponent(regoToLookup)}`, {
          params: stateToLookup ? { state: stateToLookup } : {},
        });

        console.log('🌐 fallback caravan lookup response (in-ground confirm)', response.data);

        const foundCaravan = response.data?.data?.masterCaravan || null;
        if (!foundCaravan || cancelled) return;

        if (!caravanMake && foundCaravan.make) setCaravanMake(String(foundCaravan.make));
        if (!caravanModel && foundCaravan.model) setCaravanModel(String(foundCaravan.model));
        if (!caravanYear && foundCaravan.year != null) setCaravanYear(String(foundCaravan.year));
        if (!caravanAtm && (foundCaravan.atm != null || foundCaravan.atmCapacity != null)) {
          setCaravanAtm(String(foundCaravan.atm != null ? foundCaravan.atm : foundCaravan.atmCapacity));
        }
        if (!caravanGtm && (foundCaravan.gtm != null || foundCaravan.gtmCapacity != null)) {
          setCaravanGtm(String(foundCaravan.gtm != null ? foundCaravan.gtm : foundCaravan.gtmCapacity));
        }
        if (!caravanAxleGroups && (foundCaravan.axleCapacity != null || foundCaravan.axleGroupLoading != null)) {
          setCaravanAxleGroups(
            String(foundCaravan.axleCapacity != null ? foundCaravan.axleCapacity : foundCaravan.axleGroupLoading)
          );
        }
        if (!caravanTare && (foundCaravan.tare != null || foundCaravan.tareMass != null)) {
          setCaravanTare(String(foundCaravan.tare != null ? foundCaravan.tare : foundCaravan.tareMass));
        }
        if (!vin && foundCaravan.vin) setVin(String(foundCaravan.vin).toUpperCase());

        if (
          !caravanComplianceImage &&
          (weighingSelection === 'caravan_only_registered' || weighingSelection === 'tow_vehicle_and_caravan') &&
          foundCaravan.complianceImage
        ) {
          const url = String(foundCaravan.complianceImage);
          console.log('✅ prefill complianceImage via fallback (in-ground)', url);
          setCaravanComplianceLocalPreviewUrl('');
          setCaravanComplianceLocalPreviewIsPdf(url.toLowerCase().endsWith('.pdf'));
          setCaravanCompliancePreviewError(false);
          setCaravanComplianceImage(url);
        }
      } catch (error) {
        console.error('Fallback caravan lookup failed (in-ground confirm):', error?.response?.data || error);
      }
    };

    fetchCaravanIfMissing();

    return () => {
      cancelled = true;
    };
  }, [weighingSelection, rego, state, location.state, caravanMake, caravanModel, caravanYear, caravanAtm, caravanGtm, caravanAxleGroups, caravanTare, vin, caravanComplianceImage]);

  useEffect(() => {
    setCaravanCompliancePreviewError(false);
  }, [caravanComplianceImage]);

  useEffect(() => {
    return () => {
      if (caravanComplianceLocalPreviewUrl) {
        URL.revokeObjectURL(caravanComplianceLocalPreviewUrl);
      }
    };
  }, [caravanComplianceLocalPreviewUrl]);

  const validateVehicleConfirm = () => {
    const nextErrors = {};
    const isEmpty = (v) => String(v || '').trim() === '';

    if (weighingSelection === 'caravan_only_registered') {
      setFieldErrors({});
      return true;
    }

    if (isEmpty(rego)) nextErrors.rego = 'Rego Number is required';
    if (isEmpty(state)) nextErrors.state = 'State is required';
    if (isEmpty(description)) nextErrors.description = 'Vehicle Description is required';

    // VIN optional

    if (isEmpty(frontAxleLoading)) nextErrors.frontAxleLoading = 'Front Axle Loading is required';
    if (isEmpty(rearAxleLoading)) nextErrors.rearAxleLoading = 'Rear Axle Loading is required';
    if (isEmpty(gvm)) nextErrors.gvm = 'Gross Vehicle Mass (GVM) is required';

    if (weighingSelection === 'tow_vehicle_and_caravan') {
      if (isEmpty(gcm)) nextErrors.gcm = 'Gross Combination Mass (GCM) is required';
      if (isEmpty(btc)) nextErrors.btc = 'Braked Towing Capacity (BTC) is required';
      if (isEmpty(tbm)) nextErrors.tbm = 'Tow Ball Mass (TBM) is required';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateCaravanConfirm = () => {
    const nextErrors = {};
    const isEmpty = (v) => String(v || '').trim() === '';

    if (isEmpty(rego)) nextErrors.rego = 'Rego Number is required';
    if (isEmpty(state)) nextErrors.state = 'State is required';
    if (isEmpty(caravanMake)) nextErrors.caravanMake = 'Make is required';
    if (isEmpty(caravanModel)) nextErrors.caravanModel = 'Model is required';
    if (isEmpty(caravanYear)) nextErrors.caravanYear = 'Year is required';

    // VIN optional
    // GTM optional
    // Axle Group Loadings optional

    if (isEmpty(caravanAtm)) nextErrors.caravanAtm = 'Aggregate Trailer Mass (ATM) is required';
    if (isEmpty(caravanTare)) nextErrors.caravanTare = 'Tare Mass Weight is required';

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    return () => {
      if (Array.isArray(modifiedImagePreviews) && modifiedImagePreviews.length > 0) {
        modifiedImagePreviews.forEach((p) => {
          if (p?.localUrl) {
            URL.revokeObjectURL(p.localUrl);
          }
        });
      }
    };
  }, [modifiedImagePreviews]);

  const handleModifiedImageUpload = async (event) => {
    if (weighingSelection !== 'caravan_only_registered' && modifiedImages.length >= 3) return;
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      setUploading(true);

      if (weighingSelection === 'caravan_only_registered') {
        const file = fileList[0];
        const isPdf =
          String(file.type).toLowerCase() === 'application/pdf' ||
          String(file.name || '').toLowerCase().endsWith('.pdf');

        setCaravanComplianceLocalPreviewIsPdf(isPdf);
        setCaravanCompliancePreviewError(false);

        if (!isPdf) {
          if (caravanComplianceLocalPreviewUrl) {
            URL.revokeObjectURL(caravanComplianceLocalPreviewUrl);
          }
          setCaravanComplianceLocalPreviewUrl(URL.createObjectURL(file));
        } else {
          if (caravanComplianceLocalPreviewUrl) {
            URL.revokeObjectURL(caravanComplianceLocalPreviewUrl);
          }
          setCaravanComplianceLocalPreviewUrl('');
        }

        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post('/api/uploads/compliance', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (response.data?.url) setCaravanComplianceImage(response.data.url);
        return;
      }

      const remainingSlots = Math.max(0, 3 - modifiedImages.length);
      const files = Array.from(fileList).slice(0, remainingSlots);

      for (const file of files) {
        const isPdf =
          String(file.type).toLowerCase() === 'application/pdf' ||
          String(file.name || '').toLowerCase().endsWith('.pdf');

        const localUrl = URL.createObjectURL(file);
        setModifiedImagePreviews((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          if (next.length >= 3) {
            URL.revokeObjectURL(localUrl);
            return next;
          }
          next.push({ localUrl, isPdf, previewError: false });
          return next;
        });

        const formData = new FormData();
        formData.append('file', file);
        const response = await axios.post('/api/uploads/compliance', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data?.url) {
          setModifiedImages((prev) => {
            if (prev.length >= 3) return prev;
            return [...prev, response.data.url];
          });
        }
      }
    } catch (error) {
      console.error('Image upload failed', error);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleConfirm = () => {
    if (weighingSelection === 'caravan_only_registered') {
      if (!validateCaravanConfirm()) {
        window.alert('Please fill all required fields before continuing.');
        return;
      }
    } else if (!validateVehicleConfirm()) {
      window.alert('Please fill all required fields before continuing.');
      return;
    }

    const pendingRaw = window.localStorage.getItem('weighbuddy_pendingClient');
    let pendingClient = null;

    if (pendingRaw) {
      try {
        pendingClient = JSON.parse(pendingRaw);
      } catch (e) {
        console.error('Failed to parse pending client from localStorage', e);
      }
    }

    // Professional client draft created from the ProfessionalClientStart screen.
    // Contains diyClientUserId and the end-customer contact details. We forward
    // these into the DIY vehicle-only save so history shows the real client.
    let clientUserId = null;
    let clientName = '';
    let clientPhone = '';
    let clientEmail = '';
    try {
      const draftRaw = window.localStorage.getItem('professionalClientDraft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft && draft.diyClientUserId) {
          clientUserId = draft.diyClientUserId;
        }

        const firstName = String(draft.firstName || '').trim();
        const lastName = String(draft.lastName || '').trim();
        clientName = [firstName, lastName].filter(Boolean).join(' ').trim();
        clientPhone = String(draft.phone || '').trim();
        clientEmail = String(draft.email || '').trim();
      }
    } catch (e) {
      console.error('Failed to parse professionalClientDraft from localStorage', e);
    }

    const createDiyClient = async () => {
      if (!pendingClient || pendingClient.clientType !== 'new') return;

      try {
        setSaving(true);
        await axios.post('/api/auth/create-diy-client-from-professional', {
          firstName: pendingClient.firstName,
          lastName: pendingClient.lastName,
          email: pendingClient.email,
          phone: pendingClient.phone,
          password: pendingClient.password,
        });
      } catch (error) {
        console.error('Failed to create DIY client from professional flow', error);
      } finally {
        setSaving(false);
      }
    };

    const axleWeigh = location.state?.axleWeigh || null;

    createDiyClient().finally(() => {
      const baseState = {
        rego,
        state,
        description,
        vin,
        frontAxleCapacity: frontAxleLoading,
        rearAxleCapacity: rearAxleLoading,
        gvmCapacity: gvm,
        gcmCapacity: gcm,
        btcCapacity: btc,
        tbmCapacity: tbm,
        measuredFrontAxle: axleWeigh?.frontAxleUnhitched ?? '',
        measuredRearAxle: '',
        measuredGvm: axleWeigh?.gvmUnhitched ?? '',
        fuelLevel: preWeigh?.fuelLevel ?? '',
        passengersFront: preWeigh?.passengersFront ?? '',
        passengersRear: preWeigh?.passengersRear ?? '',
        modifiedImages,
        // Customer context so DIY history can show the real client
        clientUserId: clientUserId || null,
        customerName: clientName || 'Professional Client',
        customerPhone: clientPhone || 'N/A',
        customerEmail: clientEmail || 'unknown@example.com',
        methodSelection: 'Weighbridge - In Ground - Individual Axle Weights',
        weighingSelection,
        axleWeigh,
        preWeigh,
      };

      const saveVehicleOnlyWeigh = async () => {
        try {
          setSaving(true);

          const capacities = {
            fawr: frontAxleLoading !== '' ? Number(frontAxleLoading) || 0 : null,
            rawr: rearAxleLoading !== '' ? Number(rearAxleLoading) || 0 : null,
            gvm: gvm !== '' ? Number(gvm) || 0 : null,
            gcm: gcm !== '' ? Number(gcm) || 0 : null,
            btc: btc !== '' ? Number(btc) || 0 : null,
            tbm: tbm !== '' ? Number(tbm) || 0 : null,
          };

          const frontMeasured = axleWeigh?.frontAxleUnhitched != null ? Number(axleWeigh.frontAxleUnhitched) || 0 : 0;
          const gvmMeasured = axleWeigh?.gvmUnhitched != null ? Number(axleWeigh.gvmUnhitched) || 0 : 0;
          const rearMeasured = gvmMeasured > 0 ? Math.max(0, gvmMeasured - frontMeasured) : 0;

          const normalizedWeights = {
            methodSelection: 'Weighbridge - In Ground - Individual Axle Weights',
            frontAxle: frontMeasured,
            rearAxle: rearMeasured,
            totalVehicle: gvmMeasured,
            totalCaravan: 0,
            grossCombination: gvmMeasured,
            tbm: 0,
            raw: {
              axleWeigh: axleWeigh || null,
              vehicleCapacities: capacities,
            },
          };

          const response = await axios.post('/api/weighs/diy-vehicle-only', {
            vehicleSummary: {
              description,
              rego,
              state,
              vin,
              gvmUnhitched: gvmMeasured,
              frontUnhitched: frontMeasured,
              rearUnhitched: rearMeasured,
              ...capacities,
            },
            weights: normalizedWeights,
            preWeigh: {
              fuelLevel: baseState.fuelLevel === '' ? null : Number(baseState.fuelLevel),
              passengersFront: Number(baseState.passengersFront) || 0,
              passengersRear: Number(baseState.passengersRear) || 0,
              notes: preWeigh?.notes || '',
            },
            modifiedVehicleImages: Array.isArray(modifiedImages) ? modifiedImages : [],
            payment: {
              method: 'direct',
              amount: 0,
              status: 'completed',
            },
            clientUserId: clientUserId || null,
          });

          return response.data?.weighId || null;
        } catch (error) {
          console.error('Failed to save professional vehicle-only in-ground weigh:', error);
          console.error('Backend response:', error?.response?.data);
          return null;
        } finally {
          setSaving(false);
        }
      };

      // Caravan-only flow: send caravan details with caravan object straight to results
      if (weighingSelection === 'caravan_only_registered') {
        const saveCaravanOnlyWeigh = async () => {
          try {
            setSaving(true);

            const caravanCaps = {
              atm: caravanAtm !== '' ? Number(caravanAtm) || 0 : null,
              gtm: caravanGtm !== '' ? Number(caravanGtm) || 0 : null,
              axleGroups: caravanAxleGroups !== '' ? Number(caravanAxleGroups) || 0 : null,
              tare: caravanTare !== '' ? Number(caravanTare) || 0 : null,
            };

            const gtmSource =
              axleWeigh?.caravanHitchedGtm != null
                ? axleWeigh.caravanHitchedGtm
                : axleWeigh?.trailerGtm;
            const atmSource =
              axleWeigh?.caravanUnhitchedAtm != null
                ? axleWeigh.caravanUnhitchedAtm
                : axleWeigh?.trailerAtm;

            const gtmMeasured = gtmSource != null ? Number(gtmSource) || 0 : 0;
            const atmMeasured = atmSource != null ? Number(atmSource) || 0 : 0;
            const tbmMeasured =
              axleWeigh?.tbm != null
                ? Number(axleWeigh.tbm) || 0
                : (atmMeasured > 0 && gtmMeasured > 0 ? Math.max(0, atmMeasured - gtmMeasured) : 0);

            const normalizedWeights = {
              methodSelection: 'Weighbridge - In Ground - Individual Axle Weights',
              frontAxle: 0,
              rearAxle: 0,
              totalVehicle: 0,
              totalCaravan: gtmMeasured,
              grossCombination: atmMeasured,
              tbm: tbmMeasured,
              raw: {
                axleWeigh: axleWeigh || null,
                towBallMass: tbmMeasured,
                caravanCapacities: caravanCaps,
              },
            };

            const response = await axios.post('/api/weighs/diy-vehicle-only', {
              vehicleSummary: {
                description: '',
                rego: '',
                state: '',
                vin: '',
                gvmUnhitched: 0,
                frontUnhitched: 0,
                rearUnhitched: 0,
              },
              caravanSummary: {
                rego,
                state,
                make: caravanMake,
                model: caravanModel,
                year: caravanYear,
                vin,
                complianceImage: caravanComplianceImage,
                ...caravanCaps,
                tbmMeasured,
                gtmMeasured,
                atmMeasured,
              },
              weights: normalizedWeights,
              preWeigh: {
                fuelLevel: baseState.fuelLevel === '' ? null : Number(baseState.fuelLevel),
                passengersFront: Number(baseState.passengersFront) || 0,
                passengersRear: Number(baseState.passengersRear) || 0,
                notes: preWeigh?.notes || '',
              },
              modifiedVehicleImages: Array.isArray(modifiedImages) ? modifiedImages : [],
              payment: {
                method: 'direct',
                amount: 0,
                status: 'completed',
              },
              clientUserId: clientUserId || null,
            });

            return response.data?.weighId || null;
          } catch (error) {
            console.error('Failed to save professional caravan-only in-ground weigh:', error);
            console.error('Backend response:', error?.response?.data);
            return null;
          } finally {
            setSaving(false);
          }
        };

        const enhancedState = {
          ...baseState,
          caravan: {
            rego,
            state,
            make: caravanMake,
            model: caravanModel,
            year: caravanYear,
            vin,
            gtm: caravanGtm,
            atm: caravanAtm,
            axleGroups: caravanAxleGroups,
            tare: caravanTare,
            complianceImage: caravanComplianceImage,
          },
        };

        saveCaravanOnlyWeigh().then((weighId) => {
          navigate('/vehicle-only-weighbridge-results', {
            state: {
              ...enhancedState,
              alreadySaved: Boolean(weighId),
              weighId: weighId || null,
            },
          });
        });
        return;
      }

      if (weighingSelection === 'tow_vehicle_and_caravan') {
        navigate('/tow-caravan-weighbridge-caravan-rego', {
          state: {
            ...baseState,
            isProfessionalFlow: true,
          },
        });
      } else {
        // Vehicle-only: persist a weigh record immediately so it appears in history.
        saveVehicleOnlyWeigh().then((weighId) => {
          navigate('/vehicle-only-weighbridge-results', {
            state: {
              ...baseState,
              alreadySaved: Boolean(weighId),
              weighId: weighId || null,
            },
          });
        });
      }
    });
  };

  const renderCaravanConfirmLayout = () => (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Caravan Trailer Only (registered)
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Weighbridge - In Ground - Individual Axle Weights
      </Typography>

      <Typography
        variant="h5"
        sx={{ fontWeight: 'bold', mb: 4 }}
      >
        Confirm Caravan/Trailer Details
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Rego Number"
            required
            value={rego}
            onChange={(e) => setRego(e.target.value)}
            error={Boolean(fieldErrors.rego)}
            helperText={fieldErrors.rego || ''}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="State"
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
            error={Boolean(fieldErrors.state)}
            helperText={fieldErrors.state || ''}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Make"
            required
            value={caravanMake}
            onChange={(e) => setCaravanMake(e.target.value)}
            error={Boolean(fieldErrors.caravanMake)}
            helperText={fieldErrors.caravanMake || ''}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Model"
            required
            value={caravanModel}
            onChange={(e) => setCaravanModel(e.target.value)}
            error={Boolean(fieldErrors.caravanModel)}
            helperText={fieldErrors.caravanModel || ''}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Year"
            required
            value={caravanYear}
            onChange={(e) => setCaravanYear(e.target.value)}
            error={Boolean(fieldErrors.caravanYear)}
            helperText={fieldErrors.caravanYear || ''}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="VIN Number"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Gross Trailer Mass (GTM)"
            value={caravanGtm}
            onChange={(e) => setCaravanGtm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Aggregate Trailer Mass (ATM)"
            required
            value={caravanAtm}
            onChange={(e) => setCaravanAtm(e.target.value)}
            error={Boolean(fieldErrors.caravanAtm)}
            helperText={fieldErrors.caravanAtm || ''}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Axle Group Loadings"
            value={caravanAxleGroups}
            onChange={(e) => setCaravanAxleGroups(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tare Mass Weight"
            required
            value={caravanTare}
            onChange={(e) => setCaravanTare(e.target.value)}
            error={Boolean(fieldErrors.caravanTare)}
            helperText={fieldErrors.caravanTare || ''}
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 2,
          p: 2,
          border: '1px solid',
          borderColor: 'grey.400',
          borderRadius: 1,
          minHeight: 80,
        }}
      >
        <Typography variant="body2" gutterBottom>
          How to Find Your Caravan / Trailer's Weigh Capacities
        </Typography>
        <Typography variant="body2" sx={{ fontSize: 12 }}>
          Compliance plates are usually found on the drawbar, in the front tunnel box or inside the door.
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            component="label"
            disabled={uploading}
          >
            Upload Image of Caravan/Trailer Compliance Plate
            <input
              hidden
              type="file"
              accept="image/*,application/pdf"
              onChange={handleModifiedImageUpload}
            />
          </Button>
          <Button
            variant="outlined"
            color="primary"
            component="label"
            disabled={uploading}
          >
            Take Photo
            <input
              hidden
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleModifiedImageUpload}
            />
          </Button>
          {(caravanComplianceLocalPreviewUrl || caravanComplianceImage) &&
            (caravanCompliancePreviewError ? (
              <Typography
                variant="caption"
                sx={{ display: 'block', cursor: 'pointer' }}
                onClick={() =>
                  window.open(
                    caravanComplianceImage || caravanComplianceLocalPreviewUrl,
                    '_blank',
                    'noopener,noreferrer'
                  )}
              >
                Preview unavailable (open file)
              </Typography>
            ) : (caravanComplianceLocalPreviewIsPdf ||
              String(caravanComplianceImage).toLowerCase().endsWith('.pdf')) ? (
              <Typography variant="caption" sx={{ display: 'block' }}>
                Compliance plate PDF selected
              </Typography>
            ) : (
              <Box
                role="button"
                tabIndex={0}
                onClick={() => setCaravanCompliancePreviewOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setCaravanCompliancePreviewOpen(true);
                }}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.400',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                title="Click to preview"
              >
                <Box
                  component="img"
                  src={caravanComplianceLocalPreviewUrl || caravanComplianceImage}
                  alt="Caravan compliance plate preview"
                  onError={() => setCaravanCompliancePreviewError(true)}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
            ))}
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={saving}
        >
          Confirm Data is Correct
        </Button>
      </Box>

      <Dialog
        open={caravanCompliancePreviewOpen}
        onClose={() => setCaravanCompliancePreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {(caravanComplianceLocalPreviewIsPdf ||
            String(caravanComplianceImage).toLowerCase().endsWith('.pdf') ||
            caravanCompliancePreviewError) ? (
            <Box
              component="iframe"
              src={caravanComplianceImage || caravanComplianceLocalPreviewUrl}
              title="Caravan compliance plate"
              sx={{ width: '100%', height: '80vh', border: 0, display: 'block' }}
            />
          ) : (
            <Box
              component="img"
              src={caravanComplianceLocalPreviewUrl || caravanComplianceImage}
              alt="Caravan compliance plate"
              onError={() => setCaravanCompliancePreviewError(true)}
              sx={{ width: '100%', height: 'auto', display: 'block' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {weighingSelection === 'caravan_only_registered'
            ? renderCaravanConfirmLayout()
            : (
              <>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {weighingSelection === 'tow_vehicle_and_caravan'
                    ? 'Tow Vehicle and Caravan / Trailer'
                    : 'Vehicle Only'}
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Weighbridge - In Ground - Individual Axle Weights
                </Typography>

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 'bold', mb: 4 }}
                >
                  Confirm Vehicle Details
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Rego Number"
                      required
                      value={rego}
                      onChange={(e) => setRego(e.target.value)}
                      error={Boolean(fieldErrors.rego)}
                      helperText={fieldErrors.rego || ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="State"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      error={Boolean(fieldErrors.state)}
                      helperText={fieldErrors.state || ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Vehicle Description"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      error={Boolean(fieldErrors.description)}
                      helperText={fieldErrors.description || ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="VIN Number"
                      value={vin}
                      onChange={(e) => setVin(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Front Axle Loading"
                      required
                      value={frontAxleLoading}
                      onChange={(e) => setFrontAxleLoading(e.target.value)}
                      error={Boolean(fieldErrors.frontAxleLoading)}
                      helperText={fieldErrors.frontAxleLoading || ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Rear Axle Loading"
                      required
                      value={rearAxleLoading}
                      onChange={(e) => setRearAxleLoading(e.target.value)}
                      error={Boolean(fieldErrors.rearAxleLoading)}
                      helperText={fieldErrors.rearAxleLoading || ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Gross Vehicle Mass (GVM)"
                      required
                      value={gvm}
                      onChange={(e) => setGvm(e.target.value)}
                      error={Boolean(fieldErrors.gvm)}
                      helperText={fieldErrors.gvm || ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Gross Combination Mass (GCM)"
                      required
                      value={gcm}
                      onChange={(e) => setGcm(e.target.value)}
                      error={Boolean(fieldErrors.gcm)}
                      helperText={fieldErrors.gcm || ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Braked Towing Capacity (BTC)"
                      required
                      value={btc}
                      onChange={(e) => setBtc(e.target.value)}
                      error={Boolean(fieldErrors.btc)}
                      helperText={fieldErrors.btc || ''}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tow Ball Mass (TBM)"
                      required
                      value={tbm}
                      onChange={(e) => setTbm(e.target.value)}
                      error={Boolean(fieldErrors.tbm)}
                      helperText={fieldErrors.tbm || ''}
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    mt: 4,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'grey.400',
                    borderRadius: 1,
                    minHeight: 120,
                  }}
                >
                  <Typography variant="body2" gutterBottom>
                    Has the vehicle been modified? Some data missing? Let's fill it in.
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 12 }}>
                    How to Find Your Vehicle's Weigh Capacities:
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 12 }}>
                    Owner's Manual: Look under "Towing a Trailer" for Axle Group Loadings, GVM, GCM, BTC, and TBM.
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 12 }}>
                    Online Search: Find your vehicle's make, model, and year brochure (PDF) – the data is usually near the back.
                  </Typography>
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                  <Box sx={{ maxWidth: '60%' }}>
                    <FormControlLabel
                      control={(
                        <Checkbox
                          checked={hasModifications}
                          onChange={(e) => setHasModifications(e.target.checked)}
                          color="primary"
                        />
                      )}
                      label="If the vehicle has been modified, upload images of the new compliance plate (up to 3 images)"
                    />
                    {hasModifications && (
                      <Box sx={{ mt: 1 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          component="label"
                          disabled={uploading || modifiedImages.length >= 3}
                        >
                          Upload Image for modified vehicles
                          <input
                            hidden
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={handleModifiedImageUpload}
                          />
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          component="label"
                          disabled={uploading || modifiedImages.length >= 3}
                          sx={{ ml: 2 }}
                        >
                          Take Photo
                          <input
                            hidden
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleModifiedImageUpload}
                          />
                        </Button>
                        {modifiedImagePreviews.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                            {modifiedImagePreviews.map((p, idx) =>
                              p?.previewError ? (
                                <Typography
                                  // eslint-disable-next-line react/no-array-index-key
                                  key={idx}
                                  variant="caption"
                                  sx={{ display: 'block', cursor: 'pointer' }}
                                  onClick={() =>
                                    window.open(
                                      modifiedImages[idx] || p.localUrl,
                                      '_blank',
                                      'noopener,noreferrer'
                                    )}
                                >
                                  Preview unavailable (open file)
                                </Typography>
                              ) : p?.isPdf ? (
                                <Typography
                                  // eslint-disable-next-line react/no-array-index-key
                                  key={idx}
                                  variant="caption"
                                  sx={{ display: 'block', cursor: 'pointer' }}
                                  onClick={() => {
                                    setModifiedPreviewIndex(idx);
                                    setModifiedPreviewOpen(true);
                                  }}
                                >
                                  PDF selected
                                </Typography>
                              ) : (
                                <Box
                                  // eslint-disable-next-line react/no-array-index-key
                                  key={idx}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    setModifiedPreviewIndex(idx);
                                    setModifiedPreviewOpen(true);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      setModifiedPreviewIndex(idx);
                                      setModifiedPreviewOpen(true);
                                    }
                                  }}
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'grey.400',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                  }}
                                  title="Click to preview"
                                >
                                  <Box
                                    component="img"
                                    src={p.localUrl || modifiedImages[idx]}
                                    alt="Modified compliance plate preview"
                                    onError={() =>
                                      setModifiedImagePreviews((prev) =>
                                        (Array.isArray(prev) ? prev : []).map((x, i) =>
                                          i === idx ? { ...x, previewError: true } : x
                                        ))
                                    }
                                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                </Box>
                              )
                            )}
                          </Box>
                        )}
                        {modifiedImages.length > 0 && (
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', mt: 1 }}
                          >
                            {`Uploaded ${modifiedImages.length} of 3 images`}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleConfirm}
                    disabled={saving}
                  >
                    Confirm Data is Correct
                  </Button>
                </Box>

                <Dialog
                  open={modifiedPreviewOpen}
                  onClose={() => setModifiedPreviewOpen(false)}
                  maxWidth="md"
                  fullWidth
                >
                  <DialogContent sx={{ p: 0 }}>
                    {modifiedImagePreviews[modifiedPreviewIndex]?.isPdf ||
                    modifiedImagePreviews[modifiedPreviewIndex]?.previewError ? (
                      <Box
                        component="iframe"
                        src={
                          modifiedImages[modifiedPreviewIndex] ||
                          modifiedImagePreviews[modifiedPreviewIndex]?.localUrl
                        }
                        title="Modified compliance plate"
                        sx={{ width: '100%', height: '80vh', border: 0, display: 'block' }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={
                          modifiedImagePreviews[modifiedPreviewIndex]?.localUrl ||
                          modifiedImages[modifiedPreviewIndex]
                        }
                        alt="Modified compliance plate"
                        onError={() =>
                          setModifiedImagePreviews((prev) =>
                            (Array.isArray(prev) ? prev : []).map((x, i) =>
                              i === modifiedPreviewIndex ? { ...x, previewError: true } : x
                            ))
                        }
                        sx={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )}

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              2026 Weigh Buddy. All rights reserved ABN 29 669 902 345
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ProfessionalVehicleOnlyWeighbridgeInGroundConfirm;
