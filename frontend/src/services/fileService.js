import api from './api.js'

export async function listFiles({ folderId = null, sort = 'name', order = 'asc', filter = null, favorite = false } = {}) {
  const params = { sort, order }
  if (folderId) params.folder_id = folderId
  if (filter) params.filter = filter
  if (favorite) params.favorite = true
  const { data } = await api.get('/files', { params })
  return data // { files, total_files }
}

export async function getRecentFiles(limit = 10) {
  const { data } = await api.get('/files/recent', { params: { limit } })
  return data
}

export async function uploadFile(file, folderId, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)
  if (folderId) formData.append('folder_id', folderId)

  const { data } = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
  return data
}

export async function renameFile(fileId, filename) {
  const { data } = await api.patch(`/files/${fileId}/rename`, { filename })
  return data
}

export async function moveFile(fileId, folderId) {
  const { data } = await api.patch(`/files/${fileId}/move`, { folder_id: folderId })
  return data
}

export async function copyFile(fileId) {
  const { data } = await api.post(`/files/${fileId}/copy`)
  return data
}

export async function setFavorite(fileId, isFavorite) {
  const { data } = await api.patch(`/files/${fileId}/favorite`, { is_favorite: isFavorite })
  return data
}

export async function trashFile(fileId) {
  // Soft delete — moves the file to Trash.
  await api.delete(`/files/${fileId}`)
}

export async function downloadFile(fileId, filename) {
  const response = await api.get(`/files/${fileId}/download`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export function getPreviewUrl(fileId) {
  // Native <img>/<video>/<audio>/<iframe> elements can't send our
  // Authorization header, so the token travels as a query param here.
  // The backend's preview endpoint accepts either form.
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = localStorage.getItem('access_token') || ''
  return `${base}/preview/${fileId}?token=${encodeURIComponent(token)}`
}

export async function fetchTextPreview(fileId) {
  const { data } = await api.get(`/preview/${fileId}`, { responseType: 'text' })
  return data
}

export async function fetchPreviewBlob(fileId) {
  const response = await api.get(`/preview/${fileId}`, { responseType: 'blob' })
  return window.URL.createObjectURL(response.data)
}

export async function fetchStorageUsage() {
  const { data } = await api.get('/storage/usage')
  return data // { used_bytes, file_count }
}
