import prisma from "../../config/database";
import { logger } from "../../config/logger";
import { CreateUserInput, UpdateUserInput } from "./user.schema";
import bcrypt from "bcrypt";

export class UserService {
  async createUser(data: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword
      }
    })
    logger.info(`User created: ${user.id}`);
  }


  async getUserById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return user;
  }


  async listUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany(
        {
          skip, take: limit,
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            updatedAt: true,
          },
        },

      ),
      prisma.user.count()
    ])

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
      }
    }
  }


  async updateUser(id: number, data: UpdateUserInput) {
    const updateData: any = { ...data }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);


    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      }
    })
    return user;
  }


  async deleteUser(id: number) {
    await prisma.user.delete({
      where: { id }
    })
  }
}
