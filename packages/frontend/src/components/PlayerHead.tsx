/**
 * Player Head Component
 * Displays Minecraft player head (avatar) from skin URL or username
 */

import { useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';

interface PlayerHeadProps {
  skinUrl?: string | null;
  username?: string | null;
  uuid?: string | null;
  size?: number;
  className?: string;
}

// Helper function to get base URL for static files
const getBaseUrl = () => {
  return API_CONFIG.baseUrlWithoutApi;
};

// Helper function to get full URL for texture
const getTextureUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${getBaseUrl()}${url}`;
};

// Function to extract head from skin texture
// Minecraft skin format: 64x64 or 64x32
// Head is at: x: 8-16, y: 8-16 (for 64x64) or x: 8-16, y: 8-16 (for 64x32)
const getHeadFromSkin = (skinUrl: string, size: number): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Minecraft skin head coordinates
        // Head front: x: 8-16, y: 8-16 (8x8 pixels) - works for both 64x64 and 64x32
        const headSize = 8; // 8x8 pixels in skin texture
        const headX = 8;
        const headY = 8;

        // Disable image smoothing for pixelated Minecraft style
        ctx.imageSmoothingEnabled = false;

        // Draw only head front (8x8 -> scale to size)
        // This gives a clean, recognizable head view
        ctx.drawImage(
          img,
          headX, headY, headSize, headSize, // Source: head front (8x8)
          0, 0, size, size // Destination: full canvas
        );

        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load skin image'));
    };

    img.src = skinUrl;
  });
};

export default function PlayerHead({
  skinUrl,
  username,
  uuid,
  size = 40,
  className = ''
}: PlayerHeadProps) {
  const [headImage, setHeadImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setHeadImage(null);

    // Priority: Use skinUrl from our server (extract head from skin texture)
    if (skinUrl) {
      const fullSkinUrl = getTextureUrl(skinUrl);
      if (fullSkinUrl) {
        getHeadFromSkin(fullSkinUrl, size)
          .then((dataUrl) => {
            setHeadImage(dataUrl);
            setLoading(false);
          })
          .catch((err) => {
            console.error('[PlayerHead] Failed to extract head from skin:', err);
            setError(true);
            setLoading(false);
          });
      } else {
        setError(true);
        setLoading(false);
      }
    } else {
      // No skin available - show fallback icon
      setError(true);
      setLoading(false);
    }
  }, [skinUrl, size]);

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: '#1f1f1f',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #3d3d3d',
          width: size,
          height: size
        }}
        className={className}
      >
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #6b8e23',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error || !headImage) {
    return (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #6b8e23, #556b2f)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(122, 159, 53, 0.3)',
          width: size,
          height: size
        }}
        className={className}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={headImage}
      alt={username || 'Player head'}
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        border: '1px solid #3d3d3d',
        imageRendering: 'pixelated' // Minecraft pixel art style
      }}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        setError(true);
        setHeadImage(null);
      }}
    />
  );
}
