<!-- components/FileUploader.vue -->
<script setup lang="ts">
const isDragging = ref(false)
const isUploading = ref(false)
const inputRef = ref<HTMLInputElement>()

const emit = defineEmits<{
  uploaded: []
}>()

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) await uploadFile(files[0])
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await uploadFile(file)
}

async function uploadFile(file: File) {
  const allowed = ['text/plain', 'text/markdown', 'application/pdf']
  if (!allowed.includes(file.type)) {
    alert('仅支持 .txt .md .pdf 文件')
    return
  }

  isUploading.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    await $fetch('/api/files/upload', { method: 'POST', body: formData })
    emit('uploaded')
  } catch {
    alert('上传失败，请重试')
  } finally {
    isUploading.value = false
    if (inputRef.value) inputRef.value.value = ''
  }
}
</script>

<template>
  <div
    class="border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
    :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="inputRef?.click()"
  >
    <input
      ref="inputRef"
      type="file"
      accept=".txt,.md,.pdf"
      class="hidden"
      @change="onFileChange"
    />
    <div v-if="isUploading" class="text-gray-500">上传并处理中...</div>
    <div v-else>
      <p class="text-gray-600">拖拽文件到此处，或点击上传</p>
      <p class="text-sm text-gray-400 mt-1">支持 .txt .md .pdf</p>
    </div>
  </div>
</template>
