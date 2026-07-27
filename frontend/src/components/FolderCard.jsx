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
import FolderIcon from '@mui/icons-material/Folder'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import DriveFileMoveOutlineIcon from '@mui/icons-material/DriveFileMoveOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

export default function FolderCard({ folder, onOpen, onRename, onMove, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null)

  const closeMenu = () => setAnchorEl(null)

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, position: 'relative' }}>
      <CardActionArea onClick={() => onOpen(folder)} sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FolderIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="body2" fontWeight={600} noWrap sx={{ flexGrow: 1 }}>
            {folder.folder_name}
          </Typography>
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
        <MenuItem onClick={() => { closeMenu(); onRename(folder) }}>
          <ListItemIcon><DriveFileRenameOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onMove(folder) }}>
          <ListItemIcon><DriveFileMoveOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Move</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onDelete(folder) }}>
          <ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  )
}
