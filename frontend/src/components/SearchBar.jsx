import { useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import IconButton from '@mui/material/IconButton'
import ClearIcon from '@mui/icons-material/Clear'

export default function SearchBar({ onSearch, placeholder = 'Search your files…' }) {
  const [value, setValue] = useState('')

  const submit = (q) => onSearch(q)

  return (
    <TextField
      size="small"
      fullWidth
      placeholder={placeholder}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        if (e.target.value === '') submit('')
      }}
      onKeyDown={(e) => e.key === 'Enter' && submit(value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => {
                setValue('')
                submit('')
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
      sx={{ maxWidth: 420, bgcolor: 'background.paper' }}
    />
  )
}
