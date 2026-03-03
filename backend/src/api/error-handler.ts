/**
 * Global error handler for Fastify.
 * Maps errors to consistent API response shape:
 * { success: false, error: { code, message, details? } }
 */

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../infrastructure/logger/index.js';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export function buildErrorResponse(code: string, message: string, details?: unknown[]): ErrorResponse {
  return {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const traceId = request.id;

  // Zod validation errors (if using zod for manual validation)
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    reply.status(400).send(
      buildErrorResponse('VALIDATION_ERROR', 'Request validation failed', details),
    );
    return;
  }

  // Fastify schema validation errors (JSON Schema)
  if (error.validation) {
    const details = error.validation.map((v) => ({
      field: v.instancePath || v.params?.['missingProperty'] || 'unknown',
      message: v.message ?? 'Invalid value',
    }));
    reply.status(400).send(
      buildErrorResponse('VALIDATION_ERROR', 'Request validation failed', details),
    );
    return;
  }

  // Rate limit errors from @fastify/rate-limit
  if (error.statusCode === 429) {
    reply.status(429).send(
      buildErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests. Please slow down.'),
    );
    return;
  }

  // Not found
  if (error.statusCode === 404) {
    reply.status(404).send(buildErrorResponse('NOT_FOUND', error.message || 'Resource not found'));
    return;
  }

  // Unexpected error — log it and return 500
  logger.error(
    { err: error, traceId, url: request.url, method: request.method },
    'Unhandled error',
  );

  const isDev = process.env['NODE_ENV'] === 'development';
  reply.status(500).send(
    buildErrorResponse(
      'INTERNAL_ERROR',
      isDev ? error.message : 'An unexpected error occurred. Please try again.',
    ),
  );
}
