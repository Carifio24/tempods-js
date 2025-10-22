<template>
  <ul>
    <draggable 
      v-model="displayOrder" 
      handle=".drag-handle"
    >
      <template #item="{ element, index }">
        <div>
          <div class="layer-order-row">
            <span class="drag-handle">☰</span>
            <layer-control-item
              :map="mapRef"
              :layer-id="element"
              :info="layerInfo[element]"
              :display-name="displayNameTransform(element)"
            >
            </layer-control-item>
          </div>
          <hr v-if="index != currentOrder.length - 1" />
        </div>
      </template>
    </draggable>
  </ul>
</template>


<script setup lang="ts">
import { computed, type MaybeRef, toValue, toRef } from 'vue';
import draggable from 'vuedraggable';
import M from 'maplibre-gl';

import { useMaplibreLayerOrderControl } from "@/composables/useMaplibreLayerOrderControl";
import { capitalizeWords } from "@/utils/names";

interface Props {
  mapRef: M.Map | null;
  order: MaybeRef<string[]>;
}

const props = defineProps<Props>();
const mapRef = toRef(() => props.mapRef);

// https://vuejs.org/guide/typescript/composition-api.html#typing-component-emits

interface Emits {
  (e: 'change', newOrder: string[]): void;
}
const _emit = defineEmits<Emits>();
console.log('LayerOrderControl props:', props);
const { 
  currentOrder, 
  controller 
} = useMaplibreLayerOrderControl(mapRef, toValue(props.order), true);

const displayOrder = computed({
  get(): string[] {
    return currentOrder.value.slice().reverse();
  },
  set(value: string[]) {
    controller?.setManagedOrder(value.slice().reverse());
  }
});

const layerNames: Record<string, string | undefined> = {
  "esri-source": "TEMPO Data",
  "aqi-layer-aqi": "Air Quality Index",
  "power-plants-heatmap": "Power Plants",
};

const layerInfo: Record<string, string | undefined> = {
  "aqi-layer-aqi": 'From <a href="https://www.airnow.gov/aqi/aqi-basics/">EPA</a>; taken once per day',
};

function displayNameTransform(layerId: string): string {
  return layerNames[layerId] ?? capitalizeWords(layerId.replace(/-/g, " "));
}
</script>


<style scoped>
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  margin-left: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  height: fit-content;
}
li {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  cursor: move;
  margin: 10px 0;
}

.drag-handle {
  font-size: 20pt;

  &:hover {
    cursor: grab;
  }
}

.layer-order-row {
  display: flex;
  flex-direction: row;
  gap: 5px;
}
</style>
