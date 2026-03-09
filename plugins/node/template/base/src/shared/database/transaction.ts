import { PrismaClient } from '@prisma/client';
import prisma from '../../config/database';

/**
 * Execute operations in transaction
 */
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

/**
 * Execute multiple operations in transaction
 */
export async function executeInTransaction<T>(
  operations: ((tx: PrismaClient) => Promise<any>)[]
): Promise<T[]> {
  return await prisma.$transaction(
    operations.map((op) => op(prisma))
  );
}

/**
 * Retry transaction on failure
 */
export async function retryTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await prisma.$transaction(callback);
    } catch (error) {
      lastError = error as Error;

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, i) * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Transaction failed after retries');
}
