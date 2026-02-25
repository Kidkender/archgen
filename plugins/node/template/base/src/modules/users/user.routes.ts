import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserQuerySchema,
} from './user.dto';
import z from 'zod';

const controller = new UserController();

export default async function userRoutes(app: FastifyInstance) {

  app.post(
    '/',
    {
      schema: {
        body: createUserSchema,
        tags: ['Users'],
      },
    },
    controller.create
  );

  app.get(
    '/:id',
    {
      preHandler: authenticate,
      schema: {
        params: z.object({
          id: z.string()
        }),
        tags: ['Users'],
      },
    },
    controller.getById
  );

  app.get(
    '/',
    {
      preHandler: authenticate,
      schema: {
        querystring: getUserQuerySchema,
        tags: ['Users'],
      },
    },
    controller.list
  );

  app.patch(
    '/:id',
    {
      preHandler: authenticate,
      schema: {
        params: z.object({
          id: z.string()
        }),
        body: updateUserSchema,
        tags: ['Users'],
      },
    },
    controller.update
  );

  app.delete(
    '/:id',
    {
      preHandler: authenticate,
      schema: {
        params: z.object({
          id: z.string()
        }),
        tags: ['Users'],
      },
    },
    controller.delete
  );
}
