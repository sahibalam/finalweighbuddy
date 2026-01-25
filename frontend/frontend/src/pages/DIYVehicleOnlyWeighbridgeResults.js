import React from 'react';
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

const DIYVehicleOnlyWeighbridgeResults = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
    goweighData = null
  } = location.state || {};

  const methodLabel = methodSelection || 'Weighbridge - In Ground - Individual Axle Weights';
  const isCaravanGoweighMethod =
    methodSelection === 'Weighbridge - goweigh' || methodSelection === 'GoWeigh Weighbridge';
  const isCaravanAboveGroundMethod =
    methodSelection === 'Weighbridge - Above Ground' || methodSelection === 'Above Ground Weighbridge';
  const isTowCaravanInGroundMethod =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Weighbridge - In Ground - Tow Vehicle and Trailer are level and Individual Axle Weights can be recorded';

  const isProfessionalTowCaravanInGroundMethod =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Weighbridge - In Ground - Individual Axle Weights';
  const isTowCaravanGoWeighMethod =
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Weighbridge - goweigh';
  const headingLabel =
    weighingSelection === 'tow_vehicle_and_caravan'
      ? 'Tow Vehicle and Caravan/Trailer'
      : weighingSelection === 'caravan_only_registered'
        ? 'Caravan / Trailer Only (registered)'
        : 'Vehicle Only';

  // Measured (Compliance row) values
  let frontMeasured = 0;
  let rearMeasured = 0;
  let gvmMeasured = 0;

  if (methodSelection === 'Portable Scales - Individual Tyre Weights') {
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
    rearMeasured = frontMeasured - gvmMeasured;
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
  const caravanAxleCapacityNum = caravan.axleGroups ? Number(caravan.axleGroups) || 0 : 0;

  // Measured caravan metrics for Caravan Only flows
  let caravanMeasuredGtm = 0;
  let caravanMeasuredAtm = 0;
  let caravanMeasuredTbm = 0;

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
      if (location.state && location.state.towBallMass != null) {
        caravanMeasuredTbm = safeNumLocal(location.state.towBallMass);
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
        location.state &&
        location.state.towBallMass != null;

      if (!hasExplicitGoweighTbm && !hasExplicitPortableTbm) {
        // For methods without an explicit TBM input, derive TBM as ATM - GTM
        caravanMeasuredTbm = caravanMeasuredAtm - caravanMeasuredGtm;
      }
    }
  }

  const safeNum = (v) => (v != null ? Number(v) || 0 : 0);

  let gvmHitched = 0;
  let gvmHitchWdhOff = 0;
  let gvmUnhitched = 0;
  let tbm = 0;
  let gtmMeasured = 0;
  let atmMeasured = caravanAtmCapacityNum; // default ATM uses caravan ATM rating
  let gcmMeasured = 0;

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
  } else if (isTowCaravanGoWeighMethod && goweighData) {
    // Tow Vehicle + Caravan GoWeigh method using dedicated GoWeigh screen inputs.
    const first = goweighData.firstWeigh || {};
    const second = goweighData.secondWeigh || {};
    const summary = goweighData.summary || {};

    const frontUnhitched = safeNum(first.frontUnhitched);
    const rearUnhitched = safeNum(first.rearUnhitched);
    const caravanAtmSupplied = safeNum(first.trailerAtm); // ATM supplied

    const frontHitched = safeNum(second.frontHitched);
    const rearHitched = safeNum(second.rearHitched);
    const caravanGtmSupplied = safeNum(second.trailerGtm); // GTM supplied

    const gcmSupplied = safeNum(summary.gcm); // GCM supplied
    const tbmSupplied = safeNum(summary.tbm); // TBM supplied

    // Detailed Report Equations
    // Front Axle Hitched + Rear Axle Hitched = GVM Hitched
    gvmHitched = frontHitched + rearHitched;
    // Front Axle Unhitched + Rear Axle Unhitched = GVM Unhitched
    gvmUnhitched = frontUnhitched + rearUnhitched;

    // Supplied caravan / towing metrics
    atmMeasured = caravanAtmSupplied;
    gtmMeasured = caravanGtmSupplied;
    gcmMeasured = gcmSupplied;
    tbm = tbmSupplied;
  } else if (
    weighingSelection === 'tow_vehicle_and_caravan' &&
    methodSelection === 'Portable Scales - Individual Tyre Weights' &&
    axleWeigh
  ) {
    // Professional Tow Vehicle + Caravan portable scales flow.
    // 1) Always use GVM Unhitched derived from individual tyre loads on the VCI02 screen.
    gvmUnhitched = safeNum(axleWeigh.gvmUnhitched);

    // 2) TBM: prefer explicit towBallMass override if provided.
    if (location.state && location.state.towBallMass != null) {
      tbm = safeNum(location.state.towBallMass);

      // Use the caravan GTM from the Professional GTM/ATM screen as measured GTM
      // and derive ATM as GTM + TBM so the Compliance Summary shows true measured ATM.
      gtmMeasured = safeNum(axleWeigh.trailerGtm);
      if (gtmMeasured > 0) {
        atmMeasured = gtmMeasured + tbm;

        // Also compute GVM Hitched from the VCI01 hitch weights so we can
        // derive GCM as GTM (measured) + GVM Hitched.
        const vci01 = location.state?.vci01 || null;
        const hitchWeigh = vci01?.hitchWeigh || null;
        if (hitchWeigh) {
          const hitchedFront =
            safeNum(hitchWeigh.frontLeft) + safeNum(hitchWeigh.frontRight);
          const hitchedRear =
            safeNum(hitchWeigh.rearLeft) + safeNum(hitchWeigh.rearRight);
          const gvmHitchedPortable = hitchedFront + hitchedRear;

          gvmHitched = gvmHitchedPortable;
          gcmMeasured = gtmMeasured + gvmHitchedPortable;
        }
      }
    } else {
      // 3) Otherwise, derive TBM from GVM Hitched vs GVM Unhitched using VCI01 hitch weights.
      const vci01 = location.state?.vci01 || null;
      const hitchWeigh = vci01?.hitchWeigh || null;
      const hitchWdhOffWeigh = vci01?.hitchWdhOffWeigh || null;
      const hasWdh = vci01?.hasWdh;

      if (hitchWeigh) {
        const hitchedFront = safeNum(hitchWeigh.frontLeft) + safeNum(hitchWeigh.frontRight);
        const hitchedRear = safeNum(hitchWeigh.rearLeft) + safeNum(hitchWeigh.rearRight);
        const gvmHitchedPortable = hitchedFront + hitchedRear;

        // Use the caravan GTM from the Professional GTM/ATM screen as measured GTM.
        gtmMeasured = safeNum(axleWeigh.trailerGtm);

        if (hasWdh && hitchWdhOffWeigh) {
          // With WDH: use the GVM with WDH released.
          const wdhOffFront = safeNum(hitchWdhOffWeigh.frontLeft) + safeNum(hitchWdhOffWeigh.frontRight);
          const wdhOffRear = safeNum(hitchWdhOffWeigh.rearLeft) + safeNum(hitchWdhOffWeigh.rearRight);
          const gvmHitchWdhReleasePortable = wdhOffFront + wdhOffRear;
          tbm = gvmHitchWdhReleasePortable - gvmUnhitched;
        } else {
          // Without WDH: GVM Hitched - GVM Unhitched = TBM.
          tbm = gvmHitchedPortable - gvmUnhitched;
        }

        if (gtmMeasured > 0) {
          // GTM + TBM = ATM
          atmMeasured = gtmMeasured + tbm;
          // GCM = GTM + GVM Hitched
          gcmMeasured = gtmMeasured + gvmHitchedPortable;
        }
      }
    }
  } else if (location.state && location.state.towBallMass != null) {
    // For non in-ground flows that provide an explicit towBallMass (e.g. professional portable scales),
    // use that value directly as measured TBM.
    tbm = safeNum(location.state.towBallMass);
  }

  const isTowCaravanAdvisoryMethod = isTowCaravanInGroundMethod || isTowCaravanGoWeighMethod;

  // For tow vehicle + caravan methods, the GVM row is labelled "GVM Unhitched",
  // so the measured value should always be the unhitched GVM when available.
  const effectiveGvmForCapacity = weighingSelection === 'tow_vehicle_and_caravan' ? gvmUnhitched : gvmMeasured;

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
  const caravanTbm = hasCaravanDetails && caravanMeasuredTbm
    ? `${caravanMeasuredTbm} kg`
    : 'N/A';

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
          fuelLevel: fuelLevel === '' ? null : Number(fuelLevel),
          passengersFront: Number(passengersFront) || 0,
          passengersRear: Number(passengersRear) || 0
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
      await axios.post('/api/weighs/diy-vehicle-only', {
        vehicleSummary: {
          description,
          rego,
          state,
          vin,
          gvmUnhitched: gvmMeasured,
          frontUnhitched: frontMeasured,
          rearUnhitched: rearMeasured
        },
        preWeigh: {
          fuelLevel: fuelLevel === '' ? null : Number(fuelLevel),
          passengersFront: Number(passengersFront) || 0,
          passengersRear: Number(passengersRear) || 0
        },
        modifiedVehicleImages: Array.isArray(modifiedImages) ? modifiedImages : []
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save DIY vehicle-only weigh:', err);
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
          <Typography variant="h6" sx={{ mb: 1 }}>
            {headingLabel}
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {methodLabel}
          </Typography>

          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', mb: 4 }}
          >
            Weigh Results
          </Typography>

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

            {/* Row 1: Compliance (measured values) */}
            {/* Tow Vehicle + Caravan/Trailer */}
            {weighingSelection === 'tow_vehicle_and_caravan' && (
              <>
                {/* Gross Vehicle Mass (GVM Unhitched) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Vehicle Mass (GVM Unhitched)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{gvmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{effectiveGvmForCapacity} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{gvmCapacityDiff} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={effectiveGvmForCapacity <= gvmCapacityNum ? 'success.main' : 'error'}
                    >
                      {effectiveGvmForCapacity <= gvmCapacityNum ? 'OK' : 'OVER'}
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
                    <Typography variant="body2">{tbm} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {tbmCapacityNum != null ? `${tbmCapacityNum - tbm} kg` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        tbmCapacityNum == null || tbm <= tbmCapacityNum
                          ? 'success.main'
                          : 'error'
                      }
                    >
                      {tbmCapacityNum == null
                        ? 'N/A'
                        : tbm <= tbmCapacityNum
                          ? 'OK'
                          : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Aggregated Trailor Mass (ATM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Aggregated Trailor Mass (ATM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{atmMeasured} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanAtmCapacityNum - atmMeasured} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        caravanAtmCapacityNum === 0 || atmMeasured <= caravanAtmCapacityNum
                          ? 'success.main'
                          : 'error'
                      }
                    >
                      {caravanAtmCapacityNum === 0
                        ? 'N/A'
                        : atmMeasured <= caravanAtmCapacityNum
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
                    <Typography variant="body2">{gcmMeasured} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {gcmCapacityNum != null ? `${gcmCapacityNum - gcmMeasured} kg` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        gcmCapacityNum == null || gcmMeasured <= gcmCapacityNum
                          ? 'success.main'
                          : 'error'
                      }
                    >
                      {gcmCapacityNum == null
                        ? 'N/A'
                        : gcmMeasured <= gcmCapacityNum
                          ? 'OK'
                          : 'OVER'}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Gross Trailor Mass (GTM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Trailor Mass (GTM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{gtmMeasured} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanGtmCapacityDiff} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography
                      variant="body2"
                      color={
                        caravanGtmCapacityNum === 0 || gtmMeasured <= caravanGtmCapacityNum
                          ? 'success.main'
                          : 'error'
                      }
                    >
                      {caravanGtmCapacityNum === 0
                        ? 'N/A'
                        : gtmMeasured <= caravanGtmCapacityNum
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
                {weighingSelection !== 'caravan_only_registered' && (
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
                      <Typography variant="body2" color={gvmMeasured <= gvmCapacityNum ? 'success.main' : 'error'}>
                        {gvmMeasured <= gvmCapacityNum ? 'OK' : 'OVER'}
                      </Typography>
                    </Grid>
                  </Grid>
                )}

                {/* Caravan Only: specific rows for different methods */}
                {weighingSelection === 'caravan_only_registered' && (
                  <>
                    {methodSelection === 'Portable Scales - Individual Tyre Weights' && (
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
                              {caravanAxleCapacityNum ? `${caravanAxleCapacityNum} kg` : 'N/A'}
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
                        <Grid container sx={{ borderBottom: '1px solid ' + '#eee', py: 1 }}>
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

                    {/* TBM row for Caravan Only flows (all methods) */}
                    <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                      <Grid item xs={4}>
                        <Typography variant="body2">Tow Ball Mass (TBM)</Typography>
                      </Grid>
                      {/* Compliance: use TBM capacity when available, otherwise N/A */}
                      <Grid item xs={2}>
                        <Typography variant="body2">
                          {tbmCapacityNum != null ? `${tbmCapacityNum} kg` : 'N/A'}
                        </Typography>
                      </Grid>
                      {/* Measured: caravan TBM derived per method */}
                      <Grid item xs={2}>
                        <Typography variant="body2">{caravanMeasuredTbm} kg</Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">
                          {tbmCapacityNum != null ? `${tbmCapacityNum - caravanMeasuredTbm} kg` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography
                          variant="body2"
                          color={
                            tbmCapacityNum == null || caravanMeasuredTbm <= tbmCapacityNum
                              ? 'success.main'
                              : 'error'
                          }
                        >
                          {tbmCapacityNum == null
                            ? 'N/A'
                            : caravanMeasuredTbm <= tbmCapacityNum
                              ? 'OK'
                              : 'OVER'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                )}
              </>
            )}

            <Box sx={{ mt: 3 }}>
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
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Additional Information : Front Axle {frontMeasured} kg , Rear Axle {rearMeasured} kg
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Additional Information : Fuel {fuelLevel !== '' ? `${fuelLevel}%` : 'N/A'}, Passengers Front {passengersFront || 0}, Passengers Rear {passengersRear || 0}, Additional Notes from Page on
                  </Typography>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFinish}
            >
              Finish
            </Button>
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
