import React, { useMemo, useState } from 'react';
import { Box, Dialog, IconButton, Link, Typography } from '@mui/material';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

// Utility: extract Google Drive fileId or best-effort id from a URL or raw id string
function extractDriveFileId(urlOrId) {
  if (!urlOrId) return null;
  // try to find a long id token
  const directIdMatch = String(urlOrId).match(/[-\w]{25,}/);
  if (directIdMatch) return directIdMatch[0];
  try {
    const u = new URL(urlOrId);
    if (u.pathname.includes('/d/')) return u.pathname.split('/d/')[1].split('/')[0];
    return u.searchParams.get('id');
  } catch (e) {
    return urlOrId;
  }
}

function looksLikeImage(url) {
  if (!url) return false;
  return /\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(url);
}

export default function DrivePreview({ url, alt = 'Preview', thumbHeight = 140, sx = {} }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileId = useMemo(() => extractDriveFileId(url), [url]);

  if (!url) return null;

  // Normalize URLs for Google Drive
  const isDrive = /drive\.google\.com/.test(String(url));
  const previewUrl = isDrive && fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
  const imageSrc = isDrive && fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : url;

  const useImage = looksLikeImage(url) || (isDrive && !/\.pdf(\?|$)/i.test(url));

  return (
    <>
      <Box sx={{ position: 'relative', display: 'inline-block', ...sx }}>
        {useImage ? (
          imgError ? (
            <Box sx={{ height: thumbHeight, width: '100%', borderRadius: 2, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              <Typography sx={{ fontSize: 12, color: 'var(--muted)' }}>Gagal memuat gambar. Buka untuk melihat.</Typography>
            </Box>
          ) : (
            <Box component="img" src={imageSrc} alt={alt} onError={() => setImgError(true)} sx={{ height: thumbHeight, width: '100%', borderRadius: 2, boxShadow: '0 6px 18px rgba(0,0,0,0.45)', objectFit: 'cover', display: 'block' }} />
          )
        ) : (
          <Box sx={{ height: thumbHeight, width: '100%', borderRadius: 2, bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Preview</Box>
        )}
        <IconButton size="small" onClick={() => setOpen(true)} sx={{ position: 'absolute', right: 6, top: 6, bgcolor: 'rgba(255,255,255,0.6)' }} title="Open preview">
          <OpenInFullIcon fontSize="small" />
        </IconButton>
      </Box>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <Box sx={{ width: '100%', height: { xs: '60vh', md: '80vh' }, display: 'flex', alignItems: 'stretch', justifyContent: 'center', p: 2 }}>
          {useImage ? (
            imgError ? (
              <Box sx={{ width: '100%', textAlign: 'center' }}>
                <Typography sx={{ mb: 1 }}>Gagal memuat gambar. Mungkin akses terbatas.</Typography>
                <Link href={url} target="_blank" rel="noopener noreferrer">Buka di tab baru</Link>
              </Box>
            ) : (
              <Box component="img" src={imageSrc} alt={alt} sx={{ maxWidth: '100%', maxHeight: '100%', margin: 'auto', objectFit: 'contain' }} />
            )
          ) : (
            // Use iframe for Drive preview or third-party preview pages. If Drive blocks the iframe, user can open the original url.
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
              <iframe title={alt} src={previewUrl} style={{ width: '100%', height: '100%', border: 0 }} />
              <Box sx={{ position: 'absolute', right: 12, bottom: 12 }}>
                <Link href={url} target="_blank" rel="noopener noreferrer" sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', px: 1, py: 0.5, borderRadius: 1 }}>Open original</Link>
              </Box>
            </Box>
          )}
        </Box>
      </Dialog>
    </>
  );
}
