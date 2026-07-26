<template>
  <div class="auth-title mb-7 w-full">
    <h2 class="text-foreground mb-3 text-3xl font-bold leading-9">
      <slot></slot>
    </h2>
    <p class="text-muted-foreground text-sm leading-6">
      <slot name="desc"></slot>
    </p>
  </div>
</template>

<style scoped>
.auth-title h2 {
  letter-spacing: 0;
}

.auth-title p {
  max-width: 38ch;
}
</style>
