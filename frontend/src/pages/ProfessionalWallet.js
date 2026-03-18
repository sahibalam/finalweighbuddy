import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import axios from 'axios';

const ProfessionalWallet = () => {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [requestedBalance, setRequestedBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [cashoutOpen, setCashoutOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutNote, setCashoutNote] = useState('');
  const [cashoutError, setCashoutError] = useState('');
  const [isSubmittingCashout, setIsSubmittingCashout] = useState(false);

  const fetchWallet = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [summaryRes, txRes] = await Promise.all([
        axios.get('/api/wallet/summary'),
        axios.get('/api/wallet/transactions'),
      ]);

      if (summaryRes?.data?.success) {
        setAvailableBalance(Number(summaryRes.data.availableBalance || 0));
        setRequestedBalance(Number(summaryRes.data.requestedBalance || 0));
      }

      if (txRes?.data?.success) {
        setTransactions(Array.isArray(txRes.data.transactions) ? txRes.data.transactions : []);
      }
    } catch (e) {
      setLoadError('Failed to load wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const openCashout = () => {
    setCashoutAmount('');
    setCashoutNote('');
    setCashoutError('');
    setCashoutOpen(true);
  };

  const closeCashout = () => {
    setCashoutOpen(false);
  };

  const handleSendRequest = async () => {
    const n = Number(cashoutAmount);
    if (!Number.isFinite(n) || n <= 0) {
      setCashoutError('Enter a valid cashout amount.');
      return;
    }

    setIsSubmittingCashout(true);
    setCashoutError('');
    try {
      const res = await axios.post('/api/wallet/cashout-requests', {
        amount: n,
        note: cashoutNote,
      });

      if (res?.data?.success) {
        await fetchWallet();
        setCashoutOpen(false);
      } else {
        setCashoutError(res?.data?.message || 'Failed to send cashout request.');
      }
    } catch (e) {
      setCashoutError(e?.response?.data?.message || 'Failed to send cashout request.');
    } finally {
      setIsSubmittingCashout(false);
    }
  };

  const formattedTransactions = useMemo(() => {
    return (Array.isArray(transactions) ? transactions : []).map((t) => {
      const isDebit = String(t?.type || '').toLowerCase() === 'debit';
      const isCashout = String(t?.source || '').toLowerCase() === 'cashout';

      const diyName = t?.diyUser?.name || t?.diyUser?.email || 'DIY User';
      const vehicle = t?.vehicleRego ? String(t.vehicleRego).toUpperCase() : '';
      const trailer = t?.trailerRego ? String(t.trailerRego).toUpperCase() : '';
      const label = vehicle && trailer ? `${vehicle} + ${trailer}` : vehicle || trailer || t?.setupKey || 'Weigh credit';
      const when = t?.createdAt ? new Date(t.createdAt) : null;
      const whenLabel = when && !Number.isNaN(when.getTime()) ? when.toLocaleString() : '';
      return {
        id: t?.id,
        type: t?.type,
        source: t?.source,
        isDebit,
        isCashout,
        diyName,
        label,
        amount: Number(t?.amount || 0),
        sign: isDebit ? -1 : 1,
        statusLabel: isCashout ? 'Paid' : '',
        whenLabel,
      };
    });
  }, [transactions]);

  const creditRows = useMemo(() => {
    return formattedTransactions.filter((t) => !t.isCashout && !t.isDebit);
  }, [formattedTransactions]);

  const cashoutRows = useMemo(() => {
    return formattedTransactions.filter((t) => t.isCashout && t.isDebit);
  }, [formattedTransactions]);

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Wallet
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Available Balance
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              ${availableBalance.toFixed(2)}
            </Typography>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Requested Balance
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                ${Number(requestedBalance || 0).toFixed(2)}
              </Typography>
              <Button variant="contained" onClick={openCashout}>
                Cashout
              </Button>
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Credits
          </Typography>
          <Button variant="outlined" onClick={fetchWallet} disabled={isLoading}>
            Refresh
          </Button>
        </Box>

        {loadError ? (
          <Typography variant="body2" color="error">
            {loadError}
          </Typography>
        ) : null}

        {isLoading ? (
          <Typography variant="body2">Loading...</Typography>
        ) : creditRows.length === 0 ? (
          <Typography variant="body2">No wallet credits yet.</Typography>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {creditRows.map((t) => (
              <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                    {t.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {t.diyName}{t.whenLabel ? ` · ${t.whenLabel}` : ''}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  {t.sign >= 0 ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Cashouts
          </Typography>
          <Button variant="outlined" onClick={fetchWallet} disabled={isLoading}>
            Refresh
          </Button>
        </Box>

        {loadError ? (
          <Typography variant="body2" color="error">
            {loadError}
          </Typography>
        ) : null}

        {isLoading ? (
          <Typography variant="body2">Loading...</Typography>
        ) : cashoutRows.length === 0 ? (
          <Typography variant="body2">No paid cashouts yet.</Typography>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {cashoutRows.map((t) => (
              <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
                    Cashout
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Paid{t.whenLabel ? ` · ${t.whenLabel}` : ''}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  -${Math.abs(t.amount).toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={cashoutOpen} onClose={closeCashout} fullWidth maxWidth="sm">
        <DialogTitle>Cashout Request</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Available Balance"
              value={`$${availableBalance.toFixed(2)}`}
              InputProps={{ readOnly: true }}
              fullWidth
            />
            <TextField
              label="Cashout Amount"
              value={cashoutAmount}
              onChange={(e) => setCashoutAmount(e.target.value)}
              fullWidth
              placeholder="Enter amount"
              inputProps={{ inputMode: 'decimal' }}
            />
            <TextField
              label="Note (optional)"
              value={cashoutNote}
              onChange={(e) => setCashoutNote(e.target.value)}
              fullWidth
              placeholder="Add a note for the superadmin"
            />
            {cashoutError ? (
              <Typography variant="body2" color="error">
                {cashoutError}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCashout} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSendRequest} variant="contained" disabled={isSubmittingCashout}>
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessionalWallet;
