import { useState, useEffect } from 'react';
import { Button, TextField, Container, Typography, Grid, Paper, Box, CircularProgress, Alert, Stack, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import Papa from 'papaparse'; // Import Papa
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0, // consistent names
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

function App() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [emailTemplate, setEmailTemplate] = useState(''); // plain no style for that and try to keep it that way
  const [previewData, setPreviewData] = useState<{ [key: string]: string }>({}); // Consistent naming and avoid `any` if possible
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // SIMPLE: only a display name for From
  const [senderName, setSenderName] = useState<string>('LMS Team');
  const [emailSubject, setEmailSubject] = useState<string>('Your Login Link for the LMS Platform');

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/template')
      .then(res => res.json())
      .then(data => setEmailTemplate(data.template))
      .catch(() => {
        setError('Failed to fetch the saved email template from the server.'); // Correct use of setError
        setEmailTemplate('<p>Could not load template. Please try refreshing.</p>');
      })
      .finally(() => setLoading(false));
  }, []);

  const sanitizeSenderName = (name: string) => // Removes <, > but allows spaces
    name.replace(/[<>]/g, '').trim();

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
      // pass only the plain display name
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

  // Build full HTML preview by replacing placeholders
  const buildBodyHtmlPreview = () => {
    let html = emailTemplate;
    const data: { [key: string]: string } = { ...previewData, Email: previewData.Email || previewData.email || '' };
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

  // Convert HTML body to short plain-text snippet for mobile-style preview
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

  return (
    <Box sx={{ backgroundColor: '#f4f6f8', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl" >
        <Typography variant="h4" component="h1" sx={{ mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
          Bulk Email Sender{/* Title for clarity */}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={4} alignItems="stretch">
          {/* 1. Upload */}
          <Grid item xs={12} md={6} >
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={2}>
              <Typography variant="h6" gutterBottom>1. Upload Students File</Typography>{/* Step 1 */}
              <Divider sx={{ mb: 2 }} />
              <Button component="label" variant="contained" disabled={loading}>
                Upload file{/* More explicit action */}
                <VisuallyHiddenInput type="file" accept=".csv,.xls,.xlsx" onChange={handleFileChange} />
              </Button>
              {csvFile && <Typography sx={{ mt: 2, fontStyle: 'italic' }}>{csvFile.name}</Typography>/* Show file name */}
            </Paper>
          </Grid>

          {/* 2. Email Details */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={2}>
              <Typography variant="h6" gutterBottom>2. Email Details</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>{/* Consistent spacing */}
                <TextField
                  label='From name'
                  placeholder='e.g., "LMS Team"'
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  fullWidth
                />
                <TextField // Added missing Subject field
                  label="Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  fullWidth
                />
              </Stack>
            </Paper>
          </Grid>

          {/* 3. Edit Template */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={2}>
              <Typography variant="h6" gutterBottom>3. Edit Email Template</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ flexGrow: 1, pb: 8 }}>
                <ReactQuill
                  theme="snow"
                  value={emailTemplate}
                  onChange={setEmailTemplate}
                  style={{ height: '250px' }}
                />
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Use placeholders like {"{Name}"} from your file. Use {"{login_link}"} for the login link.
              </Typography>
              <Button variant="outlined" onClick={handleSaveTemplate} sx={{ mt: 2, alignSelf: 'flex-start' }} disabled={loading}>
                Save Template
              </Button>
            </Paper>
          </Grid>

          {/* 4. Preview */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }} elevation={2}>
              <Typography variant="h6" gutterBottom>4. Preview</Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Mobile-style preview */}
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Mobile Preview
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, wordBreak: 'break-word' }}>{mobileSender}</Typography>
                <Typography sx={{ fontWeight: 600, mt: 0.5, wordBreak: 'break-word' }}>{mobileSubject}</Typography>{/* Subject */}
                <Typography sx={{ color: 'text.secondary', mt: 0.5, wordBreak: 'break-word' }}>{mobileSnippet}</Typography>
              </Paper>

              {/* Full HTML body preview */}
              <Typography variant="subtitle2" gutterBottom color="text.secondary">
                Full Email Body Preview
              </Typography>
              <Paper // More descriptive title
                variant="outlined"
                sx={{ p: 2, flexGrow: 1, minHeight: '150px', backgroundColor: '#fff', overflowY: 'auto' }}
                dangerouslySetInnerHTML={{ __html: fullHtml }}
              />
            </Paper>
          </Grid>

          {/* Send Button */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 2 }} elevation={2}>
              <Box sx={{ textAlign: 'center' }}>{/* Centralize elements */}
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSendEmails}
                  disabled={loading || !csvFile}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                  sx={{ minWidth: '200px' }}
                >{/* Increase minWidth for better readability */}
                  {loading ? 'Sending...' : 'Send All Emails'}
                </Button>
                {!csvFile && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                    Please upload a file to enable sending.
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
