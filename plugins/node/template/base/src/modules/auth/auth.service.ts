import { env } from "../../config";
import prisma from "../../config/database";
import { ERROR_USER_ALREADY_EXISTS } from "../../constants";
import { LoginInput, RegisterInput, TokenResponse } from "./auth.dto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

export class AuthService {
  async register(data: RegisterInput) {
    const existUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username }
        ]
      }
    })

    if (existUser) {
      throw new Error(ERROR_USER_ALREADY_EXISTS)
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
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

    const token = this.generateToken(user.id, user.email);

    return { user.id, ...token }
  }


  async login(data: LoginInput): Promise<{ user: any } & TokenResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (!user) {
      throw new Error("Invalid credentials")
    }

    const isValid = await bcrypt.compare(data.password, user.password);

    if (!isValid) {
      throw new Error("Invalid credentials")
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt
      },
      ...token
    }
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
