<!-- pages/index.vue -->
<script setup lang="ts">
const { data: files, refresh } = await useFetch('/api/files')

// 当有文件处于 PROCESSING/PENDING 状态时，每3秒自动刷新
const hasProcessing = computed(() =>
  files.value?.some(f => f.status === 'PROCESSING' || f.status === 'PENDING'),
)

let timer: ReturnType<typeof setInterval> | undefined
watch(hasProcessing, (val) => {
  clearInterval(timer)
  if (val) timer = setInterval(refresh, 3000)
}, { immediate: true })

onUnmounted(() => clearInterval(timer))

function onDeleted(id: string) {
  if (files.value) {
    files.value = files.value.filter((f: any) => f.id !== id)
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto py-10 px-4">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-gray-900">文件库</h1>
      <NuxtLink
        to="/chat"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
      >
        开始对话 →
      </NuxtLink>
    </div>

    <FileUploader class="mb-6" @uploaded="refresh" />

    <div v-if="files?.length" class="space-y-3">
      <FileCard
        v-for="file in files"
        :key="file.id"
        :file="file"
        @deleted="onDeleted"
      />
    </div>
    <div v-else class="text-center text-gray-400 py-12">
      还没有文件，上传一个试试
    </div>
  </div>
</template>
