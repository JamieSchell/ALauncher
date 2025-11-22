/**
 * Home Page - Main launcher interface
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Play, Download, AlertCircle } from 'lucide-react';
import { profilesAPI } from '../api/profiles';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';

export default function HomePage() {
  const { playerProfile, accessToken } = useAuthStore();
  const { selectedProfile, ram, width, height, fullScreen, autoEnter, javaPath } = useSettingsStore();
  const [launching, setLaunching] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.getProfiles,
  });

  const selectedProfileData = profiles?.find(p => p.profile.id === selectedProfile);

  const handleLaunch = async () => {
    if (!selectedProfileData || !playerProfile) return;

    setLaunching(true);

    try {
      const profile = selectedProfileData.profile;
      
      // Build launch arguments
      const jvmArgs = [
        `-Xms${ram}M`,
        `-Xmx${ram}M`,
        ...profile.jvmArgs,
      ];

      const gameArgs = [
        '--username', playerProfile.username,
        '--uuid', playerProfile.uuid,
        '--accessToken', accessToken || '',
        '--version', profile.version,
        '--width', width.toString(),
        '--height', height.toString(),
        ...profile.clientArgs,
      ];

      if (fullScreen) {
        gameArgs.push('--fullscreen', 'true');
      }

      if (autoEnter) {
        gameArgs.push('--server', profile.serverAddress);
        gameArgs.push('--port', profile.serverPort.toString());
      }

      // Launch via Electron IPC
      const result = await window.electronAPI.launchGame({
        javaPath,
        jvmArgs,
        mainClass: profile.mainClass,
        classPath: profile.classPath,
        gameArgs,
        workingDir: './minecraft', // TODO: get from settings
      });

      if (result.success) {
        console.log('Game launched successfully, PID:', result.pid);
      } else {
        console.error('Launch failed:', result.error);
      }
    } catch (error) {
      console.error('Launch error:', error);
    } finally {
      setLaunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading profiles...</div>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Profiles Available</h2>
          <p className="text-gray-400">Contact your server administrator to add profiles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Launch Minecraft</h1>
        <p className="text-gray-400">Select a profile and launch your game</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((item) => {
          const profile = item.profile;
          const isSelected = profile.id === selectedProfile;

          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => useSettingsStore.getState().updateSettings({ selectedProfile: profile.id })}
              className={`glass rounded-xl p-6 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary-500' : 'hover:bg-white/10'
              }`}
            >
              <h3 className="text-xl font-bold text-white mb-2">{profile.title}</h3>
              <p className="text-gray-400 text-sm mb-4">Minecraft {profile.version}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {profile.serverAddress}:{profile.serverPort}
                </span>
                {isSelected && (
                  <span className="px-2 py-1 bg-primary-500 text-white text-xs rounded">
                    Selected
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedProfileData && (
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {selectedProfileData.profile.title}
              </h3>
              <p className="text-gray-400">
                RAM: {ram}MB | Resolution: {width}x{height}
              </p>
            </div>

            <button
              onClick={handleLaunch}
              disabled={launching}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg"
            >
              {launching ? (
                <>
                  <Download className="animate-bounce" size={24} />
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <Play size={24} />
                  <span>Launch Game</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
