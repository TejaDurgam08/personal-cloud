import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { formatBytes } from '../utils/formatBytes.js'


const DISPLAY_CEILING_BYTES = 10 * 1024 * 1024 * 1024 

export default function StorageMeter({ usedBytes, fileCount }) {
  const percent = Math.min(100, (usedBytes / DISPLAY_CEILING_BYTES) * 100)

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        <Typography variant="h6">Storage used</Typography>
        <Typography variant="body2" color="text.secondary">
          {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        color="secondary"
        sx={{ height: 10, borderRadius: 5, mb: 1 }}
      />
      <Typography variant="body2" color="text.secondary">
        {formatBytes(usedBytes)} used
      </Typography>
    </Box>
  )
}
