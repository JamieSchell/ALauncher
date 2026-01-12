/**
 * Button to manually check for launcher updates
 * Для отладки и ручной проверки обновлений
 */

import { useState } from 'react';
import { useLauncherUpdate } from '../hooks/useLauncherUpdate';
import { isTauri } from '../api/platformSimple';

export default function UpdateCheckButton() {
  const { checkForUpdates, isChecking, updateCheckResult, currentVersion } = useLauncherUpdate();
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const handleCheck = async () => {
    setLastCheck(new Date());
    await checkForUpdates(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={handleCheck}
        disabled={isChecking || isTauri}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          fontSize: '14px',
          backgroundColor: isChecking || isTauri ? '#4a4a4a' : '#3a3a3a',
          color: 'white',
          borderRadius: '8px',
          cursor: isChecking || isTauri ? 'not-allowed' : 'pointer',
          opacity: isChecking || isTauri ? 0.5 : 1,
        }}
        title={isTauri ? "Обновления встраиваются в установщик" : "Проверить обновления лаунчера"}
      >
        {isChecking ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span>Проверка...</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Проверить обновления</span>
          </>
        )}
      </button>

      {updateCheckResult && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
          {updateCheckResult.hasUpdate ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(74, 222, 128)" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span style={{ color: 'rgb(74, 222, 128)' }}>
                Доступна версия {updateCheckResult.updateInfo?.version}
              </span>
            </>
          ) : updateCheckResult.error ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(248, 113, 113)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <span style={{ color: 'rgb(248, 113, 113)' }}>{updateCheckResult.error}</span>
            </>
          ) : (
            <span style={{ color: '#aaa' }}>Обновлений нет</span>
          )}
        </div>
      )}

      {currentVersion && (
        <span style={{ fontSize: '12px', color: '#888' }}>v{currentVersion}</span>
      )}

      {lastCheck && (
        <span style={{ fontSize: '12px', color: '#888' }}>
          Проверено: {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
