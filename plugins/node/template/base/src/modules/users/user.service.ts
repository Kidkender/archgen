import prisma from "../../config/database";
import { logger } from "../../core/logger";
import { hashPassword } from "../../shared/utils";
import { CreateUserInput, UpdateUserInput } from "./user.schema";

import { PrismaClient } from "@prisma/client";

export class UserService {
  constructor(private prisma: PrismaClient) { }

  async createUser(data: CreateUserInput) {

    const hashedPassword = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword
      }
    })
    logger.info(`User created: ${user.id}`);
  }


  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
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
      this.prisma.user.findMany(
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
      this.prisma.user.count()
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
      updateData.password = await hashPassword(data.password);

    }

    const user = await this.prisma.user.update({
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
    await this.prisma.user.delete({
      where: { id }
    })
  }
}
