import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined'
import RestoreIcon from '@mui/icons-material/Restore'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

import TopBar from '../components/TopBar.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { iconForFile } from '../utils/fileIcons.js'
import { formatBytes, formatDate } from '../utils/formatBytes.js'
import { emptyTrash, listTrash, permanentlyDeleteFile, restoreFile } from '../services/trashService.js'

export default function TrashPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [permDeleteTarget, setPermDeleteTarget] = useState(null)
  const [emptyConfirmOpen, setEmptyConfirmOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await listTrash()
      setFiles(data.files)
    } catch {
      setError('Could not load Trash.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleRestore = async (file) => {
    try {
      await restoreFile(file.id)
      await load()
    } catch {
      setError('Could not restore this file.')
    }
  }

  const handlePermanentDelete = async () => {
    try {
      await permanentlyDeleteFile(permDeleteTarget.id)
      await load()
    } catch {
      setError('Could not delete this file.')
    }
  }

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash()
      await load()
    } catch {
      setError('Could not empty Trash.')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4">Trash</Typography>
              <Typography variant="body2" color="text.secondary">
                Files here can be restored, or deleted permanently to free up space.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepOutlinedIcon />}
              disabled={files.length === 0}
              onClick={() => setEmptyConfirmOpen(true)}
            >
              Empty trash
            </Button>
          </Stack>

          {loading ? (
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
          ) : files.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <DeleteOutlineIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">Trash is empty.</Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell>Deleted</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => {
                    const Icon = iconForFile(file)
                    return (
                      <TableRow key={file.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Icon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 320 }}>
                              {file.filename}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatBytes(file.file_size)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {file.deleted_at ? formatDate(file.deleted_at) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Restore">
                            <IconButton size="small" onClick={() => handleRestore(file)}>
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete permanently">
                            <IconButton size="small" onClick={() => setPermDeleteTarget(file)}>
                              <DeleteForeverIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Container>

      <ConfirmDialog
        open={Boolean(permDeleteTarget)}
        title="Delete permanently?"
        description={permDeleteTarget ? `"${permDeleteTarget.filename}" will be permanently deleted. This can't be undone.` : ''}
        confirmLabel="Delete forever"
        confirmColor="error"
        onClose={() => setPermDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
      />

      <ConfirmDialog
        open={emptyConfirmOpen}
        title="Empty trash?"
        description={`All ${files.length} file(s) in Trash will be permanently deleted. This can't be undone.`}
        confirmLabel="Empty trash"
        confirmColor="error"
        onClose={() => setEmptyConfirmOpen(false)}
        onConfirm={handleEmptyTrash}
      />

      <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
    </Box>
  )
}
