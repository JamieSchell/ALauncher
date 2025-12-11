/**
 * Game Launch Button Component
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import GameLauncherService, { GameProcess } from '../services/gameLauncher';
import { ClientProfile } from '../api/types';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

interface GameLaunchButtonProps {
  profile: ClientProfile;
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
      // Проверяем авторизацию
      if (!playerProfile || !accessToken) {
        showError(t('login.required'));
        return;
      }

      // Проверяем Java
      if (!javaPath) {
        showError(t('settings.javaPathRequired'));
        return;
      }

      // Запускаем игру
      const result = await GameLauncherService.launchGame({
        profile,
        username: playerProfile.username,
        session: accessToken,
      });

      if (result.success) {
        showSuccess(t('game.launchSuccess'));

        // Обновляем список процессов
        setActiveProcesses(GameLauncherService.getActiveProcesses());

        // Начинаем отслеживание процесса
        const checkInterval = setInterval(() => {
          const processes = GameLauncherService.getActiveProcesses();
          setActiveProcesses(processes);

          // Если процесс завершился, останавливаем проверку
          const gameProcess = processes.find(p => p.id === result.processId);
          if (!gameProcess || gameProcess.status === 'stopped' || gameProcess.status === 'crashed') {
            clearInterval(checkInterval);
            setIsLaunching(false);
            onLaunchEnd?.();

            if (gameProcess?.status === 'crashed') {
              showError(t('game.crashDetected'));
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
        showError(result.error || t('game.launchFailed'));
        setIsLaunching(false);
        onLaunchEnd?.();
      }
    } catch (error: any) {
      showError(error.message || t('game.launchFailed'));
      setIsLaunching(false);
      onLaunchEnd?.();
    }
  };

  const handleStop = async () => {
    if (currentProcess) {
      try {
        await GameLauncherService.killGame(currentProcess.id);
        showSuccess(t('game.stopped'));
        setActiveProcesses(GameLauncherService.getActiveProcesses());
      } catch (error: any) {
        showError(error.message || t('game.stopFailed'));
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
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    if (currentProcess?.status === 'running') {
      return <Square className="w-5 h-5" />;
    }
    if (currentProcess?.status === 'crashed') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    return <Play className="w-5 h-5" />;
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

  const getButtonClass = () => {
    let baseClass = "inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ";

    if (currentProcess?.status === 'starting' || isLaunching) {
      baseClass += "bg-yellow-500 hover:bg-yellow-600 text-white cursor-wait";
    } else if (currentProcess?.status === 'running') {
      baseClass += "bg-red-500 hover:bg-red-600 text-white";
    } else if (currentProcess?.status === 'crashed') {
      baseClass += "bg-orange-500 hover:bg-orange-600 text-white";
    } else {
      baseClass += "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105";
    }

    if (className) {
      baseClass += ` ${className}`;
    }

    return baseClass;
  };

  const handleClick = () => {
    if (currentProcess?.status === 'running') {
      handleStop();
    } else {
      handleLaunch();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLaunching || (isGameRunning && !currentProcess)}
      className={getButtonClass()}
      whileHover={{ scale: (currentProcess?.status === 'running' || isLaunching) ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>

      {/* Показываем время работы если игра запущена */}
      {currentProcess?.status === 'running' && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-sm opacity-90"
        >
          {Math.floor((Date.now() - currentProcess.startTime) / 1000)}s
        </motion.div>
      )}
    </motion.button>
  );
}