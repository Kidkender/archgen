import { env } from "../../config";
import { ERROR_INVALID_CREDENTIALS, ERROR_USER_ALREADY_EXISTS, ERROR_USER_NOT_FOUND } from "../../constants";
import { BadRequestException, logger, NotFoundException, UnauthorizedException } from "../../core";
import { hashPassword } from "../../shared/utils";
import { LoginInput, RegisterInput, TokenResponse } from "./auth.schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { PrismaClient } from "@prisma/client";

export class AuthService {

  constructor(private prisma: PrismaClient) { }

  async register(data: RegisterInput) {
    const existUser = await this.prisma.user.findFirst({
      where: {
        email: data.email
      }
    })

    if (existUser) {
      throw new BadRequestException(ERROR_USER_ALREADY_EXISTS)
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    })

    logger.info(`User registered: ${user.email}`)
  }

  async login(data: LoginInput): Promise<TokenResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      throw new NotFoundException(ERROR_USER_NOT_FOUND)
    }

    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
      throw new UnauthorizedException(ERROR_INVALID_CREDENTIALS)
    }

    const token = this.generateToken(user.id, user.email);

    return token
  }

  private generateToken(userId: number, email: string): TokenResponse {
    const payload = {
      userId,
      email
    }

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as StringValue,
    });

    return {
      userId,
      accessToken,
    }
  }
}
