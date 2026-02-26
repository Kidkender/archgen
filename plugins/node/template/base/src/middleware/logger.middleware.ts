import { FastifyRequest, FastifyReply } from 'fastify';

export async function loggerMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const start = Date.now();

  request.log.info({
    method: request.method,
    url: request.url,
    headers: request.headers,
  }, 'Incoming request');

  reply.then(
    () => {
      const duration = Date.now() - start;

      request.log.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
      }, 'Request completed');
    },
    (err) => {
      const duration = Date.now() - start;

      request.log.error({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
        error: err?.message,
      }, 'Request failed');
    }
  );
}
