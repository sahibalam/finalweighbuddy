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
    // Measured values from DIY axle weigh screen
    measuredFrontAxle = '',
    measuredGvm = '',
    fuelLevel = '',
    passengersFront = '',
    passengersRear = ''
  } = location.state || {};

  // Measured (Compliance row) values
  const frontMeasured = Number(measuredFrontAxle) || 0;
  const gvmMeasured = Number(measuredGvm) || 0;
  const rearMeasured = gvmMeasured - frontMeasured; // Detailed Report Equation

  // Capacity (Info-Agent / lookup) values for Weights Recorded row
  const frontCapacity = Number(frontAxleCapacity) || 0;
  const rearCapacity = Number(rearAxleCapacity) || 0;
  const gvmCapacityNum = Number(gvmCapacity) || 0;

  // Capacity row: difference (capacity - measured)
  const frontCapacityDiff = frontCapacity - frontMeasured;
  const rearCapacityDiff = rearCapacity - rearMeasured;
  const gvmCapacityDiff = gvmCapacityNum - gvmMeasured;

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
        notes: ''
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
        }
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
            Vehicle Only
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Weighbridge - In Ground - Individual Axle Weights
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
              Vehicle
            </Typography>

            <Grid container spacing={1} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">Make/Model: {description || 'Not Available'}</Typography>
                <Typography variant="body2">Rego Number: {rego || 'Not Available'}</Typography>
                <Typography variant="body2">State: {state || 'Not Available'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">VIN: {vin || 'Not Available'}</Typography>
                <Typography variant="body2">GVM (Unhitched): {gvmMeasured} kg</Typography>
                <Typography variant="body2">Front Axle (Unhitched): {frontMeasured} kg</Typography>
                <Typography variant="body2">Rear Axle (Unhitched): {rearMeasured} kg</Typography>
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
            <Grid container sx={{ borderBottom: '1px solid #eee', py: 1 }}>
              <Grid item xs={4}>
                <Typography variant="body2">Vehicle Load (GVM Unhitched)</Typography>
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

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Additional Information : Front Axle {frontMeasured} kg , Rear Axle {rearMeasured} kg
              </Typography>
              <Typography variant="body2">
                Additional Information : Fuel {fuelLevel !== '' ? `${fuelLevel}%` : 'N/A'}, Passengers Front {passengersFront || 0}, Passengers Rear {passengersRear || 0}, Additional Notes from Page on
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
              YYYY Weigh Buddy. All rights reserved ABN 29 669 902 345
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DIYVehicleOnlyWeighbridgeResults;
