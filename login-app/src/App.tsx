import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Logo from './assets/New Logo SIKSHA.png';


const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

function MobileMailPreview({
  sender,
  subject,
  html,
}: {
  sender: string;
  subject: string;
  html: string;
}) {
  return (
    <Box
      sx={{
        width: 375,
        height: 712,
        bgcolor: '#000',
        borderRadius: '28px',
        boxShadow:
          '0 24px 48px rgba(0,0,0,0.45), inset 0 0 10px rgba(255,255,255,0.1)',
        border: '8px solid #111',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        mx: 'auto',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 210,
          height: 26,
          bgcolor: '#111',
          borderRadius: '24px 24px 16px 16px',
          boxShadow: '0 3px 6px rgba(0,0,0,0.9)',
          zIndex: 15,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 6,
            bgcolor: '#444',
            borderRadius: 3,
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15)',
          }}
        />
        <Box
          sx={{
            width: 14,
            height: 14,
            bgcolor: '#222',
            borderRadius: '50%',
            boxShadow:
              '0 0 2px 2px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)',
            ml: 3,
          }}
        />
      </Box>

      <Box
        sx={{
          flex: 1,
          bgcolor: '#fff',
          mt: '44px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '48px',
          overflow: 'hidden',
          boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1)',
        }}
      >
        <Box
          sx={{
            height: 56,
            bgcolor: '#f7f7f7',
            px: 3,
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #ddd',
            fontWeight: 700,
            fontSize: 18,
            color: '#333',
          }}
        >
          Inbox
        </Box>

        <Box
          sx={{
            px: 3,
            py: 2,
            flex: 1,
            overflowY: 'auto',
            fontSize: 14,
            color: '#1a1a1a',
          }}
        >
          <Typography fontWeight={700} fontSize={16} mb={0.5}>
            {sender}
          </Typography>
          <Typography fontWeight={600} fontSize={15} mb={1}>
            {subject}
          </Typography>
          <Divider sx={{ my: 1.5 }} />
          <Box sx={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: html }} />
        </Box>
      </Box>
    </Box>
  );
}

