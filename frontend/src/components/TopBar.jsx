import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'

export default function TopBar() {
  const { user, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)

  const initials = user?.username?.slice(0, 2).toUpperCase() || '?'

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CloudOutlinedIcon color="primary" />
          <Typography variant="h6">Personal Cloud</Typography>
        </Stack>

        <Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {initials}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Stack>
                <Typography variant="body2" fontWeight={600}>
                  {user?.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Stack>
            </MenuItem>
            <MenuItem onClick={logout}>Log out</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
