import React from 'react'
import LayoutContent from './LayoutContent'

export default function PageTransition({ children /* pathname omitted */ }) {
  // Use LayoutContent as the default/global wrapper for all pages
  return <LayoutContent>{children}</LayoutContent>
}
