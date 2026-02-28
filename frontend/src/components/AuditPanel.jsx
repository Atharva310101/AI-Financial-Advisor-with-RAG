import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress } from '@mui/material';
import apiClient from '../api/client';

export default function AuditPanel({ companies }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await apiClient.get('/audit');
        setLogs(response.data);
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Helper to get company name from ID
  const getCompanyName = (id) => {
    const company = companies.find(c => c.id === id);
    return company ? company.name : `ID: ${id}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: '#0052CC' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="700" color="#1A202C">Compliance & Audit Logs</Typography>
        <Typography variant="body1" color="#718096">Immutable record of all AI interactions and generated advisory content.</Typography>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(9, 30, 66, 0.05)', flexGrow: 1, overflowY: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#4A5568', bgcolor: '#F8FAFC' }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#4A5568', bgcolor: '#F8FAFC' }}>Entity</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#4A5568', bgcolor: '#F8FAFC' }}>Mode</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#4A5568', bgcolor: '#F8FAFC' }}>Query / Prompt</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#718096' }}>No audit logs found.</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ color: '#2D3748', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ color: '#2D3748', fontWeight: 500 }}>
                    {getCompanyName(log.company_id)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={log.llm_mode.toUpperCase()} 
                      size="small" 
                      sx={{ 
                        bgcolor: log.llm_mode === 'chat' ? '#E9F2FF' : '#FFFBEB', 
                        color: log.llm_mode === 'chat' ? '#0052CC' : '#D97706',
                        fontWeight: 600, fontSize: '0.7rem' 
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#4A5568', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.query_text}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}