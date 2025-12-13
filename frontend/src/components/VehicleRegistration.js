import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  DirectionsCar as VehicleIcon,
  HelpOutline as HelpIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudUpload as CloudUploadIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';

const VehicleRegistration = ({
  initialData = {},
  onSave,
  onNext,
  onBack,
  loading = false,
  error = null,
  isCaravan = false
}) => {
  const [formData, setFormData] = useState({
    registrationNumber: '',
    state: '',
    make: '',
    model: '',
    year: '',
    vin: '',
    tareWeight: '',
    gvm: '',
    gcm: '',
    atm: '',
    tyreSize: '',
    tyreLoadRating: '',
    gtm: '',
    ballWeight: ''
  });

  const [images, setImages] = useState([]);
  const [isExistingRecord, setIsExistingRecord] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        registrationNumber: initialData.registration || initialData.registrationNumber || '',
        state: initialData.state || '',
        make: initialData.make || '',
        model: initialData.model || '',
        year: initialData.year || '',
        vin: initialData.vin || '',
        tareWeight: initialData.tareWeight || '',
        gvm: initialData.gvm || '',
        gcm: initialData.gcm || '',
        atm: initialData.atm || '',
        tyreSize: initialData.tyreSize || '',
        tyreLoadRating: initialData.tyreLoadRating || '',
        gtm: initialData.gtm || '',
        ballWeight: initialData.ballWeight || ''
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const handleSearch = () => {
    setSearchPerformed(true);
    
    setTimeout(() => {
      const mockData = {
        registrationNumber: formData.registrationNumber,
        state: formData.state,
        make: 'Toyota',
        model: 'LandCruiser',
        year: '2020',
        vin: 'JTMRJ3FV0MD123456',
        tareWeight: '2500',
        gvm: '3350',
        gcm: '6850',
        atm: '3500',
        tyreSize: '265/65R17',
        tyreLoadRating: '121/118' 
      };
      
      setFormData(prev => ({
        ...prev,
        ...mockData
      }));
      
      setIsExistingRecord(true);
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      const dataToSave = {
        registration: formData.registrationNumber,
        registrationNumber: formData.registrationNumber,
        state: formData.state,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        vin: formData.vin,
        tareWeight: formData.tareWeight,
        gvm: formData.gvm,
        gcm: formData.gcm,
        atm: formData.atm,
        tyreSize: formData.tyreSize,
        tyreLoadRating: formData.tyreLoadRating,
        gtm: formData.gtm,
        ballWeight: formData.ballWeight,
        images
      };
      console.log('Calling onSave with:', dataToSave);
      onSave(dataToSave);
    }
  };

  const canSearch = formData.registrationNumber && formData.state;
  const canProceed = formData.registrationNumber && formData.state && formData.make && formData.model;

  return (
    <Card elevation={3} sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <VehicleIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h5" component="h2">
            {isExistingRecord 
              ? `Confirm ${isCaravan ? 'Caravan' : 'Vehicle'} Details` 
              : `Enter ${isCaravan ? 'Caravan' : 'Vehicle'} Registration`}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Registration Number"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                required
                disabled={isExistingRecord}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {isExistingRecord ? (
                        <CheckCircleIcon color="success" />
                      ) : searchPerformed ? (
                        <ErrorIcon color="error" />
                      ) : null}
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel>State</InputLabel>
                <Select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  label="State"
                  disabled={isExistingRecord}
                >
                  <MenuItem value=""><em>Select State</em></MenuItem>
                  <MenuItem value="NSW">NSW</MenuItem>
                  <MenuItem value="VIC">VIC</MenuItem>
                  <MenuItem value="QLD">QLD</MenuItem>
                  <MenuItem value="WA">WA</MenuItem>
                  <MenuItem value="SA">SA</MenuItem>
                  <MenuItem value="TAS">TAS</MenuItem>
                  <MenuItem value="NT">NT</MenuItem>
                  <MenuItem value="ACT">ACT</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {!isExistingRecord && canSearch && !searchPerformed && (
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  disabled={!canSearch}
                  fullWidth
                >
                  Search Registration
                </Button>
              </Grid>
            )}

            {searchPerformed && (
              <>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Make"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    type="number"
                    inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="VIN/Chassis Number"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                  />
                </Grid>
                {!isCaravan && (
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Tare Weight (kg)"
                      name="tareWeight"
                      value={formData.tareWeight}
                      onChange={handleChange}
                      type="number"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                      }}
                    />
                  </Grid>
                )}
                {!isCaravan && (
                  <>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="GVM (kg)"
                        name="gvm"
                        value={formData.gvm}
                        onChange={handleChange}
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="GCM (kg)"
                        name="gcm"
                        value={formData.gcm}
                        onChange={handleChange}
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </>
                )}
                {isCaravan && (
                  <>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="ATM (kg)"
                        name="atm"
                        value={formData.atm}
                        onChange={handleChange}
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="GTM (kg)"
                        name="gtm"
                        value={formData.gtm}
                        onChange={handleChange}
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="Ball Weight (kg)"
                        name="ballWeight"
                        value={formData.ballWeight}
                        onChange={handleChange}
                        type="number"
                        InputProps={{
                          endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                        }}
                      />
                    </Grid>
                  </>
                )}
                {!isCaravan && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tyre Size"
                        name="tyreSize"
                        value={formData.tyreSize}
                        onChange={handleChange}
                        placeholder="e.g., 265/65R17"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tyre Load Rating"
                        name="tyreLoadRating"
                        value={formData.tyreLoadRating}
                        onChange={handleChange}
                        placeholder="e.g., 121/118"
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Vehicle Images (Optional)
                      <Tooltip title="Upload images of your vehicle for reference">
                        <HelpIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                      </Tooltip>
                    </Typography>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="vehicle-image-upload"
                      type="file"
                      multiple
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="vehicle-image-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUploadIcon />}
                        sx={{ mr: 2 }}
                      >
                        Upload Images
                      </Button>
                    </label>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCameraIcon />}
                      component="label"
                    >
                      Take Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                      />
                    </Button>
                    
                    {images.length > 0 && (
                      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {images.map((img, index) => (
                          <Paper 
                            key={index} 
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              overflow: 'hidden',
                              position: 'relative',
                              '&:hover .delete-overlay': {
                                opacity: 1,
                              },
                            }}
                          >
                            <img 
                              src={typeof img === 'string' ? img : URL.createObjectURL(img)} 
                              alt={`Vehicle ${index + 1}`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                            <Box 
                              className="delete-overlay"
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                cursor: 'pointer',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setImages(prev => prev.filter((_, i) => i !== index));
                              }}
                            >
                              <Typography variant="caption" color="white">
                                Remove
                              </Typography>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Grid>
              </>
            )}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            {onBack && (
              <Button
                variant="outlined"
                onClick={onBack}
                disabled={loading}
              >
                Back
              </Button>
            )}
            
            <Box sx={{ flex: 1 }} />
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!canProceed || loading}
              endIcon={loading ? <CircularProgress size={20} /> : <span>→</span>}
            >
              {loading ? 'Saving...' : 'Continue'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default VehicleRegistration;
