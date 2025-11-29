/**
 * Button to manually check for launcher updates
 * Для отладки и ручной проверки обновлений
 */

import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLauncherUpdate } from '../hooks/useLauncherUpdate';

export default function UpdateCheckButton() {
  const { checkForUpdates, isChecking, updateCheckResult, currentVersion } = useLauncherUpdate();
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const handleCheck = async () => {
    setLastCheck(new Date());
    await checkForUpdates(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCheck}
        disabled={isChecking}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Проверить обновления лаунчера"
      >
        {isChecking ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Проверка...</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            <span>Проверить обновления</span>
          </>
        )}
      </button>

      {updateCheckResult && (
        <div className="flex items-center gap-1 text-sm">
          {updateCheckResult.hasUpdate ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">
                Доступна версия {updateCheckResult.updateInfo?.version}
              </span>
            </>
          ) : updateCheckResult.error ? (
            <>
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400">{updateCheckResult.error}</span>
            </>
          ) : (
            <span className="text-gray-400">Обновлений нет</span>
          )}
        </div>
      )}

      {currentVersion && (
        <span className="text-xs text-gray-500">v{currentVersion}</span>
      )}

      {lastCheck && (
        <span className="text-xs text-gray-500">
          Проверено: {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

