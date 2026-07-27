// Mirrors backend app/utils/file_types.py so the frontend can decide how
// to render a preview without waiting on a round trip.
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const TEXT_EXT = new Set(['.txt', '.json', '.md', '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.yml', '.yaml'])
const AUDIO_EXT = new Set(['.mp3', '.wav', '.ogg'])
const VIDEO_EXT = new Set(['.mp4', '.webm'])

const LANGUAGE_BY_EXT = {
  '.py': 'python',
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.json': 'json',
  '.html': 'markup',
  '.css': 'css',
  '.md': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.txt': 'text',
}

function extOf(filename) {
  const i = filename.lastIndexOf('.')
  return i === -1 ? '' : filename.slice(i).toLowerCase()
}

export function getPreviewKind(filename) {
  const ext = extOf(filename)
  if (IMAGE_EXT.has(ext)) return 'image'
  if (ext === '.pdf') return 'pdf'
  if (TEXT_EXT.has(ext)) return 'text'
  if (AUDIO_EXT.has(ext)) return 'audio'
  if (VIDEO_EXT.has(ext)) return 'video'
  return 'none'
}

export function getLanguage(filename) {
  return LANGUAGE_BY_EXT[extOf(filename)] || 'text'
}
