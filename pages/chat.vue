<!-- pages/chat.vue -->
<template>
  <div class="h-screen flex flex-col">
    <div class="border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <NuxtLink to="/" class="text-gray-500 hover:text-gray-700 text-sm">← 文件库</NuxtLink>
      <h1 class="font-semibold text-gray-900">AI 对话</h1>
    </div>
    <div class="flex-1 overflow-hidden">
      <ChatWindow />
    </div>
  </div>
</template>
