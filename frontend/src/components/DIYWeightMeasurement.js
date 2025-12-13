import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Divider,
  InputAdornment,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { Scale as ScaleIcon, Info as InfoIcon } from '@mui/icons-material';

const DIYWeightMeasurement = ({ 
  weighingMethod, 
  vehicleData, 
  caravanData, 
  onSave,
  onBack
}) => {
  const [weights, setWeights] = useState({
    vehicleOnly: {
      lf: '', rf: '', lr: '', rr: ''
    },
    caravanOnly: {
      lf: '', rf: '', lr: '', rr: ''
    },
    vehicleOnlyAxles: {
      front: '', rear: ''
    },
    caravanOnlyAxles: {
      front: '', rear: ''
    }
  });

  const [calculatedWeights, setCalculatedWeights] = useState({
    vehicleOnlyTotal: 0,
    caravanOnlyTotal: 0,
    combinedTotal: 0,
    towBallWeight: 0
  });

  const isPortable = weighingMethod?.method === 'portable';
  const hasCaravan = !!caravanData;

  useEffect(() => {
    calculateWeights();
  }, [weights]);

  const calculateWeights = () => {
    let vehicleTotal = 0;
    let caravanTotal = 0;

    if (isPortable) {
      vehicleTotal = (parseFloat(weights.vehicleOnly.lf) || 0) +
                     (parseFloat(weights.vehicleOnly.rf) || 0) +
                     (parseFloat(weights.vehicleOnly.lr) || 0) +
                     (parseFloat(weights.vehicleOnly.rr) || 0);

      if (hasCaravan) {
        caravanTotal = (parseFloat(weights.caravanOnly.lf) || 0) +
                       (parseFloat(weights.caravanOnly.rf) || 0) +
                       (parseFloat(weights.caravanOnly.lr) || 0) +
                       (parseFloat(weights.caravanOnly.rr) || 0);
      }
    } else {
      vehicleTotal = (parseFloat(weights.vehicleOnlyAxles.front) || 0) +
                     (parseFloat(weights.vehicleOnlyAxles.rear) || 0);

      if (hasCaravan) {
        caravanTotal = (parseFloat(weights.caravanOnlyAxles.front) || 0) +
                       (parseFloat(weights.caravanOnlyAxles.rear) || 0);
      }
    }

    const combined = vehicleTotal + caravanTotal;
    const towBall = combined - vehicleTotal;

    setCalculatedWeights({
      vehicleOnlyTotal: vehicleTotal,
      caravanOnlyTotal: caravanTotal,
      combinedTotal: combined,
      towBallWeight: hasCaravan ? towBall : 0
    });
  };

  const handleWeightChange = (section, field, value) => {
    setWeights(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        ...weights,
        ...calculatedWeights
      });
    }
  };

  const canSubmit = isPortable 
    ? (weights.vehicleOnly.lf && weights.vehicleOnly.rf && 
       weights.vehicleOnly.lr && weights.vehicleOnly.rr &&
       (!hasCaravan || (weights.caravanOnly.lf && weights.caravanOnly.rf && 
        weights.caravanOnly.lr && weights.caravanOnly.rr)))
    : (weights.vehicleOnlyAxles.front && weights.vehicleOnlyAxles.rear &&
       (!hasCaravan || (weights.caravanOnlyAxles.front && weights.caravanOnlyAxles.rear)));

  return (
    <Card elevation={3} sx={{ maxWidth: 900, margin: '0 auto', p: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ScaleIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h5" component="h2">
            Weight Measurement
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Important information to start the weighing process
          </Typography>
          <Typography variant="body2" component="div">
            {isPortable ? (
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>Portable Scales - Individual Tyre Weights</li>
                <li>Weigh all four tyres individually for accuracy</li>
                <li>Ensure vehicle is on level ground</li>
                <li>Remove driver before weighing</li>
              </ul>
            ) : (
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li>Weighbridge - {weighingMethod?.weighbridgeType?.charAt(0).toUpperCase() + weighingMethod?.weighbridgeType?.slice(1) || 'Axle'}</li>
                <li>Drive vehicle onto weighbridge carefully</li>
                <li>Ensure all wheels are on the scale</li>
                <li>Record the front and rear axle weights</li>
              </ul>
            )}
          </Typography>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              Vehicle only
            </Typography>

            {isPortable ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="LF Weight"
                    type="number"
                    value={weights.vehicleOnly.lf}
                    onChange={(e) => handleWeightChange('vehicleOnly', 'lf', e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="RF Weight"
                    type="number"
                    value={weights.vehicleOnly.rf}
                    onChange={(e) => handleWeightChange('vehicleOnly', 'rf', e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="LR Weight"
                    type="number"
                    value={weights.vehicleOnly.lr}
                    onChange={(e) => handleWeightChange('vehicleOnly', 'lr', e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="RR Weight"
                    type="number"
                    value={weights.vehicleOnly.rr}
                    onChange={(e) => handleWeightChange('vehicleOnly', 'rr', e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Front Axle Weight"
                    type="number"
                    value={weights.vehicleOnlyAxles.front}
                    onChange={(e) => handleWeightChange('vehicleOnlyAxles', 'front', e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Rear Axle Weight"
                    type="number"
                    value={weights.vehicleOnlyAxles.rear}
                    onChange={(e) => handleWeightChange('vehicleOnlyAxles', 'rear', e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          {hasCaravan && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', flexGrow: 1 }}>
                  Caravan/Trailer Only (Skippable)
                </Typography>
                <Chip label="Optional" size="small" variant="outlined" />
              </Box>

              {isPortable ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="LF Weight"
                      type="number"
                      value={weights.caravanOnly.lf}
                      onChange={(e) => handleWeightChange('caravanOnly', 'lf', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="RF Weight"
                      type="number"
                      value={weights.caravanOnly.rf}
                      onChange={(e) => handleWeightChange('caravanOnly', 'rf', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="LR Weight"
                      type="number"
                      value={weights.caravanOnly.lr}
                      onChange={(e) => handleWeightChange('caravanOnly', 'lr', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="RR Weight"
                      type="number"
                      value={weights.caravanOnly.rr}
                      onChange={(e) => handleWeightChange('caravanOnly', 'rr', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Front Axle Weight"
                      type="number"
                      value={weights.caravanOnlyAxles.front}
                      onChange={(e) => handleWeightChange('caravanOnlyAxles', 'front', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Rear Axle Weight"
                      type="number"
                      value={weights.caravanOnlyAxles.rear}
                      onChange={(e) => handleWeightChange('caravanOnlyAxles', 'rear', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              Weight Results
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Weight (kg)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Vehicle Only Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {calculatedWeights.vehicleOnlyTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  {hasCaravan && (
                    <>
                      <TableRow>
                        <TableCell>Caravan Only Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {calculatedWeights.caravanOnlyTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: '#e3f2fd' }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>Combined Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {calculatedWeights.combinedTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tow Ball Weight</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {calculatedWeights.towBallWeight.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ mb: 3, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Confirm Vehicle Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Vehicle Registration</Typography>
                <Typography variant="body1">{vehicleData?.registrationNumber || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Make & Model</Typography>
                <Typography variant="body1">{vehicleData?.make} {vehicleData?.model}</Typography>
              </Grid>
              {hasCaravan && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Caravan Registration</Typography>
                    <Typography variant="body1">{caravanData?.registrationNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Caravan Make & Model</Typography>
                    <Typography variant="body1">{caravanData?.make} {caravanData?.model}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onBack} variant="outlined">
              Back
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={!canSubmit} sx={{ minWidth: 120 }}>
              Next
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default DIYWeightMeasurement;
