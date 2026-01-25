import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  DirectionsCar as VehicleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import axios from 'axios';

const VehicleSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch vehicles with corrected parameters
  const { data: vehiclesData, isLoading, error } = useQuery(
    ['vehicles', makeFilter, modelFilter, yearFilter, searchTerm],
    async () => {
      const params = {
        ...(makeFilter && { make: makeFilter }),
        ...(modelFilter && { model: modelFilter }),
        ...(yearFilter && { year: yearFilter }),
        ...(searchTerm && { variant: searchTerm }) // Use searchTerm as variant filter for more flexible search
      };

      const response = await axios.get('/api/vehicles/search', { params });
      return response.data;
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  );

  // Fetch makes
  const { data: makesData } = useQuery(
    'vehicleMakes',
    async () => {
      const response = await axios.get('/api/vehicles/makes');
      return response.data;
    }
  );

  // Fetch models by make
  const { data: modelsData, isLoading: modelsLoading } = useQuery(
    ['vehicleModels', makeFilter],
    async () => {
      if (!makeFilter) return [];
      const response = await axios.get('/api/vehicles/models', { params: { make: makeFilter } });
      return response.data;
    },
    { enabled: !!makeFilter }
  );

  // Fetch years by make and model
  const { data: yearsData, isLoading: yearsLoading } = useQuery(
    ['vehicleYears', makeFilter, modelFilter],
    async () => {
      if (!makeFilter || !modelFilter) return [];
      const response = await axios.get('/api/vehicles/years', { params: { make: makeFilter, model: modelFilter } });
      return response.data;
    },
    { enabled: !!makeFilter && !!modelFilter }
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleMakeFilter = (event) => {
    setMakeFilter(event.target.value);
    setModelFilter(''); // Reset model when make changes
    setYearFilter('');  // Reset year when make changes
  };

  const handleModelFilter = (event) => {
    setModelFilter(event.target.value);
    setYearFilter('');  // Reset year when model changes
  };

  const handleYearFilter = (event) => {
    setYearFilter(event.target.value);
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDetailDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailDialogOpen(false);
    setSelectedVehicle(null);
  };

  const getComplianceChip = (vehicle) => {
    const hasSpecs = vehicle.gvm && vehicle.gcm && vehicle.fawr && vehicle.rawr;
    return hasSpecs ? 
      <Chip label="Specs Available" color="success" size="small" icon={<CheckCircleIcon />} /> :
      <Chip label="Specs Missing" color="warning" size="small" icon={<WarningIcon />} />;
  };

  // Extract data from API responses
  const vehicles = vehiclesData?.vehicles || [];
  const makes = makesData?.makes || [];
  const models = modelsData?.models || [];
  const years = yearsData?.years || [];

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom>
          Vehicle Search
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Search and view vehicle specifications for compliance checking
        </Typography>
      </motion.div>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search Models"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search vehicle models..."
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Make</InputLabel>
              <Select
                value={makeFilter}
                label="Make"
                onChange={handleMakeFilter}
              >
                <MenuItem value="">All Makes</MenuItem>
                {makes.map((make) => (
                  <MenuItem key={make} value={make}>
                    {make}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Model</InputLabel>
              <Select
                value={modelFilter}
                label="Model"
                onChange={handleModelFilter}
                disabled={!makeFilter || modelsLoading}
              >
                <MenuItem value="">All Models</MenuItem>
                {models.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
              {modelsLoading && <CircularProgress size={20} sx={{ position: 'absolute', right: 10, top: '50%' }} />}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={yearFilter}
                label="Year"
                onChange={handleYearFilter}
                disabled={!makeFilter || !modelFilter || yearsLoading}
              >
                <MenuItem value="">All Years</MenuItem>
                {years.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
              {yearsLoading && <CircularProgress size={20} sx={{ position: 'absolute', right: 10, top: '50%' }} />}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setMakeFilter('');
                setModelFilter('');
                setYearFilter('');
              }}
              startIcon={<FilterListIcon />}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading vehicles: {error.message}
        </Alert>
      )}

      {/* Vehicle Results */}
      {vehicles.length > 0 ? (
        <Grid container spacing={2}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} md={6} lg={4} key={vehicle._id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {vehicle.make} {vehicle.model}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Year: {vehicle.year}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(vehicle)}
                        aria-label="view details"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      {getComplianceChip(vehicle)}
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          GVM
                        </Typography>
                        <Typography variant="body2">
                          {vehicle.gvm ? `${vehicle.gvm}kg` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          GCM
                        </Typography>
                        <Typography variant="body2">
                          {vehicle.gcm ? `${vehicle.gcm}kg` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          FAWR
                        </Typography>
                        <Typography variant="body2">
                          {vehicle.fawr ? `${vehicle.fawr}kg` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          RAWR
                        </Typography>
                        <Typography variant="body2">
                          {vehicle.rawr ? `${vehicle.rawr}kg` : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(vehicle)}
                      sx={{ mt: 2 }}
                      startIcon={<VisibilityIcon />}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      ) : (
        !isLoading && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <VehicleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No vehicles found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria
            </Typography>
          </Paper>
        )
      )}

      {/* Vehicle Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.year})
            </Typography>
            <IconButton onClick={handleCloseDetails}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedVehicle && (
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Make</TableCell>
                    <TableCell>{selectedVehicle.make}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell>{selectedVehicle.model}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Year</TableCell>
                    <TableCell>{selectedVehicle.year}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GVM</TableCell>
                    <TableCell>{selectedVehicle.gvm} kg</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GCM</TableCell>
                    <TableCell>{selectedVehicle.gcm} kg</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>FAWR</TableCell>
                    <TableCell>{selectedVehicle.fawr ? `${selectedVehicle.fawr} kg` : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>RAWR</TableCell>
                    <TableCell>{selectedVehicle.rawr ? `${selectedVehicle.rawr} kg` : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>BTC</TableCell>
                    <TableCell>{selectedVehicle.btc} kg</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Engine</TableCell>
                    <TableCell>{selectedVehicle.engine || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Transmission</TableCell>
                    <TableCell>{selectedVehicle.transmission || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Series</TableCell>
                    <TableCell>{selectedVehicle.series || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Variant</TableCell>
                    <TableCell>{selectedVehicle.variant || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehicleSearch;