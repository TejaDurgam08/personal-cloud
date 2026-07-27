import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import { CATEGORY_LABELS } from '../utils/fileIcons.js'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'uploaded_at', label: 'Date uploaded' },
  { value: 'updated_at', label: 'Last modified' },
  { value: 'size', label: 'Size' },
  { value: 'type', label: 'File type' },
]

export default function SortFilterBar({ sort, order, filter, onSortChange, onOrderToggle, onFilterChange }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <Select size="small" value={sort} onChange={(e) => onSortChange(e.target.value)} sx={{ minWidth: 160 }}>
        {SORT_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            Sort: {opt.label}
          </MenuItem>
        ))}
      </Select>

      <IconButton size="small" onClick={onOrderToggle} title={order === 'asc' ? 'Ascending' : 'Descending'}>
        {order === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
      </IconButton>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Chip
            key={key}
            label={label}
            size="small"
            color={filter === key ? 'primary' : 'default'}
            variant={filter === key ? 'filled' : 'outlined'}
            onClick={() => onFilterChange(filter === key ? null : key)}
          />
        ))}
      </Box>
    </Stack>
  )
}
