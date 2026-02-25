import { env } from "./env";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
})

export default prisma;
