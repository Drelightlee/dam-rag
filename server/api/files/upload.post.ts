// server/api/files/upload.post.ts
import db from '~/server/utils/db'
import { chunkText } from '~/server/utils/chunking'
import { getEmbedding } from '~/server/utils/embeddings'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)
  const file = formData.get('file') as File

  if (!file) {
    throw createError({ statusCode: 400, message: '未提供文件' })
  }

  const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    throw createError({ statusCode: 400, message: '仅支持 .txt .md .pdf 文件' })
  }

  // 创建文件记录，状态 PROCESSING
  const fileRecord = await db.file.create({
    data: {
      name: file.name,
      size: file.size,
      mimeType: file.type,
      status: 'PROCESSING',
    },
  })

  // 异步处理（不阻塞响应）
  processFile(fileRecord.id, file).catch(async (err) => {
    console.error('文件处理失败:', err)
    await db.file.update({
      where: { id: fileRecord.id },
      data: { status: 'ERROR' },
    })
  })

  return { id: fileRecord.id, status: 'PROCESSING' }
})

async function processFile(fileId: string, file: File) {
  const text = await file.text()
  const chunks = chunkText(text)

  for (const chunkContent of chunks) {
    const embedding = await getEmbedding(chunkContent)

    if (!embedding.every(n => typeof n === 'number' && isFinite(n))) {
      throw new Error('Embedding 包含无效数值')
    }

    await db.$executeRaw`
      INSERT INTO "Chunk" (id, "fileId", content, embedding)
      VALUES (gen_random_uuid(), ${fileId}, ${chunkContent}, ${`[${embedding.join(',')}]`}::vector)
    `
  }

  await db.file.update({
    where: { id: fileId },
    data: { status: 'READY' },
  })
}
