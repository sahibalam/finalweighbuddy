import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  CarCrash as CaravanIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  Edit as EditIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const CaravanSelectionFlow = ({ onCaravanSelected, onCaravanDataChange }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    numberPlate: '',
    state: '',
    make: '',
    model: '',
    year: '',
    // Caravan-specific compliance ratings - REQUIRED for manual entry
    atm: '',
    gtm: '',
    axleCapacity: '',
    numberOfAxles: 'Single'
  });

  // Search states  
  const [plateSearchResult, setPlateSearchResult] = useState(null);
  const [caravanFound, setCaravanFound] = useState(false);
  const [selectedCaravan, setSelectedCaravan] = useState(null);
  const [variantFoundInMaster, setVariantFoundInMaster] = useState(false);
  const [isModificationMode, setIsModificationMode] = useState(false); // Track if this is a modification scenario
  const [showManualForm, setShowManualForm] = useState(false); // Track when user wants manual form
  
  // Dynamic dropdown states
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState({
    makes: false,
    models: false,
    years: false
  });
  
  // Confirmations
  const [informationCorrect, setInformationCorrect] = useState(false);
  const [noModificationsConfirmed, setNoModificationsConfirmed] = useState(false);
  const [complianceImage, setComplianceImage] = useState(null);
  const [complianceImagePreview, setComplianceImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const steps = [
    'Enter Caravan Number Plate & State',
    'Select Caravan & Verify Specifications', 
    'Confirm Information',
    'Upload Compliance Image'
  ];

  // Manual entry validation
  const validateManualEntry = () => {
    console.log('🔍 validateManualEntry called for caravan');
    const requiredFields = ['make', 'model', 'year', 'atm', 'gtm', 'axleCapacity'];
    console.log('📋 Checking required caravan fields:', requiredFields);

    // Validate year specifically
    const year = parseInt(formData.year);
    if (!formData.year || isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      console.log('❌ Year validation failed:', formData.year);
      setError(`Please enter a valid year between 1900 and ${new Date().getFullYear() + 1}`);
      return false;
    }

    const fieldValues = {};
    requiredFields.forEach(field => {
      if (field === 'year') {
        fieldValues[field] = {
          value: formData[field],
          parsed: parseInt(formData[field]),
          isValid: formData[field] && !isNaN(parseInt(formData[field])) && parseInt(formData[field]) >= 1900 && parseInt(formData[field]) <= new Date().getFullYear() + 1
        };
      } else {
        fieldValues[field] = {
          value: formData[field],
          parsed: parseFloat(formData[field]),
          isValid: formData[field] && parseFloat(formData[field]) > 0
        };
      }
    });
    console.log('📊 Caravan field validation details:', fieldValues);

    const missingFields = requiredFields.filter(field => {
      if (field === 'year') return false; // Already validated above
      return !formData[field] || parseFloat(formData[field]) <= 0;
    });
    console.log('❌ Missing/invalid caravan fields:', missingFields);

    if (missingFields.length > 0) {
      const errorMsg = `Please enter valid values for: ${missingFields.map(f => f.toUpperCase()).join(', ')}`;
      console.log('🚨 Setting caravan error:', errorMsg);
      setError(errorMsg);
      return false;
    }

    // Basic validation - ATM should be >= GTM
    if (parseFloat(formData.atm) < parseFloat(formData.gtm)) {
      console.log('❌ ATM validation failed:', parseFloat(formData.atm), '<', parseFloat(formData.gtm));
      setError('ATM (Aggregate Trailer Mass) should be greater than or equal to GTM (Gross Trailer Mass)');
      return false;
    }
    console.log('✅ ATM validation passed:', parseFloat(formData.atm), '>=', parseFloat(formData.gtm));

    console.log('✅ All caravan validations passed - proceeding with submission');
    return true;
  };

  // Handle manual entry submission
  const handleManualEntrySubmit = () => {
    console.log('🎯 handleManualEntrySubmit called for caravan');
    
    if (!validateManualEntry()) {
      console.log('❌ Caravan validation failed');
      return;
    }
    
    console.log('✅ Caravan validation passed, creating manual caravan data');
    setError(''); // Clear any previous errors
    
    // Create a caravan object from manual entry data - MARKED AS USER-PROVIDED
    const manualCaravan = {
      make: formData.make,
      model: formData.model,
      year: formData.year,
      atm: parseFloat(formData.atm),
      gtm: parseFloat(formData.gtm),
      axleCapacity: parseFloat(formData.axleCapacity),
      numberOfAxles: formData.numberOfAxles,
      numberPlate: formData.numberPlate,
      state: formData.state,
      // CRITICAL: Mark this as user-provided data
      dataSource: 'USER_PROVIDED',
      requiresAdminVerification: true,
      userProvidedAt: new Date().toISOString(),
      isFromMasterDatabase: false
    };
    
    setSelectedCaravan(manualCaravan);
    setCaravanFound(true);
    setVariantFoundInMaster(false); // FALSE - because this is manual entry
    setInformationCorrect(false); // Reset confirmation for next step
    setIsModificationMode(false); // Reset modification mode
    setShowManualForm(false); // Hide manual form after submission
    setNoModificationsConfirmed(false); // Reset modifications confirmation
    setActiveStep(2); // Proceed to confirmation step after manual submission
    
    console.log('🎉 Manual caravan data submitted successfully!');
  };

  // API functions to fetch dropdown data from MongoDB Atlas
  const fetchMakes = async () => {
    try {
      setDropdownLoading(prev => ({ ...prev, makes: true }));
      const response = await axios.get('/api/caravans/makes');
      console.log('📦 Caravan makes fetched:', response.data);
      console.log('📦 Response structure:', {
        success: response.data?.success,
        makes: response.data?.makes,
        makesLength: response.data?.makes?.length
      });
      setMakes(response.data?.makes || []);
      console.log('📦 Makes state updated with:', response.data?.makes?.length || 0, 'items');
    } catch (error) {
      console.error('Error fetching caravan makes:', error);
      setError('Failed to load caravan makes. Please try again.');
    } finally {
      setDropdownLoading(prev => ({ ...prev, makes: false }));
    }
  };

  const fetchModels = async (make) => {
    if (!make) return;
    try {
      setDropdownLoading(prev => ({ ...prev, models: true }));
      const response = await axios.get(`/api/caravans/models?make=${encodeURIComponent(make)}`);
      console.log('🚗 Caravan models fetched for', make, ':', response.data);
      setModels(response.data?.models || []);
      setYears([]); // Clear years when make changes
    } catch (error) {
      console.error('Error fetching caravan models:', error);
      setError('Failed to load caravan models. Please try again.');
    } finally {
      setDropdownLoading(prev => ({ ...prev, models: false }));
    }
  };

  const fetchYears = async (make, model) => {
    if (!make || !model) return;
    try {
      setDropdownLoading(prev => ({ ...prev, years: true }));
      const response = await axios.get(`/api/caravans/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
      console.log('📅 Caravan years fetched for', make, model, ':', response.data);
      setYears(response.data?.years || []);
    } catch (error) {
      console.error('Error fetching caravan years:', error);
      setError('Failed to load caravan years. Please try again.');
    } finally {
      setDropdownLoading(prev => ({ ...prev, years: false }));
    }
  };

  // Search master database for selected caravan
  const searchMasterDatabase = async () => {
    if (!formData.make || !formData.model || !formData.year) return;
    
    try {
      setLoading(true);
      console.log('🔍 Searching master database for caravan:', formData.make, formData.model, formData.year);
      
      const response = await axios.get('/api/caravans/search', {
        params: { 
          make: formData.make, 
          model: formData.model, 
          year: formData.year 
        }
      });
      
      console.log('🎯 Caravan master database search result:', response.data);
      
      if (response.data?.success && response.data?.caravans?.length > 0) {
        // Found in master database with complete data
        const masterCaravan = response.data.caravans[0];
        console.log('✅ Caravan found in master database:', masterCaravan);
        
        // Check if the compliance data is complete
        if (masterCaravan.atm && masterCaravan.gtm && masterCaravan.axleCapacity) {
          console.log('✅ Complete caravan compliance data found');
          
          // Set the complete caravan data
          const completeCaravan = {
            ...masterCaravan,
            dataSource: 'MASTER_DATABASE',
            isFromMasterDatabase: true,
            requiresAdminVerification: false
          };
          
          setSelectedCaravan(completeCaravan);
          setCaravanFound(true);
          setVariantFoundInMaster(true);
          setInformationCorrect(false); // User needs to confirm this is correct
        } else {
          console.log('⚠️ Incomplete caravan data found, need manual entry');
          setCaravanFound(false);
          setVariantFoundInMaster(false);
        }
      } else {
        console.log('❌ Caravan not found in master database');
        setCaravanFound(false);
        setVariantFoundInMaster(false);
      }
    } catch (error) {
      console.error('Error searching caravan master database:', error);
      setCaravanFound(false);
      setVariantFoundInMaster(false);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Search by number plate
  const searchCaravanByPlate = async (plate, state) => {
    if (!plate || plate.length < 3) return;
    
    try {
      setLoading(true);
      setError('');
      setIsModificationMode(false); // Reset modification mode
      setShowManualForm(false); // Reset manual form state
      setNoModificationsConfirmed(false); // Reset modifications confirmation
      console.log('🔍 Searching caravan by plate:', plate, state);
      
      const response = await axios.get(`/api/caravans/by-plate/${encodeURIComponent(plate)}`, {
        params: { state }
      });
      
      console.log('🎯 Caravan plate search result:', response.data);
      
      if (response.data?.success && response.data?.found) {
        // Caravan found in registry
        console.log('✅ Caravan found in registry:', response.data.data);
        setPlateSearchResult(response.data.data);
        setSelectedCaravan(response.data.data.masterCaravan);
        setCaravanFound(true);
        setVariantFoundInMaster(true);
        // Populate form with found data
        setFormData(prev => ({
          ...prev,
          ...response.data.data.masterCaravan
        }));
        // Skip to confirmation step since we have complete data
        setActiveStep(2);
      } else {
        // Caravan not found - go to manual selection
        console.log('❌ Caravan not found in registry');
        setPlateSearchResult(null);
        setCaravanFound(false);
        setActiveStep(1); // Go to manual selection
      }
    } catch (error) {
      console.error('Error searching caravan by plate:', error);
      if (error.response?.status === 404) {
        // 404 is expected if plate not found
        setPlateSearchResult(null);
      setCaravanFound(false);
        setActiveStep(1); // Automatically proceed to dropdowns
      } else {
        setError('Number plate search failed. Please proceed with manual selection.');
        setActiveStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImageUploading(true);
      
      // Store the file object directly instead of uploading it first
      setComplianceImage(file);
      
      // Create a preview URL for display
      const previewUrl = URL.createObjectURL(file);
      setComplianceImagePreview(previewUrl);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process photo. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const openCamera = async () => {
    console.log('Camera: openCamera invoked');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('Camera: mediaDevices/getUserMedia not available');
        setError('Camera not supported here. Opening camera app via file input.');
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        return;
      }
      if (!window.isSecureContext) {
        console.log('Camera: not in secure context (HTTPS or localhost)');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      console.log('Camera: stream acquired');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          console.log('Camera: video play resolved');
        } catch (err) {
          console.log('Camera: video play rejected', err);
        }
      }
      setCameraOpen(true);
      setError('');
    } catch (e) {
      console.log('Camera: getUserMedia error', e);
      setError('Unable to access camera. Please allow permissions or use file upload.');
    }
  };

  const closeCamera = () => {
    console.log('Camera: closeCamera invoked');
    const v = videoRef.current;
    const stream = v && v.srcObject;
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach(t => {
        console.log('Camera: stopping track', t.kind);
        t.stop();
      });
    }
    if (v) v.srcObject = null;
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    console.log('Camera: capturePhoto invoked');
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const width = v.videoWidth || 640;
    const height = v.videoHeight || 480;
    console.log('Camera: capture dimensions', { width, height });
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, 0, 0, width, height);
    c.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'compliance.jpg', { type: 'image/jpeg' });
        console.log('Camera: blob created', { size: file.size });
        setComplianceImage(file);
        const url = URL.createObjectURL(file);
        setComplianceImagePreview(url);
        closeCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  // Navigation handlers
  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Require compliance image before completing selection
      if (!complianceImage) {
        setError('Please upload the compliance plate image before completing.');
        return;
      }
      // Final step - complete selection
      const caravanData = {
        ...formData,
        ...selectedCaravan, // Include all caravan specs
        complianceImage,
        noModificationsConfirmed,
        informationCorrect,
        caravanFound,
        variantFoundInMaster,
        // Data governance fields
        dataSource: selectedCaravan?.dataSource || 'UNKNOWN',
        requiresAdminVerification: selectedCaravan?.requiresAdminVerification || false,
        isFromMasterDatabase: selectedCaravan?.isFromMasterDatabase || false
      };
      
      console.log('🚛 Completing caravan selection with data:', caravanData);
      
      // If this is a manual entry (user-provided data), submit to admin review
      if (caravanData.dataSource === 'USER_PROVIDED' && complianceImage) {
        try {
          setLoading(true);
          
          // Validate data before submission
          console.log('🔍 Validating caravan data before submission:', caravanData);
          
          // Check for required fields and valid values
          console.log('🔍 Checking required fields:', {
            make: caravanData.make,
            model: caravanData.model,
            year: caravanData.year,
            atm: caravanData.atm,
            gtm: caravanData.gtm,
            axleCapacity: caravanData.axleCapacity,
            numberPlate: caravanData.numberPlate,
            state: caravanData.state
          });
          
          if (!caravanData.make || !caravanData.model || !caravanData.year || !caravanData.atm || !caravanData.gtm || !caravanData.axleCapacity) {
            setError('Please fill in all required fields (Make, Model, Year, ATM, GTM, Axle Capacity)');
            setLoading(false);
            return;
          }
          
          // Validate year is a proper year (not just '2' or decimal)
          if (!isYearValid(caravanData.year)) {
            setError(`Please enter a valid year between 1900 and ${new Date().getFullYear() + 1}`);
            setLoading(false);
            return;
          }
          const year = parseInt(caravanData.year);
          
          // Create FormData for file upload
          const formDataToSubmit = new FormData();
          
          // Append the file if provided (now optional)
          if (complianceImage) {
            formDataToSubmit.append('compliancePlatePhoto', complianceImage);
          }
          
          formDataToSubmit.append('make', caravanData.make.trim());
          formDataToSubmit.append('model', caravanData.model.trim());
          formDataToSubmit.append('year', year.toString()); // Ensure year is a proper number
          formDataToSubmit.append('atm', parseFloat(caravanData.atm).toString());
          formDataToSubmit.append('gtm', parseFloat(caravanData.gtm).toString());
          formDataToSubmit.append('axleCapacity', parseFloat(caravanData.axleCapacity).toString());
          formDataToSubmit.append('numberOfAxles', caravanData.numberOfAxles || 'Single');
          formDataToSubmit.append('numberPlate', caravanData.numberPlate.toUpperCase());
          formDataToSubmit.append('state', caravanData.state.toUpperCase());
          
          console.log('✅ Validated data - submitting with year:', year);
          console.log('📤 FormData contents:');
          for (let [key, value] of formDataToSubmit.entries()) {
            console.log(`   ${key}: ${value}`);
          }
          
          const response = await axios.post('/api/submissions/caravan', formDataToSubmit, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data.success) {
            // Show success message
            setError('');
            
            
            // Continue with the selection process
            onCaravanSelected(caravanData);
            onCaravanDataChange(caravanData);
          }
        } catch (error) {
          console.error('Error submitting caravan data:', error);
          
          // Show more specific error message
          if (error.response && error.response.data) {
            console.log('🔍 Backend error details:', error.response.data);
            
            if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
              // Handle validation errors
              const errorMessages = error.response.data.errors.join(', ');
              setError(`Validation failed: ${errorMessages}`);
            } else if (error.response.data.message) {
              // Handle specific error messages
              if (error.response.data.message.includes('already pending review')) {
                setError('A submission for this number plate is already pending review. Proceeding with existing submission.');
                onCaravanSelected(caravanData);
                onCaravanDataChange(caravanData);
              } else if (error.response.data.message.includes('already registered')) {
                setError('This number plate is already registered in our database. Please search for it instead of submitting.');
              } else {
                setError(`Submission failed: ${error.response.data.message}`);
              }
            } else {
              setError('Failed to submit caravan data. Please try again.');
            }
          } else if (error.message) {
            setError(`Submission failed: ${error.message}`);
          } else {
            setError('Failed to submit caravan data. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Standard selection - no submission needed
        onCaravanSelected(caravanData);
        onCaravanDataChange(caravanData);
      }
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Effect hooks
  useEffect(() => {
    fetchMakes();
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (complianceImagePreview) {
        URL.revokeObjectURL(complianceImagePreview);
      }
    };
  }, [complianceImagePreview]);

  // Helper function to validate year
  const isYearValid = (year) => {
    if (!year) return true; // Empty is valid (not an error)
    
    // Convert to string first to check for decimal point
    const yearStr = String(year);
    if (yearStr.includes('.')) return false;
    
    const yearNum = parseInt(year);
    // Check if it's a valid integer and within range
    return !isNaN(yearNum) && 
           Number.isInteger(yearNum) && 
           yearNum >= 1900 && 
           yearNum <= new Date().getFullYear() + 1;
  };

  useEffect(() => {
    if (formData.make) {
      fetchModels(formData.make);
      // Reset model and year when make changes
      setFormData(prev => ({ ...prev, model: '', year: '' }));
    }
  }, [formData.make]);

  useEffect(() => {
    if (formData.make && formData.model) {
      fetchYears(formData.make, formData.model);
      // Reset year when model changes
      setFormData(prev => ({ ...prev, year: '' }));
    }
  }, [formData.make, formData.model]);

  // Auto-search master database when year is selected
  useEffect(() => {
    if (formData.make && formData.model && formData.year && !caravanFound) {
      console.log('🔄 Auto-searching master database for caravan...');
      searchMasterDatabase();
    }
  }, [formData.year]); // Removed caravanFound dependency to prevent interference with "No, Different" button

  // Render step content
  const renderStepContent = (index) => {
    switch (index) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Step 1:</strong> Enter your caravan's number plate and state. If found in our database, details will be automatically filled.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Caravan Number Plate"
                value={formData.numberPlate}
                onChange={(e) => setFormData(prev => ({ ...prev, numberPlate: e.target.value.toUpperCase() }))}
                placeholder="HR55T1001"
                InputProps={{
                  startAdornment: <CaravanIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={formData.state}
                  label="State"
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                >
                  <MenuItem value="">Select State</MenuItem>
                  <MenuItem value="NSW">New South Wales</MenuItem>
                  <MenuItem value="VIC">Victoria</MenuItem>
                  <MenuItem value="QLD">Queensland</MenuItem>
                  <MenuItem value="WA">Western Australia</MenuItem>
                  <MenuItem value="SA">South Australia</MenuItem>
                  <MenuItem value="TAS">Tasmania</MenuItem>
                  <MenuItem value="ACT">Australian Capital Territory</MenuItem>
                  <MenuItem value="NT">Northern Territory</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={() => searchCaravanByPlate(formData.numberPlate, formData.state)}
                disabled={!formData.numberPlate || !formData.state || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                fullWidth
                size="large"
              >
                {loading ? 'Searching...' : 'Search Caravan & Continue'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                This will search our database and proceed automatically
              </Typography>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            {/* Alert for number plate not found */}
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="bold">
                Number plate not found. Please manually select your caravan details.
              </Typography>
              <Typography variant="body2">
                Please select: Make → Model → Year (system will auto-search after year selection)
                      </Typography>
            </Alert>

            

            {/* Dropdown selection removed as requested */}
                    
            {/* Auto-search loading indicator */}
            {formData.make && formData.model && formData.year && loading && (
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <CircularProgress sx={{ 
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  🔍 Automatically searching master database for {formData.make} {formData.model} {formData.year}...
                      </Typography>
                    </Box>
            )}

            {/* Show caravan found result */}
            {caravanFound && selectedCaravan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    ✅ Caravan Found!
                  </Typography>
                  <Typography variant="body1">
                    <strong>{selectedCaravan?.make} {selectedCaravan?.model} {selectedCaravan?.year}</strong>
                  </Typography>
                </Alert>
                
                <Paper sx={{ mt: 2, p: 2, bgcolor: 'success.light' }}>
                  <Typography variant="h6" color="success.dark" gutterBottom>
                    📋 Caravan Specifications:
                </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">ATM</Typography>
                      <Typography variant="h6">{selectedCaravan?.atm || 'N/A'} kg</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">GTM</Typography>
                      <Typography variant="h6">{selectedCaravan?.gtm || 'N/A'} kg</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Axle Capacity</Typography>
                      <Typography variant="h6">{selectedCaravan?.axleCapacity || 'N/A'} kg</Typography>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Axles</Typography>
                      <Typography variant="h6">{selectedCaravan?.numberOfAxles || 'N/A'}</Typography>
                    </Grid>
                  </Grid>

                  {selectedCaravan?.dataSource === 'USER_PROVIDED' && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2" fontWeight="bold">
                        📝 Data Source: User-Provided ⚠️
                      </Typography>
                      <Typography variant="body2">
                        <strong>Data Governance Policy:</strong> This manually entered data is for your current session only. 
                        It has been flagged for admin review. If verified accurate, an administrator may add it to our master database for future users.
                      </Typography>
                    </Alert>
                  )}

                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body1" fontWeight="bold" color="success.dark">
                      Is this your caravan specification?
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => setInformationCorrect(true)}
                        sx={{ mr: 1 }}
                        startIcon={<CheckCircleIcon />}
                      >
                        ✅ Yes, Correct
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => {
                          console.log('🔧 User clicked "Modification" - showing modification form');
                          setSelectedCaravan(null);
                          setCaravanFound(false);
                          setVariantFoundInMaster(false);
                          setIsModificationMode(true); // Set modification mode
                          setShowManualForm(true); // Show manual form
                          console.log('🔧 State reset: caravanFound=false, selectedCaravan=null');
                        }}
                        sx={{ minWidth: 120 }}
                      >
                        🔧 Modification
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            )}

            {/* Manual entry form when caravan not found */}
            <Box sx={{ mt: 4, p: 3, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="bold">
                    {isModificationMode 
                      ? 'Caravan Modifications Detected'
                      : formData.make && formData.model && formData.year 
                        ? 'Caravan data not found or incomplete'
                        : 'How to Find Your Caravan’s Weight Specifications'
                    }
                  </Typography>
                  <Typography variant="body2">
                    {isModificationMode 
                      ? `You've indicated that your "${formData.make} ${formData.model} ${formData.year}" has been modified from its original specifications. Please enter the updated compliance ratings from your modified caravan's compliance plate.`
                      : formData.make && formData.model && formData.year 
                        ? `We couldn't find complete compliance data for "${formData.make} ${formData.model} ${formData.year}" in our database. Please enter the compliance ratings manually from your caravan's compliance plate.`
                        : 'How to Find Your Caravan’s Weight Specifications'
                    }
                  </Typography>
                </Alert>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Locate the Compliance Plate
                  </Typography>
                  <Typography variant="body2">
                    Common locations include the front tunnel box, drawbar, or inside the entry door.<br/>
                    <strong>Record Key Details:</strong><br/>
                    Note the following from the compliance plate:<br/>
                    ATM (Aggregate Trailer Mass)<br/>
                    GTM (Gross Trailer Mass)<br/>
                    Axle Group Loading<br/>
                    Tare Weight<br/>
                    (Some plates may not list GTM or Axle Group Loadings.)<br/>
                    <strong>Take a Photo for Verification:</strong><br/>
                    Capture a clear photo of the compliance plate to verify details and keep for your records.
                  </Typography>
                </Alert>

                    <Typography variant="h6" gutterBottom>
                      📝 {isModificationMode 
                        ? 'Modified Caravan Compliance Entry' 
                        : formData.make && formData.model && formData.year 
                          ? 'Manual Compliance Entry' 
                          : 'How to Find Your Caravan’s Weight Specifications'
                      }
                    </Typography>

                <Grid container spacing={2}>
                  {/* Caravan Identification - Disabled/Editable based on context */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                      Caravan Identification {formData.make && formData.model && formData.year ? '(Cannot be modified)' : ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Number Plate"
                      value={formData.numberPlate}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberPlate: e.target.value.toUpperCase() }))}
                      placeholder="HR55T1001"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>State</InputLabel>
                      <Select
                        value={formData.state}
                        label="State"
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      >
                        <MenuItem value="">Select State</MenuItem>
                        <MenuItem value="NSW">New South Wales</MenuItem>
                        <MenuItem value="VIC">Victoria</MenuItem>
                        <MenuItem value="QLD">Queensland</MenuItem>
                        <MenuItem value="WA">Western Australia</MenuItem>
                        <MenuItem value="SA">South Australia</MenuItem>
                        <MenuItem value="TAS">Tasmania</MenuItem>
                        <MenuItem value="ACT">Australian Capital Territory</MenuItem>
                        <MenuItem value="NT">Northern Territory</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Make"
                          value={formData.make}
                          onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                          disabled={false}
                          sx={{}}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Model"
                          value={formData.model}
                          onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                          disabled={false}
                          sx={{}}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Year"
                          type="number"
                          value={formData.year || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow typing any digits, validate on blur or submission
                            if (value === '' || /^\d*$/.test(value)) {
                              setFormData(prev => ({ ...prev, year: value }));
                            }
                          }}
                          onBlur={(e) => {
                            // Validate on blur to show error if invalid
                            const value = e.target.value;
                            if (value && !isYearValid(value)) {
                              // Show user-friendly error message
                              const yearNum = parseInt(value);
                              if (yearNum > new Date().getFullYear() + 1) {
                                setError(`❌ Year ${yearNum} cannot be in the future. Please enter a year between 1900 and ${new Date().getFullYear() + 1}`);
                              } else if (yearNum < 1900) {
                                setError(`❌ Year ${yearNum} is too old. Please enter a year between 1900 and ${new Date().getFullYear() + 1}`);
                              } else if (value.includes('.')) {
                                setError('❌ Year must be a whole number (no decimals)');
                              } else {
                                setError(`❌ Invalid year format. Please enter a valid year between 1900 and ${new Date().getFullYear() + 1}`);
                              }
                            } else if (value && isYearValid(value)) {
                              // Clear error when year becomes valid
                              setError('');
                            }
                          }}
                          disabled={false}
                          sx={{}}
                          inputProps={{ 
                            min: 1900, 
                            max: new Date().getFullYear() + 1,
                            step: 1,
                            pattern: '[0-9]*'
                          }}
                          helperText={`Enter year between 1900 and ${new Date().getFullYear() + 1}`}
                          error={Boolean(formData.year && formData.year.length > 0 && !isYearValid(formData.year))}
                        />
                      </Grid>

                  {/* Compliance Ratings - Required */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                      Compliance Ratings (Required) *
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                      required
                      label="ATM (Aggregate Trailer Mass) *"
                          type="number"
                          value={formData.atm}
                          onChange={(e) => setFormData(prev => ({ ...prev, atm: e.target.value }))}
                      helperText="Total caravan weight including everything (kg)"
                      inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                  
                  <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                      required
                      label="GTM (Gross Trailer Mass) *"
                          type="number"
                          value={formData.gtm}
                          onChange={(e) => setFormData(prev => ({ ...prev, gtm: e.target.value }))}
                      helperText="Weight transmitted to ground by caravan wheels (kg)"
                      inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                  
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                      required
                      label="Axle Capacity *"
                          type="number"
                      value={formData.axleCapacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, axleCapacity: e.target.value }))}
                      helperText="Maximum weight each axle can carry (kg)"
                      inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                  
                      <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Number of Axles</InputLabel>
                      <Select
                        value={formData.numberOfAxles}
                        label="Number of Axles"
                        onChange={(e) => setFormData(prev => ({ ...prev, numberOfAxles: e.target.value }))}
                      >
                        <MenuItem value="Single">Single</MenuItem>
                        <MenuItem value="Dual">Dual</MenuItem>
                        <MenuItem value="Triple">Triple</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* No Modifications Confirmation */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={noModificationsConfirmed}
                          onChange={(e) => setNoModificationsConfirmed(e.target.checked)}
                        />
                      }
                      label="I confirm there have been no modifications to the caravan's compliance specifications"
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  
                  {/* Submit Manual Entry Button */}
                  <Grid item xs={12}>
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'success.light', borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="body2" color="success.dark" sx={{ mb: 2 }}>
                        📋 Once you've entered all compliance ratings, click below to proceed
                      </Typography>
                      
                      <Button
                        variant="contained"
                        color="success"
                        size="large"
                        onClick={handleManualEntrySubmit}
                        disabled={!formData.atm || !formData.gtm || !formData.axleCapacity || !noModificationsConfirmed}
                        startIcon={<CheckCircleIcon />}
                      >
                        {isModificationMode 
                          ? 'Submit Modified Caravan Data' 
                          : formData.make && formData.model && formData.year 
                            ? 'Submit Manual Caravan Data' 
                            : 'Submit Manual Caravan Data'
                        }
                      </Button>
                      <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                        {isModificationMode 
                          ? 'This will verify your modifications and proceed to confirmation'
                          : formData.make && formData.model && formData.year 
                            ? 'This will verify your entries and proceed to confirmation'
                            : 'This will verify your entries and proceed to confirmation'
                        }
                      </Typography>
                    </Box>
                      </Grid>
                    </Grid>
                  </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Caravan found! Please review the caravan specifications below and confirm they are correct.
            </Alert>
            
            {/* Caravan Specifications Display */}
            {selectedCaravan && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Caravan Specifications
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Basic Caravan Info */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Caravan Details
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Number Plate</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.numberPlate}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">State</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.state}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Make</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.make}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Model</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.model}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Year</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.year}</Typography>
                    </Grid>
                    
                    {/* Compliance Specifications */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
                        Compliance Specifications
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">ATM (Aggregate Trailer Mass)</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.atm} kg</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">GTM (Gross Trailer Mass)</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.gtm} kg</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Axle Capacity</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.axleCapacity} kg</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Number of Axles</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedCaravan.numberOfAxles}</Typography>
                    </Grid>
                    {selectedCaravan.tbm2 && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">TBM2 (Tow Ball Mass 2)</Typography>
                        <Typography variant="body1" fontWeight="medium">{selectedCaravan.tbm2} kg</Typography>
                      </Grid>
                    )}
                    
                    {/* Data Source Info */}
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                        Source: {selectedCaravan.dataSource === 'USER_PROVIDED' ? 'Previously used in weigh process' : 'Master database'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please verify the caravan information is correct and confirm no modifications have been made.
            </Alert>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={informationCorrect}
                  onChange={(e) => setInformationCorrect(e.target.checked)}
                />
              }
              label="I confirm the caravan information is correct"
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={noModificationsConfirmed}
                  onChange={(e) => setNoModificationsConfirmed(e.target.checked)}
                />
              }
              label="I confirm there have been no modifications to the caravan's compliance specifications"
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <>
              <Typography variant="body1" gutterBottom>
                Upload an image of the caravan's compliance plate for verification.
              </Typography>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={imageUploading ? <CircularProgress size={20} /> : <UploadIcon />}
                disabled={imageUploading}
                sx={{ mb: 2 }}
              >
                Upload Compliance Plate Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
              </Button>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Or use your device camera to capture the compliance plate.
                </Typography>
                {!cameraOpen ? (
                  <Button
                    variant="contained"
                    startIcon={<CameraIcon />}
                    onClick={openCamera}
                    sx={{ mb: 2 }}
                  >
                    Open Camera
                  </Button>
                ) : (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={() => {
                          const v = videoRef.current;
                          console.log('Camera: loadedmetadata', v?.videoWidth, v?.videoHeight);
                        }}
                        onPlay={() => console.log('Camera: video playing')}
                        style={{ width: '100%', maxHeight: '240px', background: '#000' }}
                      />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button variant="contained" color="success" startIcon={<CameraIcon />} onClick={capturePhoto}>Capture Photo</Button>
                      <Button variant="outlined" onClick={closeCamera}>Close Camera</Button>
                    </Box>
                  </Box>
                )}
              </Box>
              
              {complianceImage && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label="Image uploaded successfully"
                    color="success"
                    icon={<CheckCircleIcon />}
                    sx={{ mb: 2 }}
                  />
                  {complianceImagePreview && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Preview:
                      </Typography>
                      <img
                        src={complianceImagePreview}
                        alt="Compliance Plate Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          objectFit: 'contain',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </>
          </Box>
        );



      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom color="primary">
        🚛 Caravan Selection Process
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {formData.year && isYearValid(formData.year) && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Year {formData.year} is valid and within the acceptable range (1900 - {new Date().getFullYear() + 1})
        </Alert>
      )}

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step}>
            <StepLabel>{step}</StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                {renderStepContent(index)}
                
                <Box sx={{ mt: 2 }}>
                  {/* Only show Continue button for steps that don't have their own action buttons */}
                  {(index === 1 && caravanFound && informationCorrect) && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ mr: 1 }}
                  >
                    {index === steps.length - 1 ? 'Complete Selection' : 'Continue to Confirmation'}
                  </Button>
                  )}
                  
                  {index === 2 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                      disabled={!informationCorrect || !noModificationsConfirmed}
                    sx={{ mr: 1 }}
                  >
                    Continue to Image Upload
                  </Button>
                  )}
                  
                  {index === 3 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                      disabled={!complianceImage}
                    sx={{ mr: 1 }}
                  >
                      Complete Caravan Selection
                  </Button>
                  )}
                  {index > 0 && (
                    <Button
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  )}
                </Box>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default CaravanSelectionFlow;