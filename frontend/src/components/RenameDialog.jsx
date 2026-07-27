import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

// Generic rename dialog for both files and folders.
export default function RenameDialog({ open, initialName, itemLabel = 'item', onClose, onRename }) {
  const [name, setName] = useState(initialName || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(initialName || '')
    setError('')
  }, [initialName, open])

  const handleClose = () => {
    setError('')
    onClose()
  }

  const handleRename = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await onRename(name.trim())
      handleClose()
    } catch (err) {
      setError(err.response?.data?.detail || `Could not rename this ${itemLabel}.`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Rename {itemLabel}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="Name"
          value={name}
          error={Boolean(error)}
          helperText={error}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleRename} disabled={submitting || !name.trim()}>
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  )
}
