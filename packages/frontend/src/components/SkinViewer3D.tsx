/**
 * 3D Minecraft Skin Viewer Component
 * Использует skinview3d для отображения 3D модели скина и плаща
 * Поддерживает анимированные GIF плащи через декодирование кадров
 */

import React, { useEffect, useRef } from 'react';
import { SkinViewer } from 'skinview3d';
import { parseGIF, decompressFrames } from 'gifuct-js';

interface SkinViewer3DProps {
  skinUrl: string | null;
  cloakUrl?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

interface GifFrame {
  patch: Uint8ClampedArray;
  dims: { width: number; height: number; top: number; left: number };
  delay: number;
  disposalType: number;
}

export default function SkinViewer3D({ 
  skinUrl, 
  cloakUrl = null, 
  width = 256, 
  height = 256,
  className = ''
}: SkinViewer3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const gifFramesRef = useRef<GifFrame[]>([]);
  const currentGifFrameRef = useRef<number>(0);
  const gifFrameTimeoutRef = useRef<number | null>(null);
  const fullImageDataRef = useRef<ImageData | null>(null);
  const lastGifUpdateRef = useRef<number>(0);
  const frameDataUrlCacheRef = useRef<Map<number, string>>(new Map());
  const skippedFramesRef = useRef<number>(0); // Track skipped frames

  // Function to decode GIF and extract frames
  const decodeGif = async (gifUrl: string): Promise<GifFrame[]> => {
    try {
      const response = await fetch(gifUrl);
      const arrayBuffer = await response.arrayBuffer();
      const gif = parseGIF(arrayBuffer);
      const frames = decompressFrames(gif, true);
      
      return frames.map((frame: any) => ({
        patch: frame.patch,
        dims: frame.dims,
        delay: frame.delay || 100, // Default to 100ms if no delay
        disposalType: frame.disposalType || 0,
      }));
    } catch (error) {
      console.error('[SkinViewer3D] Error decoding GIF:', error);
      throw error;
    }
  };

  // Function to render a GIF frame to canvas (optimized)
  const renderGifFrame = (frame: GifFrame, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, fullImageData: ImageData) => {
    const { patch, dims } = frame;
    
    // Create ImageData for the patch
    const patchImageData = ctx.createImageData(dims.width, dims.height);
    patchImageData.data.set(patch);
    
    // Composite the patch onto the full image (optimized with bounds checking)
    const fullData = fullImageData.data;
    const patchData = patchImageData.data;
    const fullWidth = fullImageData.width;
    const fullHeight = fullImageData.height;
    
    // Calculate bounds to avoid unnecessary checks
    const startY = Math.max(0, dims.top);
    const endY = Math.min(fullHeight, dims.top + dims.height);
    const startX = Math.max(0, dims.left);
    const endX = Math.min(fullWidth, dims.left + dims.width);
    
    // Optimized loop with pre-calculated bounds
    for (let y = startY; y < endY; y++) {
      const patchY = y - dims.top;
      const fullYOffset = y * fullWidth;
      const patchYOffset = patchY * dims.width;
      
      for (let x = startX; x < endX; x++) {
        const patchX = x - dims.left;
        const fullIdx = (fullYOffset + x) * 4;
        const patchIdx = (patchYOffset + patchX) * 4;
        
        // Copy RGBA values (direct assignment is faster)
        fullData[fullIdx] = patchData[patchIdx];
        fullData[fullIdx + 1] = patchData[patchIdx + 1];
        fullData[fullIdx + 2] = patchData[patchIdx + 2];
        fullData[fullIdx + 3] = patchData[patchIdx + 3];
      }
    }
    
    // Handle disposal type (only if needed)
    if (frame.disposalType === 2) {
      // Clear to background (optimized)
      for (let y = startY; y < endY; y++) {
        const fullYOffset = y * fullWidth;
        for (let x = startX; x < endX; x++) {
          const idx = (fullYOffset + x) * 4;
          fullData[idx] = 0;
          fullData[idx + 1] = 0;
          fullData[idx + 2] = 0;
          fullData[idx + 3] = 0;
        }
      }
    }
    
    // Draw the full image to canvas
    ctx.putImageData(fullImageData, 0, 0);
  };

  // Function to animate GIF frames (optimized with caching, frame skipping, and aggressive throttling)
  const animateGifFrames = () => {
    if (!viewerRef.current || gifFramesRef.current.length === 0) return;
    
    const frames = gifFramesRef.current;
    const frameIndex = currentGifFrameRef.current;
    const currentFrame = frames[frameIndex];
    
    // Get cached data URL (should always be cached after pre-rendering)
    const dataUrl = frameDataUrlCacheRef.current.get(frameIndex);
    
    if (!dataUrl) {
      console.warn('[SkinViewer3D] Frame not cached, skipping:', frameIndex);
      // Move to next frame and continue
      currentGifFrameRef.current = (frameIndex + 1) % frames.length;
      const delay = Math.max(200, currentFrame.delay || 200);
      gifFrameTimeoutRef.current = window.setTimeout(() => {
        animateGifFrames();
      }, delay);
      return;
    }
    
    // Update cape texture (throttle to max 3 FPS = 333ms to prevent lag)
    // This significantly reduces texture updates and prevents page lag
    const now = Date.now();
    const minUpdateInterval = 333; // 3 FPS maximum
    
    // Only update texture when enough time has passed
    if (!lastGifUpdateRef.current || now - lastGifUpdateRef.current >= minUpdateInterval) {
      lastGifUpdateRef.current = now;
      skippedFramesRef.current = 0; // Reset skipped frames counter
      
      // Update texture
      viewerRef.current.loadCape(dataUrl).catch((err) => {
        console.error('[SkinViewer3D] Failed to update cape texture:', err);
      });
    } else {
      // Skip this frame update (texture update throttled)
      skippedFramesRef.current++;
    }
    
    // Move to next frame
    currentGifFrameRef.current = (frameIndex + 1) % frames.length;
    
    // Calculate delay: use frame's delay, but ensure minimum 200ms
    // If we've skipped many frames, we can reduce delay slightly to catch up
    const frameDelay = currentFrame.delay || 200;
    const baseDelay = Math.max(200, frameDelay);
    
    // If we've skipped too many frames, reduce delay slightly to catch up
    const delay = skippedFramesRef.current > 10 ? Math.max(150, baseDelay * 0.8) : baseDelay;
    
    gifFrameTimeoutRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        animateGifFrames();
      });
    }, delay);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create skin viewer
    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width,
      height,
    });

    viewerRef.current = viewer;

    // Create temp canvas for GIF frame rendering
    const tempCanvas = document.createElement('canvas');
    tempCanvasRef.current = tempCanvas;

    // Load initial skin
    if (skinUrl) {
      viewer.loadSkin(skinUrl).catch((err) => {
        console.error('[SkinViewer3D] Failed to load skin:', err);
      });
    }

    // Auto-rotate animation
    const animate = () => {
      if (viewerRef.current) {
        viewerRef.current.render();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gifFrameTimeoutRef.current) {
        clearTimeout(gifFrameTimeoutRef.current);
      }
      if (viewerRef.current) {
        viewerRef.current.dispose();
      }
      tempCanvasRef.current = null;
      gifFramesRef.current = [];
      currentGifFrameRef.current = 0;
      fullImageDataRef.current = null;
      frameDataUrlCacheRef.current.clear();
      skippedFramesRef.current = 0;
    };
  }, [width, height]);

  // Update skin when URL changes
  useEffect(() => {
    if (!viewerRef.current) return;

    if (skinUrl) {
      viewerRef.current.loadSkin(skinUrl).catch((err) => {
        console.error('[SkinViewer3D] Failed to load skin:', err);
      });
    }
  }, [skinUrl]);

  // Update cloak when URL changes
  useEffect(() => {
    if (!viewerRef.current) return;

    // Stop previous GIF animation
    if (gifFrameTimeoutRef.current) {
      clearTimeout(gifFrameTimeoutRef.current);
      gifFrameTimeoutRef.current = null;
    }
    gifFramesRef.current = [];
    currentGifFrameRef.current = 0;
    fullImageDataRef.current = null;
    skippedFramesRef.current = 0;

    if (cloakUrl) {
      const isGif = cloakUrl.toLowerCase().endsWith('.gif');
      
      if (isGif) {
        // Decode GIF and extract frames
        console.log('[SkinViewer3D] Decoding GIF cloak:', cloakUrl);
        decodeGif(cloakUrl).then((frames) => {
          if (frames.length === 0) {
            console.error('[SkinViewer3D] No frames extracted from GIF');
            return;
          }
          
          console.log('[SkinViewer3D] GIF decoded, frames:', frames.length);
          gifFramesRef.current = frames;
          currentGifFrameRef.current = 0;
          frameDataUrlCacheRef.current.clear(); // Clear cache for new GIF
          
          // Initialize temp canvas and full image data
          const tempCanvas = tempCanvasRef.current;
          if (!tempCanvas || !viewerRef.current) return;
          
          const firstFrame = frames[0];
          const canvasWidth = firstFrame.dims.width + firstFrame.dims.left;
          const canvasHeight = firstFrame.dims.height + firstFrame.dims.top;
          
          // Find the maximum dimensions across all frames
          let maxWidth = canvasWidth;
          let maxHeight = canvasHeight;
          for (const frame of frames) {
            maxWidth = Math.max(maxWidth, frame.dims.width + frame.dims.left);
            maxHeight = Math.max(maxHeight, frame.dims.height + frame.dims.top);
          }
          
          tempCanvas.width = maxWidth;
          tempCanvas.height = maxHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (!tempCtx) return;
          
          // Create full image data
          fullImageDataRef.current = tempCtx.createImageData(maxWidth, maxHeight);
          
          // Pre-render and cache all frames to avoid repeated rendering
          console.log('[SkinViewer3D] Pre-rendering and caching GIF frames...');
          
          // Create a working copy of fullImageData for rendering each frame
          const workingImageData = tempCtx.createImageData(maxWidth, maxHeight);
          
          // Pre-render all frames and cache their data URLs
          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            
            // Clear working image data for this frame
            const data = workingImageData.data;
            for (let j = 0; j < data.length; j += 4) {
              data[j] = 0;     // R
              data[j + 1] = 0; // G
              data[j + 2] = 0; // B
              data[j + 3] = 0; // A
            }
            
            // Render frame to working image data
            renderGifFrame(frame, tempCanvas, tempCtx, workingImageData);
            
            // Convert to data URL and cache
            tempCtx.putImageData(workingImageData, 0, 0);
            const dataUrl = tempCanvas.toDataURL('image/png');
            frameDataUrlCacheRef.current.set(i, dataUrl);
          }
          
          console.log('[SkinViewer3D] All frames cached, starting animation');
          
          // Start animation after a short delay to ensure cache is ready
          setTimeout(() => {
            animateGifFrames();
          }, 100);
        }).catch((err) => {
          console.error('[SkinViewer3D] Failed to decode GIF, loading as static:', err);
          // Fallback: try to load as static image
          viewerRef.current?.loadCape(cloakUrl).catch((loadErr) => {
            console.error('[SkinViewer3D] Failed to load cape:', loadErr);
          });
        });
      } else {
        // Regular PNG cape
        console.log('[SkinViewer3D] Loading PNG cloak:', cloakUrl);
        viewerRef.current.loadCape(cloakUrl).then(() => {
          console.log('[SkinViewer3D] PNG cloak loaded successfully');
        }).catch((err) => {
          console.error('[SkinViewer3D] Failed to load PNG cloak:', err);
        });
      }
    } else {
      console.log('[SkinViewer3D] No cloak URL, removing cape');
      viewerRef.current.loadCape(null);
    }
    
    // Cleanup on unmount or URL change
    return () => {
      if (gifFrameTimeoutRef.current) {
        clearTimeout(gifFrameTimeoutRef.current);
        gifFrameTimeoutRef.current = null;
      }
      gifFramesRef.current = [];
      currentGifFrameRef.current = 0;
      fullImageDataRef.current = null;
      skippedFramesRef.current = 0;
    };
  }, [cloakUrl]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width, height }}
      />
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
        Drag to rotate
      </div>
    </div>
  );
}
