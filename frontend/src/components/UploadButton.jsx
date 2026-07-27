import { useRef, useState } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import { uploadFile } from '../services/fileService.js'

const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024 // must mirror the backend's MAX_UPLOAD_SIZE_MB

export default function UploadButton({ folderId = null, onUploaded, onError }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)


  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-selecting the same file later
    if (!file) return

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      onError?.(`"${file.name}" is larger than the 500 MB upload limit.`)
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadFile(file, folderId)
      onUploaded?.(uploaded)
    } catch (err) {
      const detail = err.response?.data?.detail
      onError?.(typeof detail === 'string' ? detail : 'Upload failed. Please try again.')
    } finally {
    
      setUploading(false)
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" hidden onChange={handleFileChange} />
      <Button
        variant="contained"
        startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Uploading…' : 'Upload file'}
        
      </Button>
    </>
  )
}
