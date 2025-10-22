<template>
  <v-menu open-on-hover>
    <template #activator="{ props }">
      <v-btn
        icon
        v-bind="props"
        density="compact"
      >
        <v-icon>mdi-information-variant-circle-outline</v-icon>
      </v-btn>
    </template>
    <v-card class="info-card">
      <slot name="info">
        <v-card-text>{{ infoText }}</v-card-text>
      </slot>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
interface Props {
  infoText: string;
}

defineProps<Props>();
</script>

<style scoped>
.info-card {
  padding: 10px;
  border-radius: 5px;
}
</style>
