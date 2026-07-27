import api from './api.js'

export async function getDashboardSummary() {
  const { data } = await api.get('/dashboard/summary')
  return data // { total_files, total_folders, used_bytes, recent_files, favorite_files }
}
