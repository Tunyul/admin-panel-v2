import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

// tiny cute default animation (a minimal bouncing dot sequence) — simplified Lottie structure
const DEFAULT_ANIM = {
  v: '5.5.7',
  fr: 30,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'mini-bounce',
  layers: [],
};

export default function LottieLoader({ animationData: initialAnimation = DEFAULT_ANIM, size = 160 }) {
  const [LottieComp, setLottieComp] = useState(null);
  const [animationData, setAnimationData] = useState(initialAnimation);

  useEffect(() => {
    let mounted = true;
    // dynamically import lottie-react and the animation JSON only when component mounts
    (async () => {
      try {
        const [{ default: Lottie }, cute] = await Promise.all([
          import('lottie-react'),
          // try importing the user-provided animation; falls back if missing
          import('../assets/cute-cat.json').catch(() => ({ default: null })),
        ]);
        if (!mounted) return;
        setLottieComp(() => Lottie);
        if (cute && cute.default) {
          setAnimationData(cute.default);
        }
      } catch (e) {
        // if dynamic import fails (network or package missing), keep fallback SVG
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <Box sx={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {LottieComp ? (
        <LottieComp animationData={animationData} loop style={{ width: '100%', height: '100%' }} />
      ) : (
        <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stopColor="#60e7c6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="30" r="8" fill="url(#g)">
            <animate attributeName="cy" dur="0.8s" values="30;70;30" repeatCount="indefinite" />
            <animate attributeName="r" dur="0.8s" values="8;5;8" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="70" r="6" fill="#fbbf24" opacity="0.9">
            <animate attributeName="cx" dur="1.2s" values="30;70;30" repeatCount="indefinite" />
            <animate attributeName="r" dur="1.2s" values="6;4;6" repeatCount="indefinite" />
          </circle>
        </svg>
      )}
    </Box>
  );
}
