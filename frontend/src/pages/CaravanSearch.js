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
  DirectionsCar as CaravanIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import axios from 'axios';

const CaravanSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedCaravan, setSelectedCaravan] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch caravans with corrected parameters
  const { data: caravansData, isLoading, error } = useQuery(
    ['caravans', makeFilter, modelFilter, yearFilter, searchTerm],
    async () => {
      const params = {
        ...(makeFilter && { make: makeFilter }),
        ...(modelFilter && { model: modelFilter }),
        ...(yearFilter && { year: yearFilter }),
        ...(searchTerm && { model: searchTerm }) // Use searchTerm as model filter
      };

      console.log('🔍 Searching caravans with params:', params);
      const response = await axios.get('/api/caravans/search', { params });
      console.log('📦 Caravan search response:', response.data);
      return response.data;
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true // Always fetch on mount
    }
  );

  // Fetch makes
  const { data: makesData } = useQuery(
    'caravanMakes',
    async () => {
      const response = await axios.get('/api/caravans/makes');
      return response.data;
    }
  );

  // Fetch models by make
  const { data: modelsData, isLoading: modelsLoading } = useQuery(
    ['caravanModels', makeFilter],
    async () => {
      if (!makeFilter) return [];
      const response = await axios.get('/api/caravans/models', { params: { make: makeFilter } });
      return response.data;
    },
    { enabled: !!makeFilter }
  );

  // Fetch years by make and model
  const { data: yearsData, isLoading: yearsLoading } = useQuery(
    ['caravanYears', makeFilter, modelFilter],
    async () => {
      if (!makeFilter || !modelFilter) return [];
      const response = await axios.get('/api/caravans/years', { params: { make: makeFilter, model: modelFilter } });
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

  const handleViewDetails = (caravan) => {
    setSelectedCaravan(caravan);
    setDetailDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailDialogOpen(false);
    setSelectedCaravan(null);
  };

  const getComplianceChip = (caravan) => {
    const hasSpecs = caravan.atm && caravan.gtm && caravan.axleCapacity;
    return hasSpecs ? 
      <Chip label="Specs Available" color="success" size="small" icon={<CheckCircleIcon />} /> :
      <Chip label="Specs Missing" color="warning" size="small" icon={<WarningIcon />} />;
  };

  // Extract data from API responses
  const caravans = caravansData?.caravans || [];
  const makes = makesData?.makes || [];
  const models = modelsData?.models || [];
  const years = yearsData?.years || [];

  // Debug logging
  console.log('🔍 Debug - caravansData:', caravansData);
  console.log('🔍 Debug - caravans array:', caravans);
  console.log('🔍 Debug - makes:', makes);
  console.log('🔍 Debug - models:', models);
  console.log('🔍 Debug - years:', years);

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom>
          Caravan Search
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Search and view caravan specifications for compliance checking
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
              placeholder="Search caravan models..."
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
               sx={{ mb: 1 }}
             >
               Clear Filters
             </Button>
             <Button
               fullWidth
               variant="contained"
               onClick={() => {
                 // Force a refresh of the search
                 window.location.reload();
               }}
               startIcon={<SearchIcon />}
             >
               Show All Caravans
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
          Error loading caravans: {error.message}
        </Alert>
      )}

      {/* Caravan Results */}
      {caravans.length > 0 ? (
        <Grid container spacing={2}>
          {caravans.map((caravan) => (
            <Grid item xs={12} md={6} lg={4} key={caravan._id}>
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
                          {caravan.make} {caravan.model}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Year: {caravan.year}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(caravan)}
                        aria-label="view details"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      {getComplianceChip(caravan)}
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          ATM
                        </Typography>
                        <Typography variant="body2">
                          {caravan.atm ? `${caravan.atm}kg` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          GTM
                        </Typography>
                        <Typography variant="body2">
                          {caravan.gtm ? `${caravan.gtm}kg` : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Length
                        </Typography>
                        <Typography variant="body2">
                          {caravan.length ? `${caravan.length}m` : 'N/A'}
                        </Typography>
                      </Grid>
                                             <Grid item xs={6}>
                         <Typography variant="caption" color="text.secondary">
                           Axle Capacity
                         </Typography>
                         <Typography variant="body2">
                           {caravan.axleCapacity ? `${caravan.axleCapacity}kg` : 'N/A'}
                         </Typography>
                       </Grid>
                    </Grid>

                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewDetails(caravan)}
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
            <CaravanIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No caravans found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria
            </Typography>
          </Paper>
        )
      )}

      {/* Caravan Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedCaravan?.make} {selectedCaravan?.model} ({selectedCaravan?.year})
            </Typography>
            <IconButton onClick={handleCloseDetails}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedCaravan && (
            <TableContainer>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Make</TableCell>
                    <TableCell>{selectedCaravan.make}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell>{selectedCaravan.model}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Year</TableCell>
                    <TableCell>{selectedCaravan.year}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Length</TableCell>
                    <TableCell>{selectedCaravan.length ? `${selectedCaravan.length}m` : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ATM (Aggregate Trailer Mass)</TableCell>
                    <TableCell>{selectedCaravan.atm ? `${selectedCaravan.atm}kg` : 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GTM (Gross Trailer Mass)</TableCell>
                    <TableCell>{selectedCaravan.gtm ? `${selectedCaravan.gtm}kg` : 'N/A'}</TableCell>
                  </TableRow>
                                     <TableRow>
                     <TableCell>Axle Capacity</TableCell>
                     <TableCell>{selectedCaravan.axleCapacity ? `${selectedCaravan.axleCapacity}kg` : 'N/A'}</TableCell>
                   </TableRow>
                  <TableRow>
                    <TableCell>Axle Count</TableCell>
                    <TableCell>{selectedCaravan.axleCount || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fuel Type</TableCell>
                    <TableCell>{selectedCaravan.fuelType || 'N/A'}</TableCell>
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

export default CaravanSearch;