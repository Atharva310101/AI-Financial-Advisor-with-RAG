import React, { useState } from 'react';
import { List, ListItem, ListItemButton, ListItemText, Typography, Box, Button, CircularProgress, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import apiClient from '../api/client';

export default function Sidebar({ selectedCompany, onSelectCompany, companies, refreshCompanies }) {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    try {
      await apiClient.post('/ingest', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshCompanies();
    } catch (error) { 
      alert("Failed to upload file."); 
    } finally { 
      setLoading(false); 
      event.target.value = null; 
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          component="label" variant="outlined" fullWidth disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          sx={{
            borderRadius: '20px', py: 1, border: '1px solid #E2E8F0', color: '#4A5568', bgcolor: '#F7FAFC',
            '&:hover': { bgcolor: '#EDF2F7', border: '1px solid #CBD5E0' }
          }}
        >
          {loading ? "Processing..." : "New 10-K Upload"}
          <input type="file" hidden accept=".json" onChange={handleFileUpload} />
        </Button>
      </Box>

      <Typography variant="subtitle2" sx={{ px: 1, mb: 2, fontWeight: 800, color: '#1A202C', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem' }}>
        Your Entities
      </Typography>

      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 0.5 }}>
        {companies && companies.map((company) => {
          const isSelected = selectedCompany?.id === company.id;
          
          return (
            <ListItem key={company.id} disablePadding sx={{ mb: 1.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => onSelectCompany(company)}
                sx={{
                  borderRadius: '16px',
                  p: 2,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  
                  // --- PROMINENT SELECTED STATE ---
                  '&.Mui-selected': {
                    bgcolor: '#1A202C', 
                    color: '#FFFFFF',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                    borderLeft: '6px solid #F25C54', // Thick orange focus bar
                    transform: 'translateX(4px)', // Subtle "pop out" effect
                    '&:hover': { bgcolor: '#000000' },
                  },
                  
                  // --- HOVER STATE FOR UNSELECTED ---
                  '&:not(.Mui-selected):hover': {
                    bgcolor: '#F1F5F9',
                    transform: 'translateX(2px)',
                  }
                }}
              >
                {/* Visual Identifier (Square Icon) */}
                <Box sx={{ 
                  width: 40, height: 40, borderRadius: '10px', mr: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: isSelected ? 'rgba(255,255,255,0.1)' : '#F8FAFC',
                  border: isSelected ? 'none' : '1px solid #E2E8F0',
                }}>
                   <Typography variant="subtitle2" fontWeight="900" color={isSelected ? '#FFFFFF' : '#64748B'}>
                    {company.name.charAt(0)}
                   </Typography>
                </Box>
                
                <ListItemText
                  primary={company.name}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', gap: 1.5, mt: 0.75, alignItems: 'center' }}>
                      <Chip 
                        label={company.filing_type} 
                        size="small" 
                        sx={{ 
                          height: 20, fontSize: '0.65rem', fontWeight: 800,
                          bgcolor: isSelected ? '#F25C54' : '#E2E8F0', // Orange chip when selected
                          color: isSelected ? '#FFFFFF' : '#475569'
                        }} 
                      />
                      <Typography 
                        component="span" 
                        variant="caption" 
                        sx={{ fontWeight: 600, color: isSelected ? 'rgba(255,255,255,0.6)' : '#94A3B8' }}
                      >
                        {company.filing_date.split('T')[0]}
                      </Typography>
                    </Box>
                  }
                  primaryTypographyProps={{ 
                    fontWeight: 800, 
                    color: isSelected ? '#FFFFFF' : '#1E293B', 
                    fontSize: '0.95rem',
                    lineHeight: 1.2
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}