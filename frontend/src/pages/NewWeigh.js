import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  Payment as PaymentIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStripe } from '../contexts/StripeContext';
import { Elements, CardElement, useStripe as useStripeElements, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { useMutation, useQueryClient } from 'react-query';
import VehicleSelectionFlow from '../components/VehicleSelectionFlow';
import CaravanSelectionFlow from '../components/CaravanSelectionFlow';
import DIYWeightMeasurement from '../components/DIYWeightMeasurement';
import DIYComplianceReport from '../components/DIYComplianceReport';
import CustomerResponsibilityDisclaimer from '../components/CustomerResponsibilityDisclaimer';

// Stripe Card Element styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

// Payment Form Component with Stripe Card Element
const PaymentForm = ({ onPaymentSuccess, onPaymentError, amount }) => {
  const stripe = useStripeElements();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      setLoading(false);
      return;
    }

    try {
      // Create payment intent on server
      const response = await axios.post('/api/payments/create-payment-intent', {
        amount: amount,
        currency: 'aud'
      });

      if (!response.data?.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment with card element
      const { error: stripeError } = await stripe.confirmCardPayment(
        response.data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      onPaymentSuccess();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Payment failed');
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePaymentSubmit}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Payment Details
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Please enter your card details to complete the payment.
        </Typography>
        
        <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
          <CardElement options={cardElementOptions} />
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        <Button
          type="submit"
          variant="contained"
          startIcon={<PaymentIcon />}
          fullWidth
          disabled={loading || !stripe}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={20} /> : `Pay $${amount} for Report`}
        </Button>
      </Box>
    </form>
  );
};

