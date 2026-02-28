import React, { useState, useEffect } from 'react';
import { 
  Box, CssBaseline, ThemeProvider, createTheme, Typography, 
  Avatar, Button, Dialog, DialogContent, IconButton 
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close'; // For the "X" button
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import ActionPanel from './components/ActionPanel';
import AuditPanel from './components/AuditPanel';
import apiClient from './api/client';

const modernTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#F25C54' },
    secondary: { main: '#4A5568' },
    background: { default: '#050530', paper: '#FFFFFF' },
    text: { primary: '#2D3748', secondary: '#718096' }
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  }
});

export default function App() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [currentView, setCurrentView] = useState('workspace');
  const [companies, setCompanies] = useState([]);
  
  // --- NEW STATE FOR MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCompanies = async () => {
    try {
      const response = await apiClient.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      <Box sx={{
        height: '100vh', width: '100vw', bgcolor: 'background.default',
        display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 }
      }}>

        <Box sx={{
          width: '100%', maxWidth: '1400px', height: '100%', maxHeight: '900px',
          bgcolor: '#FFFFFF', borderRadius: '32px', boxShadow: '0 24px 48px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>

          {/* Top Navigation */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 4, py: 2.5, borderBottom: '1px solid #EDF2F7'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontSize: '1.25rem', color: '#1A202C', fontWeight: 700 }}>AI Advisor</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 4, color: '#718096', fontWeight: 500 }}>
              <Typography 
                onClick={() => setCurrentView('workspace')}
                sx={{ 
                  color: currentView === 'workspace' ? '#2D3748' : '#718096', 
                  borderBottom: currentView === 'workspace' ? '2px solid #2D3748' : 'none', 
                  pb: 0.5, cursor: 'pointer', fontWeight: currentView === 'workspace' ? 600 : 500 
                }}>
                Workspace
              </Typography>
              <Typography 
                onClick={() => setCurrentView('reports')}
                sx={{ 
                  color: currentView === 'reports' ? '#2D3748' : '#718096', 
                  borderBottom: currentView === 'reports' ? '2px solid #2D3748' : 'none', 
                  pb: 0.5, cursor: 'pointer', fontWeight: currentView === 'reports' ? 600 : 500 
                }}>
                Compliance Reports
              </Typography>
            </Box>

            {/* Right Side Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {selectedCompany && currentView === 'workspace' && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<OpenInNewIcon />}
                  onClick={() => setIsModalOpen(true)} // Open the Popup
                  sx={{ 
                    borderRadius: '10px', 
                    textTransform: 'none',
                    borderColor: '#E2E8F0',
                    color: '#4A5568'
                  }}
                >
                  View 10-K
                </Button>
              )}
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#E2E8F0', color: '#4A5568', fontSize: '0.8rem', fontWeight: 'bold' }}>
                AP
              </Avatar>
            </Box>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
            {currentView === 'workspace' ? (
              <>
                <Box sx={{ width: '280px', flexShrink: 0, borderRight: '1px solid #EDF2F7' }}>
                  <Sidebar 
                    selectedCompany={selectedCompany} 
                    onSelectCompany={setSelectedCompany} 
                    companies={companies} 
                    refreshCompanies={fetchCompanies} 
                  />
                </Box>

                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#FAFCFF' }}>
                  {selectedCompany ? (
                     <ChatPanel companyId={selectedCompany.id} />
                  ) : (
                    <Box sx={{ m: 'auto', textAlign: 'center', opacity: 0.6 }}>
                      <Typography variant="h5" fontWeight="600" mb={1} color="#2D3748">Workspace Empty</Typography>
                      <Typography variant="body1" color="#718096">Select or upload a 10-K document to begin.</Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ width: '400px', flexShrink: 0, borderLeft: '1px solid #EDF2F7', bgcolor: '#FFFFFF' }}>
                  {selectedCompany && <ActionPanel companyId={selectedCompany.id} />}
                </Box>
              </>
            ) : (
              <Box sx={{ flexGrow: 1, p: 4, bgcolor: '#FAFCFF', overflowY: 'auto' }}>
                <AuditPanel companies={companies} />
              </Box>
            )}
          </Box>
        </Box>

        {/* --- FILING MODAL POPUP --- */}
        <Dialog 
          open={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          fullWidth
          maxWidth="lg" // Makes the popup nice and wide
          PaperProps={{
            sx: { borderRadius: '24px', height: '90vh' }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid #EDF2F7' }}>
            <Typography variant="subtitle1" fontWeight="700">
               Source Filing: {selectedCompany?.name}
            </Typography>
            <IconButton onClick={() => setIsModalOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
            {selectedCompany?.filename ? (
              <iframe
                src={`http://localhost:8000/static-filings/${selectedCompany.filename}`}
                title="SEC Filing"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading document...</Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

      </Box>
    </ThemeProvider>
  );
}