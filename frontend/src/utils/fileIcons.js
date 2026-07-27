import ImageIcon from '@mui/icons-material/ImageOutlined'
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined'
import MovieIcon from '@mui/icons-material/MovieOutlined'
import AudiotrackIcon from '@mui/icons-material/AudiotrackOutlined'
import ArchiveIcon from '@mui/icons-material/FolderZipOutlined'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFileOutlined'

// Maps the "icon" key the backend derives from a file's extension
// (see backend app/utils/file_types.py) to a Material icon component.
const ICON_MAP = {
  image: ImageIcon,
  description: DescriptionIcon,
  movie: MovieIcon,
  audiotrack: AudiotrackIcon,
  archive: ArchiveIcon,
  insert_drive_file: InsertDriveFileIcon,
}

export function iconForFile(file) {
  return ICON_MAP[file.icon] || InsertDriveFileIcon
}

export const CATEGORY_LABELS = {
  image: 'Images',
  document: 'Documents',
  video: 'Videos',
  audio: 'Audio',
  archive: 'Archives',
  other: 'Others',
}
