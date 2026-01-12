/**
 * Game Launch Button Component
 */

import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import GameLauncherService, { GameProcess } from '../services/gameLauncher';
import { GameProfile } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { platformAPI } from '../api/platformSimple';
import { soundService } from '../services/soundService';

interface GameLaunchButtonProps {
  profile: GameProfile;
  className?: string;
  onLaunchStart?: () => void;
  onLaunchEnd?: () => void;
}

export default function GameLaunchButton({
  profile,
  className = '',
  onLaunchStart,
  onLaunchEnd
}: GameLaunchButtonProps) {
  const { t } = useTranslation();
  const { showError, showSuccess } = useToast();
  const { playerProfile, accessToken } = useAuthStore();
  const { javaPath, ram } = useSettingsStore();
  const [isLaunching, setIsLaunching] = useState(false);
  const [activeProcesses, setActiveProcesses] = useState<GameProcess[]>([]);

  // Check if game is already running
  const isGameRunning = activeProcesses.some(p => p.status === 'running' || p.status === 'starting');
  const currentProcess = activeProcesses.find(p => p.profileId === profile.id);

  const handleLaunch = async () => {
    if (isLaunching || isGameRunning) return;

    setIsLaunching(true);
    onLaunchStart?.();

    try {
      // Check if running in Tauri desktop mode
      if (!platformAPI.getPlatformInfo().isTauri) {
        await showError('Game launch is only available in desktop mode. Please use the desktop app instead of web browser.');
        return;
      }

      // Проверяем авторизацию
      if (!playerProfile || !accessToken) {
        await showError(t('login.required'));
        return;
      }

      // Проверяем Java
      if (!javaPath) {
        await showError(t('settings.javaPathRequired'));
        return;
      }

      // Запускаем игру
      const result = await GameLauncherService.launchGame({
        profile,
        username: playerProfile.username,
        session: accessToken,
      });

      if (result.success) {
        await showSuccess(t('game.launchSuccess'));

        // Обновляем список процессов
        setActiveProcesses(GameLauncherService.getActiveProcesses());

        // Начинаем отслеживание процесса
        const checkInterval = setInterval(async () => {
          const processes = GameLauncherService.getActiveProcesses();
          setActiveProcesses(processes);

          // Если процесс завершился, останавливаем проверку
          const gameProcess = processes.find(p => p.id === result.processId);
          if (!gameProcess || gameProcess.status === 'stopped' || gameProcess.status === 'crashed') {
            clearInterval(checkInterval);
            setIsLaunching(false);
            onLaunchEnd?.();

            if (gameProcess?.status === 'crashed') {
              await showError(t('game.crashDetected'));
            }
          }
        }, 1000);

        // Остановка проверки через 10 минут
        setTimeout(() => {
          clearInterval(checkInterval);
          setIsLaunching(false);
          onLaunchEnd?.();
        }, 10 * 60 * 1000);
      } else {
        await showError(result.error || t('game.launchFailed'));
        setIsLaunching(false);
        onLaunchEnd?.();
      }
    } catch (error: any) {
      await showError(error.message || t('game.launchFailed'));
      setIsLaunching(false);
      onLaunchEnd?.();
    }
  };

  const handleStop = async () => {
    if (currentProcess) {
      try {
        await GameLauncherService.killGame(currentProcess.id);
        await showSuccess(t('game.stopped'));
        setActiveProcesses(GameLauncherService.getActiveProcesses());
      } catch (error: any) {
        await showError(error.message || t('game.stopFailed'));
      }
    }
  };

  // Обновляем список процессов при монтировании
  React.useEffect(() => {
    setActiveProcesses(GameLauncherService.getActiveProcesses());

    const interval = setInterval(() => {
      setActiveProcesses(GameLauncherService.getActiveProcesses());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (currentProcess?.status === 'starting' || isLaunching) {
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>;
    }
    if (currentProcess?.status === 'running') {
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      </svg>;
    }
    if (currentProcess?.status === 'crashed') {
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgb(239, 68, 68)" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>;
    }
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>;
  };

  const getStatusText = () => {
    if (currentProcess?.status === 'starting' || isLaunching) {
      return t('game.starting');
    }
    if (currentProcess?.status === 'running') {
      return t('game.running');
    }
    if (currentProcess?.status === 'crashed') {
      return t('game.crashed');
    }
    return t('game.play');
  };

  const getButtonStyle = () => {
    let baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '16px 32px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      transition: 'all 0.2s',
      position: 'relative',
      overflow: 'hidden',
      cursor: (currentProcess?.status === 'running' || isLaunching) ? 'wait' : 'pointer',
      border: 'none',
      fontSize: '14px'
    };

    if (currentProcess?.status === 'starting' || isLaunching) {
      baseStyle.backgroundColor = 'white';
      baseStyle.color = 'black';
    } else if (currentProcess?.status === 'running') {
      baseStyle.background = 'linear-gradient(to right, rgb(236, 72, 153), rgb(219, 39, 119))';
      baseStyle.color = 'white';
    } else if (currentProcess?.status === 'crashed') {
      baseStyle.background = 'linear-gradient(to right, rgb(220, 38, 38), rgb(185, 28, 28))';
      baseStyle.color = 'white';
    } else {
      baseStyle.backgroundColor = 'white';
      baseStyle.color = 'black';
    }

    return baseStyle;
  };

  const handleClick = () => {
    soundService.play('click');
    if (currentProcess?.status === 'running') {
      handleStop();
    } else {
      soundService.play('launch');
      handleLaunch();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLaunching || (isGameRunning && !currentProcess)}
      style={getButtonStyle()}
      className={className}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>

      {/* Показываем время работы если игра запущена */}
      {currentProcess?.status === 'running' && (
        <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
          {Math.floor((Date.now() - currentProcess.startTime) / 1000)}s
        </div>
      )}
    </button>
  );
}
