// server/api/files/[id].delete.ts
import db from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  await db.file.delete({ where: { id } })
  // Chunk 通过 onDelete: Cascade 自动删除

  return { success: true }
})
