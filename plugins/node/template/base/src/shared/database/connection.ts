import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';

class DatabaseConnectionManager {
  private static instance: PrismaClient;
  private static isConnected: boolean = false;

  /**
   * Get singleton Prisma instance
   */
  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Log queries in development
      this.instance.$on('query' as never, (e: any) => {
        logger.debug({
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });

      // Log errors
      this.instance.$on('error' as never, (e: any) => {
        logger.error({ error: e }, 'Prisma error');
      });

      // Log warnings
      this.instance.$on('warn' as never, (e: any) => {
        logger.warn({ warning: e }, 'Prisma warning');
      });
    }

    return this.instance;
  }

  /**
   * Connect to database
   */
  static async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const prisma = this.getInstance();
      await prisma.$connect();
      this.isConnected = true;
      logger.info('✓ Database connected');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database');
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  static async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const prisma = this.getInstance();
      await prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error({ error }, 'Failed to disconnect from database');
      throw error;
    }
  }

  /**
   * Check database health
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const prisma = this.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return false;
    }
  }

  /**
   * Get connection status
   */
  static isHealthy(): boolean {
    return this.isConnected;
  }
}

export default DatabaseConnectionManager;
