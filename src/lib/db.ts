import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Prisma cannot connect to the database.")
  }

  if (globalForPrisma.prisma) return globalForPrisma.prisma

  const client = new PrismaClient()
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client
  return client
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient()
    return (client as any)[prop]
  }
})

export default prisma

