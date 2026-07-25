import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'

// Shared frame for the Login and Register pages: a centered card on a
// quiet backdrop, with the app's mark and tagline above the form.
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Stack alignItems="center" spacing={3} sx={{ width: '100%', maxWidth: 420 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CloudOutlinedIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight={700}>
            Personal Cloud
          </Typography>
        </Stack>

        <Paper elevation={0} variant="outlined" sx={{ width: '100%', p: 4, borderRadius: 3 }}>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            <Typography variant="h5">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>
          {children}
        </Paper>
      </Stack>
    </Box>
  )
}
