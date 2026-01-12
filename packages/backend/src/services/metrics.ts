/**
 * Metrics Service
 *
 * In-memory metrics collection for monitoring application performance and health.
 * Provides real-time visibility into request statistics, response times, errors, and connections.
 *
 * @example
 * ```ts
 * import { metricsService } from './services/metrics';
 *
 * // Record a request (typically done via middleware)
 * metricsService.recordRequest('GET', '/api/users');
 * metricsService.recordResponse(200, 45); // 45ms response time
 *
 * // Get all metrics
 * const metrics = metricsService.getMetrics();
 * console.log(`Total requests: ${metrics.requests.total}`);
 * console.log(`Average response time: ${metrics.avgResponseTime}ms`);
 * console.log(`Uptime: ${Math.floor(metrics.uptime / 1000)}s`);
 *
 * // Get summary for health check
 * const summary = metricsService.getSummary();
 * console.log(`Active connections: ${summary.activeConnections}`);
 * ```
 *
 * @feature Request counting by method, path, and status code
 * @feature Response time tracking (min, max, average)
 * @feature Error categorization by type
 * @feature Active connection monitoring
 * @feature Thread-safe singleton pattern
 */

/**
 * Raw metrics data structure
 *
 * @interface MetricsData
 * @property requests - Request statistics
 * @property responseTimes - Response time statistics
 * @property errors - Error statistics
 * @property activeConnections - Current number of active connections
 * @property startTime - Server start timestamp
 */
interface MetricsData {
  /** Request statistics */
  requests: {
    /** Total number of requests received */
    total: number;
    /** Request count by HTTP method (GET, POST, etc.) */
    byMethod: Record<string, number>;
    /** Request count by path (UUIDs replaced with :id for aggregation) */
    byPath: Record<string, number>;
    /** Request count by HTTP status code */
    byStatus: Record<number, number>;
  };
  /** Response time statistics in milliseconds */
  responseTimes: {
    /** Number of responses recorded */
    count: number;
    /** Total response time (for calculating average) */
    total: number;
    /** Minimum response time */
    min: number;
    /** Maximum response time */
    max: number;
  };
  /** Error statistics */
  errors: {
    /** Total number of errors */
    total: number;
    /** Error count by type (NETWORK_ERROR, VALIDATION_ERROR, etc.) */
    byType: Record<string, number>;
  };
  /** Current number of active connections */
  activeConnections: number;
  /** Server start timestamp for uptime calculation */
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
   *
   * Increments request counters for total, by method, and by path.
   * Path UUIDs are automatically replaced with :id for better aggregation.
   *
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param path - Request path (e.g., /api/users/123)
   *
   * @example
   * ```ts
   * metricsService.recordRequest('GET', '/api/users');
   * metricsService.recordRequest('POST', '/api/users/123');
   * // Path becomes '/api/users/:id' for aggregation
   * ```
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
   *
   * Updates response status code counter and response time statistics.
   *
   * @param statusCode - HTTP status code (200, 404, 500, etc.)
   * @param duration - Response time in milliseconds
   *
   * @example
   * ```ts
   * metricsService.recordResponse(200, 45);   // Success in 45ms
   * metricsService.recordResponse(404, 12);   // Not found in 12ms
   * metricsService.recordResponse(500, 150);  // Error in 150ms
   * ```
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
   *
   * Increments error counters for total and by type.
   *
   * @param errorType - Type of error (NETWORK_ERROR, VALIDATION_ERROR, AUTHENTICATION_ERROR, etc.)
   *
   * @example
   * ```ts
   * metricsService.recordError('NETWORK_ERROR');
   * metricsService.recordError('VALIDATION_ERROR');
   * ```
   */
  recordError(errorType: string): void {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
  }

  /**
   * Increment active connections counter
   *
   * Called when a new request starts processing.
   *
   * @example
   * ```ts
   * metricsService.incrementConnections();
   * ```
   */
  incrementConnections(): void {
    this.metrics.activeConnections++;
  }

  /**
   * Decrement active connections counter
   *
   * Called when a request completes (response sent or error occurs).
   *
   * @example
   * ```ts
   * metricsService.decrementConnections();
   * ```
   */
  decrementConnections(): void {
    this.metrics.activeConnections--;
  }

  /**
   * Get all metrics with computed values
   *
   * Returns complete metrics including calculated uptime and average response time.
   *
   * @returns Complete metrics data
   *
   * @example
   * ```ts
   * const metrics = metricsService.getMetrics();
   * console.log(`Requests: ${metrics.requests.total}`);
   * console.log(`Average: ${metrics.avgResponseTime}ms`);
   * console.log(`Min: ${metrics.responseTimes.min}ms`);
   * console.log(`Max: ${metrics.responseTimes.max}ms`);
   * console.log(`Errors: ${metrics.errors.total}`);
   * ```
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
   * Get metrics summary (for health check endpoint)
   *
   * Returns a simplified metrics object for health checks.
   *
   * @returns Simplified metrics with uptime, request count, active connections, avg response time, and error count
   *
   * @example
   * ```ts
   * const summary = metricsService.getSummary();
   * // { uptime: 3600, requests: 1234, activeConnections: 5, avgResponseTime: 45, errors: 2 }
   * ```
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
   * Reset all metrics (use with caution)
   *
   * Clears all accumulated metrics except active connections.
   * Resets start time to current time. Useful for testing or manual reset.
   *
   * @example
   * ```ts
   * // Reset metrics after deployment or for testing
   * metricsService.reset();
   * ```
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
