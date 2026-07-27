import api from './api.js'

export async function createFolder(folderName, parentId = null) {
  const { data } = await api.post('/folders', { folder_name: folderName, parent_id: parentId })
  return data
}

// folderId === null fetches the root of "My Drive".
export async function getFolderContents(folderId, { sort = 'name', order = 'asc', filter = null } = {}) {
  const params = { sort, order }
  if (filter) params.filter = filter
  const { data } = await api.get(`/folders/${folderId || 'root'}`, { params })
  return data // { folder, breadcrumbs, subfolders, files, total_files }
}

export async function renameFolder(folderId, folderName) {
  const { data } = await api.patch(`/folders/${folderId}`, { folder_name: folderName })
  return data
}

export async function moveFolder(folderId, parentId) {
  const body = parentId === null ? { move_to_root: true } : { parent_id: parentId }
  const { data } = await api.patch(`/folders/${folderId}`, body)
  return data
}

export async function deleteFolder(folderId) {
  await api.delete(`/folders/${folderId}`)
}
