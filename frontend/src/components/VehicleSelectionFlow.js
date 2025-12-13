import React, { useState, useEffect } from 'react';
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
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Upload as UploadIcon,
  DirectionsCar as VehicleIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

const VehicleSelectionFlow = ({ onVehicleSelected, onVehicleDataChange }) => {
  // Add CSS animation for spinner
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    numberPlate: '',
    state: '',
    make: '',
    model: '',
    series: '',
    variant: '',
    year: '',
    engine: '',
    transmission: '',
    tyreSize: '',
    subTank: false,
    brakes: '',
    // Critical compliance rating fields
    gvm: '',
    gcm: '',
    btc: '',
    tbm: '',
    fawr: '',
    rawr: ''
  });

  // Search and selection states
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [variantFoundInMaster, setVariantFoundInMaster] = useState(false);
  const [informationCorrect, setInformationCorrect] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false); // Track when user wants manual form
  const [isModificationMode, setIsModificationMode] = useState(false); // Track if this is a modification scenario
  
  // Dynamic dropdown data from MongoDB Atlas
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [series, setSeries] = useState([]);
  const [years, setYears] = useState([]);
  const [variants, setVariants] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState({
    makes: false,
    models: false,
    series: false,
    years: false,
    variants: false
  });
  const [noModificationsConfirmed, setNoModificationsConfirmed] = useState(false);
  const [complianceImage, setComplianceImage] = useState(null);
  const [complianceImagePreview, setComplianceImagePreview] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const steps = [
    'Enter Number Plate & State',
    'Select Vehicle & Verify Specifications',
    'Confirm Information',
    'Upload Compliance Image'
  ];

  // API functions to fetch dropdown data from MongoDB Atlas
  const fetchMakes = async () => {
    try {
      setDropdownLoading(prev => ({ ...prev, makes: true }));
      const response = await axios.get('/api/vehicles/makes');
      if (response.data.success) {
        setMakes(response.data.makes || []);
      }
    } catch (error) {
      console.error('Error fetching makes:', error);
      setError('Failed to fetch vehicle makes');
    } finally {
      setDropdownLoading(prev => ({ ...prev, makes: false }));
    }
  };

  const fetchModels = async (make) => {
    if (!make) return;
    try {
      setDropdownLoading(prev => ({ ...prev, models: true }));
      const response = await axios.get(`/api/vehicles/models?make=${encodeURIComponent(make)}`);
      if (response.data.success) {
        setModels(response.data.models || []);
      } else {
        setModels([]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    } finally {
      setDropdownLoading(prev => ({ ...prev, models: false }));
    }
  };

  const fetchSeries = async (make, model) => {
    if (!make || !model) return;
    try {
      setDropdownLoading(prev => ({ ...prev, series: true }));
      const response = await axios.get(`/api/vehicles/series?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`);
      if (response.data.success) {
        setSeries(response.data.series || []);
      } else {
        setSeries([]);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      setSeries([]);
    } finally {
      setDropdownLoading(prev => ({ ...prev, series: false }));
    }
  };

  const fetchYears = async (make, model, series) => {
    if (!make || !model) return;
    try {
      setDropdownLoading(prev => ({ ...prev, years: true }));
      let url = `/api/vehicles/years?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
      if (series) {
        url += `&series=${encodeURIComponent(series)}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        setYears(response.data.years || []);
      } else {
        setYears([]);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
      setYears([]);
    } finally {
      setDropdownLoading(prev => ({ ...prev, years: false }));
    }
  };

  const fetchVariants = async (make, model, series, year) => {
    if (!make || !model || !year) return;
    try {
      setDropdownLoading(prev => ({ ...prev, variants: true }));
      let url = `/api/vehicles/variants?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${encodeURIComponent(year)}`;
      if (series) {
        url += `&series=${encodeURIComponent(series)}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        setVariants(response.data.variants || []);
      } else {
        setVariants([]);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]);
    } finally {
      setDropdownLoading(prev => ({ ...prev, variants: false }));
    }
  };

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

  // useEffect hooks for data loading
  useEffect(() => {
    // Load makes when component mounts
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

  useEffect(() => {
    // Load models when make changes
    if (formData.make) {
      setModels([]);
      setSeries([]);
      setYears([]);
      setVariants([]);
      fetchModels(formData.make);
    } else {
      setModels([]);
      setSeries([]);
      setYears([]);
      setVariants([]);
    }
  }, [formData.make]);

  useEffect(() => {
    // Load series when make/model changes
    if (formData.make && formData.model) {
      setSeries([]);
      setYears([]);
      setVariants([]);
      fetchSeries(formData.make, formData.model);
    } else {
      setSeries([]);
      setYears([]);
      setVariants([]);
    }
  }, [formData.model]);

  useEffect(() => {
    // Load years when make/model/series changes
    if (formData.make && formData.model) {
      setYears([]);
      setVariants([]);
      fetchYears(formData.make, formData.model, formData.series);
    } else {
      setYears([]);
      setVariants([]);
    }
  }, [formData.series]);

  useEffect(() => {
    // Load variants when make/model/series/year changes
    if (formData.make && formData.model && formData.year) {
      setVariants([]);
      fetchVariants(formData.make, formData.model, formData.series, formData.year);
    } else {
      setVariants([]);
    }
  }, [formData.year]);

  // Auto search master database when variant is selected
  useEffect(() => {
    console.log('🔍 ===== VARIANT USEEFFECT TRIGGERED =====');
    console.log('🔍 formData.make:', formData.make);
    console.log('🔍 formData.model:', formData.model);
    console.log('🔍 formData.series:', formData.series);
    console.log('🔍 formData.year:', formData.year);
    console.log('🔍 formData.variant:', formData.variant);
    console.log('🔍 All fields present?', !!(formData.make && formData.model && formData.year && formData.variant));
    if (selectedVehicle && selectedVehicle.dataSource === 'INFOAGENT') {
      console.log('🔍 InfoAgent data source detected - skipping master database search');
      return;
    }
    
    if (formData.make && formData.model && formData.year && formData.variant) {
      console.log('🔍 All fields present, calling searchMasterDatabase...');
      searchMasterDatabase(formData.make, formData.model, formData.year, formData.variant);
    } else {
      console.log('🔍 Not all fields present, skipping search');
    }
  }, [formData.variant]);

  // Validate manual entry compliance fields
  const validateManualEntry = () => {
    console.log('🔍 validateManualEntry called');
    const requiredFields = ['gvm', 'gcm', 'btc', 'tbm', 'fawr', 'rawr'];
    console.log('📋 Checking required fields:', requiredFields);
    
    // Check each field individually for better debugging
    const fieldValues = {};
    requiredFields.forEach(field => {
      fieldValues[field] = {
        value: formData[field],
        parsed: parseFloat(formData[field]),
        isValid: formData[field] && parseFloat(formData[field]) > 0
      };
    });
    console.log('📊 Field validation details:', fieldValues);
    
    const missingFields = requiredFields.filter(field => !formData[field] || parseFloat(formData[field]) <= 0);
    console.log('❌ Missing/invalid fields:', missingFields);
    
    if (missingFields.length > 0) {
      const errorMsg = `Please enter valid values for: ${missingFields.map(f => f.toUpperCase()).join(', ')}`;
      console.log('🚨 Setting error:', errorMsg);
      setError(errorMsg);
      return false;
    }
    
    // Basic validation - GCM should be >= GVM
    if (parseFloat(formData.gcm) < parseFloat(formData.gvm)) {
      console.log('❌ GCM validation failed:', parseFloat(formData.gcm), '<', parseFloat(formData.gvm));
      setError('GCM (Gross Combination Mass) should be greater than or equal to GVM (Gross Vehicle Mass)');
      return false;
    }
    console.log('✅ GCM validation passed:', parseFloat(formData.gcm), '>=', parseFloat(formData.gvm));
    
    // Skip BTC validation - it can legitimately be higher than GVM
    console.log('✅ All validations passed - proceeding with submission');
    
    return true;
  };

  // Handle manual entry submission
  const handleManualEntrySubmit = async () => {
    console.log('🎯 handleManualEntrySubmit called');
    
    // Check if number plate and state are set
    if (!formData.numberPlate || !formData.state) {
      console.log('❌ Number plate or state missing:', {
        numberPlate: formData.numberPlate,
        state: formData.state
      });
      setError('Please enter both number plate and state in the first step.');
      return;
    }
    
    if (!validateManualEntry()) {
      console.log('❌ Validation failed');
      return;
    }
    
    console.log('✅ Validation passed, creating manual vehicle data');
    console.log('🔍 FormData at manual entry:', formData);
    setError(''); // Clear any previous errors
    
    // Create a vehicle object from manual entry data - MARKED AS USER-PROVIDED
    console.log('🔍 Creating manualVehicle with formData:', formData);
    const manualVehicle = {
      numberPlate: formData.numberPlate,
      state: formData.state,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      variant: formData.variant,
      series: formData.series,
      engine: formData.engine,
      transmission: formData.transmission,
      tyreSize: formData.tyreSize,
      brakes: formData.brakes,
      hasSubTank: formData.subTank,
      gvm: parseFloat(formData.gvm),
      gcm: parseFloat(formData.gcm),
      btc: parseFloat(formData.btc),
      tbm: parseFloat(formData.tbm),
      fawr: parseFloat(formData.fawr),
      rawr: parseFloat(formData.rawr),
      // CRITICAL: Mark this as user-provided data
      dataSource: 'USER_PROVIDED',
      requiresAdminVerification: true,
      userProvidedAt: new Date().toISOString(),
      isFromMasterDatabase: false
    };
    console.log('🔍 Created manualVehicle:', manualVehicle);
    
    setSelectedVehicle(manualVehicle);
    setVehicleFound(true);
    setVariantFoundInMaster(false); // FALSE - because this is manual entry
    setInformationCorrect(false); // Reset confirmation for next step
    setShowManualForm(false); // Hide manual form after submission
    setIsModificationMode(false); // Reset modification mode
    
    console.log('🎉 Manual vehicle data submitted successfully!');
  };

  // Search vehicles by number plate
  const searchVehicleByPlate = async (plate, state) => {
    if (!plate || plate.length < 3) return;
    
    try {
      setLoading(true);
      setShowManualForm(false); // Reset manual form state
      setIsModificationMode(false); // Reset modification mode
      setError(''); // Clear any previous errors
      
      console.log('🔍 Searching for vehicle:', plate, state);
      const response = await axios.get(`/api/vehicles/by-plate/${encodeURIComponent(plate)}`, {
        params: { state }
      });
      
      console.log('🎯 Vehicle search response:', response.data);
      
      if (response.data?.success && response.data?.found) {
        const vehicleData = response.data.data.masterVehicle;
        const source = response.data.data.source;
        
        console.log('✅ Vehicle found:', vehicleData);
        console.log('📊 Source:', source);
        
        setSelectedVehicle(vehicleData);
        setVehicleFound(true);
        
        // Populate form with found vehicle data
        setFormData(prev => ({
          ...prev,
          ...vehicleData
        }));
        
        // If found from weigh history, show success message and move to next step
        if (source === 'weigh_history') {
          setError('');
          // Move to confirmation step since we have complete data
          setActiveStep(2);
        } else {
          // If from registry, stay on current step for confirmation
          setActiveStep(1);
        }
      } else {
        console.log('❌ Vehicle not found');
        setVehicleFound(false);
        setSelectedVehicle(null);
        setError('Vehicle not found in database. Please select vehicle details manually.');
        setShowManualForm(true);
        setActiveStep(1); // Move to dropdown selection step
      }
    } catch (error) {
      console.error('Error searching vehicle by plate:', error);
      setVehicleFound(false);
      setSelectedVehicle(null);
      setError('Error searching vehicle. Please try again or select vehicle details manually.');
      setShowManualForm(true);
      setActiveStep(1); // Move to dropdown selection step even on error
    } finally {
      setLoading(false);
    }
  };

  // Search master database for specific variant
  const searchMasterDatabase = async (make, model, year, variant) => {
    console.log('🔍 ===== SEARCH MASTER DATABASE CALLED =====');
    console.log('🔍 Parameters:', { make, model, year, variant });
    
    try {
      setLoading(true);
      console.log('🔍 Making API call to search master database...');
      const response = await axios.get('/api/vehicles/search', {
        params: { make, model, year, variant }
      });
      console.log('🔍 API response received:', response.data);
      console.log('🔍 Response structure check:');
      console.log('🔍 - response.data.success:', response.data?.success);
      console.log('🔍 - response.data.vehicles:', response.data?.vehicles);
      console.log('🔍 - response.data.vehicles.length:', response.data?.vehicles?.length);

      if (response.data?.success && response.data?.vehicles?.length > 0) {
        const masterVehicle = response.data.vehicles[0];
        console.log('🔍 Master vehicle found:', masterVehicle);

        // Check if basic vehicle info is present (always show vehicle if variant found)
        const hasBasicInfo = masterVehicle.make && masterVehicle.model && masterVehicle.year && masterVehicle.variant;
        console.log('🔍 Has basic vehicle info?', hasBasicInfo);
        
        // Check if compliance ratings are complete
        const hasCompleteRatings = masterVehicle.fawr && masterVehicle.rawr &&
                                 masterVehicle.gvm && masterVehicle.btc && masterVehicle.tbm && masterVehicle.gcm;
        console.log('🔍 Has complete ratings?', hasCompleteRatings);
        console.log('🔍 Ratings check:', {
          fawr: masterVehicle.fawr,
          rawr: masterVehicle.rawr,
          gvm: masterVehicle.gvm,
          btc: masterVehicle.btc,
          tbm: masterVehicle.tbm,
          gcm: masterVehicle.gcm
        });

        if (hasBasicInfo) {
          // Vehicle found - show details container regardless of rating completeness
          console.log('🔍 ===== SETTING SELECTED VEHICLE =====');
          console.log('🔍 About to set selectedVehicle to:', masterVehicle);
          setSelectedVehicle(masterVehicle);
          setVehicleFound(true);
          setVariantFoundInMaster(true);
          console.log('🔍 setSelectedVehicle called successfully');
          console.log('🔍 setVehicleFound(true) called');
          console.log('🔍 setVariantFoundInMaster(true) called');
          
          // Only auto-fill form data if ratings are complete
          if (hasCompleteRatings) {
            setFormData(prev => ({
              ...prev,
              fawr: masterVehicle.fawr,
              rawr: masterVehicle.rawr,
              gvm: masterVehicle.gvm,
              btc: masterVehicle.btc,
              tbm: masterVehicle.tbm,
              gcm: masterVehicle.gcm
            }));
            console.log('🔍 Form data updated with complete compliance ratings');
          } else {
            console.log('🔍 Ratings incomplete - manual entry form will be shown');
          }
          // Stay on current step to show vehicle specs and get user confirmation
        } else {
          // Basic vehicle info missing - Manual entry needed
          console.log('🔍 Variant found but basic info missing:', masterVehicle);
          setVehicleFound(false);
          setSelectedVehicle(null);
          setVariantFoundInMaster(false);
          // User will see manual entry form below dropdowns
        }
      } else {
        // Variant not found at all - Manual entry needed
        console.log('🔍 No variant found in master database');
        setVehicleFound(false);
        setSelectedVehicle(null);
        setVariantFoundInMaster(false);
        // User will see manual entry form below dropdowns
      }
    } catch (error) {
      console.error('🔍 ===== ERROR IN SEARCH MASTER DATABASE =====');
      console.error('🔍 Error:', error);
      setVehicleFound(false);
      setSelectedVehicle(null);
      setVariantFoundInMaster(false);
      // User will see manual entry form below dropdowns on error
    } finally {
      setLoading(false);
      console.log('🔍 Search master database completed, loading set to false');
    }
  };

  // Handle number plate change
  const handleNumberPlateChange = (e) => {
    const plate = e.target.value.toUpperCase();
    console.log('🔍 Number plate changed to:', plate);
    setFormData(prev => {
      const newData = { ...prev, numberPlate: plate };
      console.log('🔍 Updated formData:', newData);
      return newData;
    });
  };

  // Handle state change
  const handleStateChange = (e) => {
    const state = e.target.value;
    console.log('🔍 State changed to:', state);
    setFormData(prev => {
      const newData = { ...prev, state };
      console.log('🔍 Updated formData:', newData);
      return newData;
    });
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

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Final step - complete selection
      // Use selectedVehicle if it exists (manual entry), otherwise use formData
      console.log('🔍 selectedVehicle before final submission:', selectedVehicle);
      console.log('🔍 formData before final submission:', formData);
      
      const vehicleData = {
        ...(selectedVehicle || formData),
        numberPlate: formData.numberPlate, // Ensure number plate is included
        state: formData.state, // Ensure state is included
        complianceImage,
        noModificationsConfirmed,
        informationCorrect
      };
      
      console.log('🔍 Final vehicleData for submission:', vehicleData);
      
      // If this is a manual entry (user-provided data), submit to admin review
      console.log('🔍 Vehicle submission check:', {
        dataSource: vehicleData.dataSource,
        hasComplianceImage: !!complianceImage,
        vehicleData: vehicleData
      });
      console.log('🔍 Number plate and state in vehicleData:', {
        numberPlate: vehicleData.numberPlate,
        state: vehicleData.state
      });
      
      if (vehicleData.dataSource === 'USER_PROVIDED' && complianceImage) {
        try {
          setLoading(true);
          
          // Create FormData for file upload
          const formDataToSubmit = new FormData();
          
          // Append the file if provided (now optional)
          if (complianceImage) {
            formDataToSubmit.append('compliancePlatePhoto', complianceImage);
          }
          formDataToSubmit.append('make', vehicleData.make);
          formDataToSubmit.append('model', vehicleData.model);
          formDataToSubmit.append('series', vehicleData.series || '');
          formDataToSubmit.append('year', vehicleData.year);
          formDataToSubmit.append('variant', vehicleData.variant);
          formDataToSubmit.append('engine', vehicleData.engine || '');
          formDataToSubmit.append('transmission', vehicleData.transmission || 'Automatic');
          formDataToSubmit.append('tyreSize', vehicleData.tyreSize || '');
          formDataToSubmit.append('hasSubTank', vehicleData.hasSubTank || false);
          formDataToSubmit.append('fawr', vehicleData.fawr);
          formDataToSubmit.append('rawr', vehicleData.rawr);
          formDataToSubmit.append('gvm', vehicleData.gvm);
          formDataToSubmit.append('btc', vehicleData.btc);
          formDataToSubmit.append('tbm', vehicleData.tbm);
          formDataToSubmit.append('gcm', vehicleData.gcm);
          formDataToSubmit.append('numberPlate', vehicleData.numberPlate);
          formDataToSubmit.append('state', vehicleData.state);
          
          console.log('🚗 Submitting vehicle data to API...');
          const response = await axios.post('/api/submissions/vehicle', formDataToSubmit, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          console.log('✅ Vehicle submission response:', response.data);
          
          if (response.data.success) {
            // Show success message
            setError('');
           
            
            // Continue with the selection process
            onVehicleSelected(vehicleData);
            onVehicleDataChange(vehicleData);
          }
        } catch (error) {
          console.error('❌ Error submitting vehicle data:', error);
          console.error('❌ Error response:', error.response?.data);
          setError('Failed to submit vehicle data. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        // Standard selection - no submission needed
        onVehicleSelected(vehicleData);
        onVehicleDataChange(vehicleData);
      }
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  // Removed debounced search - now using structured dropdowns instead

  // Render step content
  const renderStepContent = (index) => {
    switch (index) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number Plate"
                value={formData.numberPlate}
                onChange={handleNumberPlateChange}
                placeholder="Enter number plate"
                InputProps={{
                  startAdornment: <VehicleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={formData.state}
                  label="State"
                  onChange={handleStateChange}
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
                onClick={() => {
                  console.log('🔍 Search button clicked with:', {
                    numberPlate: formData.numberPlate,
                    state: formData.state
                  });
                  
                  if (!formData.numberPlate || !formData.state) {
                    alert('Please enter both number plate and state before continuing.');
                    return;
                  }
                  
                  searchVehicleByPlate(formData.numberPlate, formData.state);
                }}
                disabled={!formData.numberPlate || !formData.state || loading}
                startIcon={<SearchIcon />}
                fullWidth
                size="large"
              >
                {loading ? 'Searching Database...' : 'Search Vehicle & Continue'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                This will search our database and auto-fill vehicle details if found
              </Typography>
              
              {/* Show what the user has entered */}
              {(formData.numberPlate || formData.state) && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    You entered:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Number Plate: <strong>{formData.numberPlate || 'Not entered'}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    State: <strong>{formData.state || 'Not selected'}</strong>
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>💡 Tip:</strong> If your vehicle is not found, you can manually select it from our database in the next step.
                </Typography>
              </Alert>
            </Grid>
            
            {loading && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">Searching vehicle database...</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Box>
            {(() => {
              console.log('🎯 ===== CHECKING VEHICLE DETAILS DISPLAY CONDITION =====');
              console.log('🎯 vehicleFound:', vehicleFound);
              console.log('🎯 selectedVehicle:', selectedVehicle);
              console.log('🎯 Condition result (vehicleFound && selectedVehicle):', !!(vehicleFound && selectedVehicle));
              return null;
            })()}
            
            {vehicleFound && selectedVehicle ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {console.log('🎯 ===== RENDERING VEHICLE DETAILS =====')}
                {console.log('🎯 Vehicle details are rendering!')}
                <Card sx={{ 
                  mb: 2, 
                  border: '2px solid', 
                  borderColor: 'success.main',
                  background: 'linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%)'
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 28 }} />
                      <Typography variant="h5" color="success.main" fontWeight="bold">
                        {selectedVehicle?.dataSource === 'USER_PROVIDED' 
                          ? 'Manual Vehicle Specifications ✏️' 
                          : 'Vehicle Specifications Found! ✅'
                        }
                      </Typography>
                    </Box>
                    
                    {selectedVehicle?.dataSource === 'USER_PROVIDED' ? (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                          📝 Data Source: User-Provided
                        </Typography>
                        <Typography variant="body2">
                          These specifications were manually entered by you from your vehicle's compliance plate. 
                          This data will be used for your current compliance check only and will be flagged for admin verification.
                        </Typography>
                      </Alert>
                    ) : (
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                        We found the following specifications for your selected vehicle in our verified database:
                      </Typography>
                    )}
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                          {(selectedVehicle?.make || formData?.make || 'Unknown')} {(selectedVehicle?.model || formData?.model || 'Model')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          Year: {(selectedVehicle?.year || formData?.year || 'N/A')} | State: {(selectedVehicle?.registrationState || formData?.state || 'N/A')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Number Plate: {(selectedVehicle?.numberPlate || formData?.numberPlate || 'N/A')}
                        </Typography>
                        {selectedVehicle?.series && (
                          <Typography variant="body2" color="text.secondary">
                            Series: {selectedVehicle.series}
                          </Typography>
                        )}
                        {!selectedVehicle?.series && formData?.series && (
                          <Typography variant="body2" color="text.secondary">
                            Series: {formData.series}
                          </Typography>
                        )}
                        {selectedVehicle?.variant && (
                          <Typography variant="body2" color="text.secondary">
                            Variant: {selectedVehicle.variant}
                          </Typography>
                        )}
                        {!selectedVehicle?.variant && formData?.variant && (
                          <Typography variant="body2" color="text.secondary">
                            Variant: {formData.variant}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'background.paper', 
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}>
                          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                            Vehicle Specifications:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            FAWR: {(selectedVehicle?.fawr ?? formData?.fawr ?? 'N/A')}kg | RAWR: {(selectedVehicle?.rawr ?? formData?.rawr ?? 'N/A')}kg
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            GVM: {(selectedVehicle?.gvm ?? formData?.gvm ?? 'N/A')}kg | GCM: {(selectedVehicle?.gcm ?? formData?.gcm ?? 'N/A')}kg
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            BTC: {(selectedVehicle?.btc ?? formData?.btc ?? 'N/A')}kg
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            TBM: {(selectedVehicle?.tbm ?? formData?.tbm ?? 'N/A')}kg
                          </Typography>
                          {selectedVehicle?.engine && (
                            <Typography variant="body2" color="text.secondary">
                              Engine: {selectedVehicle.engine}
                            </Typography>
                          )}
                          {selectedVehicle?.transmission && (
                            <Typography variant="body2" color="text.secondary">
                              Transmission: {selectedVehicle.transmission}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                    
                    {/* Show manual entry form if ratings are incomplete */}
                    {selectedVehicle && (!selectedVehicle.fawr || !selectedVehicle.rawr || 
                      !selectedVehicle.gvm || !selectedVehicle.btc || !selectedVehicle.tbm || !selectedVehicle.gcm) && (
                      <Box sx={{ mt: 3, p: 3, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="h6" color="warning.dark" gutterBottom fontWeight="bold">
                          ⚠️ Complete Vehicle Specifications Required
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          We found your vehicle but some compliance ratings are missing. Please complete the specifications below:
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              required
                              label="FAWR (kg) *"
                              type="number"
                              value={formData.fawr}
                              onChange={(e) => setFormData(prev => ({ ...prev, fawr: e.target.value }))}
                              helperText="Front Axle Weight Rating"
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              required
                              label="RAWR (kg) *"
                              type="number"
                              value={formData.rawr}
                              onChange={(e) => setFormData(prev => ({ ...prev, rawr: e.target.value }))}
                              helperText="Rear Axle Weight Rating"
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              required
                              label="GVM (kg) *"
                              type="number"
                              value={formData.gvm}
                              onChange={(e) => setFormData(prev => ({ ...prev, gvm: e.target.value }))}
                              helperText="Gross Vehicle Mass"
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              required
                              label="BTC (kg) *"
                              type="number"
                              value={formData.btc}
                              onChange={(e) => setFormData(prev => ({ ...prev, btc: e.target.value }))}
                              helperText="Breaked towing capacity"
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              required
                              label="TBM (kg) *"
                              type="number"
                              value={formData.tbm}
                              onChange={(e) => setFormData(prev => ({ ...prev, tbm: e.target.value }))}
                              helperText="Tow Ball Mass"
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              required
                              label="GCM (kg) *"
                              type="number"
                              value={formData.gcm}
                              onChange={(e) => setFormData(prev => ({ ...prev, gcm: e.target.value }))}
                              helperText="Gross Combination Mass"
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 3, p: 3, bgcolor: 'primary.light', borderRadius: 1, textAlign: 'center' }}>
                      <Typography variant="h6" color="primary.dark" gutterBottom fontWeight="bold">
                        🚗 Is this your vehicle specification?
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Please verify if the above details match your vehicle's compliance plate
                      </Typography>
                      
                      <Box display="flex" gap={2} justifyContent="center">
                        <Button 
                          variant="contained" 
                          color="success"
                          size="large"
                          onClick={() => {
                            // Check if manual entry is needed
                            const needsManualEntry = !formData.fawr || !formData.rawr || 
                              !formData.gvm || !formData.btc || !formData.tbm || !formData.gcm;
                            
                            if (needsManualEntry) {
                              // Show manual entry form
                              setShowManualForm(true);
                            } else {
                              // All data complete, proceed to next step
                              setInformationCorrect(true);
                              setActiveStep(2);
                            }
                          }}
                          disabled={selectedVehicle && (!formData.fawr || !formData.rawr || 
                            !formData.gvm || !formData.btc || !formData.tbm || !formData.gcm)}
                          sx={{ minWidth: 120 }}
                        >
                          {selectedVehicle && (!formData.fawr || !formData.rawr || 
                            !formData.gvm || !formData.btc || !formData.tbm || !formData.gcm) 
                            ? '⚠️ Complete Fields Above' 
                            : '✅ Yes, Correct'
                          }
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="warning"
                          size="large"
                          onClick={() => {
                            console.log('🔧 User clicked "Modification" - showing modification form');
                            setSelectedVehicle(null);
                            setVehicleFound(false);
                            setVariantFoundInMaster(false);
                            setIsModificationMode(true); // Set modification mode
                            setShowManualForm(true); // Explicitly show manual form
                            // This will trigger modification form
                          }}
                          sx={{ minWidth: 120 }}
                        >
                          🔧 Modification
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Vehicle not found in database
                  </Typography>
                  <Typography variant="body2">
                    The number plate "{formData.numberPlate}" was not found in our database. 
                    You can search for similar vehicles or enter the details manually.
                  </Typography>
                </Alert>
                
                <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                  🚗 Select Your Vehicle Manually
                </Typography>
                
                
                {/* Debug Info */}

                
                {/* Dropdown selection removed as requested */}

                {/* Auto-search Loading Indicator */}
                {formData.make && formData.model && formData.year && formData.variant && loading && (
                  <Box sx={{ mt: 3, textAlign: 'center', p: 3, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="h6" color="info.dark" gutterBottom>
                      🔍 Searching Database...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Looking for {formData.make} {formData.model} {formData.series ? formData.series + ' ' : ''}{formData.year} {formData.variant} specifications
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e0e0e0',
                        borderTop: '4px solid #1976d2',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto'
                      }}></div>
                    </Box>
                  </Box>
                )}


                
                  <Box sx={{ mt: 4, p: 3, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body1" fontWeight="bold">
                        {isModificationMode 
                          ? `Vehicle Modifications Detected`
                          : formData.make && formData.model && formData.year && formData.variant 
                            ? `Vehicle variant not found or incomplete data`
                            : `How to Find Your Vehicle’s Weigh Capacities`
                        }
                      </Typography>
                      <Typography variant="body2">
                        {isModificationMode 
                          ? `You've indicated that your "${formData.make} ${formData.model} ${formData.year} ${formData.variant}" has been modified from its original specifications. Please enter the updated compliance ratings from your modified vehicle's compliance plate.`
                          : formData.make && formData.model && formData.year && formData.variant 
                            ? `We couldn't find complete compliance data for "${formData.make} ${formData.model} ${formData.year} ${formData.variant}" in our database. Please enter the compliance ratings manually from your vehicle's compliance plate.`
                            : `Please enter your vehicle specifications manually. All fields marked with * are required for compliance checking.`
                        }
                      </Typography>
                    </Alert>
                    
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="body2" fontWeight="bold">
                        How to Find Your Vehicle’s Weigh Capacities
                      </Typography>
                      <Typography variant="body2">
                        • Owner’s Manual: Look under “Towing a Trailer” for Axle Group Loadings, GVM, GCM, BTC, and TBM.<br/>
                        • Online Search: Find your vehicle’s make, model, and year brochure (PDF) — the data is usually near the back.<br/>
                        • Check Modifications: Confirm the vehicle hasn’t been upgraded. Look for a sticker or plate on the door sill for accurate ratings.
                      </Typography>
                    </Alert>
                    
                    <Typography variant="h6" gutterBottom>
                      📝 {isModificationMode 
                        ? 'Modified Vehicle Compliance Entry' 
                        : formData.make && formData.model && formData.year && formData.variant 
                          ? 'Manual Compliance Entry' 
                          : 'How to Find Your Vehicle’s Weigh Capacities'
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {isModificationMode 
                        ? 'Please enter the updated compliance ratings for your modified vehicle. All fields marked with * are required.'
                        : formData.make && formData.model && formData.year && formData.variant 
                          ? 'Please enter your vehicle details manually. All fields marked with * are required.'
                          : 'How to Find Your Vehicle’s Weigh Capacities'
                      }
                    </Typography>
                    <Grid container spacing={2}>
                      {/* Vehicle Identification Fields */}
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
                          Vehicle Identification {formData.make && formData.model && formData.year && formData.variant ? '(Cannot be modified)' : ''}
                        </Typography>
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
                          label="Series"
                          value={formData.series}
                          onChange={(e) => setFormData(prev => ({ ...prev, series: e.target.value }))}
                          helperText="e.g., GR Sport, Sahara"
                          disabled={false}
                          sx={{}}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Year"
                          type="number"
                          value={formData.year}
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
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>Drive Type</InputLabel>
                          <Select
                            value={formData.variant}
                            label="Drive Type"
                            onChange={(e) => setFormData(prev => ({ ...prev, variant: e.target.value }))}
                          >
                            <MenuItem value="4x2">4x2</MenuItem>
                            <MenuItem value="4x4">4x4</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      
                      
                      {/* Compliance Rating Fields - CRITICAL FOR COMPLIANCE CHECK */}
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'error.main' }}>
                          🚨 Vehicle Compliance Ratings (Required)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Please enter the following values from your vehicle's compliance plate. These are essential for weight compliance checking.
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="FAWR (Front Axle Weight Rating) *"
                          type="number"
                          value={formData.fawr}
                          onChange={(e) => setFormData(prev => ({ ...prev, fawr: e.target.value }))}
                          helperText="Maximum front axle weight (kg)"
                          inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="RAWR (Rear Axle Weight Rating) *"
                          type="number"
                          value={formData.rawr}
                          onChange={(e) => setFormData(prev => ({ ...prev, rawr: e.target.value }))}
                          helperText="Maximum rear axle weight (kg)"
                          inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="GVM (Gross Vehicle Mass) *"
                          type="number"
                          value={formData.gvm}
                          onChange={(e) => setFormData(prev => ({ ...prev, gvm: e.target.value }))}
                          helperText="Maximum allowed weight of vehicle + load (kg)"
                          inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="GCM (Gross Combination Mass)"
                          type="number"
                          value={formData.gcm}
                          onChange={(e) => setFormData(prev => ({ ...prev, gcm: e.target.value }))}
                          helperText="Maximum weight of vehicle + trailer (kg)"
                          inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label=" BTC (Breaked Towing Capacity) *"
                          type="number"
                          value={formData.btc}
                          onChange={(e) => setFormData(prev => ({ ...prev, btc: e.target.value }))}
                          helperText="Breaked towing capacity"
                          inputProps={{ min: 0, step: 1 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="TBM (Tow Ball Mass) *"
                          type="number"
                          value={formData.tbm}
                          onChange={(e) => setFormData(prev => ({ ...prev, tbm: e.target.value }))}
                          helperText="Tow Ball Mass"
                          inputProps={{ min: 0, step: 1 }}
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
                            disabled={!formData.gvm || !formData.gcm || !formData.btc || !formData.tbm || !formData.fawr || !formData.rawr}
                            startIcon={<CheckCircleIcon />}
                          >
                            {isModificationMode 
                              ? 'Submit Modified Vehicle Data' 
                              : formData.make && formData.model && formData.year && formData.variant 
                                ? 'Submit Manual Vehicle Data' 
                                : 'Submit Manual Vehicle Data'
                            }
                          </Button>
                          <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                            {isModificationMode 
                              ? 'This will verify your modifications and proceed to confirmation'
                              : formData.make && formData.model && formData.year && formData.variant 
                                ? 'This will verify your entries and proceed to confirmation'
                                : 'This will verify your entries and proceed to confirmation'
                            }
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
              </motion.div>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Vehicle found! Please review the vehicle specifications below and confirm they are correct.
            </Alert>
            
            {/* Vehicle Specifications Display */}
            {(selectedVehicle || formData) && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Vehicle Specifications
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {/* Basic Vehicle Info */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Vehicle Details
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">Number Plate</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedVehicle?.numberPlate ?? formData?.numberPlate ?? 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">State</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedVehicle?.state ?? formData?.state ?? 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Make</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedVehicle?.make ?? formData?.make ?? 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Model</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedVehicle?.model ?? formData?.model ?? 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">Year</Typography>
                      <Typography variant="body1" fontWeight="medium">{selectedVehicle?.year ?? formData?.year ?? 'N/A'}</Typography>
                    </Grid>
                    {(selectedVehicle?.variant || formData?.variant) && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary">Variant</Typography>
                        <Typography variant="body1" fontWeight="medium">{selectedVehicle?.variant ?? formData?.variant}</Typography>
                      </Grid>
                    )}
                    
                    {/* Compliance Specifications */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
                        Compliance Specifications
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">GVM (Gross Vehicle Mass)</Typography>
                      <Typography variant="body1" fontWeight="medium">{(selectedVehicle?.gvm ?? formData?.gvm ?? 'N/A')} kg</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">GCM (Gross Combination Mass)</Typography>
                      <Typography variant="body1" fontWeight="medium">{(selectedVehicle?.gcm ?? formData?.gcm ?? 'N/A')} kg</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">BTC (Braked Towing Capacity)</Typography>
                      <Typography variant="body1" fontWeight="medium">{(selectedVehicle?.btc ?? formData?.btc ?? 'N/A')} kg</Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="text.secondary">TBM (Tow Ball Mass)</Typography>
                      <Typography variant="body1" fontWeight="medium">{(selectedVehicle?.tbm ?? formData?.tbm ?? 'N/A')} kg</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">FAWR (Front Axle Weight Rating)</Typography>
                      <Typography variant="body1" fontWeight="medium">{(selectedVehicle?.fawr ?? formData?.fawr ?? 'N/A')} kg</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">RAWR (Rear Axle Weight Rating)</Typography>
                      <Typography variant="body1" fontWeight="medium">{(selectedVehicle?.rawr ?? formData?.rawr ?? 'N/A')} kg</Typography>
                    </Grid>
                    
                    {/* Data Source Info */}
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                        Source: {(selectedVehicle?.dataSource === 'USER_PROVIDED' || formData?.dataSource === 'USER_PROVIDED') ? 'User-provided / completed' : 'Master database'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Please verify the vehicle information is correct and confirm no modifications have been made.
            </Alert>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={informationCorrect}
                  onChange={(e) => setInformationCorrect(e.target.checked)}
                />
              }
              label="I confirm the vehicle information is correct"
              sx={{ mb: 1 }}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={noModificationsConfirmed}
                  onChange={(e) => setNoModificationsConfirmed(e.target.checked)}
                />
              }
              label="I confirm there have been no modifications to the vehicle's compliance specifications"
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            {/* Only show photo upload section for manual specification entries */}
            {showManualForm ? (
              <>
                <Typography variant="body1" gutterBottom>
                  Upload an image of the vehicle's compliance plate for verification (optional).
                </Typography>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={imageUploading ? <CircularProgress size={20} /> : <UploadIcon />}
                  disabled={imageUploading}
                  sx={{ mb: 2 }}
                >
                  Upload Compliance Plate Image (Optional)
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                
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
            ) : (
              /* Commented out photo upload section for dropdown-selected vehicles - may be used in future */
              <>
                {/* 
                <Typography variant="body1" gutterBottom>
                  Upload an image of the vehicle's compliance plate for verification (optional).
                </Typography>
                
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={imageUploading ? <CircularProgress size={20} /> : <UploadIcon />}
                  disabled={imageUploading}
                  sx={{ mb: 2 }}
                >
                  Upload Compliance Plate Image (Optional)
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Button>
                
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
                */}
                <Typography variant="body1" gutterBottom>
                  Vehicle information has been verified from our database. You can proceed to the next step.
                </Typography>
              </>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Vehicle Selection Process
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
                                    {(index === 1 && vehicleFound && informationCorrect) && (
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
                      {showManualForm ? 'Continue to Image Upload' : 'Continue to Final Step'}
                  </Button>
                  )}
                  
                  {index === 3 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                      disabled={false}
                    sx={{ mr: 1 }}
                  >
                      Complete Vehicle Selection
                  </Button>
                  )}
                  
                  {/* Back button for all steps except first */}
                  {index > 0 && (
                  <Button
                    onClick={handleBack}
                      variant="outlined"
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

export default VehicleSelectionFlow;
