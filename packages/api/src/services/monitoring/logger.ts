/**
 * Structured Logging Configuration for Ultra AI Platform
 * 
 * Uses Winston for comprehensive, structured logging with multiple transports
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

/**
 * Custom format for logs with context
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json(),
);

/**
 * Create a logger instance with standard configuration
 */
function createLogger(label: string): winston.Logger {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: customFormat,
    defaultMeta: { service: 'ultra-ai-api', module: label },
    transports: [
      // Error logs
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: customFormat,
      }),
      // Combined logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: customFormat,
      }),
    ],
  });
}

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, metadata }) => {
        const meta = metadata && Object.keys(metadata).length > 0
          ? ` ${JSON.stringify(metadata)}`
          : '';
        return `${timestamp} [${level}] ${message}${meta}`;
      }),
    ),
  });

  // Add to all loggers
  winston.loggers.options.transports?.push(consoleTransport);
}

/**
 * Logger class with context management
 */
export class StructuredLogger {
  private logger: winston.Logger;
  private context: LogContext = {
    correlationId: uuidv4(),
  };

  constructor(label: string) {
    this.logger = createLogger(label);
  }

  /**
   * Set correlation ID for request tracking
   */
  setCorrelationId(correlationId: string): void {
    this.context.correlationId = correlationId;
  }

  /**
   * Set user context
   */
  setUser(userId: string): void {
    this.context.userId = userId;
  }

  /**
   * Set request context
   */
  setRequestContext(method: string, endpoint: string): void {
    this.context.method = method;
    this.context.endpoint = endpoint;
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Partial<LogContext>): void {
    this.logger.info(message, { ...this.context, ...meta });
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Partial<LogContext>): void {
    this.logger.warn(message, { ...this.context, ...meta });
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | string, meta?: Partial<LogContext>): void {
    const errorMeta = {
      ...this.context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
      }),
      ...(typeof error === 'string' && { error }),
      ...meta,
    };
    this.logger.error(message, errorMeta);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Partial<LogContext>): void {
    this.logger.debug(message, { ...this.context, ...meta });
  }

  /**
   * Log verbose message
   */
  verbose(message: string, meta?: Partial<LogContext>): void {
    this.logger.verbose?.(message, { ...this.context, ...meta });
  }

  /**
   * Log HTTP request
   */
  logHttpRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string,
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.logger[level](
      `${method} ${endpoint} ${statusCode} ${duration}ms`,
      {
        ...this.context,
        method,
        endpoint,
        statusCode,
        duration,
        userId,
      },
    );
  }

  /**
   * Log database operation
   */
  logDbOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    error?: Error,
  ): void {
    const level = success ? 'debug' : 'error';
    const message = `Database ${operation} on ${table} - ${duration}ms`;
    
    this.logger[level](message, {
      ...this.context,
      operation,
      table,
      duration,
      success,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
      }),
    });
  }

  /**
   * Log authentication event
   */
  logAuthEvent(
    event: 'login' | 'logout' | 'register' | 'token_refresh',
    userId: string,
    success: boolean,
    error?: Error,
  ): void {
    const level = success ? 'info' : 'warn';
    const message = `Auth ${event} - ${success ? 'success' : 'failure'}`;
    
    this.logger[level](message, {
      ...this.context,
      event,
      userId,
      success,
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
      }),
    });
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
  ): void {
    const levelMap = {
      low: 'debug',
      medium: 'warn',
      high: 'error',
      critical: 'error',
    };
    
    const level = levelMap[severity];
    this.logger[level](`Security: ${event}`, {
      ...this.context,
      severity,
      ...details,
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(metric: string, value: number, unit: string): void {
    this.logger.info(`Performance: ${metric}`, {
      ...this.context,
      metric,
      value,
      unit,
    });
  }

  /**
   * Create child logger with additional context
   */
  child(metadata: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger('child');
    childLogger.context = { ...this.context, ...metadata };
    return childLogger;
  }
}

// Export singleton loggers for different modules
export const appLogger = new StructuredLogger('app');
export const authLogger = new StructuredLogger('auth');
export const dbLogger = new StructuredLogger('database');
export const securityLogger = new StructuredLogger('security');
export const aiLogger = new StructuredLogger('ai-processing');
