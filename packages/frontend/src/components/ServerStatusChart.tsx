/**
 * Server Status Chart Component
 * График мониторинга Minecraft сервера - онлайн игроков за 24 часа
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WifiOff } from 'lucide-react';
import { ServerStatus } from '@modern-launcher/shared';
import { serversAPI } from '../api/servers';

interface ServerStatusChartProps {
  status: ServerStatus | undefined;
  isLoading?: boolean;
  serverAddress?: string;
  serverPort?: number;
}

interface StatisticsData {
  online: number;
  average: number;
  minimum: number;
  maximum: number;
}

// Преобразуем статистику в формат для графика (24 часа, каждые 5 минут)
const formatStatisticsData = (statistics: StatisticsData[], currentOnline: number): Array<{ time: string; value1: number; value2: number; value3: number }> => {
  const now = new Date();
  const data: Array<{ time: string; value1: number; value2: number; value3: number }> = [];
  
  // Создаем данные за последние 24 часа (288 интервалов по 5 минут)
  for (let i = 287; i >= 0; i--) {
    const intervalTime = new Date(now.getTime() - i * 5 * 60 * 1000);
    const hour = intervalTime.getHours();
    const minute = Math.floor(intervalTime.getMinutes() / 5) * 5;
    
    const stat = statistics[287 - i] || { online: 0, average: 0, minimum: 0, maximum: 0 };
    
    // Если это текущий интервал (последние 5 минут), используем текущий онлайн
    const isCurrentInterval = i === 0;
    const value1 = isCurrentInterval ? currentOnline : stat.online; // Онлайн
    const value2 = stat.average; // Средний
    const value3 = stat.minimum; // Минимум
    
    // Форматируем время: показываем каждый час и каждые 30 минут для читаемости
    let timeLabel = '';
    if (minute === 0) {
      timeLabel = `${hour.toString().padStart(2, '0')}:00`;
    } else if (minute === 30) {
      timeLabel = `${hour.toString().padStart(2, '0')}:30`;
    } else {
      timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
    
    data.push({
      time: timeLabel,
      value1,
      value2,
      value3,
    });
  }
  
  return data;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-gray-900/95 border border-white/20 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-white text-sm font-semibold mb-2">{data.time}</p>
        {payload.map((entry: any, index: number) => {
          const labels = ['Онлайн', 'Средний', 'Минимум'];
          const value = entry.value || 0;
          
          return (
            <div key={index} className="mb-1">
              <p className="text-xs" style={{ color: entry.color }}>
                {labels[index]}: <span className="text-white font-semibold">{value}</span> игроков
              </p>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export default function ServerStatusChart({ status, isLoading = false, serverAddress, serverPort = 25565 }: ServerStatusChartProps) {
  const [statistics, setStatistics] = useState<StatisticsData[]>([]);

  // Загрузить статистику из базы данных - ВСЕГДА вызывается в начале компонента
  useEffect(() => {
    if (serverAddress) {
      serversAPI.getServerStatistics(serverAddress, serverPort)
        .then(data => {
          console.log('[ServerStatusChart] Loaded statistics:', data.length, 'intervals');
          console.log('[ServerStatusChart] Statistics sample:', data.slice(0, 5));
          setStatistics(data);
        })
        .catch(error => {
          console.error('Error loading statistics:', error);
          // Если ошибка, используем пустой массив
          setStatistics([]);
        });
    } else {
      setStatistics([]);
    }
  }, [serverAddress, serverPort, status?.online]);

  if (isLoading || !status) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (!status.online) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] py-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-4"
        >
          <WifiOff size={64} className="text-red-500" />
        </motion.div>
        <p className="text-gray-300 font-semibold">Сервер офлайн</p>
      </div>
    );
  }

  const online = status.players?.online || 0;
  const max = status.players?.max || 0;

  // Форматируем данные для графика
  const chartData = formatStatisticsData(statistics, online);
  
  // Вычисляем максимальное значение для Y-оси на основе реальных данных
  const maxDataValue = Math.max(
    ...chartData.map(d => Math.max(d.value1, d.value2, d.value3)),
    max || 50
  );
  const maxYValue = Math.max(50, Math.ceil(maxDataValue / 10) * 10);
  const yAxisTicks = Array.from({ length: Math.floor(maxYValue / 5) + 1 }, (_, i) => i * 5);
  
  console.log('[ServerStatusChart] Chart data:', chartData.length, 'points, max value:', maxYValue);
  console.log('[ServerStatusChart] Data sample:', chartData.slice(-10)); // Последние 10 точек

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* График */}
      <div className="flex-1 min-h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={400}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
        >
          <defs>
            {/* Эффект свечения для линий - более яркий */}
            <filter id="glow1" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow3" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255, 255, 255, 0.1)" 
            vertical={false}
          />
          
          <XAxis 
            dataKey="time" 
            stroke="rgba(255, 255, 255, 0.5)"
            style={{ fontSize: '10px' }}
            tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
            interval={23} // Показывать каждую 24-ю метку (примерно каждый час) для читаемости
            angle={-45}
            textAnchor="end"
            height={60}
          />
          
          <YAxis 
            stroke="rgba(255, 255, 255, 0.5)"
            style={{ fontSize: '11px' }}
            tick={{ fill: 'rgba(255, 255, 255, 0.6)' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
            domain={[0, maxYValue]}
            ticks={yAxisTicks}
            tickFormatter={(value) => `${value}`}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Три линии графика как на скриншоте - волнистые и плавные */}
          <Line
            type="monotone"
            dataKey="value1"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#glow1)"
          />
          <Line
            type="monotone"
            dataKey="value2"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#glow2)"
          />
          <Line
            type="monotone"
            dataKey="value3"
            stroke="#ec4899"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#glow3)"
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
