import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Button,
  Grid,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Scale as ScaleIcon,
  ScaleOutlined as PortableScaleIcon,
  DirectionsCarFilled as WeighbridgeIcon,
  HelpOutline as HelpIcon
} from '@mui/icons-material';

const WeighingMethodSelection = ({ onSelectMethod, onNext }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [selectedWeighbridgeType, setSelectedWeighbridgeType] = useState('');

  const handleMethodChange = (event) => {
    setSelectedMethod(event.target.value);
    setSelectedWeighbridgeType('');
  };

  const handleWeighbridgeTypeChange = (event) => {
    setSelectedWeighbridgeType(event.target.value);
  };

  const handleNext = () => {
    if (!selectedMethod) return;
    
    const methodData = {
      method: selectedMethod,
      weighbridgeType: selectedMethod === 'weighbridge' ? selectedWeighbridgeType : null
    };
    
    onSelectMethod(methodData);
    onNext();
  };

  return (
    <Card elevation={3} sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 4 }}>
          <ScaleIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Select Weighing Method
        </Typography>
        
        <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
          <RadioGroup
            aria-label="weighing-method"
            name="weighing-method"
            value={selectedMethod}
            onChange={handleMethodChange}
          >
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                mb: 2,
                borderColor: selectedMethod === 'portable' ? 'primary.main' : 'divider',
                bgcolor: selectedMethod === 'portable' ? 'action.hover' : 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  cursor: 'pointer'
                }
              }}
              onClick={() => setSelectedMethod('portable')}
            >
              <FormControlLabel
                value="portable"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PortableScaleIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Portable Scales</Typography>
                    <Tooltip title="Use individual wheel scales for measuring each wheel's weight">
                      <HelpIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
              {selectedMethod === 'portable' && (
                <Box sx={{ ml: 4, mt: 1, color: 'text.secondary' }}>
                  <Typography variant="body2">
                    Measure individual tyre weights using portable scales for precise weight distribution.
                  </Typography>
                </Box>
              )}
            </Paper>

            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2,
                borderColor: selectedMethod === 'weighbridge' ? 'primary.main' : 'divider',
                bgcolor: selectedMethod === 'weighbridge' ? 'action.hover' : 'background.paper',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                  cursor: 'pointer'
                }
              }}
              onClick={() => setSelectedMethod('weighbridge')}
            >
              <FormControlLabel
                value="weighbridge"
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WeighbridgeIcon sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Weighbridge</Typography>
                    <Tooltip title="Use a professional weighbridge for accurate total weight measurement">
                      <HelpIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
              
              {selectedMethod === 'weighbridge' && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <FormControl component="fieldset" sx={{ width: '100%' }}>
                    <FormLabel component="legend" sx={{ mb: 1, color: 'text.primary' }}>
                      Weighbridge Type:
                    </FormLabel>
                    <RadioGroup
                      aria-label="weighbridge-type"
                      name="weighbridge-type"
                      value={selectedWeighbridgeType}
                      onChange={handleWeighbridgeTypeChange}
                    >
                      <FormControlLabel 
                        value="in-ground" 
                        control={<Radio size="small" />} 
                        label="In-Ground Weighbridge" 
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel 
                        value="on-weigh" 
                        control={<Radio size="small" />} 
                        label="On-Weigh Weighbridge" 
                        sx={{ mb: 1 }}
                      />
                      <FormControlLabel 
                        value="above-ground" 
                        control={<Radio size="small" />} 
                        label="Above-Ground Weighbridge" 
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
              )}
            </Paper>
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={!selectedMethod || (selectedMethod === 'weighbridge' && !selectedWeighbridgeType)}
            endIcon={<span>→</span>}
          >
            Next
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WeighingMethodSelection;
