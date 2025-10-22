<template>
  <div class="comparison-data-controls">
    <v-tabs
      v-model="tab"
    >
      <v-tab :value="0">TEMPO Deep Dive</v-tab>
      <v-tab :value="1">Comparison Data</v-tab>
    </v-tabs>
    
    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        class="tab-content"
        :value="0"
        :key="0"
      >
        <dataset-controls />
      </v-tabs-window-item>
      <v-tabs-window-item
        :value="1"
        :key="1"
        class="tab-content"
      >
        <div
          v-for="(map, index) in maps"
          :key="index"
        >
          <layer-order-control
            :mapRef="map"
            :order="['power-plants-heatmap', 'aqi-layer-aqi', 'esri-source']"
          >
          </layer-order-control>
          <power-plants-filter-control
            :map="map"
            layer-id="power-plants-heatmap"
          >
          </power-plants-filter-control>
        </div>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useTempoStore } from "@/stores/app";

const tab = ref(0);

const store = useTempoStore();
const {
  maps,
} = storeToRefs(store);
</script>
