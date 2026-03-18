import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Visibility as PreviewIcon,
  CreditCard as CreditCardIcon,
  Lock as SecurityIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import StripePaymentForm from './StripePaymentForm';
import { useNavigate } from 'react-router-dom';

const ReportPreviewAndPayment = ({
  vehicleData,
  caravanData,
  weightsData,
  customerData,
  preWeigh,
  onPaymentComplete,
  paymentOnly = false,
  amount = 20,
  vehicleOnlyMethodLabel = '',
  weighingSelection = '',
  diyWeighingSelection = '',
  towSetupType = ''
}) => {
  const navigate = useNavigate();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const resolvedCustomerData = (() => {
    if (customerData) return customerData;

    try {
      const draftRaw = localStorage.getItem('professionalClientDraft');
      const draft = draftRaw ? JSON.parse(draftRaw) : null;
      if (!draft || typeof draft !== 'object') return null;

      const firstName = String(draft.firstName || '').trim();
      const lastName = String(draft.lastName || '').trim();
      const fullName = String(draft.name || '').trim() || [firstName, lastName].filter(Boolean).join(' ').trim();
      const email = String(draft.email || '').trim();
      const phone = String(draft.phone || '').trim();
      const clientUserId = draft.diyClientUserId != null ? String(draft.diyClientUserId).trim() : null;

      if (!fullName && !email && !phone && !clientUserId) return null;

      return {
        fullName,
        name: fullName,
        email,
        phone,
        clientUserId,
      };
    } catch (e) {
      return null;
    }
  })();

  const isCustomBuildTrailerTarePortablePaymentOnly =
    paymentOnly &&
    weighingSelection === 'custom_build_trailer_tare' &&
    vehicleOnlyMethodLabel === 'Portable Scales - Individual Tyre Weights';

  const isCustomBuildTrailerTareWeighbridgePaymentOnly =
    paymentOnly &&
    weighingSelection === 'custom_build_trailer_tare' &&
    (vehicleOnlyMethodLabel === 'GoWeigh Weighbridge' || vehicleOnlyMethodLabel === 'Weighbridge - In Ground -');

  const buildTrailerTareReportPayload = () => {
    const tyreWeigh = vehicleData?.diyTyreWeigh || null;
    const header = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: resolvedCustomerData?.fullName || resolvedCustomerData?.name || '',
      location: '',
      caravanRego: caravanData?.rego || caravanData?.numberPlate || '',
      caravanMake: caravanData?.make || '',
      caravanModel: caravanData?.model || '',
    };

    return {
      customBuildTrailerTare: true,
      weighingSelection: 'custom_build_trailer_tare',
      diyWeighingSelection: 'custom_build_trailer_tare',
      header,
      trailerInfo: {
        rego: header.caravanRego,
        make: header.caravanMake,
        model: header.caravanModel,
      },
      capacities: {
        tbm: caravanData?.tbm || caravanData?.tbmCapacity || null,
        gtm: caravanData?.gtm || null,
        atm: caravanData?.atm || null,
      },
      tyreWeigh,
      notes: preWeigh?.notes || '',
      preWeigh: {
        ...(preWeigh || {}),
        axleConfig: preWeigh?.axleConfig || tyreWeigh?.axleConfig || preWeigh?.towedAxleConfig || null,
      },
    };
  };

  const buildTrailerTareWeighbridgePayload = () => {
    const axleWeigh = vehicleData?.diyAxleWeigh || null;
    const header = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: resolvedCustomerData?.fullName || resolvedCustomerData?.name || '',
      location: '',
      caravanRego: caravanData?.rego || caravanData?.numberPlate || '',
      caravanMake: caravanData?.make || '',
      caravanModel: caravanData?.model || '',
    };

    return {
      customBuildTrailerTare: true,
      weighingSelection: 'custom_build_trailer_tare',
      diyWeighingSelection: 'custom_build_trailer_tare',
      header,
      trailerInfo: {
        rego: header.caravanRego,
        make: header.caravanMake,
        model: header.caravanModel,
      },
      capacities: {
        tbm: caravanData?.tbm || caravanData?.tbmCapacity || null,
        gtm: caravanData?.gtm || null,
        atm: caravanData?.atm || null,
      },
      axleWeigh,
      notes: preWeigh?.notes || '',
      preWeigh: {
        ...(preWeigh || {}),
        axleConfig: preWeigh?.axleConfig || preWeigh?.towedAxleConfig || null,
      },
      methodSelection: vehicleOnlyMethodLabel,
    };
  };

  const triggerPdfDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // For the standard flow, generate a compliance preview.
    // For the "payment only" flow (Vehicle Only / Weighbridge Axle),
    // we don't need a preview.
    if (!paymentOnly) {
      generatePreviewReport();
    }
  }, [vehicleData, caravanData, weightsData, paymentOnly]);

  const generatePreviewReport = () => {
    const results = {};
    
    // Map DIYWeightMeasurement output into simple numeric totals
    const combinedTotal = parseFloat(weightsData?.combinedTotal) || 0;
    const vehicleOnlyTotal = parseFloat(weightsData?.vehicleOnlyTotal) || 0;
    const caravanOnlyTotal = parseFloat(weightsData?.caravanOnlyTotal) || 0;
    const towBallWeight = typeof weightsData?.towBallWeight === 'number'
      ? weightsData.towBallWeight
      : (combinedTotal - vehicleOnlyTotal);

    // Add null checks and safe parsing
    if (vehicleData && weightsData && vehicleData.gvm && combinedTotal) {
      // GVM Check (attached combination against vehicle GVM)
      const measured = combinedTotal;
      const limit = parseFloat(vehicleData.gvm) || 0;
      
      results.gvm = {
        status: measured <= limit ? 'PASS' : 'FAIL',
        measured: measured,
        limit: limit,
        overload: Math.max(0, measured - limit)
      };

      // GCM Check  
      const gcmMeasured = measured + caravanOnlyTotal;
      const gcmLimit = parseFloat(vehicleData.gcm) || 0;
      
      results.gcm = {
        status: gcmMeasured <= gcmLimit ? 'PASS' : 'FAIL',
        measured: gcmMeasured,
        limit: gcmLimit,
        overload: Math.max(0, gcmMeasured - gcmLimit)
      };

      // BTC Check - compare caravan weight against towing capacity
      const caravanOnly = caravanOnlyTotal;
      const btcLimit = parseFloat(vehicleData.btc) || 0;
      
      results.btc = {
        status: caravanOnly <= btcLimit ? 'PASS' : 'FAIL',
        measured: caravanOnly,  // Actual caravan weight being towed
        limit: btcLimit,        // Vehicle's maximum towing capacity
        overload: Math.max(0, caravanOnly - btcLimit)
      };
    }

    if (caravanData && weightsData && caravanData.atm && caravanOnlyTotal) {
      // ATM Check - ATM = GTM + TBM
      const caravanOnly = caravanOnlyTotal;
      
      // Calculate measured ATM = GTM + TBM = Caravan Only + TBM
      const measuredATM = caravanOnly + towBallWeight;
      const atmLimit = parseFloat(caravanData.atm) || 0;
      
      results.atm = {
        status: measuredATM <= atmLimit ? 'PASS' : 'FAIL',
        measured: measuredATM,
        limit: atmLimit,
        overload: Math.max(0, measuredATM - atmLimit)
      };
      
      // Also add TBM check for reference
      results.tbm = {
        status: towBallWeight <= (parseFloat(caravanData.atm) * 0.1) ? 'PASS' : 'FAIL',
        measured: towBallWeight,
        limit: parseFloat(caravanData.atm) * 0.1,
        overload: Math.max(0, towBallWeight - (parseFloat(caravanData.atm) * 0.1))
      };
    }

    setPreviewReport(results);
  };

  const handlePaymentSuccess = (paymentResult) => {
    console.log('Payment successful:', paymentResult);
    setPaymentSuccess(true);
    setPaymentDialogOpen(false);
    
    // Call the payment completion handler
    if (onPaymentComplete) {
      onPaymentComplete();
    }

    // For payment-only flows, redirect to the appropriate next screen.
    if (paymentOnly) {
      if (isCustomBuildTrailerTarePortablePaymentOnly) {
        (async () => {
          try {
            const reportPayload = buildTrailerTareReportPayload();

            const pdfRes = await axios.post(
              '/api/weighs/diy-caravan-only-registered/report',
              reportPayload,
              { responseType: 'blob' }
            );
            const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
            triggerPdfDownload(blob, 'trailer-tare-report.pdf');
          } catch (err) {
            console.error('Auto-download trailer tare report failed:', err?.response?.data || err);
            window.alert('Failed to generate PDF. Please try again.');
          }
        })();
        return;
      }

      if (isCustomBuildTrailerTareWeighbridgePaymentOnly) {
        (async () => {
          try {
            const reportPayload = buildTrailerTareWeighbridgePayload();

            const pdfRes = await axios.post(
              '/api/weighs/diy-caravan-only-registered/weighbridge-report',
              reportPayload,
              { responseType: 'blob' }
            );
            const blob = new Blob([pdfRes.data], { type: 'application/pdf' });
            triggerPdfDownload(blob, 'trailer-tare-report.pdf');
          } catch (err) {
            console.error('Auto-download trailer tare report (weighbridge) failed:', err?.response?.data || err);
            window.alert('Failed to generate PDF. Please try again.');
          }
        })();
        return;
      }

      if (weighingSelection === 'caravan_only_registered') {
        navigate('/caravan-only-rego', {
          state: {
            preWeigh,
            axleWeigh: vehicleData?.diyAxleWeigh || null,
            tyreWeigh: vehicleData?.diyTyreWeigh || null,
            methodSelection: vehicleOnlyMethodLabel,
            weighingSelection,
            diyWeighingSelection,
            towSetupType
          }
        });
      } else {
        navigate('/vehicle-only-weighbridge-rego', {
          state: {
            preWeigh,
            axleWeigh: vehicleData?.diyAxleWeigh || null,
            tyreWeigh: vehicleData?.diyTyreWeigh || null,
            methodSelection: vehicleOnlyMethodLabel || 'Weighbridge - In Ground - Individual Axle Weights',
            weighingSelection,
            diyWeighingSelection,
            towSetupType
          }
        });
      }
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error.message || 'Please try again.'}`);
  };


  // PAYMENT-ONLY VIEW (Vehicle Only / Tow Vehicle and Caravan, Weighbridge - In Ground - Individual Axle Weights)
  if (paymentOnly) {
    const methodText = vehicleOnlyMethodLabel || 'Weighbridge - In Ground - Individual Axle Weights';

    let headingText;
    if (weighingSelection === 'tow_vehicle_and_caravan') {
      const setup =
        towSetupType ||
        (diyWeighingSelection === 'tow_vehicle_and_trailer'
          ? 'trailer'
          : diyWeighingSelection === 'tow_vehicle_and_boat'
            ? 'boat'
            : 'caravan');
      headingText =
        setup === 'trailer'
          ? 'Tow Vehicle and Trailer'
          : setup === 'boat'
            ? 'Tow Vehicle and Boat'
            : 'Tow Vehicle and Caravan';
    } else if (weighingSelection === 'caravan_only_registered') {
      headingText = 'Caravan / Trailer Only (registered)';
    } else if (weighingSelection === 'custom_build_trailer_tare') {
      // Custom-build caravan / trailer tare report flow
      headingText = 'Caravan / Trailer Only (Tare Report)';
    } else {
      headingText = 'Vehicle Only';
    }
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {headingText}
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          {methodText}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 4 }}>
          Payment due ${amount}
        </Typography>

        <StripePaymentForm
          amount={amount}
          currency="aud"
          reportData={{
            customerData: resolvedCustomerData,
            vehicleData,
            caravanData,
            weightsData,
            complianceResults: previewReport,
            preWeigh,
            // Flag this as the special Vehicle Only / Weighbridge Axle DIY flow
            flowType:
              weighingSelection === 'custom_build_trailer_tare'
                ? 'TRAILER_TARE_REPORT'
                : 'VEHICLE_ONLY_WEIGHBRIDGE_AXLE'
          }}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      </Box>
    );
  }

  // DEFAULT: Existing preview + payment flow
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
          📊 Report Preview & Payment
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="bold">
            Complete Preview Available - Pay $20 AUD for Full Report
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Below is a summary of your compliance results. Pay to download the detailed PDF report with all measurements and official certification.
          </Typography>
        </Alert>

        {/* Report Preview */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PreviewIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Compliance Results Summary
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {previewReport && Object.keys(previewReport).length > 0 ? (
                Object.entries(previewReport).map(([key, result]) => (
                  <Grid item xs={12} md={6} key={key}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {key.toUpperCase()} Check
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Measured:</strong> {result.measured || 'N/A'} kg
                      </Typography>
                      <Typography variant="body2">
                        <strong>Limit:</strong> {result.limit || 'N/A'} kg
                      </Typography>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body1">
                      Unable to generate report preview. Please ensure all vehicle, caravan, and weight data is properly filled.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>

            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> This is a preview only. Detailed measurements, calculations, and official certification are included in the full report available after payment.
              </Typography>
            </Alert>
          </CardContent>
        </Card>

        {/* Payment Section */}
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <PaymentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Secure Payment - $20 AUD
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Get your detailed PDF compliance report with:
              </Typography>
              <Box sx={{ mt: 2, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
                <Typography variant="body2">• Complete weight measurements and calculations</Typography>
                <Typography variant="body2">• Official compliance certification</Typography>
                <Typography variant="body2">• Downloadable PDF format</Typography>
                <Typography variant="body2">• Saved to your account history</Typography>
                <Typography variant="body2">• Valid for insurance and legal purposes</Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CreditCardIcon />}
                onClick={() => setPaymentDialogOpen(true)}
                sx={{ mr: 2 }}
              >
                Pay Now - $20 AUD
              </Button>
              
              <Alert severity="info" sx={{ mt: 2, maxWidth: 500, mx: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Secure payment processing. Your card details are encrypted and never stored.
                  </Typography>
                </Box>
              </Alert>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stripe Payment Dialog */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <SecurityIcon sx={{ mr: 1, color: 'success.main' }} />
          Secure Payment with Stripe
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <StripePaymentForm
            amount={20}
            currency="aud"
            reportData={{
              customerData: resolvedCustomerData,
              vehicleData,
              caravanData,
              weightsData,
              complianceResults: previewReport,
              preWeigh
            }}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            onClick={() => setPaymentDialogOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
;

export default ReportPreviewAndPayment;
