import { FastifyInstance } from 'fastify';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { createUserSchema, updateUserSchema } from './user.schema';
import { UserService } from './user.service';

export default async function userRoutes(app: FastifyInstance) {
  const service = new UserService(app.prisma);
  const controller = new UserController(service);

  app.post(
    '/',
    {
      schema: {
        body: createUserSchema,
        tags: ['Users'],
      },
    },
    controller.create,
  );

  app.get(
    '/:id',
    {
      preHandler: authenticate,
      schema: { tags: ['Users'] },
    },
    controller.getById,
  );

  app.get(
    '/',
    {
      preHandler: authenticate,
      schema: { tags: ['Users'] },
    },
    controller.list,
  );

  app.patch(
    '/:id',
    {
      preHandler: authenticate,
      schema: {
        body: updateUserSchema,
        tags: ['Users'],
      },
    },
    controller.update,
  );

  app.delete(
    '/:id',
    {
      preHandler: authenticate,
      schema: { tags: ['Users'] },
    },
    controller.delete,
  );
}
