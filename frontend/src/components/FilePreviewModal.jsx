import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import DriveFileMoveOutlineIcon from '@mui/icons-material/DriveFileMoveOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

import { fetchTextPreview, getPreviewUrl } from '../services/fileService.js'
import { getLanguage, getPreviewKind } from '../utils/previewKind.js'
import { formatBytes, formatDate } from '../utils/formatBytes.js'

export default function FilePreviewModal({
  file,
  open,
  onClose,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onToggleFavorite,
}) {
  const [textContent, setTextContent] = useState(null)
  const [loadingText, setLoadingText] = useState(false)
  const [textError, setTextError] = useState('')

  const kind = file ? getPreviewKind(file.filename) : 'none'

  useEffect(() => {
    if (open && file && kind === 'text') {
      setLoadingText(true)
      setTextError('')
      fetchTextPreview(file.id)
        .then(setTextContent)
        .catch(() => setTextError('Could not load a preview of this file.'))
        .finally(() => setLoadingText(false))
    } else {
      setTextContent(null)
    }
  }, [open, file, kind])

  if (!file) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <Toolbar sx={{ borderBottom: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Typography variant="subtitle1" noWrap sx={{ flexGrow: 1 }}>
          {file.filename}
        </Typography>
        <Tooltip title={file.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
          <IconButton onClick={() => onToggleFavorite(file)}>
            {file.is_favorite ? <StarIcon color="secondary" /> : <StarBorderIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Rename">
          <IconButton onClick={() => onRename(file)}>
            <DriveFileRenameOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Move">
          <IconButton onClick={() => onMove(file)}>
            <DriveFileMoveOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download">
          <IconButton onClick={() => onDownload(file)}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Move to trash">
          <IconButton onClick={() => onDelete(file)}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Close">
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Box sx={{ p: 3 }}>
        <PreviewBody kind={kind} file={file} textContent={textContent} loadingText={loadingText} textError={textError} />

        <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            {formatBytes(file.file_size)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Uploaded {formatDate(file.uploaded_at)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Modified {formatDate(file.updated_at)}
          </Typography>
        </Stack>
      </Box>
    </Dialog>
  )
}

function PreviewBody({ kind, file, textContent, loadingText, textError }) {
  const boxSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
    maxHeight: '65vh',
    overflow: 'auto',
    borderRadius: 2,
    bgcolor: 'background.default',
  }

  if (kind === 'image') {
    return (
      <Box sx={boxSx}>
        <img
          src={getPreviewUrl(file.id)}
          alt={file.filename}
          style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8 }}
        />
      </Box>
    )
  }

  if (kind === 'pdf') {
    return (
      <Box sx={{ ...boxSx, p: 0, height: '65vh' }}>
        <iframe
          title={file.filename}
          src={getPreviewUrl(file.id)}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }}
        />
      </Box>
    )
  }

  if (kind === 'audio') {
    return (
      <Box sx={{ ...boxSx, py: 6 }}>
        <audio controls style={{ width: '100%' }} src={getPreviewUrl(file.id)} />
      </Box>
    )
  }

  if (kind === 'video') {
    return (
      <Box sx={{ ...boxSx, bgcolor: 'black' }}>
        <video controls style={{ maxWidth: '100%', maxHeight: '60vh' }} src={getPreviewUrl(file.id)} />
      </Box>
    )
  }

  if (kind === 'text') {
    if (loadingText) {
      return (
        <Box sx={boxSx}>
          <CircularProgress size={28} />
        </Box>
      )
    }
    if (textError) {
      return (
        <Box sx={boxSx}>
          <Typography color="text.secondary">{textError}</Typography>
        </Box>
      )
    }
    return (
      <Box sx={{ ...boxSx, justifyContent: 'flex-start', alignItems: 'stretch', p: 0 }}>
        <SyntaxHighlighter
          language={getLanguage(file.filename)}
          style={oneLight}
          customStyle={{ margin: 0, borderRadius: 8, fontSize: 13 }}
          showLineNumbers
        >
          {textContent || ''}
        </SyntaxHighlighter>
      </Box>
    )
  }

  return (
    <Box sx={{ ...boxSx, flexDirection: 'column', gap: 1.5 }}>
      <InsertDriveFileOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
      <Typography color="text.secondary">No preview available for this file type.</Typography>
    </Box>
  )
}
