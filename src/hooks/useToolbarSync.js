import React from 'react'
import { useLocation } from 'react-router-dom'

// useToolbarSync: listens to global toolbar events and syncs selected filter keys
// into the page's URL search params. Keys should be an array of param names.
export default function useToolbarSync({ searchParams, setSearchParams, keys = [] }) {
  const location = useLocation()
  const currentPath = location.pathname || ''

  React.useEffect(() => {
    const handleToolbarFilter = (e) => {
      try {
        const page = e?.detail?.page || null
        // Only sync if event targets this page or has no page (back-compat)
        if (page && !String(page).startsWith(currentPath) && !String(currentPath).startsWith(page)) return
        const all = e?.detail?.allFilters || {}
        const params = new URLSearchParams(searchParams.toString())
        keys.forEach((k) => {
          const v = all[k]
          if (v === undefined || v === null || v === '') params.delete(k)
          else params.set(k, String(v))
        })
        setSearchParams(params)
      } catch {
        // ignore
      }
    }

    const handleToolbarReset = (e) => {
      try {
        const page = e?.detail?.page || null
        if (page && !String(page).startsWith(currentPath) && !String(currentPath).startsWith(page)) return
        setSearchParams(new URLSearchParams())
      } catch {
        // ignore
      }
    }

    window.addEventListener('toolbar:filter', handleToolbarFilter)
    window.addEventListener('toolbar:reset', handleToolbarReset)
    return () => {
      window.removeEventListener('toolbar:filter', handleToolbarFilter)
      window.removeEventListener('toolbar:reset', handleToolbarReset)
    }
  }, [searchParams, setSearchParams, keys, currentPath])
}
