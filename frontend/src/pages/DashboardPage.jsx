import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import { useNavigate } from 'react-router-dom'

import TopBar from '../components/TopBar.jsx'
import StorageMeter from '../components/StorageMeter.jsx'
import FileCard from '../components/FileCard.jsx'
import FilePreviewModal from '../components/FilePreviewModal.jsx'
import { useAuth } from '../hooks/useAuth.jsx'
import { getDashboardSummary } from '../services/dashboardService.js'
import { downloadFile, setFavorite, trashFile } from '../services/fileService.js'
import UploadButton from '../components/UploadButton.jsx'

import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";


function StatCard({ icon, label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
      {icon}
      <Box>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState(null)
  const [success, setSuccess] = useState(false);

  const load = async () => {
    const data = await getDashboardSummary()
    setSummary(data)
  }

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [])

  const handleFavorite = async (file) => {
    await setFavorite(file.id, !file.is_favorite)
    await load()
  }

  const handleDelete = async (file) => {
    await trashFile(file.id)
    await load()
    setPreviewFile(null)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar />
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4">Welcome back, {user?.username}</Typography>
            <Typography variant="body2" color="text.secondary">
              Here's what's happening in your personal cloud.
            </Typography>
          </Box>

          {loading ? (
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <StatCard icon={<InsertDriveFileOutlinedIcon color="primary" sx={{ fontSize: 32 }} />} label="Total files" value={summary.total_files} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard icon={<FolderOutlinedIcon color="primary" sx={{ fontSize: 32 }} />} label="Total folders" value={summary.total_folders} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
                  <StorageMeter usedBytes={summary.used_bytes} fileCount={summary.total_files} />
                </Paper>
              </Grid>
            </Grid>
          )}

          <Stack spacing={1.5}>
            <Typography variant="h6">Recently opened</Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 3 }} />
            ) : summary.recent_files.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nothing here yet — files you upload or open will show up in this list.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {summary.recent_files.map((file) => (
                  <Grid item xs={12} sm={6} md={3} key={file.id}>
                    <FileCard
                      file={file}
                      onPreview={setPreviewFile}
                      onDownload={(f) => downloadFile(f.id, f.filename)}
                      onRename={() => navigate('/drive')}
                      onMove={() => navigate('/drive')}
                      onCopy={() => navigate('/drive')}
                      onFavorite={handleFavorite}
                      onDelete={handleDelete}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Stack>

          <Stack spacing={1.5}>
            <Typography variant="h6">Favorites</Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 3 }} />
            ) : summary.favorite_files.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Star a file in My Drive to pin it here.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {summary.favorite_files.map((file) => (
                  <Grid item xs={12} sm={6} md={3} key={file.id}>
                    <FileCard
                      file={file}
                      onPreview={setPreviewFile}
                      onDownload={(f) => downloadFile(f.id, f.filename)}
                      onRename={() => navigate('/drive')}
                      onMove={() => navigate('/drive')}
                      onCopy={() => navigate('/drive')}
                      onFavorite={handleFavorite}
                      onDelete={handleDelete}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Stack>
        </Stack>
      </Container>

      <FilePreviewModal
        file={previewFile}
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        onDownload={(f) => downloadFile(f.id, f.filename)}
        onRename={() => navigate('/drive')}
        onMove={() => navigate('/drive')}
        onDelete={handleDelete}
        onToggleFavorite={handleFavorite}
      />


      <Box
        sx={{
          position: "fixed",
          bottom: 40,
          right: 50,
          zIndex: (theme) => theme.zIndex.speedDial,

          transform: "scale(1.2)",
          transformOrigin: "bottom right",


        }}>


        {/* <UploadButton 
        
        onUploaded={async () => {
    await load()
  }}
  onError={(message) => {
    console.error(message)
  }} /> */}

        <UploadButton
          onUploaded={async () => {
            await load();
            setSuccess(true);
          }}
        />

      </Box>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right"
        }}


      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccess(false)}
        >
          File uploaded successfully!


        </Alert>
      </Snackbar>


    </Box>
  )
}
