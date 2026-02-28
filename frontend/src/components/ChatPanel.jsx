import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress, Chip, Avatar } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ReactMarkdown from 'react-markdown';
import apiClient from '../api/client';

export default function ChatPanel({ companyId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { setMessages([]); }, [companyId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await apiClient.post('/chat', { company_id: companyId, query: userMessage.content });
      setMessages((prev) => [...prev, { role: 'bot', content: response.data.answer, sources: response.data.sources }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', content: "Error communicating." }]);
    } finally { 
      setLoading(false); 
    }
  };

  // Allow 'Enter' to send, and 'Shift+Enter' to add a new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Chat Header inside the panel */}
      <Box sx={{ px: 4, py: 3, borderBottom: '1px solid #EDF2F7', bgcolor: '#FFFFFF' }}>
        <Typography variant="h5" fontWeight="700" color="#1A202C">Analysis Sandbox</Typography>
        <Typography variant="body2" color="#718096">Ask natural language questions to query the selected document.</Typography>
      </Box>

      {/* Message History */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {messages.length === 0 && (
          <Box sx={{ m: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.5, maxWidth: 350 }}>
            <Typography variant="h6" fontWeight="600" mb={1}>How can I help?</Typography>
            <Typography variant="body2" textAlign="center">Ask me questions regarding revenue, risk factors, or management discussions found in the 10-K.</Typography>
          </Box>
        )}
        
        {messages.map((msg, idx) => (
          <Box key={idx} sx={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 2, alignItems: 'flex-start' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: msg.role === 'user' ? '#0052CC' : '#2D3748', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {msg.role === 'user' ? 'AP' : 'AI'}
            </Avatar>
            <Box sx={{
              maxWidth: '80%', p: 2.5, borderRadius: '20px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '20px',
              borderTopLeftRadius: msg.role === 'bot' ? '4px' : '20px',
              bgcolor: msg.role === 'user' ? '#E9F2FF' : '#FFFFFF',
              border: '1px solid #EDF2F7',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              color: '#172B4D'
            }}>
              
              {/* ReactMarkdown handles bolding, lists, and formatting safely */}
              <Box sx={{ 
                '& p': { margin: 0, lineHeight: 1.6, fontSize: '0.95rem' },
                '& ul': { margin: 0, paddingLeft: 3, marginTop: 1 },
                '& li': { marginBottom: 0.5 }
              }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </Box>

              {msg.sources && msg.sources.length > 0 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #EDF2F7', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Array.from(new Set(msg.sources)).map((src, i) => (
                    <Chip key={i} label={src} size="small" sx={{ bgcolor: '#F4F5F7', color: '#4A5568', fontSize: '0.7rem', fontWeight: 600, borderRadius: '8px' }} />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        ))}
        {loading && <CircularProgress size={24} sx={{ ml: 6, color: '#0052CC' }} />}
        <div ref={messagesEndRef} />
      </Box>

      {/* Expanding Multi-line Input */}
      <Box sx={{ p: 3, pt: 0 }}>
        <Box component="form" onSubmit={handleSend} sx={{
          display: 'flex', alignItems: 'flex-end', bgcolor: '#FFFFFF', borderRadius: '24px',
          border: '1px solid #CBD5E1', px: 2, py: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          '&:focus-within': { borderColor: '#0052CC' }
        }}>
          <IconButton disabled sx={{ pb: 1 }}><SearchIcon sx={{ color: '#A0AEC0' }} /></IconButton>
          
          <TextField
            fullWidth 
            multiline
            maxRows={5}
            placeholder="Type your long query here... (Shift+Enter for new line)" 
            value={input}
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={handleKeyDown}
            disabled={loading} 
            variant="standard"
            InputProps={{ disableUnderline: true, sx: { color: '#172B4D', fontSize: '0.95rem', py: 1 } }}
          />
          
          <IconButton type="submit" disabled={loading || !input.trim()} sx={{
            bgcolor: input.trim() ? '#0052CC' : '#F8FAFC', color: input.trim() ? '#FFFFFF' : '#A0AEC0',
            width: 36, height: 36, mb: 0.5, '&:hover': { bgcolor: input.trim() ? '#0047B3' : '#F8FAFC' }
          }}>
            <SearchIcon fontSize="small" /> 
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}