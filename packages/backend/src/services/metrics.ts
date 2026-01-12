/**
 * Metrics Service
 * Basic metrics collection for monitoring application performance
 */

interface MetricsData {
  requests: {
    total: number;
    byMethod: Record<string, number>;
    byPath: Record<string, number>;
    byStatus: Record<number, number>;
  };
  responseTimes: {
    count: number;
    total: number;
    min: number;
    max: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
  activeConnections: number;
  startTime: number;
}

class MetricsService {
  private metrics: MetricsData = {
    requests: {
      total: 0,
      byMethod: {},
      byPath: {},
      byStatus: {},
    },
    responseTimes: {
      count: 0,
      total: 0,
      min: Infinity,
      max: 0,
    },
    errors: {
      total: 0,
      byType: {},
    },
    activeConnections: 0,
    startTime: Date.now(),
  };

  /**
   * Record an incoming request
   */
  recordRequest(method: string, path: string): void {
    this.metrics.requests.total++;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;

    // Group paths (remove IDs for better aggregation)
    const groupedPath = path.replace(/\/[0-9a-f-]+/g, '/:id');
    this.metrics.requests.byPath[groupedPath] = (this.metrics.requests.byPath[groupedPath] || 0) + 1;
  }

  /**
   * Record a response
   */
  recordResponse(statusCode: number, duration: number): void {
    this.metrics.requests.byStatus[statusCode] = (this.metrics.requests.byStatus[statusCode] || 0) + 1;

    // Update response time statistics
    this.metrics.responseTimes.count++;
    this.metrics.responseTimes.total += duration;
    this.metrics.responseTimes.min = Math.min(this.metrics.responseTimes.min, duration);
    this.metrics.responseTimes.max = Math.max(this.metrics.responseTimes.max, duration);
  }

  /**
   * Record an error
   */
  recordError(errorType: string): void {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
  }

  /**
   * Increment active connections
   */
  incrementConnections(): void {
    this.metrics.activeConnections++;
  }

  /**
   * Decrement active connections
   */
  decrementConnections(): void {
    this.metrics.activeConnections--;
  }

  /**
   * Get all metrics
   */
  getMetrics(): MetricsData & { uptime: number; avgResponseTime: number } {
    const uptime = Date.now() - this.metrics.startTime;
    const avgResponseTime = this.metrics.responseTimes.count > 0
      ? this.metrics.responseTimes.total / this.metrics.responseTimes.count
      : 0;

    return {
      ...this.metrics,
      uptime,
      avgResponseTime,
    };
  }

  /**
   * Get metrics summary (for health check)
   */
  getSummary() {
    const metrics = this.getMetrics();
    return {
      uptime: Math.floor(metrics.uptime / 1000), // seconds
      requests: metrics.requests.total,
      activeConnections: metrics.activeConnections,
      avgResponseTime: Math.round(metrics.avgResponseTime),
      errors: metrics.errors.total,
    };
  }

  /**
   * Reset metrics (use with caution)
   */
  reset(): void {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byPath: {},
        byStatus: {},
      },
      responseTimes: {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
      },
      errors: {
        total: 0,
        byType: {},
      },
      activeConnections: this.metrics.activeConnections, // Keep current connections
      startTime: Date.now(),
    };
  }
}

// Singleton instance
export const metricsService = new MetricsService();
