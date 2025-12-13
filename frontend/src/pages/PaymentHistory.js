import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useQuery } from 'react-query';
import axios from 'axios';

const PaymentHistory = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error } = useQuery(
    ['paymentHistory', page, rowsPerPage],
    async () => {
      const params = new URLSearchParams({ page: page + 1, limit: rowsPerPage });
      const response = await axios.get(`/api/payments/history?${params}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false
    }
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error loading payment history: {error.message}
      </Alert>
    );
  }

  const payments = data?.payments || [];

  const statusChip = (status) => {
    const map = {
      completed: 'success',
      pending: 'warning',
      failed: 'error',
      refunded: 'info',
      included_in_subscription: 'default'
    };
    return <Chip label={status} color={map[status] || 'default'} size="small" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payment History
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        View your transactions and subscription-included weighs
      </Typography>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Caravan</TableCell>
                <TableCell align="right">Amount (AUD)</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{p.vehicleNumberPlate || '-'}</TableCell>
                    <TableCell>{p.caravanNumberPlate || '-'}</TableCell>
                    <TableCell align="right">{(p.payment?.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{p.payment?.method}</TableCell>
                    <TableCell>{statusChip(p.payment?.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={data?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default PaymentHistory;


