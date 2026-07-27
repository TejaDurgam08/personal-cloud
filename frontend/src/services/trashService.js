import api from './api.js'

export async function listTrash() {
  const { data } = await api.get('/trash')
  return data // { files, total_files }
}

export async function restoreFile(fileId) {
  const { data } = await api.post(`/trash/${fileId}/restore`)
  return data
}

export async function permanentlyDeleteFile(fileId) {
  await api.delete(`/trash/${fileId}`)
}

export async function emptyTrash() {
  const { data } = await api.delete('/trash/empty')
  return data // { deleted_count }
}
