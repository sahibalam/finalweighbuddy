import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import axios from 'axios';

const SuperadminCashouts = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [actionError, setActionError] = useState('');
  const [isSubmittingId, setIsSubmittingId] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await axios.get('/api/superadmin/cashout-requests');
      if (res?.data?.success) {
        setRequests(Array.isArray(res.data.requests) ? res.data.requests : []);
      } else {
        setLoadError(res?.data?.message || 'Failed to load cashout requests');
      }
    } catch (e) {
      setLoadError(e?.response?.data?.message || 'Failed to load cashout requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (req) => {
    if (!req?.id) return;
    if (req?.status !== 'pending') return;

    setIsSubmittingId(req.id);
    setActionError('');
    try {
      const res = await axios.post(`/api/superadmin/cashout-requests/${req.id}/approve`, {
        adminNote: '',
      });

      if (res?.data?.success) {
        await fetchRequests();
      } else {
        setActionError(res?.data?.message || 'Failed to approve request');
      }
    } catch (e) {
      setActionError(e?.response?.data?.message || 'Failed to approve request');
    } finally {
      setIsSubmittingId(null);
    }
  };

  const rows = useMemo(() => {
    return (Array.isArray(requests) ? requests : []).map((r) => {
      const who = r?.professional?.name || r?.professional?.email || 'Professional';
      const when = r?.createdAt ? new Date(r.createdAt) : null;
      const whenLabel = when && !Number.isNaN(when.getTime()) ? when.toLocaleString() : '';
      return {
        id: r.id,
        who,
        amount: Number(r.amount || 0),
        note: r.note || '',
        status: r.status || 'pending',
        whenLabel,
        raw: r,
      };
    });
  }, [requests]);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        Cashout Requests
      </Typography>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Requests
          </Typography>
          <Button variant="outlined" onClick={fetchRequests} disabled={isLoading}>
            Refresh
          </Button>
        </Box>

        {loadError ? (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {loadError}
          </Typography>
        ) : null}

        {actionError ? (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {actionError}
          </Typography>
        ) : null}

        {isLoading ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading...
          </Typography>
        ) : rows.length === 0 ? (
          <Typography variant="body2" sx={{ mt: 1 }}>
            No cashout requests.
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {rows.map((r) => (
              <Paper key={r.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }} noWrap>
                      {r.who}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {r.whenLabel}{r.note ? ` · ${r.note}` : ''}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                    ${r.amount.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    size="small"
                    variant={r.status === 'pending' ? 'contained' : 'outlined'}
                    onClick={() => handleApprove(r.raw)}
                    disabled={r.status !== 'pending' || isSubmittingId === r.id}
                  >
                    {r.status === 'pending' ? 'Pending' : r.status === 'approved' ? 'Approved' : 'Rejected'}
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default SuperadminCashouts;
