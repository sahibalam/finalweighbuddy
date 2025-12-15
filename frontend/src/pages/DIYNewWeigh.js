import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Container,
  useTheme,
  Alert,
  Grid,
  Card,
  CardContent,
  Backdrop,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import axios from 'axios';

// Components
import WeighingMethodSelection from '../components/WeighingMethodSelection';
import VehicleRegistration from '../components/VehicleRegistration';
import DIYWeightMeasurement from '../components/DIYWeightMeasurement';
import DIYComplianceReport from '../components/DIYComplianceReport';
import ReportPreviewAndPayment from '../components/ReportPreviewAndPayment';
import CustomerResponsibilityDisclaimer from '../components/CustomerResponsibilityDisclaimer';

const DIYNewWeigh = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const startAtPayment = !!location.state?.startAtPayment;
  const vehicleOnlyMethodLabel = location.state?.methodSelection || '';
  const weighingSelection = location.state?.weighingSelection || '';

  /* -------------------- STATE -------------------- */
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Weighing method state
  const [weighingMethod, setWeighingMethod] = useState({
    method: '', // 'portable' or 'weighbridge'
    weighbridgeType: '', // 'in-ground', 'on-weigh', 'above-ground'
    portableType: 'individual' // 'individual' or 'axle'
  });

  // Vehicle and caravan data
  const [vehicleData, setVehicleData] = useState({
    registration: '',
    state: 'NSW',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    tare: '',
    gvm: '',
    gcm: '',
    gtm: '',
    axleGroups: [],
    images: []
  });

  const [caravanData, setCaravanData] = useState({
    hasCaravan: false,
    registration: '',
    state: 'NSW',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    atm: '',
    gtm: '',
    ballWeight: '',
    axleGroups: [],
    images: []
  });

  // Weight measurements
  const [weightsData, setWeightsData] = useState({});

  // Compliance results
  const [complianceData, setComplianceData] = useState({
    isCompliant: false,
    vehicle: {
      isCompliant: false,
      gvmCompliant: false,
      axleGroupCompliant: false
    },
    combination: {
      isCompliant: false,
      gcmCompliant: false,
      towRatingCompliant: false,
      towBallWeightCompliant: false
    },
    caravan: {
      isCompliant: false,
      atmCompliant: false,
      ballWeightCompliant: false
    },
    warnings: [],
    recommendations: []
  });

  // Report and payment
  const [reportPreview] = useState(null);
  const [createdWeighId, setCreatedWeighId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending', 'processing', 'completed', 'failed'
  const [preWeigh, setPreWeigh] = useState(null);
  const [axleWeigh, setAxleWeigh] = useState(null); // DIY Vehicle Only Weighbridge Axle screen values
  const [tyreWeigh, setTyreWeigh] = useState(null); // DIY Vehicle Only Portable Scales 4-tyre values

  useEffect(() => {
    if (location.state) {
      if (location.state.preWeigh) {
        setPreWeigh(location.state.preWeigh);
      }
      if (location.state.axleWeigh) {
        setAxleWeigh(location.state.axleWeigh);
      }
      if (location.state.tyreWeigh) {
        setTyreWeigh(location.state.tyreWeigh);
      }

      // If coming from the Vehicle Only Weighbridge Axle screen with a request
      // to start directly at the payment step, jump the stepper to the
      // "Report & Payment" step (currently the last step in the flow).
      if (location.state.startAtPayment) {
        setActiveStep(5);
      }
    }
  }, [location.state]);

  /* -------------------- HELPER FUNCTIONS -------------------- */
  const isStepValid = (stepIndex) => {
    switch(stepIndex) {
      case 0: // Weighing Method
        return !!weighingMethod.method && 
               (weighingMethod.method !== 'weighbridge' || !!weighingMethod.weighbridgeType);
      case 1: // Vehicle Details
        return true;
      case 2: // Caravan Details (skippable)
        return !caravanData.hasCaravan || 
               (!!caravanData.registration && 
                !!caravanData.make && 
                !!caravanData.model);
      case 3: // Weight Measurement
        return true;
      case 4: // Compliance Check
        return true; // Always allow proceeding from compliance check
      case 5: // Report & Payment
        return paymentStatus === 'completed' || !!reportPreview;
      default:
        return true;
    }
  };

  const calculateCompliance = () => {
    // This is a simplified version - in a real app, this would involve more complex calculations
    const newComplianceData = {
      isCompliant: true,
      vehicle: {
        isCompliant: true,
        gvmCompliant: true,
        axleGroupCompliant: true
      },
      combination: {
        isCompliant: true,
        gcmCompliant: true,
        towRatingCompliant: true,
        towBallWeightCompliant: true
      },
      caravan: {
        isCompliant: !caravanData.hasCaravan || true,
        atmCompliant: !caravanData.hasCaravan || true,
        ballWeightCompliant: !caravanData.hasCaravan || true
      },
      warnings: [],
      recommendations: []
    };
    
    // Add your compliance logic here based on the weights and vehicle specs
    
    setComplianceData(newComplianceData);
    return newComplianceData;
  };

  /* -------------------- HANDLERS -------------------- */
  const handleWeighingMethodSelect = (data) => {
    setWeighingMethod(data);
    handleNext();
  };

  const handleVehicleDataSave = (data) => {
    console.log('handleVehicleDataSave called with:', data);
    setVehicleData(data);
    handleNext();
  };
  
  const handleCaravanDataSave = (data) => {
    if (data) {
      setCaravanData({ ...data, hasCaravan: true });
    } else {
      setCaravanData({ ...caravanData, hasCaravan: false });
    }
    handleNext();
  };

  const handleWeightsSave = (data) => {
    setWeightsData(data);
    handleNext();
  };
  
  const handleGenerateReport = async () => {
    // Compliance preview is handled inside ReportPreviewAndPayment.
    // Here we just ensure the latest compliance data is available.
    calculateCompliance();
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      
      if (!createdWeighId) {
        setError('No completed report found. Please finish payment first.');
        return;
      }

      // Download the real PDF report from backend
      const response = await axios.get(`/api/weighs/${createdWeighId}/report`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weighbuddy-report-${createdWeighId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (result) => {
    // result comes from StripePaymentForm: { transactionId, reportId }
    if (result?.reportId) {
      setCreatedWeighId(result.reportId);
    }
    setPaymentStatus('completed');
    setError('');
  };
  
  const handleExit = () => {
    if (activeStep > 0) {
      setShowExitConfirm(true);
    } else {
      navigate('/dashboard');
    }
  };
  
  const confirmExit = () => {
    setShowExitConfirm(false);
    navigate('/dashboard');
  };
  
  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  /* -------------------- NAVIGATION -------------------- */
  const handleNext = () => {
    console.log('handleNext called, activeStep:', activeStep, 'isStepValid:', isStepValid(activeStep));

    if (!isStepValid(activeStep)) {
      console.log('Step validation failed');
      setError('Please complete all required fields before proceeding.');
      return;
    }

    console.log('Step is valid, proceeding to next step');

    // Determine the current logical step from the full steps array
    const currentStepIndexInSteps = activeStep;
    const currentStepDef = steps[currentStepIndexInSteps];

    // If leaving the Weight Measurement step, calculate compliance first
    if (currentStepDef?.label === 'Weight Measurement') {
      calculateCompliance();
    }

    // If leaving the Compliance Check step, generate the report preview
    if (currentStepDef?.label === 'Compliance Check') {
      handleGenerateReport();
    }

    // Build the list of non-skipped steps
    const activeSteps = steps.filter(step => !step.skip);

    // Find current index within non-skipped steps
    const currentIndexInActive = activeSteps.findIndex(step => step === currentStepDef);
    const nextIndexInActive = currentIndexInActive + 1;

    if (nextIndexInActive >= activeSteps.length) {
      // Already at the last logical step
      return;
    }

    const nextStepDef = activeSteps[nextIndexInActive];
    const nextStepIndexInSteps = steps.findIndex(step => step === nextStepDef);

    console.log('Moving from step', activeStep, 'to step', nextStepIndexInSteps);
    if (nextStepIndexInSteps >= 0) {
      setActiveStep(nextStepIndexInSteps);
    }
  };
  
  const handleBack = () => {
    // Build the list of non-skipped steps
    const activeSteps = steps.filter(step => !step.skip);

    // Determine the current logical step
    const currentStepDef = steps[activeStep];
    const currentIndexInActive = activeSteps.findIndex(step => step === currentStepDef);
    const prevIndexInActive = currentIndexInActive - 1;

    if (prevIndexInActive < 0) {
      return;
    }

    const prevStepDef = activeSteps[prevIndexInActive];
    const prevStepIndexInSteps = steps.findIndex(step => step === prevStepDef);

    if (prevStepIndexInSteps >= 0) {
      setActiveStep(prevStepIndexInSteps);
    }
  };

  /* -------------------- STEPS -------------------- */
  const steps = [
    { 
      label: 'Weighing Method',
      description: 'Select how you want to measure weights',
      component: (
        <WeighingMethodSelection 
          onSelectMethod={handleWeighingMethodSelect}
          initialValues={weighingMethod}
        />
      )
    },
    { 
      label: 'Vehicle Details',
      description: 'Enter your vehicle information',
      component: (
        <VehicleRegistration
          onSave={handleVehicleDataSave}
          onNext={handleNext}
          onBack={handleBack}
          initialData={vehicleData}
          onAddCaravan={() => setCaravanData(prev => ({ ...prev, hasCaravan: true }))}
        />
      )
    },
    { 
      label: 'Caravan Details',
      description: 'Enter your caravan/trailer information',
      skip: !caravanData.hasCaravan,
      component: (
        <VehicleRegistration
          isCaravan={true}
          onSave={handleCaravanDataSave}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={() => handleCaravanDataSave(null)}
          initialData={caravanData}
        />
      )
    },
    { 
      label: 'Weight Measurement',
      description: 'Enter your weight measurements',
      component: (
        <DIYWeightMeasurement
          vehicleData={vehicleData}
          caravanData={caravanData.hasCaravan ? caravanData : null}
          weighingMethod={weighingMethod}
          onSave={handleWeightsSave}
          onBack={handleBack}
        />
      )
    },
    { 
      label: 'Compliance Check',
      description: 'Review your compliance status',
      component: (
        <DIYComplianceReport
          vehicleData={vehicleData}
          caravanData={caravanData.hasCaravan ? caravanData : null}
          weightsData={weightsData}
          complianceData={complianceData}
          onBack={handleBack}
          onNext={handleNext}
          onGenerateReport={handleGenerateReport}
        />
      )
    },
    { 
      label: startAtPayment ? '' : 'Report & Payment',
      // For standard DIY flow we show this description in the header, but when
      // coming from the Vehicle Only Weighbridge Axle screen (startAtPayment),
      // we don't want the extra header subtitle because it's not in the mockup.
      description: startAtPayment ? '' : 'Get your compliance report',
      component: (
        <ReportPreviewAndPayment
          vehicleData={{
            ...vehicleData,
            // Persist DIY axle weigh / portable tyre values inside vehicleData so backend can store them
            diyAxleWeigh: axleWeigh || vehicleData.diyAxleWeigh,
            diyTyreWeigh: tyreWeigh || vehicleData.diyTyreWeigh
          }}
          caravanData={caravanData.hasCaravan ? caravanData : null}
          weightsData={weightsData}
          preWeigh={preWeigh}
          customerData={null}
          onPaymentComplete={handlePaymentComplete}
          paymentOnly={startAtPayment}
          amount={startAtPayment ? 9.99 : 20}
          vehicleOnlyMethodLabel={vehicleOnlyMethodLabel}
          weighingSelection={weighingSelection}
        />
      )
    }
  ];

  // Filter out skipped steps for the stepper (visual only)
  const activeSteps = steps.filter(step => !step.skip);
  const currentStep = steps[activeStep];

  // Map current step index into the activeSteps array for the Stepper
  const stepperActiveIndex = activeSteps.findIndex(step => step === currentStep);

  // Last non-skipped step in the full steps array
  const lastNonSkippedIndex = steps.reduce((lastIndex, step, index) => (
    step.skip ? lastIndex : index
  ), 0);

  const isLastStep = activeStep === lastNonSkippedIndex;
  const isFirstStep = activeStep === 0;

  const isStepComplete = (stepIndex) => {
    // Check if all previous steps are complete
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepSkippable(i) && !isStepValid(i)) {
        return false;
      }
    }
    return true;
  };

  const isStepSkippable = (stepIndex) => {
    return steps[stepIndex]?.skip || false;
  };

  const renderStepContent = () => {
    if (!currentStep) return null;
    
    return React.cloneElement(currentStep.component, {
      key: currentStep.label,
      onNext: handleNext,
      onBack: handleBack
    });
  };

  /* -------------------- UI -------------------- */
  return (
    <>
      {!startAtPayment && (
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.appBar,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 2
        }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <IconButton 
                onClick={handleExit}
                color="inherit"
                sx={{ mr: 2 }}
              >
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
                {currentStep?.label || 'New Weigh'}
              </Typography>
              {currentStep?.description && (
                <Typography variant="body2" color="text.secondary">
                  {currentStep.description}
                </Typography>
              )}
            </Box>
            
            <Stepper 
              activeStep={stepperActiveIndex}
              alternativeLabel
              sx={{ 
                '& .MuiStepLabel-label': {
                  fontSize: '0.75rem',
                  [theme.breakpoints.up('sm')]: {
                    fontSize: '0.875rem',
                  },
                },
              }}
            >
              {activeSteps.map((step) => {
                const stepIndexInSteps = steps.findIndex(s => s === step);
                const completed = isStepComplete(stepIndexInSteps);
                return (
                <Step 
                  key={step.label} 
                  completed={completed}
                  sx={{
                    '& .MuiStepLabel-root': {
                      cursor: 'pointer',
                    },
                  }}
                  onClick={() => {
                    // Allow navigation only to previous logical steps
                    if (stepIndexInSteps < activeStep) {
                      setActiveStep(stepIndexInSteps);
                    }
                  }}
                >
                  <StepLabel>{step.label}</StepLabel>
                </Step>
              );})}
            </Stepper>
          </Container>
        </Box>
      )}
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
        
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, mb: 3, minHeight: '60vh' }}>
          {renderStepContent()}
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handleBack}
            disabled={isFirstStep || loading}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={loading || (activeStep === steps.length - 1 && paymentStatus !== 'completed')}
            sx={{ minWidth: 120 }}
          >
            {isLastStep ? 'Finish' : 'Next'}
          </Button>
        </Box>
        
        {/* Progress Summary - hide for Vehicle Only Weighbridge payment-only flow */}
        {!startAtPayment && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Progress Summary
            </Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {steps.map((step, index) => (
                  <Grid item xs={12} md={2} key={step.label || index}>
                    <Card
                      sx={{
                        bgcolor: isStepComplete(index)
                          ? 'success.light'
                          : index === activeStep
                          ? 'primary.light'
                          : 'grey.100'
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="caption">{step.label}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Box>
        )}
      </Container>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      
      {/* Customer Responsibility Disclaimer */}
      <CustomerResponsibilityDisclaimer
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />
      
      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitConfirm} onClose={cancelExit} maxWidth="sm" fullWidth>
        <DialogTitle>Exit Weigh Process?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to exit? Your progress will be lost.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelExit} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmExit} color="error" variant="contained">
            Exit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DIYNewWeigh;
