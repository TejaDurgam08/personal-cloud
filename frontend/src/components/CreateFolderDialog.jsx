import { useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

export default function CreateFolderDialog({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setName('')
    setError('')
    onClose()
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await onCreate(name.trim())
      handleClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create the folder.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>New folder</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Folder name"
          value={name}
          error={Boolean(error)}
          helperText={error}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={submitting || !name.trim()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}
