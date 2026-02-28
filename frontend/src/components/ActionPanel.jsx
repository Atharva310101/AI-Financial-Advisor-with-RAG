import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import WarningIcon from '@mui/icons-material/Warning';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReactMarkdown from 'react-markdown';
import apiClient from '../api/client';

export default function ActionPanel({ companyId }) {
  const [loadingType, setLoadingType] = useState(null);
  const [result, setResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerate = async (type, endpoint) => {
    setLoadingType(type);
    setResult(null);
    setIsModalOpen(true); // Pop the modal open immediately to show the loading spinner
    
    try {
      const response = await apiClient.post(`/generate/${endpoint}`, { company_id: companyId });
      setResult({ type, content: response.data.content });
    } catch (error) { 
      setResult({ type, content: "Error generating content. Please try again." }); 
    } finally { 
      setLoadingType(null); 
    }
  };

  const handleClose = () => { setIsModalOpen(false); };

  const handleCopy = () => {
    if (result?.content) navigator.clipboard.writeText(result.content);
  };

  const tools = [
    { title: 'Executive Summary', endpoint: 'summary', icon: <DescriptionIcon sx={{ color: '#F25C54' }} />, label: 'Overview' },
    { title: 'Risk Assessment', endpoint: 'risk', icon: <WarningIcon sx={{ color: '#D69E2E' }} />, label: 'Analysis' },
    { title: 'Client Briefing', endpoint: 'email', icon: <EmailIcon sx={{ color: '#3182CE' }} />, label: 'Draft' },
  ];

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight="700" color="#2D3748">Advisor Tools</Typography>
      </Box>

      {/* Floating Tool Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
        {tools.map((tool, idx) => (
          <Box key={idx}
            onClick={() => handleGenerate(tool.title, tool.endpoint)}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 2, borderRadius: '16px', bgcolor: '#F7FAFC', border: '1px solid #EDF2F7',
              cursor: 'pointer', transition: 'all 0.2s',
              '&:hover': { bgcolor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {tool.icon}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="700" color="#2D3748">{tool.title}</Typography>
                <Chip label={tool.label} size="small" sx={{ height: 16, fontSize: '0.65rem', mt: 0.5, bgcolor: '#E2E8F0', color: '#4A5568', fontWeight: 600 }} />
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Empty Space Placeholder */}
      {/* <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, bgcolor: '#F7FAFC', borderRadius: '24px', border: '2px dashed #CBD5E0', p: 3 }}>
        <Typography variant="body2" color="#4A5568" textAlign="center" fontWeight="500">
          Click a tool above to generate insights. The results will open in a dedicated reading view.
        </Typography>
      </Box> */}

      {/* --- Pop-out Modal (Dialog) --- */}
      <Dialog 
        open={isModalOpen} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight="700" color="#2D3748">
            {loadingType || result?.type || "Generated Output"}
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ bgcolor: '#F7FAFC' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ borderTop: 'none', minHeight: '350px' }}>
          {loadingType ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, pt: 8 }}>
              <CircularProgress size={40} sx={{ color: '#F25C54' }} />
              <Typography variant="body1" color="#718096">Analyzing 10-K and generating {loadingType.toLowerCase()}...</Typography>
            </Box>
          ) : result ? (
            // This Box applies beautiful typography styling specifically to the Markdown output
            <Box sx={{ 
              color: '#2D3748', 
              lineHeight: 1.8,
              fontSize: '1rem',
              '& h1, & h2, & h3': { mt: 3, mb: 1, color: '#1A202C' },
              '& ul': { pl: 3, mb: 2 },
              '& li': { mb: 1 },
              '& strong': { color: '#1A202C' }
            }}>
              <ReactMarkdown>{result.content}</ReactMarkdown>
            </Box>
          ) : null}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            startIcon={<ContentCopyIcon />} 
            onClick={handleCopy}
            disabled={!result}
            sx={{ color: '#4A5568', '&:hover': { bgcolor: '#F7FAFC' } }}
          >
            Copy
          </Button>
          <Button 
            variant="contained" 
            onClick={handleClose}
            sx={{ bgcolor: '#2D3748', '&:hover': { bgcolor: '#1A202C' }, borderRadius: '8px' }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}