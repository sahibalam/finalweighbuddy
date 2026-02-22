import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Button,
  Grid
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const DIYVehicleOnlyWeighbridgeResults = ({ overrideState, embedded = false } = {}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Professional flow: hydrate client details from localStorage draft created on ProfessionalClientStart
  const [clientInfo, setClientInfo] = useState(null);
  // Fleet flow: hydrate customer draft created from FleetStaffManagement "Create new User".
  const [fleetCustomerDraft, setFleetCustomerDraft] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('professionalClientDraft');
      console.log('🔎 professionalClientDraft raw in results:', raw);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      console.log('🔎 professionalClientDraft parsed in results:', parsed);
      if (!parsed || typeof parsed !== 'object') return;

      const fullName = [parsed.firstName, parsed.lastName]
        .filter((v) => v && String(v).trim() !== '')
        .join(' ');

      const email = parsed.email ? String(parsed.email).trim() : '';
      const phone = parsed.phone ? String(parsed.phone).trim() : '';

      if (fullName || email || phone) {
        setClientInfo({ fullName, email, phone });
      }
    } catch (e) {
      // Ignore parse errors – results screen should still render for DIY flows.
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('weighbuddy_fleetCustomerDraft');
      console.log('DIYResults: fleetCustomerDraft raw from localStorage:', raw);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      console.log('DIYResults: fleetCustomerDraft parsed from localStorage:', parsed);
      if (!parsed || typeof parsed !== 'object') return;

      const fullName = String(parsed.fullName || '').trim();
      const email = parsed.email ? String(parsed.email).trim() : '';
      const phone = parsed.phone ? String(parsed.phone).trim() : '';
      const clientUserId = parsed.clientUserId ? String(parsed.clientUserId).trim() : null;

      if (fullName || email || phone || clientUserId) {
        console.log('DIYResults: setting fleetCustomerDraft state with:', {
          fullName,
          email,
          phone,
          clientUserId,
        });
        setFleetCustomerDraft({ fullName, email, phone, clientUserId });
      }
    } catch (e) {
      // Ignore parse errors; fleet flows will simply fall back to account details.
    }
  }, []);

  const loadPersistedResultsState = () => {
    try {
      const raw = window.sessionStorage.getItem('weighbuddy_lastResultsState');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const hasLocationState = Boolean(location.state && Object.keys(location.state).length > 0);
  const persistedState = useMemo(() => {
    if (overrideState) return null;
    if (hasLocationState) return null;
    return loadPersistedResultsState();
  }, [hasLocationState, overrideState]);

  const resolvedState = useMemo(() => {
    return overrideState || (hasLocationState ? location.state : persistedState) || {};
  }, [hasLocationState, location.state, overrideState, persistedState]);

  useEffect(() => {
    if (!overrideState && hasLocationState) {
      try {
        window.sessionStorage.setItem(
          'weighbuddy_lastResultsState',
          JSON.stringify(location.state)
        );
      } catch (e) {
        // ignore
      }
    }
  }, [hasLocationState, location.state, overrideState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (embedded) return;
    if (user?.userType !== 'fleet') return;

    let cancelled = false;

    const sendFleetStaffCredentialsEmail = async () => {
      try {
        const raw = window.sessionStorage.getItem('weighbuddy_fleet_new_staff_credentials');
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (!parsed || parsed.sent) return;
        if (!parsed.email || !parsed.password) return;

        await axios.post('/api/fleet/staff/send-credentials', {
          email: parsed.email,
          firstName: parsed.firstName,
          password: parsed.password,
        });

        if (cancelled) return;

        window.sessionStorage.setItem(
          'weighbuddy_fleet_new_staff_credentials',
          JSON.stringify({ ...parsed, sent: true })
        );
      } catch (e) {
        // If email fails (SMTP not configured, etc.), do not block results UI.
        // Keep sent=false so a later attempt can resend.
      }
    };

    sendFleetStaffCredentialsEmail();

    return () => {
      cancelled = true;
    };
  }, [embedded, user?.userType]);

  const {
    rego = '',
    state = '',
    description = '',
    vin = '',
    // Capacity values from Info-Agent / lookup
    frontAxleCapacity = '',
    rearAxleCapacity = '',
    gvmCapacity = '',
    gcmCapacity = '',
    btcCapacity = '',
    tbmCapacity = '',
    // Measured values from DIY axle weigh screen
    measuredFrontAxle = '',
    measuredRearAxle = '',
    measuredGvm = '',
    // Customer fields for DIY/fleet flows (forwarded from history or live flows)
    customerName = '',
    customerPhone = '',
    customerEmail = '',
    fuelLevel = '',
    passengersFront = '',
    passengersRear = '',
    modifiedImages = [],
    methodSelection = '',
    weighingSelection = '',
    caravan = {},
    tyreWeigh = null,
    preWeigh = null,
    axleWeigh = null,
    goweighData = null,
    alreadySaved = false,
    weighId = null
  } = resolvedState;

  // For embedded history modals, always prefer the customer details coming
  // from the weigh record (overrideState) so stale localStorage drafts from
  // professional/fleet workflows do not leak into the history view.
  const effectiveClient = React.useMemo(() => {
    const name = String(customerName || '').trim();
    const email = String(customerEmail || '').trim();
    const phone = String(customerPhone || '').trim();

    if (embedded) {
      if (!name && !email && !phone) return null;
      return { fullName: name, email, phone };
    }

    if (clientInfo && (clientInfo.fullName || clientInfo.email || clientInfo.phone)) {
      return clientInfo;
    }

    if (!name && !email && !phone) {
      return null;
    }

    return {
      fullName: name,
      email,
      phone,
    };
  }, [clientInfo, customerName, customerEmail, customerPhone, embedded]);

  const resolvedFuelLevel =
    fuelLevel !== '' && fuelLevel != null
      ? fuelLevel
      : preWeigh && preWeigh.fuelLevel != null
        ? preWeigh.fuelLevel
        : '';

  const resolvedPassengersFront =
    passengersFront !== '' && passengersFront != null
      ? passengersFront
      : preWeigh && preWeigh.passengersFront != null
        ? preWeigh.passengersFront
        : 0;

  const resolvedPassengersRear =
    passengersRear !== '' && passengersRear != null
      ? passengersRear
      : preWeigh && preWeigh.passengersRear != null
        ? preWeigh.passengersRear
        : 0;

  const methodLabel = methodSelection || 'Weighbridge - In Ground - Individual Axle Weights';
  const isCaravanGoweighMethod =
    methodSelection === 'Weighbridge - goweigh' || methodSelection === 'GoWeigh Weighbridge';
  const isCaravanAboveGroundMethod =
    methodSelection === 'Weighbridge - Above Ground' || methodSelection === 'Above Ground Weighbridge';
  const isTowCaravanInGroundMethod =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Weighbridge - In Ground - Tow Vehicle and Trailer are level and Individual Axle Weights can be recorded';

  const isTowCaravanAboveGroundSingleCell =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection ===
      'Weighbridge - Above Ground - Single Cell - Tow Vehicle and Trailer are no level limiting the ability to record individual axle weights.';

  const isProfessionalTowCaravanInGroundMethod =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    (
      methodSelection === 'Weighbridge - In Ground - Individual Axle Weights' ||
      // Some embedded professional history entries may not persist an explicit
      // methodSelection string, but will still carry VCI payloads. Treat these
      // as the professional in-ground tow+caravan method so reconstruction
      // logic can run and measured values are not left as 0 / N/A.
      (!methodSelection && resolvedState && resolvedState.vci01)
    );
  const isTowCaravanGoWeighMethod =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Weighbridge - goweigh';
  const headingLabel =
    weighingSelection === 'tow_vehicle_and_caravan'
      ? 'Tow Vehicle and Caravan/Trailer'
      : weighingSelection === 'caravan_only_registered'
        ? 'Caravan / Trailer Only (registered)'
        : 'Vehicle Only';

  // DIY tow+caravan GoWeigh session fallback
  let resolvedGoweighData = goweighData;
  if (
    typeof window !== 'undefined' &&
    isTowCaravanGoWeighMethod &&
    !resolvedGoweighData
  ) {
    try {
      const raw = window.sessionStorage.getItem('weighbuddy_diy_tow_goweigh');
      if (raw) {
        resolvedGoweighData = JSON.parse(raw);
      }
    } catch (e) {
      // ignore
    }
  }

  // DIY portable tow+caravan session fallbacks
  let portableSessionTyreWeigh = null;
  let portableSessionVci01 = null;
  let portableSessionVci02 = null;
  if (
    typeof window !== 'undefined' &&
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Portable Scales - Individual Tyre Weights'
  ) {
    try {
      const rawTyres = window.sessionStorage.getItem(
        'weighbuddy_diy_portable_tow_tyres_caravan'
      );
      if (rawTyres) portableSessionTyreWeigh = JSON.parse(rawTyres);
    } catch (e) {
      // ignore
    }
    try {
      const rawVci01 = window.sessionStorage.getItem(
        'weighbuddy_diy_portable_tow_vci01'
      );
      if (rawVci01) portableSessionVci01 = JSON.parse(rawVci01);
    } catch (e) {
      // ignore
    }
    try {
      const rawVci02 = window.sessionStorage.getItem(
        'weighbuddy_diy_portable_tow_vci02'
      );
      if (rawVci02) portableSessionVci02 = JSON.parse(rawVci02);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    if (
      weighingSelection === 'tow_vehicle_and_caravan' &&
      methodSelection === 'Portable Scales - Individual Tyre Weights'
    ) {
      let updated = false;
      const nextState = { ...resolvedState };

      // Hydrate caravan tyre weights if missing
      if (!nextState.tyreWeigh) {
        try {
          const rawTyres = window.sessionStorage.getItem(
            'weighbuddy_diy_portable_tow_tyres_caravan'
          );
          if (rawTyres) {
            nextState.tyreWeigh = JSON.parse(rawTyres);
            updated = true;
          }
        } catch (e) {
          // ignore
        }
      }

      // Hydrate VCI01 (hitched tow-vehicle tyres) if missing
      if (!nextState.vci01) {
        try {
          const rawVci01 = window.sessionStorage.getItem(
            'weighbuddy_diy_portable_tow_vci01'
          );
          if (rawVci01) {
            nextState.vci01 = JSON.parse(rawVci01);
            updated = true;
          }
        } catch (e) {
          // ignore
        }
      }

      // Hydrate VCI02 (unhitched tow-vehicle tyres) if missing
      if (!nextState.vci02) {
        try {
          const rawVci02 = window.sessionStorage.getItem(
            'weighbuddy_diy_portable_tow_vci02'
          );
          if (rawVci02) {
            nextState.vci02 = JSON.parse(rawVci02);
            updated = true;
          }
        } catch (e) {
          // ignore
        }
      }

      if (updated && !overrideState) {
        try {
          window.sessionStorage.setItem(
            'weighbuddy_lastResultsState',
            JSON.stringify(nextState)
          );
        } catch (e) {
          // ignore
        }
      }
    }
  }, [methodSelection, weighingSelection, resolvedState, overrideState]);

  const safeNum = (v) => (v != null ? Number(v) || 0 : 0);

  let gvmHitched = 0;
  let gvmUnhitched = 0;
  let tbm = 0;
  let gtmMeasured = 0;
  let atmMeasured = 0; // will be derived later from caravanAtmCapacityNum or measured values
  let gcmMeasured = 0;

  // Tow Vehicle + Caravan detailed axle values for Additional Information section
  let hitchedFrontAxle = 0;
  let hitchedRearAxle = 0;
  let unhitchedFrontAxle = 0;
  let unhitchedRearAxle = 0;

  // Measured (Compliance row) values
  let frontMeasured = 0;
  let rearMeasured = 0;
  let gvmMeasured = 0;

  // Overall caravan / combination measured values that may be supplied
  // directly from history (e.g. via PDF-style calculations) instead of
  // recomputed here. These are especially important for embedded
  // professional tow+caravan in-ground flows.
  const atmMeasuredOverall = resolvedState?.atmMeasuredOverall ?? null;
  const gtmMeasuredOverall = resolvedState?.gtmMeasuredOverall ?? null;
  const gcmMeasuredOverall = resolvedState?.gcmMeasuredOverall ?? null;

  if (
    embedded &&
    methodSelection === 'Portable Scales - Individual Tyre Weights' &&
    weighingSelection === 'tow_vehicle_and_caravan' &&
    !resolvedState?.vci01 &&
    !resolvedState?.vci02
  ) {
    // Embedded history for portable tow+caravan without full VCI data.
    // In this case we cannot safely recompute from tyre-level readings,
    // so fall back to the persisted axle totals supplied via
    // measuredFrontAxle / measuredRearAxle / measuredGvm.
    frontMeasured = Number(measuredFrontAxle) || 0;
    rearMeasured = Number(measuredRearAxle) || 0;
    gvmMeasured = Number(measuredGvm) || (frontMeasured + rearMeasured);

    if (gvmMeasured > 0) {
      gvmHitched = gvmMeasured;
      hitchedFrontAxle = frontMeasured;
      hitchedRearAxle = rearMeasured || Math.max(0, gvmMeasured - frontMeasured);
    }
  } else if (methodSelection === 'Portable Scales - Individual Tyre Weights') {
    // For portable scales, we treat measuredFrontAxle and measuredRearAxle
    // as the front and rear axle totals, and GVM is their sum.
    frontMeasured = Number(measuredFrontAxle) || 0;
    rearMeasured = Number(measuredRearAxle) || 0;
    gvmMeasured = frontMeasured + rearMeasured;
  } else if (methodSelection === 'Weighbridge - goweigh') {
    // GoWeigh method: use user-provided front axle and GVM, with
    // Rear Axle Unhitched derived from:
    //   Front Axle Unhitched - GVM Unhitched = Rear Axle Unhitched
    frontMeasured = Number(measuredFrontAxle) || 0;
    gvmMeasured = Number(measuredGvm) || 0;
    // Correct derivation: Rear = GVM - Front
    rearMeasured = gvmMeasured - frontMeasured;
  } else {
    // Standard Weighbridge axle method: Rear = GVM - Front
    frontMeasured = Number(measuredFrontAxle) || 0;
    gvmMeasured = Number(measuredGvm) || 0;
    rearMeasured = gvmMeasured - frontMeasured;
  }

  // Capacity (Info-Agent / lookup) values for Weights Recorded row
  const frontCapacity = Number(frontAxleCapacity) || 0;
  const rearCapacity = Number(rearAxleCapacity) || 0;
  const gvmCapacityNum = Number(gvmCapacity) || 0;
  const gcmCapacityNum = gcmCapacity === '' ? null : Number(gcmCapacity) || 0;
  const btcCapacityNum = btcCapacity === '' ? null : Number(btcCapacity) || 0;
  const tbmCapacityNum = tbmCapacity === '' ? null : Number(tbmCapacity) || 0;

  // Caravan capacity values (if provided via caravan confirm screen)
  const caravanAtmCapacityNum = caravan.atm ? Number(caravan.atm) || 0 : 0;
  const caravanGtmCapacityNum = caravan.gtm ? Number(caravan.gtm) || 0 : 0;
  const caravanAxleGroupCapacityNum = caravan.axleGroups ? Number(caravan.axleGroups) || 0 : 0;

  // For caravan-only flows, derive a TBM capacity from ATM - GTM when both are provided
  // on the Confirm Caravan/Trailer Details screen. This gives a meaningful "Compliance"
  // value for Tow Ball Mass (TBM) instead of N/A.
  const caravanTbmCapacityNum =
    weighingSelection === 'caravan_only_registered' && caravanAtmCapacityNum > 0 && caravanGtmCapacityNum > 0
      ? caravanAtmCapacityNum - caravanGtmCapacityNum
      : null;

  // Measured caravan metrics for Caravan Only flows
  let caravanMeasuredGtm = 0;
  let caravanMeasuredAtm = 0;
  let caravanMeasuredTbm = 0;

  // Embedded tow+caravan portable history may only persist caravanData
  // measured fields (atmMeasured/gtmMeasured/tbmMeasured) instead of the
  // raw tyre/axle payloads used in live DIY flows. When those values are
  // present on the incoming caravan object, use them to seed the caravan
  // measured metrics and the shared ATM/GTM/TBM variables so the Caravan /
  // Trailer section does not show 0 in the Measured column.
  if (
    embedded &&
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Portable Scales - Individual Tyre Weights'
  ) {
    const caravanAtmMeasured = caravan && caravan.atmMeasured != null
      ? Number(caravan.atmMeasured) || 0
      : 0;
    const caravanGtmMeasured = caravan && caravan.gtmMeasured != null
      ? Number(caravan.gtmMeasured) || 0
      : 0;
    const caravanTbmMeasured = caravan && caravan.tbmMeasured != null
      ? Number(caravan.tbmMeasured) || 0
      : 0;

    if (caravanGtmMeasured > 0) {
      caravanMeasuredGtm = caravanGtmMeasured;
      gtmMeasured = caravanGtmMeasured;
    }
    if (caravanAtmMeasured > 0) {
      caravanMeasuredAtm = caravanAtmMeasured;
      atmMeasured = caravanAtmMeasured;
    }
    if (caravanTbmMeasured > 0) {
      caravanMeasuredTbm = caravanTbmMeasured;
      tbm = caravanTbmMeasured;
    }
  }

  // When we have both a tow-vehicle GVM and caravan GTM measured for an
  // embedded tow+caravan portable history record but no explicit GCM,
  // derive GCM as GVM Hitched + GTM so the GCM measured column is not 0.
  if (
    embedded &&
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Portable Scales - Individual Tyre Weights'
  ) {
    const baseGvmForGcm = gvmHitched > 0 ? gvmHitched : gvmMeasured;
    if (gcmMeasured === 0 && baseGvmForGcm > 0 && gtmMeasured > 0) {
      gcmMeasured = baseGvmForGcm + gtmMeasured;
    }
  }

  if (weighingSelection === 'caravan_only_registered') {
    // Portable Scales - derive GTM from individual tyre loads
    if (methodSelection === 'Portable Scales - Individual Tyre Weights') {
      const safeNumLocal = (v) => (v != null ? Number(v) || 0 : 0);

      if (tyreWeigh) {
        // DIY caravan-only portable flow uses detailed tyreWeigh structure.
        if (tyreWeigh.axleConfig === 'Single Axle') {
          caravanMeasuredGtm = safeNumLocal(tyreWeigh.single?.left) + safeNumLocal(tyreWeigh.single?.right);
        } else if (tyreWeigh.axleConfig === 'Dual Axle') {
          caravanMeasuredGtm =
            safeNumLocal(tyreWeigh.dual?.frontLeft) +
            safeNumLocal(tyreWeigh.dual?.frontRight) +
            safeNumLocal(tyreWeigh.dual?.rearLeft) +
            safeNumLocal(tyreWeigh.dual?.rearRight);
        } else if (tyreWeigh.axleConfig === 'Triple Axle') {
          caravanMeasuredGtm =
            safeNumLocal(tyreWeigh.triple?.frontLeft) +
            safeNumLocal(tyreWeigh.triple?.frontRight) +
            safeNumLocal(tyreWeigh.triple?.middleLeft) +
            safeNumLocal(tyreWeigh.triple?.middleRight) +
            safeNumLocal(tyreWeigh.triple?.rearLeft) +
            safeNumLocal(tyreWeigh.triple?.rearRight);
        }
      } else if (axleWeigh && axleWeigh.trailerGtm != null) {
        // Professional caravan-only portable scales flow sends GTM in axleWeigh.trailerGtm.
        caravanMeasuredGtm = safeNumLocal(axleWeigh.trailerGtm);
      }

      // For professional caravan-only portable scales, TBM is taken directly
      // from the Right Tow Ball Weight field on the caravan tyre screen.
      if (tyreWeigh && tyreWeigh.rightTowBallWeight != null) {
        // DIY caravan-only portable flow stores this value on the tyreWeigh object.
        caravanMeasuredTbm = safeNumLocal(tyreWeigh.rightTowBallWeight);
      } else if (resolvedState && resolvedState.towBallMass != null) {
        // Professional caravan-only portable flow uses towBallMass.
        caravanMeasuredTbm = safeNumLocal(resolvedState.towBallMass);
      }

      // For caravan-only portable scales, ATM is not entered directly; derive it.
      // ATM = GTM + TBM when both are available.
      if (caravanMeasuredGtm > 0 && caravanMeasuredTbm > 0) {
        caravanMeasuredAtm = caravanMeasuredGtm + caravanMeasuredTbm;
      }
    }

    // Weighbridge - In Ground: GTM & ATM supplied
    // DIY caravan-only in-ground uses caravanHitchedGtm / caravanUnhitchedAtm.
    // Professional caravan-only in-ground uses trailerGtm / trailerAtm / tbm.
    if ((methodSelection === 'Weighbridge - In Ground -' ||
      methodSelection === 'Weighbridge - In Ground - Individual Axle Weights') &&
      axleWeigh) {
      const gtmSource =
        axleWeigh.caravanHitchedGtm != null ? axleWeigh.caravanHitchedGtm : axleWeigh.trailerGtm;
      const atmSource =
        axleWeigh.caravanUnhitchedAtm != null ? axleWeigh.caravanUnhitchedAtm : axleWeigh.trailerAtm;

      caravanMeasuredGtm = gtmSource != null ? Number(gtmSource) || 0 : 0;
      caravanMeasuredAtm = atmSource != null ? Number(atmSource) || 0 : 0;

      // Prefer explicit TBM when provided (professional flow), otherwise
      // it will be derived below as ATM - GTM.
      if (axleWeigh.tbm != null) {
        caravanMeasuredTbm = Number(axleWeigh.tbm) || 0;
      }
    }

    // Weighbridge - Above Ground: ATM supplied, GTM/TBM treated as not applicable
    if (isCaravanAboveGroundMethod && axleWeigh) {
      caravanMeasuredAtm = axleWeigh.caravanAtm != null ? Number(axleWeigh.caravanAtm) || 0 : 0;
      caravanMeasuredGtm = 0;
      caravanMeasuredTbm = 0;
    }

    // Weighbridge - goweigh: GTM, ATM, TBM all supplied.
    // DIY caravan-only GoWeigh uses caravanHitchedGtm / caravanUnhitchedAtm / towballMass.
    // Professional caravan-only GoWeigh uses trailerGtm / trailerAtm / tbm.
    if (isCaravanGoweighMethod && axleWeigh) {
      const gtmSource =
        axleWeigh.caravanHitchedGtm != null ? axleWeigh.caravanHitchedGtm : axleWeigh.trailerGtm;
      const atmSource =
        axleWeigh.caravanUnhitchedAtm != null ? axleWeigh.caravanUnhitchedAtm : axleWeigh.trailerAtm;
      const tbmSource =
        axleWeigh.towballMass != null ? axleWeigh.towballMass : axleWeigh.tbm;

      caravanMeasuredGtm = gtmSource != null ? Number(gtmSource) || 0 : 0;
      caravanMeasuredAtm = atmSource != null ? Number(atmSource) || 0 : 0;
      caravanMeasuredTbm = tbmSource != null ? Number(tbmSource) || 0 : 0;
    }

    // Derive TBM where possible
    if (caravanMeasuredAtm > 0 || caravanMeasuredGtm > 0) {
      const hasExplicitGoweighTbm = isCaravanGoweighMethod && axleWeigh && axleWeigh.towballMass != null;
      const hasExplicitPortableTbm =
        methodSelection === 'Portable Scales - Individual Tyre Weights' &&
        ((resolvedState && resolvedState.towBallMass != null) || (tyreWeigh && tyreWeigh.rightTowBallWeight != null));

      if (!hasExplicitGoweighTbm && !hasExplicitPortableTbm) {
        // For methods without an explicit TBM input, derive TBM as ATM - GTM
        caravanMeasuredTbm = caravanMeasuredAtm - caravanMeasuredGtm;
      }
    }
  }

  if (isTowCaravanInGroundMethod && axleWeigh) {
    // Weighbridge - In Ground tow+caravan flow using DIYTowCaravanWeighbridgeInGround +
    // DIYTowCaravanUnhitchedWeighbridgeAxle
    const hitchedFront = safeNum(axleWeigh.frontAxle);
    const hitchedGvm = safeNum(axleWeigh.gvmHitched);
    const hitchedRear = hitchedGvm - hitchedFront;

    const unhitchedFront = safeNum(axleWeigh.unhitchedFrontAxle);
    const unhitchedGvm = safeNum(axleWeigh.gvmUnhitched);
    const unhitchedRear = unhitchedGvm - unhitchedFront;

    // Front 2 tyre loadings Hitched + Rear 2 tyre Hitched = GVM Hitched
    gvmHitched = hitchedFront + hitchedRear;
    // Front 2 tyre loadings Unhitched + Rear 2 tyre Unhitched = GVM Unhitched
    gvmUnhitched = unhitchedFront + unhitchedRear;

    // Persist detailed axle values for Additional Information section
    hitchedFrontAxle = hitchedFront;
    hitchedRearAxle = hitchedRear;
    unhitchedFrontAxle = unhitchedFront;
    unhitchedRearAxle = unhitchedRear;

    // TBM from WDH / non-WDH
    const gvmHitchWdhRelease = safeNum(axleWeigh.gvmHitchedWdhRelease);
    const hasWdh = axleWeigh.wdhUsed === 'Yes';

    if (gvmUnhitched > 0) {
      if (hasWdh && gvmHitchWdhRelease > 0) {
        // With WDH- GVM Hitch WDH off - GVM Unhitched = TBM
        tbm = gvmHitchWdhRelease - gvmUnhitched;
      } else {
        // Without WDH - GVM Hitched - GVM Unhitched = TBM
        tbm = gvmHitched - gvmUnhitched;
      }
    }

    // GTM from trailer GTM input
    gtmMeasured = safeNum(axleWeigh.trailerGtm);

    // GTM + TBM = ATM
    atmMeasured = gtmMeasured + tbm;

    // GCM = GTM + GVM Hitched
    gcmMeasured = gtmMeasured + gvmHitched;
  } else if (
    // Embedded DIY history for Weighbridge - In Ground tow+caravan
    // where axleWeigh is not available. Reconstruct measured values from
    // persisted weights/compliance that were mapped into resolvedState.
    embedded &&
    isTowCaravanInGroundMethod &&
    !axleWeigh
  ) {
    const resolvedCaravan = resolvedState && resolvedState.caravan ? resolvedState.caravan : {};

    const measuredFrontFromState = safeNum(resolvedState && resolvedState.measuredFrontAxle);
    const measuredRearFromState = safeNum(resolvedState && resolvedState.measuredRearAxle);
    const measuredGvmFromState = safeNum(resolvedState && resolvedState.measuredGvm);

    // Tow Vehicle Hitched: prefer explicit front/rear from state, otherwise
    // fall back to total GVM.
    hitchedFrontAxle = measuredFrontFromState || 0;
    hitchedRearAxle =
      measuredRearFromState != null
        ? measuredRearFromState
        : measuredGvmFromState != null && measuredFrontFromState != null
          ? measuredGvmFromState - measuredFrontFromState
          : 0;

    gvmHitched =
      measuredGvmFromState != null && measuredGvmFromState > 0
        ? measuredGvmFromState
        : hitchedFrontAxle + hitchedRearAxle;

    // Tow Vehicle Unhitched: use persisted unhitched values when present,
    // otherwise fall back to hitched values so the UI shows something
    // meaningful instead of 0 / N/A.
    const unhitchedGvmFromState = safeNum(resolvedState && resolvedState.unhitchedGvm);
    const unhitchedFrontFromState = safeNum(resolvedState && resolvedState.unhitchedFrontAxle);
    const unhitchedRearFromState = safeNum(resolvedState && resolvedState.unhitchedRearAxle);

    unhitchedFrontAxle = unhitchedFrontFromState || hitchedFrontAxle;
    unhitchedRearAxle =
      unhitchedRearFromState != null
        ? unhitchedRearFromState
        : unhitchedGvmFromState != null && unhitchedFrontAxle != null
          ? unhitchedGvmFromState - unhitchedFrontAxle
          : hitchedRearAxle;

    gvmUnhitched =
      unhitchedGvmFromState != null && unhitchedGvmFromState > 0
        ? unhitchedGvmFromState
        : unhitchedFrontAxle + unhitchedRearAxle;

    // Caravan / trailer measured values from persisted caravanData.
    let caravanGtmFromState = safeNum(resolvedCaravan && resolvedCaravan.gtmMeasured);
    let caravanAtmFromState = safeNum(resolvedCaravan && resolvedCaravan.atmMeasured);
    const tbmFromState = safeNum(resolvedState && resolvedState.towBallMass);

    // Prefer explicit ATM/GTM from state; derive missing ones when possible.
    if (caravanAtmFromState == null && caravanGtmFromState != null && tbmFromState != null) {
      caravanAtmFromState = caravanGtmFromState + tbmFromState;
    }
    if (caravanGtmFromState == null && caravanAtmFromState != null && tbmFromState != null) {
      caravanGtmFromState = caravanAtmFromState - tbmFromState;
    }

    gtmMeasured = caravanGtmFromState || 0;
    atmMeasured = caravanAtmFromState || 0;
    if (tbmFromState != null && tbmFromState > 0) {
      tbm = tbmFromState;
    } else if (atmMeasured > 0 && gtmMeasured > 0) {
      tbm = atmMeasured - gtmMeasured;
    }

    // GCM: for in-ground DIY tow+caravan, this matches the detailed
    // report behaviour: vehicle GVM (unhitched) + caravan ATM.
    if (!gcmMeasured || gcmMeasured <= 0) {
      const baseVehicleGvm = gvmUnhitched || gvmHitched || measuredGvmFromState || 0;
      if (baseVehicleGvm > 0 && atmMeasured > 0) {
        gcmMeasured = baseVehicleGvm + atmMeasured;
      }
    }
  } else if (isProfessionalTowCaravanInGroundMethod && axleWeigh) {
    // Professional Weighbridge - In Ground tow+caravan flow using
    // ProfessionalVehicleOnlyWeighbridgeInGround (hitched) +
    // ProfessionalVehicleOnlyWeighbridgeInGroundUnhitched.
    const hitchedFront = safeNum(axleWeigh.frontAxleHitched);
    const hitchedGvm = safeNum(axleWeigh.gvmHitched);
    const hitchedRear = hitchedGvm - hitchedFront;

    const unhitchedFront = safeNum(axleWeigh.frontAxleUnhitched);
    const unhitchedGvm = safeNum(axleWeigh.gvmUnhitched);
    const unhitchedRear = unhitchedGvm - unhitchedFront;

    // Front + Rear (hitched) = GVM Hitched
    gvmHitched = hitchedFront + hitchedRear;
    // Front + Rear (unhitched) = GVM Unhitched
    gvmUnhitched = unhitchedFront + unhitchedRear;

    // Persist detailed axle values for Additional Information section
    hitchedFrontAxle = hitchedFront;
    hitchedRearAxle = hitchedRear;
    unhitchedFrontAxle = unhitchedFront;
    unhitchedRearAxle = unhitchedRear;

    // TBM from optional WDH release reading when provided
    const gvmHitchWdhRelease = safeNum(axleWeigh.gvmHitchedWdhRelease);

    if (gvmUnhitched > 0) {
      if (gvmHitchWdhRelease > 0) {
        // With WDH: GVM Hitch WDH off - GVM Unhitched = TBM
        tbm = gvmHitchWdhRelease - gvmUnhitched;
      } else {
        // Without WDH: GVM Hitched - GVM Unhitched = TBM
        tbm = gvmHitched - gvmUnhitched;
      }
    }

    // GTM from trailer GTM input on the hitched screen
    gtmMeasured = safeNum(axleWeigh.trailerGtm);

    // GTM + TBM = ATM
    atmMeasured = gtmMeasured + tbm;

    // GCM = GTM + GVM Hitched
    gcmMeasured = gtmMeasured + gvmHitched;
  } else if (
    // Embedded professional tow+caravan in-ground history without
    // the original axleWeigh payload. Reconstruct measured values from
    // compliance/weights that were mapped onto resolvedState in history.
    embedded &&
    isProfessionalTowCaravanInGroundMethod &&
    !axleWeigh
  ) {
    const resolvedCaravan = resolvedState && resolvedState.caravan ? resolvedState.caravan : {};

    const measuredFrontFromState = safeNum(resolvedState && resolvedState.measuredFrontAxle);
    const measuredRearFromState = safeNum(resolvedState && resolvedState.measuredRearAxle);
    const measuredGvmFromState = safeNum(resolvedState && resolvedState.measuredGvm);

    // Tow Vehicle Hitched
    hitchedFrontAxle = measuredFrontFromState || 0;
    hitchedRearAxle =
      measuredRearFromState != null
        ? measuredRearFromState
        : measuredGvmFromState != null && measuredFrontFromState != null
          ? measuredGvmFromState - measuredFrontFromState
          : 0;

    gvmHitched =
      measuredGvmFromState != null && measuredGvmFromState > 0
        ? measuredGvmFromState
        : hitchedFrontAxle + hitchedRearAxle;

    // Tow Vehicle Unhitched
    const unhitchedGvmFromState = safeNum(resolvedState && resolvedState.unhitchedGvm);
    const unhitchedFrontFromState = safeNum(resolvedState && resolvedState.unhitchedFrontAxle);
    const unhitchedRearFromState = safeNum(resolvedState && resolvedState.unhitchedRearAxle);

    unhitchedFrontAxle = unhitchedFrontFromState || hitchedFrontAxle;
    unhitchedRearAxle =
      unhitchedRearFromState != null
        ? unhitchedRearFromState
        : unhitchedGvmFromState != null && unhitchedFrontAxle != null
          ? unhitchedGvmFromState - unhitchedFrontAxle
          : hitchedRearAxle;

    gvmUnhitched =
      unhitchedGvmFromState != null && unhitchedGvmFromState > 0
        ? unhitchedGvmFromState
        : unhitchedFrontAxle + unhitchedRearAxle;

    // Caravan / trailer measured values from compliance / caravanData
    let caravanGtmFromState = safeNum(resolvedCaravan && resolvedCaravan.gtmMeasured);
    let caravanAtmFromState = safeNum(resolvedCaravan && resolvedCaravan.atmMeasured);
    let tbmFromState = safeNum(resolvedCaravan && resolvedCaravan.tbmMeasured);
    if (tbmFromState == null || tbmFromState === 0) {
      tbmFromState = safeNum(resolvedState && resolvedState.towBallMass);
    }

    if (caravanAtmFromState == null && caravanGtmFromState != null && tbmFromState != null) {
      caravanAtmFromState = caravanGtmFromState + tbmFromState;
    }
    if (caravanGtmFromState == null && caravanAtmFromState != null && tbmFromState != null) {
      caravanGtmFromState = caravanAtmFromState - tbmFromState;
    }

    gtmMeasured = caravanGtmFromState || 0;
    atmMeasured = caravanAtmFromState || 0;
    if (tbmFromState != null && tbmFromState > 0) {
      tbm = tbmFromState;
    } else if (atmMeasured > 0 && gtmMeasured > 0) {
      tbm = atmMeasured - gtmMeasured;
    }

    // GCM: align with professional detailed report – vehicle GVM
    // (unhitched) + caravan ATM.
    if (!gcmMeasured || gcmMeasured <= 0) {
      const baseVehicleGvm = gvmUnhitched || gvmHitched || measuredGvmFromState || 0;
      if (baseVehicleGvm > 0 && atmMeasured > 0) {
        gcmMeasured = baseVehicleGvm + atmMeasured;
      }
    }
  } else if (isTowCaravanGoWeighMethod && resolvedGoweighData) {
    // Tow Vehicle + Caravan GoWeigh method using dedicated GoWeigh screen inputs.
    const first = resolvedGoweighData.firstWeigh || {};
    const second = resolvedGoweighData.secondWeigh || {};
    const summary = resolvedGoweighData.summary || {};

    const frontUnhitched = safeNum(first.frontUnhitched);
    const rearUnhitched = safeNum(first.rearUnhitched);
    const caravanAtmSupplied = safeNum(first.trailerAtm); // ATM supplied

    const frontHitched = safeNum(second.frontHitched);
    const rearHitched = safeNum(second.rearHitched);
    const caravanGtmSupplied = safeNum(second.trailerGtm); // GTM supplied (may be 0)

    const tbmSupplied = safeNum(summary.tbm); // TBM supplied

    // Detailed Report Equations
    // Front Axle Hitched + Rear Axle Hitched = GVM Hitched
    gvmHitched = frontHitched + rearHitched;
    // Front Axle Unhitched + Rear Axle Unhitched = GVM Unhitched
    gvmUnhitched = frontUnhitched + rearUnhitched;

    // Persist detailed axle values for Additional Information section
    hitchedFrontAxle = frontHitched;
    hitchedRearAxle = rearHitched;
    unhitchedFrontAxle = frontUnhitched;
    unhitchedRearAxle = rearUnhitched;

    // Supplied caravan / towing metrics
    atmMeasured = caravanAtmSupplied;
    tbm = tbmSupplied;

    // Prefer explicit GTM from GoWeigh second weigh, but if it's 0 and we
    // have ATM and TBM, derive GTM via: GTM = ATM - TBM.
    if (caravanGtmSupplied > 0) {
      gtmMeasured = caravanGtmSupplied;
    } else if (caravanAtmSupplied > 0 && tbmSupplied > 0) {
      gtmMeasured = Math.max(0, caravanAtmSupplied - tbmSupplied);
    }

    // For the detailed report, always derive GCM as GVM Hitched + GTM measured
    gcmMeasured = gvmHitched + gtmMeasured;
  } else if (isTowCaravanAboveGroundSingleCell && axleWeigh) {
    // Above Ground - Single Cell tow+caravan flow using DIYTowCaravanAboveGroundWeights.
    // This method only has reliable GVM Unhitched, ATM and GCM from scale measurements.

    // Unhitched GVM via scale measurement
    gvmUnhitched = safeNum(axleWeigh.gvmUnhitched);

    // ATM via scale measurement
    atmMeasured = safeNum(axleWeigh.caravanAtm);

    // Car and van on scale together = GCM
    gcmMeasured = safeNum(axleWeigh.gcm);

    // GTM and TBM are not reliable for this method; treat as not applicable.
    gtmMeasured = 0;
    tbm = 0;
  } else if (
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Portable Scales - Individual Tyre Weights'
  ) {
    // DIY Tow Vehicle + Caravan portable scales flow.
    // Derive hitched/unhitched vehicle axle totals and GVM from the VCI screens.
    const resolvedWeights = resolvedState?.weights || null;
    const resolvedRaw = resolvedWeights?.raw || null;

    const vci01 =
      resolvedState?.vci01 || resolvedRaw?.vci01 || portableSessionVci01 || null;
    const vci02 =
      resolvedState?.vci02 || resolvedRaw?.vci02 || portableSessionVci02 || null;

    const hitchedFrontFromRaw = resolvedRaw?.hitchedFrontAxle != null ? safeNum(resolvedRaw.hitchedFrontAxle) : 0;
    const hitchedRearFromRaw = resolvedRaw?.hitchedRearAxle != null ? safeNum(resolvedRaw.hitchedRearAxle) : 0;

    const hitchWeigh = vci01?.hitchWeigh || null;
    const hitchWdhOffWeigh = vci01?.hitchWdhOffWeigh || null;
    const hasWdh = vci01?.hasWdh;

    const unhitchedWeigh = vci02?.unhitchedWeigh || null;

    if (unhitchedWeigh) {
      const unhitchedFront = safeNum(unhitchedWeigh.frontLeft) + safeNum(unhitchedWeigh.frontRight);
      const unhitchedRear = safeNum(unhitchedWeigh.rearLeft) + safeNum(unhitchedWeigh.rearRight);
      gvmUnhitched = unhitchedFront + unhitchedRear;
      unhitchedFrontAxle = unhitchedFront;
      unhitchedRearAxle = unhitchedRear;
    }

    let gvmHitchedPortable = 0;
    if (hitchWeigh) {
      const hitchedFront = safeNum(hitchWeigh.frontLeft) + safeNum(hitchWeigh.frontRight);
      const hitchedRear = safeNum(hitchWeigh.rearLeft) + safeNum(hitchWeigh.rearRight);
      gvmHitchedPortable = hitchedFront + hitchedRear;
      hitchedFrontAxle = hitchedFront;
      hitchedRearAxle = hitchedRear;
    }

    if (gvmHitchedPortable <= 0 && (hitchedFrontFromRaw > 0 || hitchedRearFromRaw > 0)) {
      hitchedFrontAxle = hitchedFrontFromRaw;
      hitchedRearAxle = hitchedRearFromRaw;
      gvmHitchedPortable = hitchedFrontAxle + hitchedRearAxle;
    }

    if (gvmHitchedPortable <= 0 && resolvedWeights?.totalVehicle != null) {
      gvmHitchedPortable = safeNum(resolvedWeights.totalVehicle);
    }

    // Fallback: some DIY flows land here without VCI objects but with axleWeigh
    // containing hitched/unhitched vehicle axle totals.
    if (gvmHitchedPortable <= 0 && axleWeigh) {
      const hitchedFrontFromAxleWeigh =
        axleWeigh.frontAxleHitched != null
          ? safeNum(axleWeigh.frontAxleHitched)
          : axleWeigh.frontAxle != null
            ? safeNum(axleWeigh.frontAxle)
            : 0;
      const gvmHitchedFromAxleWeigh =
        axleWeigh.gvmHitched != null ? safeNum(axleWeigh.gvmHitched) : 0;

      if (gvmHitchedFromAxleWeigh > 0) {
        gvmHitchedPortable = gvmHitchedFromAxleWeigh;
        hitchedFrontAxle = hitchedFrontFromAxleWeigh;
        hitchedRearAxle = Math.max(0, gvmHitchedFromAxleWeigh - hitchedFrontFromAxleWeigh);
      }
    }

    // Fallback: if we don't have hitch tyre readings, still avoid showing 0 by
    // synthesizing a hitched GVM from unhitched GVM + TBM when available.
    if (gvmHitchedPortable <= 0 && gvmUnhitched > 0) {
      const explicitTowBall =
        resolvedState && resolvedState.towBallMass != null ? safeNum(resolvedState.towBallMass) : 0;
      if (explicitTowBall > 0) {
        gvmHitchedPortable = gvmUnhitched + explicitTowBall;
      }
    }

    if (gvmUnhitched <= 0 && axleWeigh) {
      const unhitchedFrontFromAxleWeigh =
        axleWeigh.unhitchedFrontAxle != null ? safeNum(axleWeigh.unhitchedFrontAxle) : 0;
      const gvmUnhitchedFromAxleWeigh =
        axleWeigh.gvmUnhitched != null ? safeNum(axleWeigh.gvmUnhitched) : 0;
      if (gvmUnhitchedFromAxleWeigh > 0) {
        gvmUnhitched = gvmUnhitchedFromAxleWeigh;
        unhitchedFrontAxle = unhitchedFrontFromAxleWeigh;
        unhitchedRearAxle = Math.max(0, gvmUnhitchedFromAxleWeigh - unhitchedFrontFromAxleWeigh);
      }
    }

    // TBM: prefer explicit towBallMass override if provided, otherwise derive from GVM Hitched vs Unhitched.
    if (resolvedState && resolvedState.towBallMass != null) {
      tbm = safeNum(resolvedState.towBallMass);
    } else if (hitchWeigh && gvmUnhitched > 0) {
      if (hasWdh && hitchWdhOffWeigh) {
        const wdhOffFront = safeNum(hitchWdhOffWeigh.frontLeft) + safeNum(hitchWdhOffWeigh.frontRight);
        const wdhOffRear = safeNum(hitchWdhOffWeigh.rearLeft) + safeNum(hitchWdhOffWeigh.rearRight);
        const gvmHitchWdhReleasePortable = wdhOffFront + wdhOffRear;
        tbm = gvmHitchWdhReleasePortable - gvmUnhitched;
      } else {
        tbm = gvmHitchedPortable - gvmUnhitched;
      }
    }

    // Set hitched GVM for Compliance Summary.
    gvmHitched = gvmHitchedPortable;

    // Derive GTM from caravan tyreWeigh (DIY portable caravan screen) when available.
    const t =
      resolvedState?.tyreWeigh || portableSessionTyreWeigh || null;
    if (t) {
      const safeLocal = (v) => (v != null ? Number(v) || 0 : 0);
      const gtmFromTyres =
        t.axleConfig === 'Single Axle'
          ? safeLocal(t.single?.left) + safeLocal(t.single?.right)
          : t.axleConfig === 'Dual Axle'
            ? safeLocal(t.dual?.frontLeft) +
              safeLocal(t.dual?.frontRight) +
              safeLocal(t.dual?.rearLeft) +
              safeLocal(t.dual?.rearRight)
            : safeLocal(t.triple?.frontLeft) +
              safeLocal(t.triple?.frontRight) +
              safeLocal(t.triple?.middleLeft) +
              safeLocal(t.triple?.middleRight) +
              safeLocal(t.triple?.rearLeft) +
              safeLocal(t.triple?.rearRight);

      if (gtmFromTyres > 0) {
        gtmMeasured = gtmFromTyres;
        // GTM + TBM = ATM
        atmMeasured = gtmMeasured + tbm;
        // GCM = GTM + GVM Hitched
        gcmMeasured = gtmMeasured + gvmHitchedPortable;
      }
    }

    // Fallback: professional portable flow does not provide `tyreWeigh`.
    // In that case, the caravan GTM is already computed earlier and stored in axleWeigh.trailerGtm.
    if (gtmMeasured <= 0 && axleWeigh?.trailerGtm != null) {
      gtmMeasured = safeNum(axleWeigh.trailerGtm);
      if (gtmMeasured > 0) {
        // GTM + TBM = ATM
        atmMeasured = gtmMeasured + tbm;
        // GCM = GTM + GVM Hitched
        gcmMeasured = gtmMeasured + gvmHitchedPortable;
      }
    }
  } else if (resolvedState && resolvedState.towBallMass != null) {
    // For non in-ground flows that provide an explicit towBallMass (e.g. professional portable scales),
    // use that value directly as measured TBM.
    tbm = safeNum(resolvedState.towBallMass);
  }

  let hasTowVehicleHitchedMeasured =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    (gvmHitched > 0 || hitchedFrontAxle > 0 || hitchedRearAxle > 0);

  // Embedded history for tow+caravan (especially professional in-ground)
  // often persists only measured axle totals and total vehicle weight.
  // Hydrate the "Tow Vehicle Hitched" fields from the persisted values so
  // the GVM/Front/Rear rows do not show '-' or 0.
  if (embedded && weighingSelection === 'tow_vehicle_and_caravan') {
    if (gvmHitched <= 0) {
      const gvmFromState = safeNum(resolvedState && resolvedState.measuredGvm);
      if (gvmFromState != null && gvmFromState > 0) {
        gvmHitched = gvmFromState;
      }
    }
    if (hitchedFrontAxle <= 0) {
      const frontFromState = safeNum(resolvedState && resolvedState.measuredFrontAxle);
      if (frontFromState != null && frontFromState > 0) {
        hitchedFrontAxle = frontFromState;
      }
    }
    if (hitchedRearAxle <= 0) {
      const rearFromState = safeNum(resolvedState && resolvedState.measuredRearAxle);
      if (rearFromState != null && rearFromState > 0) {
        hitchedRearAxle = rearFromState;
      }
    }

    // Recompute after hydration so the UI rows render measured values.
    hasTowVehicleHitchedMeasured =
      (gvmHitched > 0 || hitchedFrontAxle > 0 || hitchedRearAxle > 0);
  }

  // Embedded tow+caravan portable history entries may only have a single GVM
  // and axle totals persisted (frontMeasured/rearMeasured/gvmMeasured) rather
  // than detailed hitched/unhitched readings. In that case, mirror those
  // measured values into the "hitched" fields so the Tow Vehicle Hitched rows
  // do not show blank/N/A measured columns.
  if (
    embedded &&
    methodSelection === 'Portable Scales - Individual Tyre Weights' &&
    weighingSelection === 'tow_vehicle_and_caravan'
  ) {
    if (gvmMeasured > 0) {
      gvmHitched = gvmMeasured;
    }
    if (frontMeasured > 0) {
      hitchedFrontAxle = frontMeasured;
    }
    if (rearMeasured > 0) {
      hitchedRearAxle = rearMeasured;
    }
  }

  // Embedded tow+caravan portable history: if we have unhitched values on the
  // resolved state but local unhitched variables are still zero (because there
  // was no live unhitched session in this component), hydrate them so the
  // "Tow Vehicle Unhitched" section shows correct measured values.
  if (
    embedded &&
    methodSelection === 'Portable Scales - Individual Tyre Weights' &&
    weighingSelection === 'tow_vehicle_and_caravan' &&
    gvmUnhitched === 0 &&
    resolvedState &&
    resolvedState.unhitchedGvm > 0
  ) {
    gvmUnhitched = Number(resolvedState.unhitchedGvm) || 0;
    unhitchedFrontAxle = Number(resolvedState.unhitchedFrontAxle) || 0;
    unhitchedRearAxle = Number(resolvedState.unhitchedRearAxle) || 0;
  }

  // Embedded tow+caravan professional / in-ground history entries may also
  // persist unhitched totals without a portable-method marker. Hydrate the
  // unhitched fields for any embedded tow+caravan record when available.
  if (
    embedded &&
    weighingSelection === 'tow_vehicle_and_caravan' &&
    gvmUnhitched === 0 &&
    resolvedState &&
    Number(resolvedState.unhitchedGvm) > 0
  ) {
    gvmUnhitched = Number(resolvedState.unhitchedGvm) || 0;
    if (unhitchedFrontAxle === 0) {
      unhitchedFrontAxle = Number(resolvedState.unhitchedFrontAxle) || 0;
    }
    if (unhitchedRearAxle === 0) {
      unhitchedRearAxle = Number(resolvedState.unhitchedRearAxle) || 0;
    }
  }

  const isPortableTowCaravanMethod =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Portable Scales - Individual Tyre Weights';

  const hasPortableTowCaravanMeasuredInputs =
    isPortableTowCaravanMethod &&
    (hasTowVehicleHitchedMeasured ||
      gvmUnhitched > 0 ||
      unhitchedFrontAxle > 0 ||
      unhitchedRearAxle > 0 ||
      gtmMeasured > 0 ||
      tbm > 0);

  const isTowCaravanAdvisoryMethod =
    isTowCaravanInGroundMethod ||
    isProfessionalTowCaravanInGroundMethod ||
    isTowCaravanGoWeighMethod ||
    (weighingSelection === 'tow_vehicle_and_caravan' &&
      methodSelection === 'Portable Scales - Individual Tyre Weights');

  // For tow vehicle + caravan methods, the GVM row is labelled "GVM Unhitched".
  // Prefer the true unhitched GVM when available; if it's missing (e.g. embedded
  // portable history that only persisted a single GVM), fall back to the
  // measured GVM so the row does not show 0.
  const effectiveGvmForCapacity =
    weighingSelection === 'tow_vehicle_and_caravan'
      ? (gvmUnhitched > 0 ? gvmUnhitched : gvmMeasured)
      : gvmMeasured;

  // FINAL embedded tow+caravan history fallbacks: run as late as possible,
  // immediately before rendering/debug logs, so no later initialization
  // (e.g. caravan-only measured variable resets) can overwrite these.
  if (embedded && weighingSelection === 'tow_vehicle_and_caravan') {
    if (atmMeasuredOverall != null) {
      atmMeasured = Number(atmMeasuredOverall) || 0;
    }
    if (gtmMeasuredOverall != null) {
      gtmMeasured = Number(gtmMeasuredOverall) || 0;
    }
    if (gcmMeasuredOverall != null) {
      gcmMeasured = Number(gcmMeasuredOverall) || 0;
    }

    // Derive TBM deterministically from ATM and GTM when both
    // are present for embedded history.
    if (atmMeasured > 0 && gtmMeasured > 0) {
      tbm = atmMeasured - gtmMeasured;
    }
  }

  // Debug: inspect measured values feeding the Compliance / Measured columns
  // eslint-disable-next-line no-console
  console.log('DIYResults measured debug', {
    embedded,
    methodSelection,
    weighingSelection,
    measuredFrontAxle,
    measuredRearAxle,
    measuredGvm,
    frontMeasured,
    rearMeasured,
    gvmMeasured,
    gvmHitched,
    gvmUnhitched,
    effectiveGvmForCapacity,
    atmMeasured,
    gtmMeasured,
    gcmMeasured,
    tbm,
    atmMeasuredOverall,
    gtmMeasuredOverall,
    gcmMeasuredOverall,
  });

  // eslint-disable-next-line no-console
  console.log('DIYResults unhitched debug', {
    embedded,
    methodSelection,
    weighingSelection,
    unhitchedGvm: gvmUnhitched,
    unhitchedFrontAxle,
    unhitchedRearAxle,
    fromState: {
      unhitchedGvm: resolvedState.unhitchedGvm,
      unhitchedFrontAxle: resolvedState.unhitchedFrontAxle,
      unhitchedRearAxle: resolvedState.unhitchedRearAxle,
    },
  });

  // Advisory-only percentages for Tow Vehicle + Caravan methods
  const vanToCarRatioPct =
    isTowCaravanAdvisoryMethod && gvmHitched > 0 ? (gtmMeasured / gvmHitched) * 100 : null;
  const towBallPct =
    isTowCaravanAdvisoryMethod && atmMeasured > 0 ? (tbm / atmMeasured) * 100 : null;
  const btcPct =
    isTowCaravanAdvisoryMethod && btcCapacityNum ? (atmMeasured / btcCapacityNum) * 100 : null;

  // Capacity row: difference (capacity - measured)
  const frontCapacityDiff = frontCapacity - frontMeasured;
  const rearCapacityDiff = rearCapacity - rearMeasured;
  const gvmCapacityDiff = gvmCapacityNum - effectiveGvmForCapacity;
  const caravanGtmCapacityDiff = caravanGtmCapacityNum -
    (weighingSelection === 'caravan_only_registered' ? caravanMeasuredGtm : gtmMeasured);

  // For caravan-only flows, hide the vehicle details block entirely so no
  // "Vehicle ... N/A" rows are shown. For vehicle-only flows, hide caravan
  // rows. Tow vehicle + caravan shows both sections.
  const hasVehicleDetails = weighingSelection === 'vehicle_only' || weighingSelection === 'tow_vehicle_and_caravan';
  const hasCaravanDetails = weighingSelection === 'caravan_only_registered' || weighingSelection === 'tow_vehicle_and_caravan';

  const vehicleMakeModel = hasVehicleDetails
    ? (description || 'N/A')
    : 'N/A';
  const vehicleRego = hasVehicleDetails ? (rego || 'N/A') : 'N/A';
  const vehicleState = hasVehicleDetails ? (state || 'N/A') : 'N/A';
  const vehicleFrontAxle = hasVehicleDetails && frontCapacity ? `${frontCapacity} kg` : 'N/A';
  const vehicleRearAxle = hasVehicleDetails && rearCapacity ? `${rearCapacity} kg` : 'N/A';
  const vehicleGvm = hasVehicleDetails && gvmCapacityNum ? `${gvmCapacityNum} kg` : 'N/A';
  const vehicleGcm = hasVehicleDetails && gcmCapacityNum != null
    ? `${gcmCapacityNum} kg`
    : 'N/A';
  const vehicleBtc = hasVehicleDetails && btcCapacityNum != null
    ? `${btcCapacityNum} kg`
    : 'N/A';
  const vehicleTbm = hasVehicleDetails && tbmCapacityNum != null
    ? `${tbmCapacityNum} kg`
    : 'N/A';

  const caravanMakeModel = hasCaravanDetails
    ? ((caravan.make || caravan.model)
        ? `${caravan.make || ''} ${caravan.model || ''}`.trim()
        : 'N/A')
    : 'N/A';
  const caravanRego = hasCaravanDetails ? (caravan.rego || 'N/A') : 'N/A';
  const caravanState = hasCaravanDetails ? (caravan.state || 'N/A') : 'N/A';
  // Detailed caravan capacity fields are not currently shown in the UI

  // Auto-save has been disabled for vehicle-only results.
  // Vehicle-only history records are created only when the user clicks Finish.
  const [autoSaved] = useState(alreadySaved || Boolean(weighId));

  const handleDownloadReport = async () => {
    try {
      const response = await axios.post('/api/weighs/diy-vehicle-only/report', {
        vehicleInfo: {
          rego,
          state,
          description,
          vin
        },
        measured: {
          front: frontMeasured,
          gvm: gvmMeasured,
          rear: rearMeasured
        },
        capacities: {
          front: frontCapacity,
          gvm: gvmCapacityNum,
          rear: rearCapacity
        },
        capacityDiff: {
          front: frontCapacityDiff,
          gvm: gvmCapacityDiff,
          rear: rearCapacityDiff
        },
        carInfo: {
          fuelLevel: resolvedFuelLevel === '' ? null : Number(resolvedFuelLevel),
          passengersFront: Number(resolvedPassengersFront) || 0,
          passengersRear: Number(resolvedPassengersRear) || 0
        },
        notes: '',
        methodSelection
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'weigh-results.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download DIY vehicle-only report:', err);
      window.alert('Failed to generate report. Please try again.');
    }
  };

  const handleFinish = async () => {
    try {
      // For fleet users using the legacy DIY wizard, prefer any explicit
      // Fleet Staff customer draft details when saving to history.
      let outgoingCustomer = null;
      if (user?.userType === 'fleet' && fleetCustomerDraft) {
        const fullName = String(fleetCustomerDraft.fullName || '').trim();
        const email = String(fleetCustomerDraft.email || '').trim();
        const phone = String(fleetCustomerDraft.phone || '').trim();
        const clientUserId = fleetCustomerDraft.clientUserId
          ? String(fleetCustomerDraft.clientUserId).trim()
          : null;
        if (fullName || email || phone || clientUserId) {
          outgoingCustomer = { fullName, email, phone, clientUserId };
        }
      }

      if (weighingSelection === 'tow_vehicle_and_caravan') {
        // DIY tow vehicle + caravan: save a full record including caravan
        // summary and normalized weights so it appears in Weigh History.

        const normalizedWeights = {
          frontAxle: hitchedFrontAxle || 0,
          rearAxle: hitchedRearAxle || 0,
          totalVehicle: gvmUnhitched || 0,
          frontAxleGroup: 0,
          rearAxleGroup: 0,
          totalCaravan: gtmMeasured || atmMeasured || 0,
          grossCombination: gcmMeasured || 0,
          tbm: tbm || 0,
          vehicleOnlyFrontAxle: unhitchedFrontAxle || 0,
          vehicleOnlyRearAxle: unhitchedRearAxle || 0,
          weightsType: 'diy_tow_caravan',
          // Remember the exact DIY flow so the Weigh History dialog can
          // mirror this results screen without having to infer methodSelection.
          diyMethodSelection: methodSelection,
          diyWeighingSelection: weighingSelection,
          raw: {
            axleWeigh: axleWeigh || null,
            goweighData: goweighData || null
          }
        };

        const vehicleSummary = {
          description,
          rego,
          state,
          vin,
          // Capacity values so history modal can mirror Compliance column
          fawr: frontCapacity || undefined,
          rawr: rearCapacity || undefined,
          frontAxleCapacity: frontCapacity || undefined,
          rearAxleCapacity: rearCapacity || undefined,
          gvm: gvmCapacityNum || undefined,
          gcm: gcmCapacityNum || undefined,
          btc: btcCapacityNum || undefined,
          tbm: tbmCapacityNum || undefined,
          // Measured DIY values
          gvmUnhitched,
          frontUnhitched: unhitchedFrontAxle || 0,
          rearUnhitched: unhitchedRearAxle || 0
        };

        const caravanSummary = hasCaravanDetails
          ? {
              description: (caravan.make || caravan.model)
                ? `${caravan.make || ''} ${caravan.model || ''}`.trim()
                : '',
              rego: caravan.rego || '',
              state: caravan.state || '',
              vin: caravan.vin || '',
              make: caravan.make,
              model: caravan.model,
              year: caravan.year,
              atm: caravan.atm,
              gtm: caravan.gtm,
              axleGroups: caravan.axleGroups,
              tare: caravan.tare,
              complianceImage: caravan.complianceImage,
              atmMeasured: atmMeasured || 0,
              gtmMeasured: gtmMeasured || 0,
              tbmMeasured: tbm || 0
            }
          : null;

        const payload = {
          vehicleSummary,
          caravanSummary,
          weights: normalizedWeights,
          preWeigh: preWeigh || {
            fuelLevel: resolvedFuelLevel === '' ? null : Number(resolvedFuelLevel),
            passengersFront: Number(resolvedPassengersFront) || 0,
            passengersRear: Number(resolvedPassengersRear) || 0
          },
          modifiedVehicleImages: Array.isArray(modifiedImages) ? modifiedImages : [],
          ...(outgoingCustomer
            ? {
                customerName: outgoingCustomer.fullName,
                customerEmail: outgoingCustomer.email,
                customerPhone: outgoingCustomer.phone,
                clientUserId: outgoingCustomer.clientUserId || undefined,
              }
            : {}),
        };

        console.log('DIYResults handleFinish tow+caravan: posting payload to /api/weighs/diy-vehicle-only', {
          userDebug: {
            id: user?.id || null,
            email: user?.email || null,
            userType: user?.userType || null,
            fleetOwnerUserId: user?.fleetOwnerUserId || null,
          },
          outgoingCustomer,
          payload,
        });

        await axios.post('/api/weighs/diy-vehicle-only', payload);
      } else if (weighingSelection === 'caravan_only_registered') {
        // DIY caravan-only (registered): save caravan details + measured values so history modal mirrors results.

        const normalizedWeights = {
          frontAxle: 0,
          rearAxle: 0,
          totalVehicle: 0,
          frontAxleGroup: 0,
          rearAxleGroup: 0,
          totalCaravan: caravanMeasuredGtm || 0,
          grossCombination: caravanMeasuredAtm || 0,
          tbm: caravanMeasuredTbm || 0,
          weightsType: 'diy_caravan_only_registered',
          diyMethodSelection: methodSelection,
          diyWeighingSelection: weighingSelection,
          raw: {
            axleWeigh: axleWeigh || null,
            tyreWeigh: tyreWeigh || null,
            towBallMass: caravanMeasuredTbm || 0,
          }
        };

        const payload = {
          // Vehicle summary is required by the endpoint; for caravan-only it is empty/zero.
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
            description: (caravan.make || caravan.model)
              ? `${caravan.make || ''} ${caravan.model || ''}`.trim()
              : '',
            rego: caravan.rego || '',
            state: caravan.state || '',
            vin: caravan.vin || '',
            make: caravan.make,
            model: caravan.model,
            year: caravan.year,
            atm: caravan.atm,
            gtm: caravan.gtm,
            axleGroups: caravan.axleGroups,
            tare: caravan.tare,
            complianceImage: caravan.complianceImage,
            atmMeasured: caravanMeasuredAtm || 0,
            gtmMeasured: caravanMeasuredGtm || 0,
            tbmMeasured: caravanMeasuredTbm || 0,
          },
          weights: normalizedWeights,
          preWeigh: preWeigh || {},
          modifiedVehicleImages: Array.isArray(modifiedImages) ? modifiedImages : [],
          ...(outgoingCustomer
            ? {
                customerName: outgoingCustomer.fullName,
                customerEmail: outgoingCustomer.email,
                customerPhone: outgoingCustomer.phone,
                clientUserId: outgoingCustomer.clientUserId || undefined,
              }
            : {}),
        };

        console.log('DIYResults handleFinish caravan-only: posting payload to /api/weighs/diy-vehicle-only', {
          userDebug: {
            id: user?.id || null,
            email: user?.email || null,
            userType: user?.userType || null,
            fleetOwnerUserId: user?.fleetOwnerUserId || null,
          },
          outgoingCustomer,
          payload,
        });

        await axios.post('/api/weighs/diy-vehicle-only', payload);
      } else {
        // Existing DIY vehicle-only behaviour
        const normalizedWeights = {
          frontAxle: frontMeasured || 0,
          rearAxle: rearMeasured || 0,
          totalVehicle: gvmMeasured || 0,
          frontAxleGroup: 0,
          rearAxleGroup: 0,
          totalCaravan: 0,
          grossCombination: 0,
          tbm: 0,
          weightsType: 'diy_vehicle_only',
          diyMethodSelection: methodSelection,
          diyWeighingSelection: weighingSelection,
          raw: {
            axleWeigh: axleWeigh || null
          }
        };

        const payload = {
          vehicleSummary: {
            description,
            rego,
            state,
            vin,
            // Capacity values so history modal can mirror Compliance column
            fawr: frontCapacity || undefined,
            rawr: rearCapacity || undefined,
            frontAxleCapacity: frontCapacity || undefined,
            rearAxleCapacity: rearCapacity || undefined,
            gvm: gvmCapacityNum || undefined,
            gcm: gcmCapacityNum || undefined,
            btc: btcCapacityNum || undefined,
            tbm: tbmCapacityNum || undefined,
            // Measured values
            gvmUnhitched: gvmMeasured,
            frontUnhitched: frontMeasured,
            rearUnhitched: rearMeasured
          },
          weights: normalizedWeights,
          preWeigh: {
            fuelLevel: resolvedFuelLevel === '' ? null : Number(resolvedFuelLevel),
            passengersFront: Number(resolvedPassengersFront) || 0,
            passengersRear: Number(resolvedPassengersRear) || 0
          },
          modifiedVehicleImages: Array.isArray(modifiedImages) ? modifiedImages : [],
          ...(outgoingCustomer
            ? {
                customerName: outgoingCustomer.fullName,
                customerEmail: outgoingCustomer.email,
                customerPhone: outgoingCustomer.phone,
                clientUserId: outgoingCustomer.clientUserId || undefined,
              }
            : {}),
        };

        console.log('DIYResults handleFinish vehicle-only: posting payload to /api/weighs/diy-vehicle-only', {
          userDebug: {
            id: user?.id || null,
            email: user?.email || null,
            userType: user?.userType || null,
            fleetOwnerUserId: user?.fleetOwnerUserId || null,
          },
          outgoingCustomer,
          payload,
        });

        await axios.post('/api/weighs/diy-vehicle-only', payload);
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save DIY weigh:', err);
      window.alert('Failed to save weigh result. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
            minHeight: '70vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
              gap: 2,
              // Keep the header text and client details on the same row on
              // most screens; allow wrapping only on the smallest widths.
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
            }}
          >
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {headingLabel}
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                {methodLabel}
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold' }}
              >
                Weigh Results
              </Typography>
            </Box>

            {effectiveClient && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  minWidth: 260,
                  maxWidth: 360,
                  ml: { xs: 0, md: 2 }
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1, textAlign: 'right' }}
                >
                  Client Details
                </Typography>
                {effectiveClient.fullName && (
                  <Typography variant="body2" sx={{ textAlign: 'right' }}>
                    {effectiveClient.fullName}
                  </Typography>
                )}
                {effectiveClient.email && (
                  <Typography variant="body2" sx={{ textAlign: 'right' }}>
                    {effectiveClient.email}
                  </Typography>
                )}
                {effectiveClient.phone && (
                  <Typography variant="body2" sx={{ textAlign: 'right' }}>
                    {effectiveClient.phone}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Simple summary card showing Vehicle (left) and Caravan/Trailer (right) */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Vehicle and Caravan Details
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {hasVehicleDetails && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Vehicle
                  </Typography>
                  <Typography variant="body2">Make/Model: {vehicleMakeModel}</Typography>
                  <Typography variant="body2">Rego Number: {vehicleRego}</Typography>
                  <Typography variant="body2">State: {vehicleState}</Typography>
                  <Typography variant="body2">Front Axle: {vehicleFrontAxle}</Typography>
                  <Typography variant="body2">Rear Axle: {vehicleRearAxle}</Typography>
                  <Typography variant="body2">GVM: {vehicleGvm}</Typography>
                  <Typography variant="body2">GCM: {vehicleGcm}</Typography>
                  <Typography variant="body2">BTC: {vehicleBtc}</Typography>
                  <Typography variant="body2">TBM: {vehicleTbm}</Typography>
                </Grid>
              )}
              {hasCaravanDetails && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Caravan / Trailer
                  </Typography>
                  <Typography variant="body2">Make/Model: {caravanMakeModel}</Typography>
                  <Typography variant="body2">Rego Number: {caravanRego}</Typography>
                  <Typography variant="body2">State: {caravanState}</Typography>
                  <Typography variant="body2">ATM: {caravan.atm ? `${caravan.atm} kg` : 'N/A'}</Typography>
                  <Typography variant="body2">GTM: {caravan.gtm ? `${caravan.gtm} kg` : 'N/A'}</Typography>
                  <Typography variant="body2">Tare: {caravan.tare ? `${caravan.tare} kg` : 'N/A'}</Typography>
                  <Typography variant="body2">Axle Group Loading: {caravan.axleGroups ? `${caravan.axleGroups} kg` : 'N/A'}</Typography>
                </Grid>
              )}
            </Grid>

            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Compliance Summary
            </Typography>

          {/* Rest of the code remains the same */}
            <Grid container sx={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', py: 1, mb: 2 }}>
              <Grid item xs={4}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Metric</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Compliance</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Measured</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Result</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Status</Typography>
              </Grid>
            </Grid>

            {/* Tow Vehicle + Caravan/Trailer layout (mirror PDF) */}
            {weighingSelection === 'tow_vehicle_and_caravan' && (
              <>
                {/* Tow Vehicle Hitched */}
                <Grid container sx={{ py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Tow Vehicle Hitched
                    </Typography>
                  </Grid>
                </Grid>

                {/* Gross Vehicle Mass (GVM) - Hitched */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Vehicle Mass (GVM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{gvmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? '-'
                        : hasTowVehicleHitchedMeasured
                          ? `${gvmHitched} kg`
                          : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? 'Not complete'
                        : hasTowVehicleHitchedMeasured
                          ? `${gvmCapacityNum - gvmHitched} kg`
                          : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={!hasTowVehicleHitchedMeasured || gvmHitched <= gvmCapacityNum ? 'success.main' : 'error'}
                    >
                      {isTowCaravanAboveGroundSingleCell
                        ? 'N/A'
                        : !hasTowVehicleHitchedMeasured
                          ? 'N/A'
                          : gvmHitched <= gvmCapacityNum
                            ? 'OK'
                            : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Front Axle - Hitched */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Front Axle</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{frontCapacity} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? '-'
                        : hasTowVehicleHitchedMeasured
                          ? `${hitchedFrontAxle} kg`
                          : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? 'Not complete'
                        : hasTowVehicleHitchedMeasured
                          ? `${frontCapacity - hitchedFrontAxle} kg`
                          : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={!hasTowVehicleHitchedMeasured || hitchedFrontAxle <= frontCapacity ? 'success.main' : 'error'}
                    >
                      {isTowCaravanAboveGroundSingleCell
                        ? 'N/A'
                        : !hasTowVehicleHitchedMeasured
                          ? 'N/A'
                          : hitchedFrontAxle <= frontCapacity
                            ? 'OK'
                            : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Rear Axle - Hitched */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Rear Axle</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{rearCapacity} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? '-'
                        : hasTowVehicleHitchedMeasured
                          ? `${hitchedRearAxle} kg`
                          : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? 'Not complete'
                        : hasTowVehicleHitchedMeasured
                          ? `${rearCapacity - hitchedRearAxle} kg`
                          : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={!hasTowVehicleHitchedMeasured || hitchedRearAxle <= rearCapacity ? 'success.main' : 'error'}
                    >
                      {isTowCaravanAboveGroundSingleCell
                        ? 'N/A'
                        : !hasTowVehicleHitchedMeasured
                          ? 'N/A'
                          : hitchedRearAxle <= rearCapacity
                            ? 'OK'
                            : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Gross Combination Mass (GCM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Combination Mass (GCM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {gcmCapacityNum != null ? `${gcmCapacityNum} kg` : 'Not Available'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isPortableTowCaravanMethod
                        ? hasPortableTowCaravanMeasuredInputs
                          ? `${gcmMeasured} kg`
                          : '-'
                        : `${gcmMeasured} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {gcmCapacityNum != null
                        ? isPortableTowCaravanMethod
                          ? hasPortableTowCaravanMeasuredInputs
                            ? `${gcmCapacityNum - gcmMeasured} kg`
                            : 'N/A'
                          : `${gcmCapacityNum - gcmMeasured} kg`
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        gcmCapacityNum != null &&
                        gcmMeasured > gcmCapacityNum
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {gcmCapacityNum == null
                        ? 'N/A'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : gcmMeasured <= gcmCapacityNum
                            ? 'OK'
                            : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Braked Towing Capacity (BTC) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Braked Towing Capacity (BTC)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {btcCapacityNum != null ? `${btcCapacityNum} kg` : 'Not Available'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isPortableTowCaravanMethod
                        ? hasPortableTowCaravanMeasuredInputs
                          ? `${atmMeasured} kg`
                          : '-'
                        : `${atmMeasured} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {btcCapacityNum != null
                        ? isPortableTowCaravanMethod
                          ? hasPortableTowCaravanMeasuredInputs
                            ? `${btcCapacityNum - atmMeasured} kg`
                            : 'N/A'
                          : `${btcCapacityNum - atmMeasured} kg`
                        : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        btcCapacityNum != null &&
                        atmMeasured > btcCapacityNum
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {btcCapacityNum == null
                        ? 'N/A'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : atmMeasured <= btcCapacityNum
                            ? 'OK'
                            : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Tow Ball Mass (TBM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Tow Ball Mass (TBM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {tbmCapacityNum != null ? `${tbmCapacityNum} kg` : 'Not Available'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? '-'
                        : isPortableTowCaravanMethod
                          ? hasPortableTowCaravanMeasuredInputs
                            ? `${tbm} kg`
                            : '-'
                          : `${tbm} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? 'Not complete'
                        : tbmCapacityNum != null
                          ? isPortableTowCaravanMethod
                            ? hasPortableTowCaravanMeasuredInputs
                              ? `${tbmCapacityNum - tbm} kg`
                              : 'N/A'
                            : `${tbmCapacityNum - tbm} kg`
                          : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        tbmCapacityNum != null &&
                        tbm > tbmCapacityNum
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {isTowCaravanAboveGroundSingleCell
                        ? 'N/A'
                        : tbmCapacityNum == null
                          ? 'N/A'
                          : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                            ? 'N/A'
                            : tbm <= tbmCapacityNum
                              ? 'OK'
                              : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Caravan / Trailer */}
                <Grid container sx={{ py: 1, mt: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Caravan / Trailer
                    </Typography>
                  </Grid>
                </Grid>

                {/* Aggregated Trailer Mass (ATM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Aggregated Trailer Mass (ATM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isPortableTowCaravanMethod
                        ? hasPortableTowCaravanMeasuredInputs
                          ? `${atmMeasured} kg`
                          : '-'
                        : `${atmMeasured} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                        ? 'N/A'
                        : `${caravanAtmCapacityNum - atmMeasured} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        caravanAtmCapacityNum !== 0 &&
                        atmMeasured > caravanAtmCapacityNum
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {caravanAtmCapacityNum === 0
                        ? 'N/A'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : atmMeasured <= caravanAtmCapacityNum
                            ? 'OK'
                            : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Gross Trailer Mass (GTM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Trailer Mass (GTM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? '-'
                        : isPortableTowCaravanMethod
                          ? hasPortableTowCaravanMeasuredInputs
                            ? `${gtmMeasured} kg`
                            : '-'
                          : `${gtmMeasured} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? 'Not complete'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : `${caravanGtmCapacityDiff} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        caravanGtmCapacityNum !== 0 &&
                        gtmMeasured > caravanGtmCapacityNum
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {isTowCaravanAboveGroundSingleCell
                        ? 'N/A'
                        : caravanGtmCapacityNum === 0
                          ? 'N/A'
                          : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                            ? 'N/A'
                            : gtmMeasured <= caravanGtmCapacityNum
                              ? 'OK'
                              : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Axle Group Loading */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Axle Group Loading</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanAxleGroupCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? '-'
                        : isPortableTowCaravanMethod
                          ? hasPortableTowCaravanMeasuredInputs
                            ? `${gtmMeasured || atmMeasured} kg`
                            : '-'
                          : `${gtmMeasured || atmMeasured} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? 'Not complete'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : `${caravanAxleGroupCapacityNum - (gtmMeasured || atmMeasured)} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        caravanAxleGroupCapacityNum !== 0 &&
                        (gtmMeasured || atmMeasured) > caravanAxleGroupCapacityNum
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {isTowCaravanAboveGroundSingleCell
                        ? 'N/A'
                        : caravanAxleGroupCapacityNum === 0
                          ? 'N/A'
                          : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                            ? 'N/A'
                            : (gtmMeasured || atmMeasured) <= caravanAxleGroupCapacityNum
                              ? 'OK'
                              : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Tow Vehicle Unhitched */}
                <Grid container sx={{ py: 1, mt: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Tow Vehicle Unhitched
                    </Typography>
                  </Grid>
                </Grid>

                {/* Gross Vehicle Mass (GVM) - Unhitched */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Vehicle Mass (GVM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{gvmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isPortableTowCaravanMethod
                        ? hasPortableTowCaravanMeasuredInputs
                          ? `${gvmUnhitched} kg`
                          : '-'
                        : `${gvmUnhitched} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                        ? 'N/A'
                        : `${gvmCapacityNum - gvmUnhitched} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        gvmUnhitched > gvmCapacityNum
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                        ? 'N/A'
                        : gvmUnhitched <= gvmCapacityNum
                          ? 'OK'
                          : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Front Axle - Unhitched */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Front Axle</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{frontCapacity} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? '-'
                        : isPortableTowCaravanMethod
                          ? hasPortableTowCaravanMeasuredInputs
                            ? `${unhitchedFrontAxle} kg`
                            : '-'
                          : `${unhitchedFrontAxle} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? 'Not complete'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : `${frontCapacity - unhitchedFrontAxle} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        unhitchedFrontAxle > frontCapacity
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {isTowCaravanAboveGroundSingleCell
                        ? 'N/A'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : unhitchedFrontAxle <= frontCapacity
                            ? 'OK'
                            : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Rear Axle - Unhitched */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Rear Axle</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{rearCapacity} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? '-'
                        : isPortableTowCaravanMethod
                          ? hasPortableTowCaravanMeasuredInputs
                            ? `${unhitchedRearAxle} kg`
                            : '-'
                          : `${unhitchedRearAxle} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {isTowCaravanAboveGroundSingleCell
                        ? 'Not complete'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : `${rearCapacity - unhitchedRearAxle} kg`}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        (!isPortableTowCaravanMethod || hasPortableTowCaravanMeasuredInputs) &&
                        unhitchedRearAxle > rearCapacity
                          ? 'error'
                          : 'success.main'
                      }
                    >
                      {isTowCaravanAboveGroundSingleCell
                        ? 'N/A'
                        : isPortableTowCaravanMethod && !hasPortableTowCaravanMeasuredInputs
                          ? 'N/A'
                          : unhitchedRearAxle <= rearCapacity
                            ? 'OK'
                            : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Vehicle Only / Caravan Only flows */}
            {weighingSelection !== 'tow_vehicle_and_caravan' && (
              <>
                {/* Vehicle Only: GVM + Front Axle + Rear Axle */}
                {weighingSelection !== 'caravan_only_registered' && (
                  <>
                    <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                      <Grid item xs={4}>
                        <Typography variant="body2">Gross Vehicle Mass (GVM Unhitched)</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">{gvmCapacityNum} kg</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">{gvmMeasured} kg</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">{gvmCapacityDiff} kg</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography
                          variant="body2"
                          color={gvmMeasured <= gvmCapacityNum ? 'success.main' : 'error'}
                        >
                          {gvmMeasured <= gvmCapacityNum ? 'OK' : 'OVER'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {!(weighingSelection === 'vehicle_only' && methodSelection === 'Weighbridge - Above Ground') && (
                      <>
                        {/* Front Axle */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Front Axle</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{frontCapacity} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{frontMeasured} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{frontCapacityDiff} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={frontMeasured <= frontCapacity ? 'success.main' : 'error'}
                            >
                              {frontMeasured <= frontCapacity ? 'OK' : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Rear Axle */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Rear Axle</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{rearCapacity} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{rearMeasured} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{rearCapacityDiff} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={rearMeasured <= rearCapacity ? 'success.main' : 'error'}
                            >
                              {rearMeasured <= rearCapacity ? 'OK' : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </>
                )}

                {/* Caravan Only: specific rows for different methods */}
                {weighingSelection === 'caravan_only_registered' && (
                  <>
                    {methodSelection === 'Portable Scales - Individual Tyre Weights' && (
                      <>
                        {/* Aggregated Trailer Mass (ATM) */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Aggregated Trailer Mass (ATM)</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredAtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanAtmCapacityNum - caravanMeasuredAtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                caravanMeasuredAtm <= caravanAtmCapacityNum || caravanAtmCapacityNum === 0
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {caravanAtmCapacityNum === 0
                                ? 'N/A'
                                : caravanMeasuredAtm <= caravanAtmCapacityNum
                                  ? 'OK'
                                  : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Gross Trailer Mass (GTM) */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Gross Trailor Mass (GTM)</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredGtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityDiff} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                caravanMeasuredGtm <= caravanGtmCapacityNum || caravanGtmCapacityNum === 0
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {caravanGtmCapacityNum === 0
                                ? 'N/A'
                                : caravanMeasuredGtm <= caravanGtmCapacityNum
                                  ? 'OK'
                                  : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    )}

                    {methodSelection === 'Weighbridge - In Ground -' ||
                    methodSelection === 'Weighbridge - In Ground - Individual Axle Weights' ? (
                      <>
                        {/* Axle Group Loading */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Axle Group Loading</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">
                              {caravanAxleGroupCapacityNum ? `${caravanAxleGroupCapacityNum} kg` : 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">N/A</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">N/A</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">N/A</Typography>
                          </Grid>
                        </Grid>

                        {/* ATM */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Aggregated Trailor Mass (ATM)</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredAtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">
                              {caravanAtmCapacityNum - caravanMeasuredAtm} kg
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                caravanMeasuredAtm <= caravanAtmCapacityNum || caravanAtmCapacityNum === 0
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {caravanAtmCapacityNum === 0
                                ? 'N/A'
                                : caravanMeasuredAtm <= caravanAtmCapacityNum
                                  ? 'OK'
                                  : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* GTM */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Gross Trailor Mass (GTM)</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredGtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityDiff} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                caravanMeasuredGtm <= caravanGtmCapacityNum || caravanGtmCapacityNum === 0
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {caravanGtmCapacityNum === 0
                                ? 'N/A'
                                : caravanMeasuredGtm <= caravanGtmCapacityNum
                                  ? 'OK'
                                  : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    ) : null}

                    {isCaravanAboveGroundMethod && (
                      <>
                        {/* Axle Group Loading - Na */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Axle Group Loading</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">Na</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">Na</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">Na</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">Na</Typography>
                          </Grid>
                        </Grid>

                        {/* ATM - Supplied */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Aggregated Trailor Mass (ATM)</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredAtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">
                              {caravanAtmCapacityNum - caravanMeasuredAtm} kg
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                caravanMeasuredAtm <= caravanAtmCapacityNum || caravanAtmCapacityNum === 0
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {caravanAtmCapacityNum === 0
                                ? 'N/A'
                                : caravanMeasuredAtm <= caravanAtmCapacityNum
                                  ? 'OK'
                                  : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* GTM - Na */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Gross Trailor Mass (GTM)</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">Na</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">Na</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">Na</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">Na</Typography>
                          </Grid>
                        </Grid>
                      </>
                    )}

                    {isCaravanGoweighMethod && (
                      <>
                        {/* Axle Group Loading (GTM) */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Axle Group Loading (GTM)</Typography>
                          </Grid>
                          {/* Compliance = capacity */}
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
                          </Grid>
                          {/* Measured = actual GTM */}
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredGtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityDiff} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                caravanMeasuredGtm <= caravanGtmCapacityNum || caravanGtmCapacityNum === 0
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {caravanGtmCapacityNum === 0
                                ? 'N/A'
                                : caravanMeasuredGtm <= caravanGtmCapacityNum
                                  ? 'OK'
                                  : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* ATM */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Aggregated Trailor Mass (ATM)</Typography>
                          </Grid>
                          {/* Compliance = capacity */}
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
                          </Grid>
                          {/* Measured = actual ATM */}
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredAtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">
                              {caravanAtmCapacityNum - caravanMeasuredAtm} kg
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                caravanMeasuredAtm <= caravanAtmCapacityNum || caravanAtmCapacityNum === 0
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {caravanAtmCapacityNum === 0
                                ? 'N/A'
                                : caravanMeasuredAtm <= caravanAtmCapacityNum
                                  ? 'OK'
                                  : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* GTM */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Gross Trailor Mass (GTM)</Typography>
                          </Grid>
                          {/* Compliance = capacity */}
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
                          </Grid>
                          {/* Measured = actual GTM */}
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredGtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityDiff} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                caravanMeasuredGtm <= caravanGtmCapacityNum || caravanGtmCapacityNum === 0
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {caravanGtmCapacityNum === 0
                                ? 'N/A'
                                : caravanMeasuredGtm <= caravanGtmCapacityNum
                                  ? 'OK'
                                  : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    )}

                    {!(
                      weighingSelection === 'caravan_only_registered' &&
                      (methodSelection === 'Portable Scales - Individual Tyre Weights' ||
                        String(methodSelection || '').startsWith('Weighbridge - In Ground') ||
                        String(methodSelection || '').toLowerCase().includes('goweigh'))
                    ) && (
                      <>
                        {/* TBM row for Caravan Only flows (all methods).
                            Compliance uses caravan TBM rating derived from ATM - GTM when available. */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Tow Ball Mass (TBM)</Typography>
                          </Grid>
                          {/* Compliance: use TBM capacity when available, otherwise N/A */}
                          <Grid item xs={2}>
                            <Typography variant="body2">
                              {weighingSelection === 'caravan_only_registered' &&
                              String(methodSelection || '').toLowerCase().includes('above ground')
                                ? 'N/A'
                                : caravanTbmCapacityNum != null
                                  ? `${caravanTbmCapacityNum} kg`
                                  : 'N/A'}
                            </Typography>
                          </Grid>
                          {/* Measured: caravan TBM derived per method */}
                          <Grid item xs={2}>
                            <Typography variant="body2">
                              {weighingSelection === 'caravan_only_registered' &&
                              String(methodSelection || '').toLowerCase().includes('above ground')
                                ? 'N/A'
                                : `${caravanMeasuredTbm} kg`}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">
                              {weighingSelection === 'caravan_only_registered' &&
                              String(methodSelection || '').toLowerCase().includes('above ground')
                                ? 'N/A'
                                : caravanTbmCapacityNum != null
                                  ? `${caravanTbmCapacityNum - caravanMeasuredTbm} kg`
                                  : 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography
                              variant="body2"
                              color={
                                weighingSelection === 'caravan_only_registered' &&
                                String(methodSelection || '').toLowerCase().includes('above ground')
                                  ? 'text.secondary'
                                  : caravanTbmCapacityNum == null || caravanMeasuredTbm <= caravanTbmCapacityNum
                                  ? 'success.main'
                                  : 'error'
                              }
                            >
                              {weighingSelection === 'caravan_only_registered' &&
                              String(methodSelection || '').toLowerCase().includes('above ground')
                                ? 'N/A'
                                : caravanTbmCapacityNum == null
                                  ? 'N/A'
                                  : caravanMeasuredTbm <= caravanTbmCapacityNum
                                    ? 'OK'
                                    : 'OVER'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <Box sx={{ mt: 3 }}>
              {weighingSelection === 'caravan_only_registered' &&
                (methodSelection === 'Portable Scales - Individual Tyre Weights' ||
                  String(methodSelection || '').startsWith('Weighbridge - In Ground') ||
                  String(methodSelection || '').toLowerCase().includes('goweigh')) && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Towball Mass {caravanMeasuredAtm > 0 ? `${Math.round((caravanMeasuredTbm / caravanMeasuredAtm) * 100)}%` : 'N/A'}
                </Typography>
              )}
              {weighingSelection === 'caravan_only_registered' &&
                String(methodSelection || '').toLowerCase().includes('above ground') && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Towball Mass % - N/A
                </Typography>
              )}
              {weighingSelection === 'caravan_only_registered' ? (
                <React.Fragment>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Additional Information : Water in Caravan/Trailer
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Number of Tanks: {preWeigh?.waterTankCount || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Number Full: {preWeigh?.waterTankFullCount || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Total Water: {preWeigh?.waterTotalLitres || 'N/A'} Ltrs
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Additional Notes from Page on: {preWeigh?.notes || 'N/A'}
                  </Typography>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {(() => {
                      const base = `Additional Information : Fuel ${
                        resolvedFuelLevel !== '' ? `${resolvedFuelLevel}%` : 'N/A'
                      }, Passengers Front ${resolvedPassengersFront || 0}, Passengers Rear ${
                        resolvedPassengersRear || 0
                      }`;

                      const hasTowball =
                        preWeigh && preWeigh.towballHeightMm != null && preWeigh.towballHeightMm !== '';
                      const hasAirbag =
                        preWeigh && preWeigh.airbagPressurePsi != null && preWeigh.airbagPressurePsi !== '';

                      if (!hasTowball && !hasAirbag) {
                        // DIY flows (and any others without these values) show only fuel/passengers.
                        return base;
                      }

                      const parts = [base];
                      if (hasTowball) {
                        parts.push(`Tow Ball Height ${preWeigh.towballHeightMm} mm`);
                      }
                      if (hasAirbag) {
                        parts.push(`Air Bag Pressure ${preWeigh.airbagPressurePsi} psi`);
                      }

                      return parts.join(', ');
                    })()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Additional Notes: {preWeigh?.notes || 'N/A'}
                  </Typography>
                  {weighingSelection === 'tow_vehicle_and_caravan' && (
                    <>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        TowBall Weight {towBallPct != null ? `${towBallPct.toFixed(0)}%` : 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        Caravan / Trailer to Tow Vehicle Ratio {vanToCarRatioPct != null ? `${vanToCarRatioPct.toFixed(0)}%` : 'N/A'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        BTC {btcPct != null ? `${btcPct.toFixed(0)}%` : 'N/A'}
                      </Typography>
                    </>
                  )}
                </React.Fragment>
              )}

              <Typography variant="body2" sx={{ mt: 1 }}>
                If this report shows there are areas that are not compliant, WeighBuddy recommends contacting a
                professional weighing operator in your area.{' '}
                <a
                  href="https://weighbuddy.ai/faqs"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2', textDecoration: 'underline' }}
                >
                  Click here for more details
                </a>
              </Typography>
            </Box>
          </Paper>

          {/* Bottom buttons */}
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center', gap: 2 }}>
            {!embedded && (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleDownloadReport}
                >
                  Download Report
                </Button>
                {!alreadySaved && !weighId && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleFinish}
                  >
                    Finish
                  </Button>
                )}
              </>
            )}
          </Box>

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

export default DIYVehicleOnlyWeighbridgeResults;
