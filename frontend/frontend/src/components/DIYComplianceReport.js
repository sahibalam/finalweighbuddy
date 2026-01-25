import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  Warning as WarningIcon,
  Assessment as ReportIcon
} from '@mui/icons-material';

const DIYComplianceReport = ({ 
  vehicleData, 
  caravanData, 
  weightsData, 
  customerData,
  fullReport 
}) => {
  
  const calculateCompliance = () => {
    // Totals as calculated in DIYWeightMeasurement
    const vehicleCaravanCombined = parseFloat(weightsData.combinedTotal) || 0;
    const vehicleOnly = parseFloat(weightsData.vehicleOnlyTotal) || 0;
    const caravanOnly = parseFloat(weightsData.caravanOnlyTotal) || 0;

    // TBM and GTM are already derived in DIYWeightMeasurement, but we can
    // safely recompute here in case they are not present.
    const towBallWeight = (typeof weightsData.towBallWeight === 'number'
      ? weightsData.towBallWeight
      : (vehicleCaravanCombined - vehicleOnly));

    const calculatedGTM = caravanOnly - towBallWeight;

    const vehicleGVM = parseFloat(vehicleData.gvm) || 0;
    const vehicleGCM = parseFloat(vehicleData.gcm) || 0;
    const vehicleBTC = parseFloat(vehicleData.btc) || 0;
    
    const tbmLimit = vehicleData.tbm || (caravanData && parseFloat(caravanData.atm) * 0.1) || 0;

    const caravanATM = caravanData ? parseFloat(caravanData.atm) || 0 : 0;
    const caravanGTM = caravanData ? parseFloat(caravanData.gtm) || 0 : 0;

    const compliance = {
      gvm: {
        actual: vehicleOnly,
        limit: vehicleGVM,
        compliant: vehicleOnly <= vehicleGVM,
        difference: vehicleOnly - vehicleGVM,
        percentage: vehicleGVM > 0 ? ((vehicleOnly / vehicleGVM) * 100).toFixed(1) : 0
      },
      
      tbm: {
        actual: towBallWeight,
        limit: tbmLimit,
        compliant: caravanData ? (towBallWeight <= tbmLimit) : true,
        difference: caravanData ? (towBallWeight - tbmLimit) : 0,
        percentage: tbmLimit > 0 ? ((towBallWeight / tbmLimit) * 100).toFixed(1) : 0
      },
      
      atm: {
        actual: caravanOnly + towBallWeight,
        limit: caravanATM,
        compliant: caravanData ? ((caravanOnly + towBallWeight) <= caravanATM) : true,
        difference: caravanData ? ((caravanOnly + towBallWeight) - caravanATM) : 0,
        percentage: caravanATM > 0 ? (((caravanOnly + towBallWeight) / caravanATM) * 100).toFixed(1) : 0
      },
      
      gcm: {
        actual: vehicleOnly + (caravanOnly + towBallWeight),
        limit: vehicleGCM,
        compliant: (vehicleOnly + (caravanOnly + towBallWeight)) <= vehicleGCM,
        difference: (vehicleOnly + (caravanOnly + towBallWeight)) - vehicleGCM,
        percentage: vehicleGCM > 0 ? (((vehicleOnly + (caravanOnly + towBallWeight)) / vehicleGCM) * 100).toFixed(1) : 0
      },
      
      gtm: {
        actual: caravanOnly,
        limit: caravanGTM,
        compliant: caravanGTM > 0 ? caravanOnly <= caravanGTM : true,
        difference: caravanGTM > 0 ? (caravanOnly - caravanGTM) : 0,
        percentage: caravanGTM > 0 ? ((caravanOnly / caravanGTM) * 100).toFixed(1) : 0
      }
    };

    const overallCompliant = compliance.gvm.compliant && 
                           compliance.tbm.compliant && 
                           compliance.atm.compliant && 
                           compliance.gcm.compliant &&
                           compliance.gtm.compliant;

    return { ...compliance, overallCompliant };
  };

  const compliance = calculateCompliance();

  // Expose key totals for use in the JSX summary cards
  const vehicleCaravanCombined = parseFloat(weightsData?.combinedTotal) || 0;
  const vehicleOnly = parseFloat(weightsData?.vehicleOnlyTotal) || 0;
  const caravanOnly = parseFloat(weightsData?.caravanOnlyTotal) || 0;

  const ComplianceRow = ({ title, check, unit = 'kg' }) => (
    <TableRow>
      <TableCell>
        <Typography variant="body1" fontWeight="bold">
          {title}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body1">
          {check.actual} {unit}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body1">
          {check.limit} {unit}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Chip
          icon={check.compliant ? <PassIcon /> : <FailIcon />}
          label={check.compliant ? 'PASS' : 'FAIL'}
          color={check.compliant ? 'success' : 'error'}
          variant="filled"
        />
      </TableCell>
      <TableCell align="center">
        <Typography 
          variant="body1" 
          color={check.difference > 0 ? 'error.main' : 'success.main'}
          fontWeight="bold"
        >
          {check.difference > 0 ? '+' : ''}{check.difference} {unit}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Typography variant="body1">
          {check.percentage}%
        </Typography>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Payment Success Message */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body1" fontWeight="bold">
          🎉 Payment Completed - Full Report Available
        </Typography>
        <Typography variant="body2">
          This is your official compliance report. You can download the PDF version and it has been saved to your account history.
        </Typography>
      </Alert>

      {/* Report Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <ReportIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Official Compliance Report
            </Typography>
            <Typography variant="h6">
              {vehicleData.make} {vehicleData.model} {vehicleData.year} {vehicleData.variant} - Compliance Report
            </Typography>
            <Typography variant="body1">
              Customer: {customerData?.name || 'DIY User'} | Date: {new Date().toLocaleDateString('en-AU')}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Overall Status */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Alert 
            severity={compliance.overallCompliant ? 'success' : 'error'}
            sx={{ fontSize: '1.1rem' }}
          >
            <Typography variant="h6" fontWeight="bold">
              {compliance.overallCompliant ? 
                '✅ Overall Status: COMPLIANT (All Tests Pass)' : 
                '❌ Overall Status: NON-COMPLIANT (Some Tests Failed)'
              }
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Detailed Compliance Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Detailed Compliance Check Results:
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><Typography variant="subtitle1" fontWeight="bold">Check Type</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Actual Weight</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Limit</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Result</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Difference</Typography></TableCell>
                  <TableCell align="center"><Typography variant="subtitle1" fontWeight="bold">Usage %</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <ComplianceRow 
                  title="Vehicle Load (GVM Unhooked)"
                  check={compliance.gvm}
                />
                {caravanData && (
                  <>
                    <ComplianceRow 
                      title="Tow Ball Load (TBM)"
                      check={compliance.tbm}
                    />
                    <ComplianceRow 
                      title="Caravan Load (ATM)"
                      check={compliance.atm}
                    />
                  </>
                )}
                <ComplianceRow 
                  title="Combined Load (GCM)"
                  check={compliance.gcm}
                />
                {caravanData && compliance.gtm.limit > 0 && (
                  <ComplianceRow 
                    title="Caravan Axle Load (GTM)"
                    check={compliance.gtm}
                  />
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Weight Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary">
                {vehicleCaravanCombined} kg
              </Typography>
              <Typography variant="body2">
                GVM (Attached)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Vehicle + {caravanData ? 'Caravan' : 'Total'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="secondary">
                {vehicleOnly} kg
              </Typography>
              <Typography variant="body2">
                GVM (Unhooked)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Vehicle Only
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {caravanData && (
          <>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main">
                    {caravanOnly} kg
                  </Typography>
                  <Typography variant="body2">
                    GTM
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Caravan Only (on wheels)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="info.main">
                    {compliance.tbm.actual} kg
                  </Typography>
                  <Typography variant="body2">
                    TBM
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tow Ball Mass
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="warning.main">
                    {compliance.gtm.actual} kg
                  </Typography>
                  <Typography variant="body2">
                    GTM
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Caravan Axle Load
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="error.main">
                {compliance.gcm.actual} kg
              </Typography>
              <Typography variant="body2">
                GCM
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Combination
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vehicle & Caravan Information */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Vehicle Information:
              </Typography>
              <Typography variant="body2">
                <strong>Make:</strong> {vehicleData.make}
              </Typography>
              <Typography variant="body2">
                <strong>Model:</strong> {vehicleData.model}
              </Typography>
              <Typography variant="body2">
                <strong>Year:</strong> {vehicleData.year}
              </Typography>
              <Typography variant="body2">
                <strong>Variant:</strong> {vehicleData.variant}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">
                <strong>GVM:</strong> {vehicleData.gvm} kg
              </Typography>
              <Typography variant="body2">
                <strong>GCM:</strong> {vehicleData.gcm} kg
              </Typography>
              <Typography variant="body2">
                <strong>BTC:</strong> {vehicleData.btc} kg
              </Typography>
              <Typography variant="body2">
                <strong>TBM Limit:</strong> {compliance.tbm.limit} kg
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {caravanData && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  Caravan Information:
                </Typography>
                <Typography variant="body2">
                  <strong>Make:</strong> {caravanData.make}
                </Typography>
                <Typography variant="body2">
                  <strong>Model:</strong> {caravanData.model}
                </Typography>
                <Typography variant="body2">
                  <strong>Year:</strong> {caravanData.year}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  <strong>ATM:</strong> {caravanData.atm} kg
                </Typography>
                <Typography variant="body2">
                  <strong>GTM:</strong> {caravanData.gtm} kg
                </Typography>
                <Typography variant="body2">
                  <strong>Axle Capacity:</strong> {caravanData.axleCapacity} kg
                </Typography>
                <Typography variant="body2">
                  <strong>Number of Axles:</strong> {caravanData.numberOfAxles}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Footer Note */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Disclaimer:</strong> This is a DIY (Do-It-Yourself) report. All measurements and compliance plate readings are your responsibility. 
          For professional verification, please contact an authorized weighbridge center.
        </Typography>
      </Alert>
    </Box>
  );
};

export default DIYComplianceReport;
