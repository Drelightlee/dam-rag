// server/api/files/index.get.ts
import db from '~/server/utils/db'

export default defineEventHandler(async () => {
  return db.file.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      size: true,
      mimeType: true,
      status: true,
      createdAt: true,
      _count: { select: { chunks: true } },
    },
  })
})
