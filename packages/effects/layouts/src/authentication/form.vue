<script setup lang="ts">
defineOptions({
  name: 'AuthenticationFormView',
});
</script>

<template>
  <div class="auth-form-view">
    <slot></slot>
    <div class="auth-form-inner">
      <RouterView v-slot="{ Component, route }">
        <Transition appear mode="out-in" name="slide-right">
          <KeepAlive :include="['Login']">
            <component
              :is="Component"
              :key="route.fullPath"
              class="auth-form-content"
            />
          </KeepAlive>
        </Transition>
      </RouterView>
    </div>

    <div class="auth-copyright text-muted-foreground">
      <slot name="copyright"> </slot>
    </div>
  </div>
</template>

<style scoped>
.auth-form-view {
  position: relative;
  display: flex;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
  padding: 92px clamp(32px, 5vw, 72px) 64px;
  background: hsl(var(--background));
}

.auth-form-inner {
  width: min(100%, 430px);
  animation: form-enter 420ms 80ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.auth-form-content {
  width: 100%;
}

.auth-copyright {
  position: absolute;
  right: 24px;
  bottom: 20px;
  left: 24px;
  display: flex;
  justify-content: center;
  text-align: center;
  font-size: 12px;
}

@keyframes form-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .auth-form-view {
    align-items: flex-start;
    padding: 116px 20px 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-form-inner {
    animation: none;
  }
}
</style>
