import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CreateNewFolderOutlinedIcon from '@mui/icons-material/CreateNewFolderOutlined'

import TopBar from '../components/TopBar.jsx'
import Breadcrumbs from '../components/Breadcrumbs.jsx'
import SearchBar from '../components/SearchBar.jsx'
import SortFilterBar from '../components/SortFilterBar.jsx'
import UploadButton from '../components/UploadButton.jsx'
import FolderCard from '../components/FolderCard.jsx'
import FileCard from '../components/FileCard.jsx'
import CreateFolderDialog from '../components/CreateFolderDialog.jsx'
import RenameDialog from '../components/RenameDialog.jsx'
import MoveDialog from '../components/MoveDialog.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import FilePreviewModal from '../components/FilePreviewModal.jsx'

import { getFolderContents, createFolder, renameFolder, moveFolder, deleteFolder } from '../services/folderService.js'
import { searchFiles } from '../services/searchService.js'
import {
  downloadFile,
  trashFile,
  renameFile,
  moveFile,
  copyFile,
  setFavorite,
} from '../services/fileService.js'

export default function DrivePage() {
  const [folderId, setFolderId] = useState(null)
  const [contents, setContents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('name')
  const [order, setOrder] = useState('asc')
  const [filter, setFilter] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null) // { kind: 'file'|'folder', item }
  const [moveTarget, setMoveTarget] = useState(null)
  const [deleteFileTarget, setDeleteFileTarget] = useState(null)
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)

  const isSearching = searchQuery.trim().length > 0

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isSearching) {
        const data = await searchFiles({ q: searchQuery, category: filter, sort, order })
        setContents({
          folder: null,
          breadcrumbs: [{ id: null, folder_name: 'Home' }],
          subfolders: [],
          files: data.files,
          total_files: data.total_files,
        })
      } else {
        const data = await getFolderContents(folderId, { sort, order, filter })
        setContents(data)
      }
    } catch {
      setError('Could not load this folder.')
    } finally {
      setLoading(false)
    }
  }, [folderId, sort, order, filter, isSearching, searchQuery])

  useEffect(() => {
    load()
  }, [load])

  const navigate = (id) => {
    setSearchQuery('')
    setFolderId(id)
  }

  // ---- Folder actions ----
  const handleCreateFolder = async (name) => {
    await createFolder(name, folderId)
    await load()
  }

  const handleRenameFolder = async (name) => {
    await renameFolder(renameTarget.item.id, name)
    await load()
  }

  const handleMoveFolder = async (destinationId) => {
    await moveFolder(moveTarget.item.id, destinationId)
    await load()
  }

  const handleDeleteFolder = async () => {
    try {
      await deleteFolder(deleteFolderTarget.id)
      await load()
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete this folder.')
    }
  }

  // ---- File actions ----
  const handleRenameFile = async (name) => {
    await renameFile(renameTarget.item.id, name)
    await load()
  }

  const handleMoveFile = async (destinationId) => {
    await moveFile(moveTarget.item.id, destinationId)
    await load()
  }

  const handleCopyFile = async (file) => {
    try {
      await copyFile(file.id)
      await load()
      setInfo(`Created a copy of "${file.filename}".`)
    } catch {
      setError('Could not copy this file.')
    }
  }

  const handleFavorite = async (file) => {
    try {
      await setFavorite(file.id, !file.is_favorite)
      await load()
      if (previewFile?.id === file.id) setPreviewFile({ ...file, is_favorite: !file.is_favorite })
    } catch {
      setError('Could not update favorites.')
    }
  }

  const handleDeleteFile = async () => {
    try {
      await trashFile(deleteFileTarget.id)
      await load()
    } catch {
      setError('Could not move this file to trash.')
    }
  }

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.id, file.filename)
    } catch {
      setError('Could not download this file.')
    }
  }

  const openRenameForFile = (file) => setRenameTarget({ kind: 'file', item: file })
  const openRenameForFolder = (folder) => setRenameTarget({ kind: 'folder', item: folder })
  const openMoveForFile = (file) => setMoveTarget({ kind: 'file', item: file })
  const openMoveForFolder = (folder) => setMoveTarget({ kind: 'folder', item: folder })

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
            <Typography variant="h4">My Drive</Typography>
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<CreateNewFolderOutlinedIcon />}
                onClick={() => setCreateFolderOpen(true)}
              >
                New folder
              </Button>
              <UploadButton
                folderId={folderId}
                onUploaded={load}
                onError={setError}
              />
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <SearchBar onSearch={setSearchQuery} />
            <SortFilterBar
              sort={sort}
              order={order}
              filter={filter}
              onSortChange={setSort}
              onOrderToggle={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              onFilterChange={setFilter}
            />
          </Stack>

          {!isSearching && contents && (
            <Breadcrumbs items={contents.breadcrumbs} onNavigate={navigate} />
          )}
          {isSearching && (
            <Typography variant="body2" color="text.secondary">
              {contents?.total_files ?? 0} result{contents?.total_files === 1 ? '' : 's'} for &quot;{searchQuery}&quot;
            </Typography>
          )}

          {loading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={84} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              {contents.subfolders.length > 0 && (
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" color="text.secondary">Folders</Typography>
                  <Grid container spacing={2}>
                    {contents.subfolders.map((folder) => (
                      <Grid item xs={12} sm={6} md={4} key={folder.id}>
                        <FolderCard
                          folder={folder}
                          onOpen={(f) => navigate(f.id)}
                          onRename={openRenameForFolder}
                          onMove={openMoveForFolder}
                          onDelete={setDeleteFolderTarget}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              )}

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" color="text.secondary">Files</Typography>
                {contents.files.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
                    {isSearching ? 'No files match your search.' : 'This folder is empty. Upload a file to get started.'}
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {contents.files.map((file) => (
                      <Grid item xs={12} sm={6} md={4} key={file.id}>
                        <FileCard
                          file={file}
                          onPreview={setPreviewFile}
                          onDownload={handleDownload}
                          onRename={openRenameForFile}
                          onMove={openMoveForFile}
                          onCopy={handleCopyFile}
                          onFavorite={handleFavorite}
                          onDelete={setDeleteFileTarget}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </Container>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        onCreate={handleCreateFolder}
      />

      <RenameDialog
        open={Boolean(renameTarget)}
        initialName={renameTarget?.item?.filename || renameTarget?.item?.folder_name || ''}
        itemLabel={renameTarget?.kind || 'item'}
        onClose={() => setRenameTarget(null)}
        onRename={renameTarget?.kind === 'file' ? handleRenameFile : handleRenameFolder}
      />

      <MoveDialog
        open={Boolean(moveTarget)}
        title={moveTarget?.kind === 'file' ? 'Move file' : 'Move folder'}
        excludeFolderId={moveTarget?.kind === 'folder' ? moveTarget.item.id : null}
        onClose={() => setMoveTarget(null)}
        onMove={moveTarget?.kind === 'file' ? handleMoveFile : handleMoveFolder}
      />

      <ConfirmDialog
        open={Boolean(deleteFileTarget)}
        title="Move to trash?"
        description={deleteFileTarget ? `"${deleteFileTarget.filename}" will be moved to Trash. You can restore it later.` : ''}
        confirmLabel="Move to trash"
        confirmColor="error"
        onClose={() => setDeleteFileTarget(null)}
        onConfirm={handleDeleteFile}
      />

      <ConfirmDialog
        open={Boolean(deleteFolderTarget)}
        title="Delete folder?"
        description={deleteFolderTarget ? `"${deleteFolderTarget.folder_name}" must be empty to delete. This can't be undone.` : ''}
        confirmLabel="Delete"
        confirmColor="error"
        onClose={() => setDeleteFolderTarget(null)}
        onConfirm={handleDeleteFolder}
      />

      <FilePreviewModal
        file={previewFile}
        open={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
        onRename={(f) => { setPreviewFile(null); openRenameForFile(f) }}
        onMove={(f) => { setPreviewFile(null); openMoveForFile(f) }}
        onDelete={(f) => { setPreviewFile(null); setDeleteFileTarget(f) }}
        onToggleFavorite={handleFavorite}
      />

      <Snackbar open={Boolean(error)} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={Boolean(info)} autoHideDuration={3500} onClose={() => setInfo('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setInfo('')} sx={{ width: '100%' }}>{info}</Alert>
      </Snackbar>
    </Box>
  )
}
