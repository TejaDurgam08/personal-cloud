import { useState } from 'react'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import DownloadIcon from '@mui/icons-material/Download'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import DriveFileMoveOutlineIcon from '@mui/icons-material/DriveFileMoveOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { iconForFile } from '../utils/fileIcons.js'
import { formatBytes, formatDate } from '../utils/formatBytes.js'

export default function FileCard({ file, onPreview, onDownload, onRename, onMove, onCopy, onFavorite, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null)
  const Icon = iconForFile(file)
  const closeMenu = () => setAnchorEl(null)

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, position: 'relative' }}>
      <CardActionArea onClick={() => onPreview(file)} sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Icon sx={{ fontSize: 30, color: 'text.secondary' }} />
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {file.filename}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(file.file_size)} · {formatDate(file.uploaded_at)}
              </Typography>
            </Box>
            {file.is_favorite && <StarIcon color="secondary" fontSize="small" />}
          </Stack>
        </Stack>
      </CardActionArea>

      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation()
          setAnchorEl(e.currentTarget)
        }}
        sx={{ position: 'absolute', top: 6, right: 6 }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu} onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={() => { closeMenu(); onFavorite(file) }}>
          <ListItemIcon>{file.is_favorite ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}</ListItemIcon>
          <ListItemText>{file.is_favorite ? 'Unfavorite' : 'Favorite'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onDownload(file) }}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onRename(file) }}>
          <ListItemIcon><DriveFileRenameOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onMove(file) }}>
          <ListItemIcon><DriveFileMoveOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Move</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onCopy(file) }}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onDelete(file) }}>
          <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Move to trash</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  )
}
