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
    axleWeigh = null
  } = location.state || {};

  const methodLabel = methodSelection || 'Weighbridge - In Ground - Individual Axle Weights';
  const isCaravanGoweighMethod =
    methodSelection === 'Weighbridge - goweigh' || methodSelection === 'GoWeigh Weighbridge';
  const isCaravanAboveGroundMethod =
    methodSelection === 'Weighbridge - Above Ground' || methodSelection === 'Above Ground Weighbridge';
  const headingLabel =
    weighingSelection === 'tow_vehicle_and_caravan'
      ? 'Tow Vehicle and Caravan/Trailer'
      : weighingSelection === 'caravan_only_registered'
        ? 'Caravan / Trailer Only (registered)'
        : 'Vehicle Only';

  // Display fields differ for Caravan Only vs Vehicle flows
  const displayRego =
    weighingSelection === 'caravan_only_registered'
      ? caravan.rego || 'Not Available'
      : rego || 'Not Available';

  const displayState =
    weighingSelection === 'caravan_only_registered'
      ? caravan.state || 'Not Available'
      : state || 'Not Available';

  const displayVin =
    weighingSelection === 'caravan_only_registered'
      ? caravan.vin || 'Not Available'
      : vin || 'Not Available';

  const displayDescription =
    weighingSelection === 'caravan_only_registered'
      ? (caravan.make || caravan.model ? `${caravan.make || ''} ${caravan.model || ''}`.trim() : 'Not Available')
      : description || 'Not Available';

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

  // Caravan capacity values (if provided via caravan confirm screen)
  const caravanAtmCapacityNum = caravan.atm ? Number(caravan.atm) || 0 : 0;
  const caravanGtmCapacityNum = caravan.gtm ? Number(caravan.gtm) || 0 : 0;

  // Measured caravan metrics for Caravan Only flows
  let caravanMeasuredGtm = 0;
  let caravanMeasuredAtm = 0;
  let caravanMeasuredTbm = 0;
  let caravanMeasuredTbmPercent = null;

  if (weighingSelection === 'caravan_only_registered') {
    // Portable Scales - derive GTM from individual tyre loads
    if (methodSelection === 'Portable Scales - Individual Tyre Weights' && tyreWeigh) {
      const safeNum = (v) => (v != null ? Number(v) || 0 : 0);

      if (tyreWeigh.axleConfig === 'Single Axle') {
        caravanMeasuredGtm = safeNum(tyreWeigh.single?.left) + safeNum(tyreWeigh.single?.right);
      } else if (tyreWeigh.axleConfig === 'Dual Axle') {
        caravanMeasuredGtm =
          safeNum(tyreWeigh.dual?.frontLeft) +
          safeNum(tyreWeigh.dual?.frontRight) +
          safeNum(tyreWeigh.dual?.rearLeft) +
          safeNum(tyreWeigh.dual?.rearRight);
      } else if (tyreWeigh.axleConfig === 'Triple Axle') {
        caravanMeasuredGtm =
          safeNum(tyreWeigh.triple?.frontLeft) +
          safeNum(tyreWeigh.triple?.frontRight) +
          safeNum(tyreWeigh.triple?.middleLeft) +
          safeNum(tyreWeigh.triple?.middleRight) +
          safeNum(tyreWeigh.triple?.rearLeft) +
          safeNum(tyreWeigh.triple?.rearRight);
      }
    }

    // Weighbridge - In Ground: GTM & ATM supplied from DIYCaravanOnlyWeighbridgeInGround
    if (methodSelection === 'Weighbridge - In Ground -' && axleWeigh) {
      caravanMeasuredGtm = axleWeigh.caravanHitchedGtm != null ? Number(axleWeigh.caravanHitchedGtm) || 0 : 0;
      caravanMeasuredAtm = axleWeigh.caravanUnhitchedAtm != null ? Number(axleWeigh.caravanUnhitchedAtm) || 0 : 0;
    }

    // Weighbridge - Above Ground: ATM supplied, GTM/TBM treated as not applicable
    if (isCaravanAboveGroundMethod && axleWeigh) {
      caravanMeasuredAtm = axleWeigh.caravanAtm != null ? Number(axleWeigh.caravanAtm) || 0 : 0;
      caravanMeasuredGtm = 0;
      caravanMeasuredTbm = 0;
    }

    // Weighbridge - goweigh: GTM, ATM, TBM all supplied from DIYCaravanOnlyWeighbridgeGoWeigh
    if (isCaravanGoweighMethod && axleWeigh) {
      caravanMeasuredGtm = axleWeigh.caravanHitchedGtm != null ? Number(axleWeigh.caravanHitchedGtm) || 0 : 0;
      caravanMeasuredAtm = axleWeigh.caravanUnhitchedAtm != null ? Number(axleWeigh.caravanUnhitchedAtm) || 0 : 0;
      caravanMeasuredTbm = axleWeigh.towballMass != null ? Number(axleWeigh.towballMass) || 0 : 0;
    }

    // Derive TBM and TowBall Mass % where possible
    if (caravanMeasuredAtm > 0 || caravanMeasuredGtm > 0) {
      if (!(isCaravanGoweighMethod && axleWeigh && axleWeigh.towballMass != null)) {
        // For non-goweigh methods, derive TBM as ATM - GTM
        caravanMeasuredTbm = caravanMeasuredAtm - caravanMeasuredGtm;
      }
      caravanMeasuredTbmPercent = caravanMeasuredAtm > 0
        ? (caravanMeasuredTbm / caravanMeasuredAtm) * 100
        : null;
    }
  }

  // Capacity row: difference (capacity - measured)
  const frontCapacityDiff = frontCapacity - frontMeasured;
  const rearCapacityDiff = rearCapacity - rearMeasured;
  const gvmCapacityDiff = gvmCapacityNum - gvmMeasured;
  const caravanGtmCapacityDiff = caravanGtmCapacityNum - caravanMeasuredGtm;

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

          {/* Simple summary card approximating report layout */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              {weighingSelection === 'caravan_only_registered' ? 'Caravan' : 'Vehicle'}
            </Typography>

            <Grid container spacing={1} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">Make/Model: {displayDescription}</Typography>
                <Typography variant="body2">Rego Number: {displayRego}</Typography>
                <Typography variant="body2">State: {displayState}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">VIN: {displayVin}</Typography>
                {weighingSelection !== 'caravan_only_registered' && (
                  <>
                    <Typography variant="body2">GVM (Unhitched): {gvmCapacityNum} kg</Typography>
                    <Typography variant="body2">
                      GCM Capacity: {gcmCapacityNum != null ? `${gcmCapacityNum} kg` : 'Not Available'}
                    </Typography>
                  </>
                )}
                {weighingSelection === 'caravan_only_registered' && isCaravanAboveGroundMethod && (
                  <>
                    <Typography variant="body2">TowBall Mass - Na</Typography>
                    <Typography variant="body2">Towball Mass % - Na</Typography>
                  </>
                )}
                {weighingSelection === 'caravan_only_registered' && methodSelection === 'Weighbridge - In Ground -' && (
                  <>
                    <Typography variant="body2">
                      TowBall Mass (TBM): {caravanMeasuredTbm} kg
                    </Typography>
                    <Typography variant="body2">
                      TowBall Mass %:{' '}
                      {caravanMeasuredTbmPercent != null
                        ? `${caravanMeasuredTbmPercent.toFixed(1)} %`
                        : 'N/A'}
                    </Typography>
                  </>
                )}

                {weighingSelection === 'caravan_only_registered' && isCaravanGoweighMethod && (
                  <>
                    <Typography variant="body2">
                      TowBall Mass (TBM): {caravanMeasuredTbm} kg
                    </Typography>
                    <Typography variant="body2">
                      TowBall Mass %:{' '}
                      {caravanMeasuredTbmPercent != null
                        ? `${caravanMeasuredTbmPercent.toFixed(1)} %`
                        : 'N/A'}
                    </Typography>
                  </>
                )}

                {weighingSelection !== 'caravan_only_registered' && (
                  <>
                    <Typography variant="body2">
                      BTC Capacity: {btcCapacityNum != null ? `${btcCapacityNum} kg` : 'Not Available'}
                    </Typography>
                    <Typography variant="body2">Front Axle (Unhitched): {frontCapacity} kg</Typography>
                    <Typography variant="body2">Rear Axle (Unhitched): {rearCapacity} kg</Typography>
                  </>
                )}
              </Grid>
            </Grid>

            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Compliance Summary
            </Typography>

            <Grid container sx={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', py: 1, mb: 2 }}>
              <Grid item xs={4}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Metric</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Measured</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Limit</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Difference</Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Status</Typography>
              </Grid>
            </Grid>

            {/* Row 1: Compliance (measured values) */}
            {/* Compliance rows differ for Vehicle Only vs Tow Vehicle and Caravan/Trailer */}
            {weighingSelection === 'tow_vehicle_and_caravan' ? (
              <>
                {/* Gross Vehicle Mass (GVM Unhitched) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Vehicle Mass (GVM Unhitched)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{gvmMeasured} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{gvmCapacityNum} kg</Typography>
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

                {/* Tow Ball Mass (TBM) - placeholder values for now */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Tow Ball Mass (TBM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">0 kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">0 kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">0 kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">N/A</Typography>
                  </Grid>
                </Grid>

                {/* Aggregated Trailor Mass (ATM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Aggregated Trailor Mass (ATM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">0 kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{0 - caravanAtmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">N/A</Typography>
                  </Grid>
                </Grid>

                {/* Gross Combination Mass (GCM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Combination Mass (GCM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">0 kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {gcmCapacityNum != null ? `${gcmCapacityNum} kg` : 'Not Available'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">
                      {gcmCapacityNum != null ? `${0 - gcmCapacityNum} kg` : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">N/A</Typography>
                  </Grid>
                </Grid>

                {/* Gross Trailor Mass (GTM) */}
                <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2">Gross Trailor Mass (GTM)</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">0 kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{0 - caravanGtmCapacityNum} kg</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">N/A</Typography>
                  </Grid>
                </Grid>
              </>
            ) : (
              <>
                {weighingSelection !== 'caravan_only_registered' && (
                  <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                    <Grid item xs={4}>
                      <Typography variant="body2">Gross Vehicle Mass (GVM Unhitched)</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">{gvmMeasured} kg</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body2">{gvmCapacityNum} kg</Typography>
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
                          <Typography variant="body2">{caravanMeasuredGtm} kg</Typography>
                        </Grid>
                        <Grid item xs={2}>
                          <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
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

                    {methodSelection === 'Weighbridge - In Ground -' && (
                      <>
                        {/* ATM */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Aggregated Trailor Mass (ATM)</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredAtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
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
                            <Typography variant="body2">{caravanMeasuredGtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
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

                        {/* TBM values are summarised in the header card for this method */}
                      </>
                    )}

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
                            <Typography variant="body2">{caravanMeasuredAtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
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
                        {/* Axle Group Loading (using measured GTM) */}
                        <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                          <Grid item xs={4}>
                            <Typography variant="body2">Axle Group Loading (GTM)</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredGtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
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
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanMeasuredAtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanAtmCapacityNum} kg</Typography>
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
                            <Typography variant="body2">{caravanMeasuredGtm} kg</Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Typography variant="body2">{caravanGtmCapacityNum} kg</Typography>
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

                        {/* TBM and TBM% are summarised in the header card for this method */}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            <Box sx={{ mt: 3 }}>
              {weighingSelection === 'caravan_only_registered' ? (
                <>
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
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Additional Information : Front Axle {frontMeasured} kg , Rear Axle {rearMeasured} kg
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Additional Information : Fuel {fuelLevel !== '' ? `${fuelLevel}%` : 'N/A'}, Passengers Front {passengersFront || 0}, Passengers Rear {passengersRear || 0}, Additional Notes from Page on
                  </Typography>
                </>
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
