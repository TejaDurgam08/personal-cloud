import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import Box from '@mui/material/Box'
import Breadcrumbs from './Breadcrumbs.jsx'
import { getFolderContents } from '../services/folderService.js'


export default function MoveDialog({ open, onClose, onMove, excludeFolderId = null, title = 'Move' }) {
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [contents, setContents] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async (folderId) => {
    setLoading(true)
    try {
      const data = await getFolderContents(folderId)
      setContents(data)
      setCurrentFolderId(folderId)
    } catch {
      setError('Could not load that folder.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      setError('')
      load(null)
    }
  }, [open])

  const handleMove = async () => {
    setSubmitting(true)
    setError('')
    try {
      await onMove(currentFolderId)
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not move here.')
    } finally {
      setSubmitting(false)
    }
  }

  const subfolders = (contents?.subfolders || []).filter((f) => f.id !== excludeFolderId)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ minHeight: 320 }}>
        {contents && (
          <Box sx={{ mb: 1 }}>
            <Breadcrumbs items={contents.breadcrumbs} onNavigate={load} />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <List dense>
            {subfolders.length === 0 && (
              <Box sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                No subfolders here
              </Box>
            )}
            {subfolders.map((folder) => (
              <ListItemButton key={folder.id} onClick={() => load(folder.id)}>
                <ListItemIcon>
                  <FolderOutlinedIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={folder.folder_name} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleMove} disabled={submitting}>
          Move here
        </Button>
      </DialogActions>
    </Dialog>
  )
}
