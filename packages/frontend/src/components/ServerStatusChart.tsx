/**
 * Server Status Chart Component
 * График мониторинга Minecraft сервера - онлайн игроков за 24 часа
 *
 * Оптимизирован для производительности:
 * - Мемоизация форматирования данных
 * - Адаптивный дизайн с ResponsiveContainer
 * - Оптимизированное обновление данных
 *
 * @module components/ServerStatusChart
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WifiOff } from 'lucide-react';
import { ServerStatus } from '@modern-launcher/shared';
import { useServerStatistics } from '../hooks/api';

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

/**
 * Преобразуем статистику в формат для графика (24 часа, каждые 5 минут)
 * Мемоизированная функция для оптимизации производительности
 */
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


export default function ServerStatusChart({ status, isLoading = false, serverAddress, serverPort = 25565 }: ServerStatusChartProps) {
  // Используем custom hook для получения статистики с кешированием
  const { data: statistics = [], isLoading: isLoadingStats } = useServerStatistics(
    serverAddress || null,
    serverPort,
    {
      enabled: !!serverAddress && !!status?.online,
      refetchInterval: 60000, // Обновлять каждую минуту
    } as any
  );

  // Мемоизируем форматирование данных для оптимизации производительности
  const chartData = useMemo(() => {
    if (!status || !status.online) return [];
    const online = status.players?.online || 0;
    return formatStatisticsData(statistics, online);
  }, [statistics, status?.players?.online, status?.online]);

  // Мемоизируем вычисление максимального значения Y-оси
  const { maxYValue, yAxisTicks } = useMemo(() => {
    if (chartData.length === 0) {
      return { maxYValue: 50, yAxisTicks: Array.from({ length: 11 }, (_, i) => i * 5) };
    }
    const max = status?.players?.max || 50;
    const maxDataValue = Math.max(
      ...chartData.map(d => Math.max(d.value1, d.value2, d.value3)),
      max
    );
    const maxY = Math.max(50, Math.ceil(maxDataValue / 10) * 10);
    const ticks = Array.from({ length: Math.floor(maxY / 5) + 1 }, (_, i) => i * 5);
    return { maxYValue: maxY, yAxisTicks: ticks };
  }, [chartData, status?.players?.max]);

  // Мемоизируем кастомный tooltip
  const CustomTooltipMemo = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-dark-panel/95 border border-techno-cyan/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-white text-xs font-semibold mb-2 font-mono">{data.time}</p>
          {payload.map((entry: any, index: number) => {
            const labels = ['Онлайн', 'Средний', 'Минимум'];
            const value = entry.value || 0;
            
            return (
              <div key={index} className="mb-1">
                <p className="text-xs font-mono" style={{ color: entry.color }}>
                  {labels[index]}: <span className="text-white font-semibold">{value}</span>
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }, []);

  if (isLoading || isLoadingStats || !status) {
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

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* График - адаптивный контейнер */}
      <div className="flex-1 min-h-[300px] sm:min-h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
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
            stroke="rgba(255, 255, 255, 0.05)" 
            vertical={false}
          />
          
          <XAxis 
            dataKey="time" 
            stroke="#6B7280"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6B7280' }}
            interval={23} // Показывать каждую 24-ю метку (примерно каждый час) для читаемости
            angle={-45}
            textAnchor="end"
            height={60}
          />
          
          <YAxis 
            stroke="#6B7280"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6B7280' }}
            domain={[0, maxYValue]}
            ticks={yAxisTicks}
            tickFormatter={(value) => `${value}`}
          />
          
          <Tooltip 
            content={<CustomTooltipMemo />}
            contentStyle={{ backgroundColor: '#1A2332', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '4px' }}
          />
          
          {/* Три линии графика - обновленные цвета под дизайн */}
          <Line
            type="monotone"
            dataKey="value1"
            stroke="#B026FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: '#B026FF', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#glow1)"
          />
          <Line
            type="monotone"
            dataKey="value2"
            stroke="#00F5FF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: '#00F5FF', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#glow2)"
          />
          <Line
            type="monotone"
            dataKey="value3"
            stroke="#4A9EFF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: '#4A9EFF', stroke: '#fff', strokeWidth: 2 }}
            filter="url(#glow3)"
          />
        </LineChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
