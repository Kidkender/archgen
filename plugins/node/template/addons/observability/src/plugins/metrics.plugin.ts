import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import client from 'prom-client';

const metricsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const register = new client.Registry();
  client.collectDefaultMetrics({ register });

  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });

  fastify.addHook('onRequest', async (request) => {
    (request as typeof request & { _metricsStart: number })._metricsStart = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const start = (request as typeof request & { _metricsStart: number })._metricsStart;
    if (start) {
      httpRequestDuration.observe(
        { method: request.method, route: request.routeOptions.url ?? request.url, status_code: reply.statusCode },
        (Date.now() - start) / 1000,
      );
    }
  });

  fastify.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });
});

export default metricsPlugin;
