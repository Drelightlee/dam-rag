<!-- components/FileCard.vue -->
<script setup lang="ts">
interface FileItem {
  id: string
  name: string
  size: number
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR'
  createdAt: string
  _count: { chunks: number }
}

const props = defineProps<{ file: FileItem }>()
const emit = defineEmits<{ deleted: [id: string] }>()

const statusConfig = {
  PENDING:    { label: '等待中', class: 'bg-gray-100 text-gray-600' },
  PROCESSING: { label: '处理中', class: 'bg-yellow-100 text-yellow-700' },
  READY:      { label: '就绪',   class: 'bg-green-100 text-green-700' },
  ERROR:      { label: '失败',   class: 'bg-red-100 text-red-600' },
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function deleteFile() {
  if (!confirm(`确定删除 ${props.file.name}？`)) return
  try {
    await $fetch(`/api/files/${props.file.id}`, { method: 'DELETE' })
    emit('deleted', props.file.id)
  } catch {
    alert('删除失败，请重试')
  }
}
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
    <div class="flex-1 min-w-0">
      <p class="font-medium text-gray-900 truncate">{{ file.name }}</p>
      <p class="text-sm text-gray-500 mt-0.5">
        {{ formatSize(file.size) }}
        <span v-if="file.status === 'READY'"> · {{ file._count.chunks }} 个文本块</span>
      </p>
    </div>
    <div class="flex items-center gap-3 ml-4">
      <span
        class="text-xs px-2 py-0.5 rounded-full font-medium"
        :class="statusConfig[file.status].class"
      >
        {{ statusConfig[file.status].label }}
      </span>
      <button
        class="text-gray-400 hover:text-red-500 transition-colors text-sm"
        @click="deleteFile"
      >
        删除
      </button>
    </div>
  </div>
</template>
