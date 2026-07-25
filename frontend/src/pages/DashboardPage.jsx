import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TopBar from '../components/TopBar.jsx'
import StorageMeter from '../components/StorageMeter.jsx'
import UploadButton from '../components/UploadButton.jsx'
import FileList from '../components/FileList.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { deleteFile, downloadFile, fetchStorageUsage, listFiles } from '../services/fileService.js'

export default function DashboardPage() {
  const { user } = useAuth()

  const [files, setFiles] = useState([])
  const [usage, setUsage] = useState({ used_bytes: 0, file_count: 0 })
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const refresh = async () => {
    const [fileData, usageData] = await Promise.all([listFiles(), fetchStorageUsage()])
    setFiles(fileData.files)
    setUsage(usageData)
  }

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [])

  const handleUploaded = async () => {
    await refresh()
  }

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.id, file.filename)
    } catch {
      setErrorMessage('Could not download that file.')
    }
  }

  const handleDelete = async (file) => {
    try {
      await deleteFile(file.id)
      await refresh()
    } catch {
      setErrorMessage('Could not delete that file.')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar />

      <Container maxWidth="md" sx={{ py: 5 }}>
        <Stack spacing={4}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h4">Welcome, {user?.username}</Typography>
              <Typography variant="body2" color="text.secondary">
                Your files, stored on your own device.
              </Typography>
            </Box>
            <Box sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}>
              <UploadButton onUploaded={handleUploaded} onError={setErrorMessage} />
            </Box>
          </Stack>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            {loading ? (
              <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2 }} />
            ) : (
              <StorageMeter usedBytes={usage.used_bytes} fileCount={usage.file_count} />
            )}
          </Paper>

          <Stack spacing={2}>
            <Typography variant="h6">Your files</Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
            ) : (
              <FileList files={files} onDownload={handleDownload} onDelete={handleDelete} />
            )}
          </Stack>
        </Stack>
      </Container>

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={5000}
        onClose={() => setErrorMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