const NewWeigh = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [createdWeighId, setCreatedWeighId] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentAmount, setPaymentAmount] = useState(29.99);
  const [vehiclePlateImage, setVehiclePlateImage] = useState(null);
  const [caravanPlateImage, setCaravanPlateImage] = useState(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { stripe, loading: stripeLoading } = useStripe();
  
  // Debug: Check if Stripe key is loaded
  useEffect(() => {
    console.log('Stripe publishable key:', 'pk_test_51RtkJxQIoLE8hev1341PsYzfvMA601wnHDV2mV2QT9iLIh7V6iZ1WSIsCmzL5CiqDNcmZL8KailgObH0ozdoQS6F009JIHecNx');
    console.log('Stripe instance:', stripe);
  }, [stripe]);

  // Remove global cache clearing to prevent freezing other pages after visiting New Weigh
  // useEffect(() => {
  //   queryClient.clear();
  // }, [queryClient]);

  // Cleanup on unmount: avoid resetting global-like states that can interfere with navigation
  useEffect(() => {
    return () => {
      setDownloadingReport(false);
    };
  }, []);

  // Form data
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleId: '',
    caravanId: '',
    vehicleNumberPlate: '',
    caravanNumberPlate: '',
    weights: {
      frontAxle: '',
      rearAxle: '',
      totalVehicle: '',
      // DIY: Caravan axle groups are not separated on a weigh bridge.
      // We collect a single combined axle-group total as totalCaravan (GTM on axles)
      frontAxleGroup: '',
      rearAxleGroup: '',
      totalCaravan: '',
      grossCombination: '',
      // DIY: TBM is calculated as (vehicle attached) - (vehicle only)
      tbm: '',
      vehicleOnlyFrontAxle: '',
      vehicleOnlyRearAxle: ''
    },
    notes: ''
  });

  // Search results
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [caravanSearch, setCaravanSearch] = useState('');
  const [vehicleResults, setVehicleResults] = useState([]);
  const [caravanResults, setCaravanResults] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedCaravan, setSelectedCaravan] = useState(null);
  const [vehicleNoModsConfirmed, setVehicleNoModsConfirmed] = useState(false);
  const [caravanNoModsConfirmed, setCaravanNoModsConfirmed] = useState(false);

  // Compliance results
  const [complianceResults, setComplianceResults] = useState(null);

  const steps = [
    'Customer Information',
    'Vehicle Selection',
    'Caravan Selection',
    'Weight Measurements',
    'Customer Responsibility',
    'Review & Submit'
  ];

  // Pre-fill customer info from signed-in user (DIY)
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: prev.customerName || user.name || '',
        customerEmail: prev.customerEmail || user.email || '',
        customerPhone: prev.customerPhone || user.phone || ''
      }));
    }
  }, [user]);


  // Search vehicles
  const searchVehicles = async (query) => {
    if (query.length < 2) {
      setVehicleResults([]);
      return;
    }
    
    try {
      console.log('Searching vehicles for:', query);
      const response = await axios.get(`/api/vehicles/search?make=${query}`);
      console.log('Vehicle search response:', response.data);
      setVehicleResults(response.data.vehicles || []);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      setVehicleResults([]);
    }
  };

  // Search caravans
  const searchCaravans = async (query) => {
    if (query.length < 2) {
      setCaravanResults([]);
      return;
    }
    
    try {
      console.log('Searching caravans for:', query);
      const response = await axios.get(`/api/caravans/search?make=${query}`);
      console.log('Caravan search response:', response.data);
      setCaravanResults(response.data.caravans || []);
    } catch (error) {
      console.error('Error searching caravans:', error);
      setCaravanResults([]);
    }
  };

  // Calculate weights per DIY flow
  const calculateWeights = useCallback(() => {
    const weights = formData.weights;
    const frontAxle = parseFloat(weights.frontAxle) || 0;
    const rearAxle = parseFloat(weights.rearAxle) || 0;
    // DIY: caravan axle groups not separated; use totalCaravan as the GTM-on-axles
    const totalCaravanMeasured = parseFloat(weights.totalCaravan) || 0;
    const vehicleOnlyFront = parseFloat(weights.vehicleOnlyFrontAxle) || 0;
    const vehicleOnlyRear = parseFloat(weights.vehicleOnlyRearAxle) || 0;

    const totalVehicle = frontAxle + rearAxle; // attached
    const grossCombination = totalVehicle + totalCaravanMeasured;
    const tbm = totalVehicle - (vehicleOnlyFront + vehicleOnlyRear);

    setFormData(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        totalVehicle: totalVehicle.toFixed(2),
        totalCaravan: totalCaravanMeasured.toFixed(2),
        grossCombination: grossCombination.toFixed(2),
        tbm: isFinite(tbm) ? tbm.toFixed(2) : prev.weights.tbm
      }
    }));
  }, [formData.weights.frontAxle, formData.weights.rearAxle, formData.weights.totalCaravan, formData.weights.vehicleOnlyFrontAxle, formData.weights.vehicleOnlyRearAxle]);

  // Calculate compliance (use combined axle-group total for caravan)
  const calculateCompliance = useCallback(() => {
    if (!selectedVehicle || !selectedCaravan) return;

    const weights = formData.weights;
    const vehicle = selectedVehicle;
    const caravan = selectedCaravan;

    // Vehicle compliance
    const vehicleCompliance = {
      gvm: {
        actual: parseFloat(weights.totalVehicle) || 0,
        limit: vehicle?.gvm || 0,
        compliant: (parseFloat(weights.totalVehicle) || 0) <= (vehicle?.gvm || 0),
        percentage: vehicle?.gvm > 0 ? ((parseFloat(weights.totalVehicle) || 0) / vehicle.gvm * 100).toFixed(1) : '0.0'
      },
      frontAxle: {
        actual: parseFloat(weights.frontAxle) || 0,
        limit: vehicle?.frontAxleCapacity || 0,
        compliant: (parseFloat(weights.frontAxle) || 0) <= (vehicle?.frontAxleCapacity || 0),
        percentage: vehicle?.frontAxleCapacity > 0 ? ((parseFloat(weights.frontAxle) || 0) / vehicle.frontAxleCapacity * 100).toFixed(1) : '0.0'
      },
      rearAxle: {
        actual: parseFloat(weights.rearAxle) || 0,
        limit: vehicle?.rearAxleCapacity || 0,
        compliant: (parseFloat(weights.rearAxle) || 0) <= (vehicle?.rearAxleCapacity || 0),
        percentage: vehicle?.rearAxleCapacity > 0 ? ((parseFloat(weights.rearAxle) || 0) / vehicle.rearAxleCapacity * 100).toFixed(1) : '0.0'
      },
      tbm: {
        actual: parseFloat(weights.tbm) || 0,
        limit: vehicle?.tbm || 0,
        compliant: (parseFloat(weights.tbm) || 0) <= (vehicle?.tbm || 0),
        percentage: vehicle?.tbm > 0 ? ((parseFloat(weights.tbm) || 0) / vehicle.tbm * 100).toFixed(1) : '0.0'
      },
      btc: {
        actual: parseFloat(weights.totalCaravan) || 0,
        limit: vehicle?.btc || 0,
        compliant: (parseFloat(weights.totalCaravan) || 0) <= (vehicle?.btc || 0),
        percentage: vehicle?.btc > 0 ? ((parseFloat(weights.totalCaravan) || 0) / vehicle.btc * 100).toFixed(1) : '0.0'
      }
    };

    // Caravan compliance (DIY: check combined axle-group total vs capacity/GTM)
    const totalCaravanActual = parseFloat(weights.totalCaravan) || 0;
    const caravanCompliance = {
      atm: {
        actual: totalCaravanActual,
        limit: caravan?.atm || 0,
        compliant: totalCaravanActual <= (caravan?.atm || 0),
        percentage: caravan?.atm > 0 ? (totalCaravanActual / caravan.atm * 100).toFixed(1) : '0.0'
      },
      axleGroupTotal: {
        actual: totalCaravanActual,
        // Prefer explicit axle group loading; if absent fall back to GTM
        limit: (caravan?.axleGroupLoading || caravan?.gtm || 0),
        compliant: totalCaravanActual <= (caravan?.axleGroupLoading || caravan?.gtm || 0),
        percentage: (caravan?.axleGroupLoading || caravan?.gtm || 0) > 0 ? (totalCaravanActual / (caravan?.axleGroupLoading || caravan?.gtm) * 100).toFixed(1) : '0.0'
      }
    };

    // Combination compliance
    const combinationCompliance = {
      gcm: {
        actual: parseFloat(weights.grossCombination) || 0,
        limit: vehicle?.gcm || 0,
        compliant: (parseFloat(weights.grossCombination) || 0) <= (vehicle?.gcm || 0),
        percentage: vehicle?.gcm > 0 ? ((parseFloat(weights.grossCombination) || 0) / vehicle.gcm * 100).toFixed(1) : '0.0'
      }
    };

    // Calculate overall compliance - only check if all required fields are present
    const overallCompliant = 
      vehicleCompliance.gvm.compliant && 
      vehicleCompliance.frontAxle.compliant && 
      vehicleCompliance.rearAxle.compliant &&
      vehicleCompliance.tbm.compliant &&
      vehicleCompliance.btc.compliant &&
      caravanCompliance.atm.compliant &&
      // DIY: use combined axle-group total if capacity is known
      (caravan?.axleGroupLoading || caravan?.gtm ? caravanCompliance.axleGroupTotal.compliant : true) &&
      combinationCompliance.gcm.compliant;

    setComplianceResults({
      vehicle: vehicleCompliance,
      caravan: caravanCompliance,
      combination: combinationCompliance,
      overallCompliant
    });
  }, [selectedVehicle, selectedCaravan, formData.weights]);



  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWeightChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [field]: value
      }
    }));
  };

  // Handle step navigation
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

     const handleReset = () => {
     setActiveStep(0);
     setFormData({
       customerName: '',
       customerPhone: '',
       customerEmail: '',
       vehicleId: '',
       caravanId: '',
       vehicleNumberPlate: '',
       caravanNumberPlate: '',
       weights: {
         frontAxle: '',
         rearAxle: '',
         totalVehicle: '',
         frontAxleGroup: '',
         rearAxleGroup: '',
         totalCaravan: '',
         grossCombination: ''
       },
       notes: ''
     });
     setSelectedVehicle(null);
     setSelectedCaravan(null);
     setComplianceResults(null);
   };

  // Handle download report
  const handleDownloadReport = async () => {
    if (!createdWeighId) {
      setError('No weigh entry found to download');
      return;
    }

    try {
      setDownloadingReport(true);
      setError('');
      const { data } = await axios.get(`/api/weighs/${createdWeighId}`);
      const weigh = data?.weigh;
      if (!weigh) throw new Error('Weigh data not found');

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
      const statusText = (measured, limit) => measured <= limit ? 'OK' : 'OVER';
      const statusColor = (measured, limit) => measured <= limit ? green : red;

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

      doc.save(`weigh-report-${createdWeighId}.pdf`);
      setSuccess('Report downloaded successfully!');
    } catch (error) {
      setError('Error downloading report. Please try again from the Weigh History page.');
    } finally {
      setDownloadingReport(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (clientPayment) => {
    console.log('🔍 handleSubmit called with clientPayment:', clientPayment);
    try {
      setLoading(true);
      setError('');

      // Validate required selections
      console.log('🔍 Validation checks:');
      console.log('selectedVehicle:', selectedVehicle);
      console.log('selectedCaravan:', selectedCaravan);
      console.log('vehicleNumberPlate:', formData.vehicleNumberPlate);
      console.log('caravanNumberPlate:', formData.caravanNumberPlate);
      console.log('vehicleNoModsConfirmed:', vehicleNoModsConfirmed);
      console.log('caravanNoModsConfirmed:', caravanNoModsConfirmed);
      console.log('disclaimerAccepted:', disclaimerAccepted);

      if (!selectedVehicle) {
        console.log('❌ Validation failed: No vehicle selected');
        setError('Please select a vehicle');
        return;
      }

      if (!selectedCaravan) {
        console.log('❌ Validation failed: No caravan selected');
        setError('Please select a caravan');
        return;
      }

      if (!formData.vehicleNumberPlate || !formData.caravanNumberPlate) {
        console.log('❌ Validation failed: Missing number plates');
        setError('Please enter both vehicle and caravan number plates');
        return;
      }

      if (!vehicleNoModsConfirmed || !caravanNoModsConfirmed) {
        console.log('❌ Validation failed: Modifications not confirmed');
        setError('Please confirm no modifications for both vehicle and caravan');
        return;
      }

      if (!disclaimerAccepted) {
        console.log('❌ Validation failed: Disclaimer not accepted');
        setError('Please accept the disclaimer to proceed');
        return;
      }

      console.log('✅ All validations passed');

      // Construct weigh data without circular references
      const weighData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        vehicleId: selectedVehicle._id,
        caravanId: selectedCaravan._id,
        vehicleNumberPlate: formData.vehicleNumberPlate,
        caravanNumberPlate: formData.caravanNumberPlate,
        weights: {
          frontAxle: parseFloat(formData.weights.frontAxle) || 0,
          rearAxle: parseFloat(formData.weights.rearAxle) || 0,
          totalVehicle: parseFloat(formData.weights.totalVehicle) || 0,
          // DIY: front/rear axle group not collected; send zeros
          frontAxleGroup: 0,
          rearAxleGroup: 0,
          totalCaravan: parseFloat(formData.weights.totalCaravan) || 0,
          grossCombination: parseFloat(formData.weights.grossCombination) || 0,
          tbm: parseFloat(formData.weights.tbm) || 0
        },
        notes: formData.notes,
        ...(clientPayment ? { payment: clientPayment } : {})
      };

      console.log('Submitting weigh data:', JSON.stringify(weighData, null, 2));
      console.log('📤 Making API call to /api/weighs...');

      const response = await axios.post('/api/weighs', weighData);

      if (response.data.success) {
        console.log('✅ Weigh entry created successfully!');
        console.log('Weigh ID:', response.data.weigh._id);
        setSuccess('Weigh entry created successfully! Click "Download Report" to get your compliance report.');
        setPaymentCompleted(true);
        setCreatedWeighId(response.data.weigh._id); // Store the weigh ID
        
        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          vehicleId: '',
          caravanId: '',
          vehicleNumberPlate: '',
          caravanNumberPlate: '',
          weights: {
            frontAxle: '',
            rearAxle: '',
            totalVehicle: '',
            totalCaravan: '',
            grossCombination: '',
            tbm: '',
            vehicleOnlyFrontAxle: '',
            vehicleOnlyRearAxle: ''
          },
          notes: ''
        });
        
        // Reset selections
        setSelectedVehicle(null);
        setSelectedCaravan(null);
        setVehicleNoModsConfirmed(false);
        setCaravanNoModsConfirmed(false);
        setVehicleSearch('');
        setCaravanSearch('');
        setVehicleResults([]);
        setCaravanResults([]);
        
        // Navigate to weigh history after a short delay
        setTimeout(() => {
          navigate('/weigh-history');
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating weigh entry:', error);
      setError(error.response?.data?.message || 'Error creating weigh entry');
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate weights when weight fields change
  useEffect(() => {
    calculateWeights();
  }, [calculateWeights]);

  // Calculate compliance when weights or selections change
  useEffect(() => {
    if (selectedVehicle && selectedCaravan && formData.weights.grossCombination) {
      calculateCompliance();
    }
  }, [calculateCompliance, selectedVehicle, selectedCaravan, formData.weights.grossCombination]);

  // Debounced search for vehicles
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (vehicleSearch.length >= 2) {
        searchVehicles(vehicleSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [vehicleSearch]);

  // Debounced search for caravans
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (caravanSearch.length >= 2) {
        searchCaravans(caravanSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [caravanSearch]);

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom>
          New Weigh Entry
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Create a new weigh entry for vehicle and caravan compliance checking
        </Typography>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mt: 3, p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step}>
              <StepLabel>{step}</StepLabel>
              <StepContent>
                <Box sx={{ mb: 2 }}>
                  {index === 0 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Customer Name"
                          value={formData.customerName}
                          onChange={(e) => handleFormChange('customerName', e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Customer Phone"
                          value={formData.customerPhone}
                          onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Customer Email"
                          type="email"
                          value={formData.customerEmail}
                          onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  )}

                                     {index === 1 && (
                     <Box>
                        <TextField
                          fullWidth
                          label="Vehicle Number Plate"
                          value={formData.vehicleNumberPlate}
                          onChange={async (e) => {
                            const plate = e.target.value.toUpperCase();
                            handleFormChange('vehicleNumberPlate', plate);
                            // Attempt auto-fill by plate when length >= 3
                            if (plate && plate.length >= 3) {
                              try {
                                const resp = await axios.get(`/api/vehicles/by-plate/${encodeURIComponent(plate)}`);
                                if (resp.data?.success) {
                                  setSelectedVehicle(resp.data.vehicle);
                                }
                              } catch (err) {
                                // silent if not found
                              }
                            }
                          }}
                          placeholder="Enter vehicle number plate"
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Search Vehicles"
                          value={vehicleSearch}
                          onChange={(e) => {
                            setVehicleSearch(e.target.value);
                          }}
                          placeholder="Search by make, model, or year..."
                          InputProps={{
                            endAdornment: <SearchIcon />
                          }}
                        />
                       
                       {vehicleResults.length > 0 && (
                         <Box sx={{ mt: 2 }}>
                           {vehicleResults.map((vehicle) => (
                             <Card 
                               key={vehicle?._id} 
                               sx={{ 
                                 mb: 1, 
                                 cursor: 'pointer',
                                 border: selectedVehicle?._id === vehicle._id ? 2 : 1,
                                 borderColor: selectedVehicle?._id === vehicle._id ? 'primary.main' : 'divider'
                               }}
                               onClick={() => setSelectedVehicle(vehicle)}
                             >
                               <CardContent>
                                                                 <Typography variant="h6">
                                  {vehicle?.make} {vehicle?.model} ({vehicle?.year})
                                </Typography>
                                                                 <Typography variant="body2" color="text.secondary">
                                  GVM: {vehicle?.gvm}kg | GCM: {vehicle?.gcm}kg | TBM: {vehicle?.tbm}kg | BTC: {vehicle?.btc}kg
                                </Typography>
                               </CardContent>
                             </Card>
                           ))}
                         </Box>
                       )}
                       

                        {selectedVehicle && (
                          <Box sx={{ mt: 2 }}>
                            {/* Selected Vehicle Details Card */}
                            <Card sx={{ mb: 2, border: '2px solid', borderColor: 'primary.main' }}>
                              <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                  Selected Vehicle Details
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1">
                                      {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Number Plate: {formData.vehicleNumberPlate}
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>Compliance Limits:</strong>
                                    </Typography>
                                    <Typography variant="body2">
                                      GVM: {selectedVehicle.gvm || 'N/A'}kg | GCM: {selectedVehicle.gcm || 'N/A'}kg
                                    </Typography>
                                    <Typography variant="body2">
                                      TBM: {selectedVehicle.tbm || 'N/A'}kg | BTC: {selectedVehicle.btc || 'N/A'}kg
                                    </Typography>
                                    <Typography variant="body2">
                                      Front Axle: {selectedVehicle.frontAxleCapacity || 'N/A'}kg | Rear Axle: {selectedVehicle.rearAxleCapacity || 'N/A'}kg
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                            
                            {/* Modifications Confirmation Checkbox */}
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={vehicleNoModsConfirmed}
                                onChange={(e) => setVehicleNoModsConfirmed(e.target.checked)}
                              />
                            }
                            sx={{ mt: 1 }}
                            label="I confirm there have been no modifications to the vehicle's compliance specs (or I have updated them)."
                          />
                          </Box>
                        )}

                      {!selectedVehicle && formData.vehicleNumberPlate && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>Vehicle Details (manual entry)</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}><TextField fullWidth label="Make" value={formData.make||''} onChange={(e)=>handleFormChange('make',e.target.value)} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="Model" value={formData.model||''} onChange={(e)=>handleFormChange('model',e.target.value)} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="Series" value={formData.series||''} onChange={(e)=>handleFormChange('series',e.target.value)} /></Grid>
                            <Grid item xs={12} md={3}><TextField fullWidth label="Year" value={formData.year||''} onChange={(e)=>handleFormChange('year',e.target.value)} /></Grid>
                            <Grid item xs={12} md={3}><TextField fullWidth label="Variant" value={formData.variant||''} onChange={(e)=>handleFormChange('variant',e.target.value)} /></Grid>
                            <Grid item xs={12} md={3}><TextField fullWidth label="Engine" value={formData.engine||''} onChange={(e)=>handleFormChange('engine',e.target.value)} /></Grid>
                            <Grid item xs={12} md={3}><TextField fullWidth label="Transmission" value={formData.transmission||''} onChange={(e)=>handleFormChange('transmission',e.target.value)} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="Tyre Size" value={formData.tyreSize||''} onChange={(e)=>handleFormChange('tyreSize',e.target.value)} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="Sub Tank (Yes/No)" value={(formData.subTank?'Yes':'No')} onChange={(e)=>handleFormChange('subTank',/^y/i.test(e.target.value))} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="Brakes" value={formData.brakes||''} onChange={(e)=>handleFormChange('brakes',e.target.value)} /></Grid>
                          </Grid>
                          <Alert severity="info" sx={{ mt: 2 }}>Please verify these details against your compliance plate/manual.</Alert>
                        </Box>
                      )}
                     </Box>
                   )}

                                     {index === 2 && (
                     <Box>
                        <Grid container spacing={2} sx={{ mb: 1 }}>
                          <Grid item xs={12} md={8}>
                            <TextField
                              fullWidth
                              label="Caravan/Trailer Number Plate"
                              value={formData.caravanNumberPlate}
                              onChange={async (e) => {
                                const plate = e.target.value.toUpperCase();
                                handleFormChange('caravanNumberPlate', plate);
                                if (plate && plate.length >= 3) {
                                  try {
                                    const resp = await axios.get(`/api/caravans/by-plate/${encodeURIComponent(plate)}`, { params: { state: formData.registrationState } });
                                    if (resp.data?.success) {
                                      setSelectedCaravan(resp.data.caravan);
                                    }
                                  } catch (err) {
                                    // silent if not found
                                  }
                                }
                              }}
                              placeholder="Enter caravan/trailer plate"
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="State"
                              value={formData.registrationState || ''}
                              onChange={(e) => handleFormChange('registrationState', e.target.value.toUpperCase())}
                              placeholder="e.g., NSW, VIC"
                            />
                          </Grid>
                        </Grid>
                        <TextField
                          fullWidth
                          label="Search Caravans"
                          value={caravanSearch}
                          onChange={(e) => {
                            setCaravanSearch(e.target.value);
                          }}
                          placeholder="Search by make, model, or year..."
                          InputProps={{
                            endAdornment: <SearchIcon />
                          }}
                        />
                       
                       {caravanResults.length > 0 && (
                         <Box sx={{ mt: 2 }}>
                           {caravanResults.map((caravan) => (
                             <Card 
                               key={caravan._id} 
                               sx={{ 
                                 mb: 1, 
                                 cursor: 'pointer',
                                 border: selectedCaravan?._id === caravan._id ? 2 : 1,
                                 borderColor: selectedCaravan?._id === caravan._id ? 'primary.main' : 'divider'
                               }}
                               onClick={() => setSelectedCaravan(caravan)}
                             >
                               <CardContent>
                                 <Typography variant="h6">
                                   {caravan.make} {caravan.model} ({caravan.year})
                                 </Typography>
                                 <Typography variant="body2" color="text.secondary">
                                   ATM: {caravan.atm}kg | GTM: {caravan.gtm}kg
                                 </Typography>
                               </CardContent>
                             </Card>
                           ))}
                         </Box>
                       )}
                       
                        {selectedCaravan && (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={caravanNoModsConfirmed}
                                onChange={(e) => setCaravanNoModsConfirmed(e.target.checked)}
                              />
                            }
                            sx={{ mt: 1 }}
                            label="I confirm there have been no modifications to the caravan/trailer compliance specs (or I have updated them)."
                          />
                        )}

                      {!selectedCaravan && formData.caravanNumberPlate && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>Caravan/Trailer Details (manual entry)</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}><TextField fullWidth label="Make" value={formData.cMake||''} onChange={(e)=>handleFormChange('cMake',e.target.value)} /></Grid>
                            <Grid item xs={12} md={6}><TextField fullWidth label="Model" value={formData.cModel||''} onChange={(e)=>handleFormChange('cModel',e.target.value)} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="ATM" value={formData.cAtm||''} onChange={(e)=>handleFormChange('cAtm',e.target.value)} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="GTM" value={formData.cGtm||''} onChange={(e)=>handleFormChange('cGtm',e.target.value)} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="Axle Load Capacity" value={formData.cAxleLoad||''} onChange={(e)=>handleFormChange('cAxleLoad',e.target.value)} /></Grid>
                            <Grid item xs={12} md={4}><TextField fullWidth label="Number of Axles" value={formData.cAxles||''} onChange={(e)=>handleFormChange('cAxles',e.target.value)} /></Grid>
                          </Grid>
                          <Alert severity="info" sx={{ mt: 2 }}>Enter details from the compliance plate. You can upload a photo in the review step.</Alert>
                        </Box>
                      )}
                     </Box>
                   )}

                  {index === 3 && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                          Vehicle Weights (kg)
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Front Axle"
                          type="number"
                          value={formData.weights.frontAxle}
                          onChange={(e) => handleWeightChange('frontAxle', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Rear Axle"
                          type="number"
                          value={formData.weights.rearAxle}
                          onChange={(e) => handleWeightChange('rearAxle', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Total Vehicle Weight"
                          type="number"
                          value={formData.weights.totalVehicle}
                          InputProps={{
                            readOnly: true,
                            endAdornment: <Typography variant="caption">kg</Typography>
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Caravan/Trailer Weights (kg)
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Caravan Axle Group Total (on axles)"
                          type="number"
                          value={formData.weights.totalCaravan}
                          onChange={(e) => handleWeightChange('totalCaravan', e.target.value)}
                          helperText="DIY: Single reading on the caravan/trailer axle group (GTM on axles)"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Disconnect Caravan – Vehicle Only (kg)
                        </Typography>
                      </Grid>
                       <Grid item xs={12} md={6}>
                         <TextField
                           fullWidth
                           label="Vehicle Only – Front Axle"
                           type="number"
                           value={formData.weights.vehicleOnlyFrontAxle}
                           onChange={(e) => handleWeightChange('vehicleOnlyFrontAxle', e.target.value)}
                           InputProps={{
                             endAdornment: <Typography variant="caption">kg</Typography>
                           }}
                         />
                       </Grid>
                       <Grid item xs={12} md={6}>
                         <TextField
                           fullWidth
                           label="Vehicle Only – Rear Axle"
                           type="number"
                           value={formData.weights.vehicleOnlyRearAxle}
                           onChange={(e) => handleWeightChange('vehicleOnlyRearAxle', e.target.value)}
                           InputProps={{
                             endAdornment: <Typography variant="caption">kg</Typography>
                           }}
                         />
                       </Grid>
                       <Grid item xs={12}>
                         <TextField
                           fullWidth
                           label="Gross Combination Weight"
                           type="number"
                           value={formData.weights.grossCombination}
                           InputProps={{
                             readOnly: true,
                             endAdornment: <Typography variant="caption">kg</Typography>
                           }}
                         />
                       </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Tow Ball Mass (TBM)
                        </Typography>
                      </Grid>
                      
                       <Grid item xs={12}>
                         <TextField
                           fullWidth
                           label="Tow Ball Mass (auto-calculated)"
                           type="number"
                           value={formData.weights.tbm}
                           InputProps={{
                             readOnly: true,
                             endAdornment: <Typography variant="caption">kg</Typography>
                           }}
                           helperText="Calculated as (Vehicle attached) − (Vehicle only)"
                         />
                       </Grid>
                    </Grid>
                  )}

                  {index === 4 && (
                    <Box>
                      {/* Selected Vehicle and Caravan Summary */}
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Selected Equipment
                          </Typography>
                                                     <Grid container spacing={2}>
                             <Grid item xs={12} md={6}>
                               <Typography variant="subtitle1">
                                 Vehicle: {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.year})
                               </Typography>
                               <Typography variant="body2" color="text.secondary">
                                 Number Plate: {formData.vehicleNumberPlate}
                               </Typography>
                             </Grid>
                             <Grid item xs={12} md={6}>
                               <Typography variant="subtitle1">
                                 Caravan: {selectedCaravan?.make} {selectedCaravan?.model} ({selectedCaravan?.year})
                               </Typography>
                               <Typography variant="body2" color="text.secondary">
                                 Number Plate: {formData.caravanNumberPlate}
                               </Typography>
                             </Grid>
                           </Grid>
                        </CardContent>
                      </Card>

                       {/* Compliance Results */}
                      {complianceResults && (
                        <Card sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6">
                                Compliance Results
                              </Typography>
                              <Chip
                                label={complianceResults.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                                color={complianceResults.overallCompliant ? 'success' : 'error'}
                                sx={{ ml: 2 }}
                              />
                            </Box>

                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Vehicle Compliance
                                </Typography>
                                {Object.entries(complianceResults.vehicle).map(([key, value]) => (
                                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">
                                      {key === 'gvm' ? 'GVM' : 
                                       key === 'frontAxle' ? 'Front Axle' : 
                                       key === 'rearAxle' ? 'Rear Axle' :
                                       key === 'tbm' ? 'TBM' :
                                       key === 'btc' ? 'BTC' : key}:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="body2" sx={{ mr: 1 }}>
                                        {value.actual}kg / {value.limit}kg ({value.percentage}%)
                                      </Typography>
                                      {value.compliant ? (
                                        <CheckCircleIcon color="success" fontSize="small" />
                                      ) : (
                                        <ErrorIcon color="error" fontSize="small" />
                                      )}
                                    </Box>
                                  </Box>
                                ))}
                              </Grid>

                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Caravan Compliance
                                </Typography>
                                 {Object.entries(complianceResults.caravan).map(([key, value]) => (
                                   <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                     <Typography variant="body2">
                                        {key === 'atm' ? 'ATM' : key === 'axleGroupTotal' ? 'Axle Group Total' : key}:
                                     </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="body2" sx={{ mr: 1 }}>
                                        {value.actual}kg / {value.limit}kg ({value.percentage}%)
                                      </Typography>
                                      {value.compliant ? (
                                        <CheckCircleIcon color="success" fontSize="small" />
                                      ) : (
                                        <ErrorIcon color="error" fontSize="small" />
                                      )}
                                    </Box>
                                  </Box>
                                ))}
                              </Grid>

                              <Grid item xs={12}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Combination Compliance
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">
                                    GCM:
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                      {complianceResults.combination.gcm.actual}kg / {complianceResults.combination.gcm.limit}kg ({complianceResults.combination.gcm.percentage}%)
                                    </Typography>
                                    {complianceResults.combination.gcm.compliant ? (
                                      <CheckCircleIcon color="success" fontSize="small" />
                                    ) : (
                                      <ErrorIcon color="error" fontSize="small" />
                                    )}
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                           </CardContent>
                         </Card>
                      )}

                       {/* Image Uploads */}
                       <Card sx={{ mb: 2 }}>
                         <CardContent>
                           <Typography variant="h6" gutterBottom>Upload Images (Compliance plates/manuals)</Typography>
                           <Grid container spacing={2}>
                             <Grid item xs={12} md={6}>
                               <Button variant="outlined" component="label" fullWidth>
                                 Upload Vehicle Image
                                 <input hidden type="file" accept="image/*,application/pdf" onChange={async (e)=>{
                                   const file=e.target.files?.[0];
                                   if(!file) return;
                                   const fd=new FormData();
                                   fd.append('file',file);
                                   try{
                                     const resp=await axios.post('/api/uploads/compliance',fd,{ headers:{ 'Content-Type':'multipart/form-data' }});
                                     if(resp.data?.url) setVehiclePlateImage(resp.data.url);
                                   }catch(err){ setError('Vehicle image upload failed'); }
                                 }} />
                               </Button>
                               {vehiclePlateImage && <Typography variant="caption" sx={{ display:'block', mt:1 }}>Uploaded: {vehiclePlateImage}</Typography>}
                             </Grid>
                             <Grid item xs={12} md={6}>
                               <Button variant="outlined" component="label" fullWidth>
                                 Upload Caravan Image
                                 <input hidden type="file" accept="image/*,application/pdf" onChange={async (e)=>{
                                   const file=e.target.files?.[0];
                                   if(!file) return;
                                   const fd=new FormData();
                                   fd.append('file',file);
                                   try{
                                     const resp=await axios.post('/api/uploads/compliance',fd,{ headers:{ 'Content-Type':'multipart/form-data' }});
                                     if(resp.data?.url) setCaravanPlateImage(resp.data.url);
                                   }catch(err){ setError('Caravan image upload failed'); }
                                 }} />
                               </Button>
                               {caravanPlateImage && <Typography variant="caption" sx={{ display:'block', mt:1 }}>Uploaded: {caravanPlateImage}</Typography>}
                             </Grid>
                           </Grid>
                         </CardContent>
                       </Card>

                       {/* Disclaimer Section */}
                       <Box sx={{ mt: 3, mb: 3 }}>
                         <Typography variant="h6" gutterBottom>
                           Disclaimer & Terms
                         </Typography>
                         <CustomerResponsibilityDisclaimer 
                           onDisclaimerAccepted={(accepted) => setDisclaimerAccepted(accepted)}
                         />
                       </Box>

                       {/* Payment Integration */}
                       {disclaimerAccepted && (
                         <Box sx={{ mt: 3 }}>
                         {stripeLoading && (
                           <Alert severity="info" sx={{ mb: 2 }}>
                             Loading payment system...
                           </Alert>
                         )}
                         
                          {!paymentCompleted ? (
                            <>
                              <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={12} md={6}>
                                  <FormControl fullWidth>
                                    <InputLabel>Payment Method</InputLabel>
                                    <Select
                                      label="Payment Method"
                                      value={paymentMethod}
                                      onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                      <MenuItem value="card">Card (Stripe)</MenuItem>
                                      <MenuItem value="cash">Cash</MenuItem>
                                      <MenuItem value="direct">Direct Transfer</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Amount (AUD)"
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                                  />
                                </Grid>
                              </Grid>

                              {paymentMethod === 'card' ? (
                                <Elements stripe={stripe}>
                                  <PaymentForm
                                    amount={paymentAmount}
                                    onPaymentSuccess={async () => {
                                      try {
                                        setPaymentCompleted(true);
                                        setSuccess('Payment completed successfully! Submitting weigh entry...');
                                        setTimeout(() => {
                                          handleSubmit({ method: 'card', status: 'completed', amount: paymentAmount });
                                        }, 600);
                                      } catch (error) {
                                        console.error('Error in payment success callback:', error);
                                        setError('Error processing payment success');
                                      }
                                    }}
                                    onPaymentError={(error) => {
                                      setError(error.message || 'Payment failed');
                                    }}
                                  />
                                </Elements>
                              ) : (
                                <>
                                  <Alert severity="info" sx={{ mb: 2 }}>
                                    Selected {paymentMethod.toUpperCase()} payment. Click "Confirm & Save" to record this weigh.
                                  </Alert>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleSubmit({ method: paymentMethod, status: 'completed', amount: paymentAmount })}
                                    disabled={loading}
                                  >
                                    {loading ? <CircularProgress size={20} /> : 'Confirm & Save'}
                                  </Button>
                                </>
                              )}
                            </>
                          ) : (
                           <Alert severity="success" sx={{ mt: 2 }}>
                             Payment completed! Your weigh entry has been saved.
                           </Alert>
                         )}
                       </Box>
                       )}

                      {/* Notes */}
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => handleFormChange('notes', e.target.value)}
                        placeholder="Add any additional notes..."
                      />
                    </Box>
                  )}

                  <Box sx={{ mb: 2, mt: 2 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={index === steps.length - 1 ? (paymentCompleted ? handleDownloadReport : () => {}) : handleNext}
                        disabled={
                          loading || 
                          downloadingReport || 
                          (index === steps.length - 1 && (!paymentCompleted || !createdWeighId)) ||
                          (index === 4 && !disclaimerAccepted)
                        }
                        sx={{ mr: 1 }}
                        startIcon={loading || downloadingReport ? <CircularProgress size={20} /> : index === steps.length - 1 ? (paymentCompleted ? <DownloadIcon /> : <SaveIcon />) : null}
                      >
                        {index === steps.length - 1 ? (paymentCompleted ? (createdWeighId ? (downloadingReport ? 'Downloading...' : 'Download Report') : 'Processing...') : (disclaimerAccepted ? 'Complete Payment First' : 'Accept Disclaimer First')) : 'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleReset}
                        startIcon={<ClearIcon />}
                      >
                        Reset
                      </Button>
                    </div>
                  </Box>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};

export default NewWeigh;