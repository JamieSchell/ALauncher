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
  const skippedFramesRef = useRef<number>(0);

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
        delay: frame.delay || 100,
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

    const patchImageData = ctx.createImageData(dims.width, dims.height);
    patchImageData.data.set(patch);

    const fullData = fullImageData.data;
    const patchData = patchImageData.data;
    const fullWidth = fullImageData.width;
    const fullHeight = fullImageData.height;

    const startY = Math.max(0, dims.top);
    const endY = Math.min(fullHeight, dims.top + dims.height);
    const startX = Math.max(0, dims.left);
    const endX = Math.min(fullWidth, dims.left + dims.width);

    for (let y = startY; y < endY; y++) {
      const patchY = y - dims.top;
      const fullYOffset = y * fullWidth;
      const patchYOffset = patchY * dims.width;

      for (let x = startX; x < endX; x++) {
        const patchX = x - dims.left;
        const fullIdx = (fullYOffset + x) * 4;
        const patchIdx = (patchYOffset + patchX) * 4;

        fullData[fullIdx] = patchData[patchIdx];
        fullData[fullIdx + 1] = patchData[patchIdx + 1];
        fullData[fullIdx + 2] = patchData[patchIdx + 2];
        fullData[fullIdx + 3] = patchData[patchIdx + 3];
      }
    }

    if (frame.disposalType === 2) {
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

    ctx.putImageData(fullImageData, 0, 0);
  };

  // Function to animate GIF frames (optimized with caching, frame skipping, and aggressive throttling)
  const animateGifFrames = () => {
    if (!viewerRef.current || gifFramesRef.current.length === 0) return;

    const frames = gifFramesRef.current;
    const frameIndex = currentGifFrameRef.current;
    const currentFrame = frames[frameIndex];

    const dataUrl = frameDataUrlCacheRef.current.get(frameIndex);

    if (!dataUrl) {
      console.warn('[SkinViewer3D] Frame not cached, skipping:', frameIndex);
      currentGifFrameRef.current = (frameIndex + 1) % frames.length;
      const delay = Math.max(200, currentFrame.delay || 200);
      gifFrameTimeoutRef.current = window.setTimeout(() => {
        animateGifFrames();
      }, delay);
      return;
    }

    const now = Date.now();
    const minUpdateInterval = 333;

    if (!lastGifUpdateRef.current || now - lastGifUpdateRef.current >= minUpdateInterval) {
      lastGifUpdateRef.current = now;
      skippedFramesRef.current = 0;

      viewerRef.current.loadCape(dataUrl).catch((err) => {
        console.error('[SkinViewer3D] Failed to update cape texture:', err);
      });
    } else {
      skippedFramesRef.current++;
    }

    currentGifFrameRef.current = (frameIndex + 1) % frames.length;

    const frameDelay = currentFrame.delay || 200;
    const baseDelay = Math.max(200, frameDelay);
    const delay = skippedFramesRef.current > 10 ? Math.max(150, baseDelay * 0.8) : baseDelay;

    gifFrameTimeoutRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        animateGifFrames();
      });
    }, delay);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width,
      height,
    });

    viewerRef.current = viewer;

    const tempCanvas = document.createElement('canvas');
    tempCanvasRef.current = tempCanvas;

    if (skinUrl) {
      viewer.loadSkin(skinUrl).catch((err) => {
        console.error('[SkinViewer3D] Failed to load skin:', err);
      });
    }

    const animate = () => {
      if (viewerRef.current) {
        viewerRef.current.render();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

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

  useEffect(() => {
    if (!viewerRef.current) return;

    if (skinUrl) {
      viewerRef.current.loadSkin(skinUrl).catch((err) => {
        console.error('[SkinViewer3D] Failed to load skin:', err);
      });
    }
  }, [skinUrl]);

  useEffect(() => {
    if (!viewerRef.current) return;

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
        console.log('[SkinViewer3D] Decoding GIF cloak:', cloakUrl);
        decodeGif(cloakUrl).then((frames) => {
          if (frames.length === 0) {
            console.error('[SkinViewer3D] No frames extracted from GIF');
            return;
          }

          console.log('[SkinViewer3D] GIF decoded, frames:', frames.length);
          gifFramesRef.current = frames;
          currentGifFrameRef.current = 0;
          frameDataUrlCacheRef.current.clear();

          const tempCanvas = tempCanvasRef.current;
          if (!tempCanvas || !viewerRef.current) return;

          const firstFrame = frames[0];
          const canvasWidth = firstFrame.dims.width + firstFrame.dims.left;
          const canvasHeight = firstFrame.dims.height + firstFrame.dims.top;

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

          fullImageDataRef.current = tempCtx.createImageData(maxWidth, maxHeight);

          console.log('[SkinViewer3D] Pre-rendering and caching GIF frames...');

          const workingImageData = tempCtx.createImageData(maxWidth, maxHeight);

          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];

            const data = workingImageData.data;
            for (let j = 0; j < data.length; j += 4) {
              data[j] = 0;
              data[j + 1] = 0;
              data[j + 2] = 0;
              data[j + 3] = 0;
            }

            renderGifFrame(frame, tempCanvas, tempCtx, workingImageData);

            tempCtx.putImageData(workingImageData, 0, 0);
            const dataUrl = tempCanvas.toDataURL('image/png');
            frameDataUrlCacheRef.current.set(i, dataUrl);
          }

          console.log('[SkinViewer3D] All frames cached, starting animation');

          setTimeout(() => {
            animateGifFrames();
          }, 100);
        }).catch((err) => {
          console.error('[SkinViewer3D] Failed to decode GIF, loading as static:', err);
          viewerRef.current?.loadCape(cloakUrl).catch((loadErr) => {
            console.error('[SkinViewer3D] Failed to load cape:', loadErr);
          });
        });
      } else {
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
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: width || '100%', height: height || '100%' }}
      />
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '12px', color: '#9ca3af', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '4px 8px', borderRadius: '4px' }}>
        Drag to rotate
      </div>
    </div>
  );
}
