import api from './api.js'

export async function listFiles() {
  const { data } = await api.get('/files')
  return data // { files, total_files }
}

export async function uploadFile(file, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
  return data
}

export async function deleteFile(fileId) {
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

export async function fetchStorageUsage() {
  const { data } = await api.get('/storage/usage')
  return data // { used_bytes, file_count }
}
