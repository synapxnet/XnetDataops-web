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
  box-sizing: border-box;
  display: flex;
  min-height: calc(100dvh - 56px);
  align-items: center;
  justify-content: center;
  padding: 88px clamp(32px, 4vw, 64px) 64px;
  border: 1px solid var(--auth-panel-border);
  border-radius: 8px;
  background: var(--auth-panel-bg);
  box-shadow:
    0 24px 64px var(--auth-panel-shadow),
    inset 0 1px 0 rgb(255 255 255 / 10%);
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
    min-height: calc(100dvh - 24px);
    padding: 112px 20px 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .auth-form-inner {
    animation: none;
  }
}
</style>
