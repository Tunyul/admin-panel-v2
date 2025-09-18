import React from 'react';

// PageTransition is now a passthrough wrapper: no enter/exit animations.
export default function PageTransition({ children /* pathname intentionally unused */ }) {
  return <>{children}</>;
}
