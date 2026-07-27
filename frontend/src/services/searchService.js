import api from './api.js'

export async function searchFiles({ q = '', extension = null, category = null, sort = 'name', order = 'asc' } = {}) {
  const params = { q, sort, order }
  if (extension) params.extension = extension
  if (category) params.category = category
  const { data } = await api.get('/search', { params })
  return data // { files, total_files, query }
}
