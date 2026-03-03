import pino from 'pino';
import { env } from '../../config/env.js';

/**
 * Structured JSON logger (pino).
 *
 * In development: pretty-printed output via pino-pretty.
 * In production: raw JSON to stdout for log aggregators (Datadog, CloudWatch, etc.).
 *
 * Every log line includes { timestamp, level, service, traceId? }.
 * Callers should add a `context` object for request-scoped data.
 */
export const logger = pino(
  {
    level: env.LOG_LEVEL,
    base: {
      service: 'lens-api',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    redact: {
      paths: ['*.password', '*.token', '*.apiKey', '*.FIRECRAWL_API_KEY'],
      censor: '[REDACTED]',
    },
  },
  env.NODE_ENV === 'development'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname,service',
        },
      })
    : pino.destination(1), // stdout
);
