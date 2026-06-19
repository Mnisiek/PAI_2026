<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="skeleton-image" />
    <div class="skeleton-content">
      <div class="skeleton-line skeleton-line--title" />
      <div class="skeleton-line skeleton-line--details" />
      <div class="skeleton-line skeleton-line--price" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  border: 1px solid var(--color-border-soft);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  overflow: hidden;
}

.skeleton-image {
  height: 190px;
  background: linear-gradient(90deg, #e2e8f0 15%, #f8fafc 45%, #e2e8f0 85%);
  background-size: 220% 100%;
  animation: shimmer 1.1s linear infinite;
}

.skeleton-content {
  padding: 1rem;
}

.skeleton-line {
  border-radius: 999px;
  margin-bottom: 0.7rem;
  background: linear-gradient(90deg, #dfe5ee 10%, #f8fafc 45%, #dfe5ee 80%);
  background-size: 220% 100%;
  animation: shimmer 1.1s linear infinite;
}

.skeleton-line--title {
  height: 16px;
  width: 74%;
}

.skeleton-line--details {
  height: 13px;
  width: 92%;
}

.skeleton-line--price {
  height: 18px;
  width: 36%;
  margin-bottom: 0;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}
</style>