function LoginPage({
  onLogin,
  loading,
  error,
  setError,
}: {
  onLogin: (email: string) => void;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
}) {
  const [email, setEmail] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) {
      setError('Please enter an email address.');
      return;
    }
    onLogin(email);
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={12} sx={{ p: 4, mt: 8, borderRadius: 3 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" align="center" fontWeight={700}>
            Admin Access
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Authorized Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            fullWidth
            required
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            fullWidth
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Verifying...' : 'Login'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [previewData, setPreviewData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [senderName, setSenderName] = useState<string>('LMS Team');
  const [emailSubject, setEmailSubject] = useState<string>('Your Login Link for the LMS Platform');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogin = (email: string) => {
    setLoading(true);
    setError(null);

    const authorizedEmail = import.meta.env.VITE_SMTP_USERNAME;
    console.log('Authorized email from env:', authorizedEmail);

    if (authorizedEmail && email.toLowerCase() === authorizedEmail.toLowerCase()) {
      setIsAuthenticated(true);
      setError(null);
    } else {
      setIsAuthenticated(false);
      setError('This email is not authorized.');
    }

    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/template')
      .then((res) => res.json())
      .then((data) => setEmailTemplate(data.template))
      .catch(() => {
        setError('Failed to fetch the saved email template from the server.');
        setEmailTemplate('<p>Could not load template. Please try refreshing.</p>');
      })
      .finally(() => setLoading(false));
  }, []);

  const sanitizeSenderName = (name: string) => name.replace(/[<>]/g, '').trim();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const file = event.target.files[0];
      setCsvFile(file);
      setError(null);
      setSuccess(null);
      setLoading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const uploadRes = await fetch('http://localhost:8000/upload-file', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.detail || 'Failed to upload file.');
        }
        setSuccess(`File "${file.name}" uploaded successfully.`);

        if (file.name.toLowerCase().endsWith('.csv')) {
          Papa.parse(file, {
            header: true,
            complete: (results) => {
              if (results.data.length > 0) {
                setPreviewData(results.data[0] as { [key: string]: string });
              }
            },
          });
        } else {
          setPreviewData({});
        }
      } catch (err: any) {
        setError(err.message);
        setCsvFile(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveTemplate = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    fetch('http://localhost:8000/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: emailTemplate }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to save template.');
        return res.json();
      })
      .then(() => setSuccess('Template saved successfully!'))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const handleSendEmails = async () => {
    if (!csvFile) {
      setError('Please upload a student file first.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    const payload = {
      template: emailTemplate,
      lms_url: 'https://lms.siddhantaknowledge.org/login/index.php',
      name_column: 'Name',
      email_column: 'Email',
      sender: sanitizeSenderName(senderName),
      subject: emailSubject.trim(),
    };
    try {
      const sendRes = await fetch('http://localhost:8000/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!sendRes.ok) {
        const errorData = await sendRes.json();
        throw new Error(errorData.detail || 'Failed to send emails.');
      }
      const resultData = await sendRes.json();
      setSuccess(`Emails sent! Sent: ${resultData.results.sent}, Failed: ${resultData.results.failed}.`);
      if (resultData.results.failed > 0) {
        console.error('Failed emails:', resultData.results.errors);
        setError('Some emails failed to send. Check the console for details.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const buildBodyHtmlPreview = () => {
    let html = emailTemplate;
    const data: { [key: string]: string } = {
      ...previewData,
      Email: previewData.Email || previewData.email || '',
    };
    for (const key in data) {
      const placeholder = `{${key}}`;
      html = html.replace(new RegExp(placeholder, 'g'), data[key]);
    }
    const loginLink = `https://lms.siddhantaknowledge.org/login/index.php?username=${encodeURIComponent(
      data.Email || ''
    )}`;
    html = html.replace(/{login_link}/g, loginLink);
    return html;
  };

  const getBodyTextSnippet = (html: string, maxLen = 140) => {
    const text = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
  };

  const fullHtml = buildBodyHtmlPreview();
  const mobileSender = sanitizeSenderName(senderName) || 'LMS Team';
  const mobileSubject = emailSubject?.trim() || '(no subject)';
  const mobileSnippet = getBodyTextSnippet(fullHtml);

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        loading={loading}
        error={error}
        setError={setError}
      />
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: '#C89878',
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 4 } }}>
        <Box
          component="header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'nowrap',
            justifyContent: 'center',
            ml: { xs: 0, sm: 8, md: 18 },
            width: 'fit-content',
            mx: 'auto',
          }}
        >
          <Box
            component="img"
            src={Logo}
            alt="Siddhanta Knowledge Foundation Logo"
            sx={{
              height: 140,
              width: 'auto',
              userSelect: 'none',
              flexShrink: 0,
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                color: '#283c7c', // original blue color
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '0.02em',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                whiteSpace: 'nowrap',
              }}
            >
              Siddhanta Knowledge Foundation
            </Typography>

            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 500,
                fontStyle: 'italic',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                lineHeight: 1.0,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>

                <Box component="span" sx={{ color: '#f5db15' }}>
                  Excellence in Education & &nbsp;
                </Box>
                <Box component="span" sx={{ color: '#d65a17' }}>
                  Innovation
                </Box>
              </Box>

            </Typography>
          </Box>
        </Box>
        <Box sx={{ pb: 3 }}>

        <Divider
  sx={{
    mx: 'auto',
    width: 580,
    height: 3,
    borderRadius: 2,
    background: 'linear-gradient(to right, transparent, #283c7c, transparent)',
    boxShadow: '0 0 8px #283c7c',
  }}
/>

</Box>

        <Grid container spacing={4}>
          {/* Left inputs and controls */}
          <Grid item xs={12} md={6} sx={{ pr: { md: 4 } }}>
            <Paper elevation={12} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
              <Stack spacing={3}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <Button
                  component="label"
                  variant="contained"
                  disabled={loading}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Upload CSV/XLSX File
                  <VisuallyHiddenInput
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileChange}
                  />
                </Button>
                {csvFile && (
                  <Typography sx={{ fontStyle: 'italic', fontSize: 14 }}>
                    {csvFile.name}
                  </Typography>
                )}

                <Divider />

                <TextField
                  label="From (Display Name)"
                  placeholder="e.g., 'LMS Team'"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  disabled={loading}
                  fullWidth
                />
                <TextField
                  label="Email Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  disabled={loading}
                  fullWidth
                />

                <Divider />

                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Email Template (use placeholders like {'{Name}'} &amp; {'{login_link}'})
                </Typography>
                <Box sx={{ height: 240, pb: 6 }}>
                  <ReactQuill
                    theme="snow"
                    value={emailTemplate}
                    onChange={setEmailTemplate}
                    style={{ height: '100%' }}
                    readOnly={loading}
                  />
                </Box>
                <Button
                  variant="outlined"
                  onClick={handleSaveTemplate}
                  disabled={loading}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  Save Template
                </Button>

                <Divider />

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSendEmails}
                  disabled={loading || !csvFile}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                  sx={{ minWidth: 200, alignSelf: 'center' }}
                >
                  {loading ? 'Sending...' : 'Send All Emails'}
                </Button>

                {!csvFile && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, textAlign: 'center' }}>
                    Please upload a file to enable sending.
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          {/* Right preview */}
          <Grid item xs={12} md={6} sx={{ pl: { md: 4 }, mt: { xs: 4, md: 0 } }}>
            <MobileMailPreview
              sender={mobileSender}
              subject={mobileSubject}
              html={fullHtml}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
