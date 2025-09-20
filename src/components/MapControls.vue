<template>
  <div id="map-view">
    <h2>Explore Map View</h2>
    <div class="mt-2">
      <h3>Select a Date</h3>
      <div class="d-flex flex-row align-center">
        <v-radio-group v-model="radio">
          <date-picker
            ref="calendar"
            :model-value="singleDateSelected"
            @internal-model-change="(value: Date) => {
              if (value != null && value.getTime() != singleDateSelected.getTime()) {
                radio = null;
                singleDateSelected = value;
                calendar?.closeMenu();
              }
            }"
            :allowed-dates="uniqueDays"
            :clearable="false"
            :enable-time-picker="false"
            :multi-dates="false"
            :transitions="false"
            :format="(date: Date | null) => date?.toDateString()"
            :preview-format="(date: Date | null) => date?.toDateString()"
            no-today
            dark
            :year-range="[uniqueDays[0]?.getFullYear(), uniqueDays[uniqueDays.length - 1]?.getFullYear()]"
          >
            <template #action-buttons>
              <button
                class="dp__action_button dp__action-latest"
                @click="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                @keyup.enter="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
                :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
                elevation="0"
                size="sm"
              >
                Latest
            </button>
            </template>
            <!-- <template #action-extra="{ selectCurrentDate }">
            
            </template> -->
          </date-picker>
          <!-- time chips to select time specifically for esri times -->
          <time-chips
            v-if="molecule.toLowerCase().includes('month')"
            :timestamps="esriTimesteps.slice(minIndex, maxIndex + 1)"
            @select="handleEsriTimeSelected($event.value, $event.index)"
            :selected-index="timeIndex - minIndex"
            :use-utc="molecule.toLowerCase().includes('month')"
            :date-only="molecule.toLowerCase().includes('month')"
            :hour-only="!molecule.toLowerCase().includes('month')"
          />
        </v-radio-group>
      </div>        
      <!-- add buttons to increment and decrement the singledateselected -->
      <div class="d-flex flex-row align-center my-2">
        <v-tooltip :disabled="touchscreen" text="Previous Date">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              class="rounded-icon-wrapper"
              @click="store.moveBackwardOneDay"
              @keyup.enter="store.moveBackwardOneDay"
              :disabled="singleDateSelected === uniqueDays[0]"
              color="#009ade"
              variant="outlined"
              elevation="0"
              size="md"
            >
              <v-icon>mdi-chevron-double-left</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-spacer></v-spacer>
        <v-tooltip :disabled="touchscreen" text="Get Data for latest available day">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              style="padding-inline: 4px;"
              @click="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
              @keyup.enter="() => singleDateSelected = uniqueDays[uniqueDays.length - 1]"
              :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
              color="#009ade"
              variant="outlined"
              elevation="0"
              size="md"
            >
              Latest Data
            </v-btn>
          </template>
        </v-tooltip>
        <v-spacer></v-spacer>
        <v-tooltip :disabled="touchscreen" text="Next Date">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              class="rounded-icon-wrapper"
              @click="store.moveForwardOneDay"
              @keyup.enter="store.moveForwardOneDay"
              :disabled="singleDateSelected === uniqueDays[uniqueDays.length - 1]"
              color="#009ade"
              variant="outlined"
              elevation="0"
              size="md"
            >
              <v-icon>mdi-chevron-double-right</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

    </div>
    <v-select
      v-model="selectedTimezone"
      label="Timezone"
      :items="timezoneOptions"
      item-title="name"
      item-value="tz"
      hide-details
      dense
      class="mt-3 pl-3"
    ></v-select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { DatePickerInstance } from "@vuepic/vue-datepicker";
import { supportsTouchscreen } from "@cosmicds/vue-toolkit";

import { type MoleculeType } from "@/esri/utils";
import { useTempoStore } from "@/stores/app";
import { useEsriTimesteps } from "@/composables/useEsriTimesteps";

import TimeChips from "@/components/TimeChips.vue";

const store = useTempoStore();
const {
  timestamps,
  singleDateSelected,
  uniqueDays,
  selectedTimezone,
  timezoneOptions,
  timeIndex,
  minIndex,
  maxIndex,
} = storeToRefs(store);

const emit = defineEmits<{
  (event: "molecule", molecule: MoleculeType): void;
}>();

const molecule = ref<MoleculeType>('no2');
const { esriTimesteps } = useEsriTimesteps(molecule);

const radio = ref<number | null>(null);
const touchscreen = supportsTouchscreen();

const calendar = ref<DatePickerInstance | null>(null);

function handleEsriTimeSelected(ts: number, _index: number) {
  const idx = timestamps.value.indexOf(ts);
  console.log(`ESRI time selected: ${new Date(ts)} (nearest index ${idx})`);
  if (idx >= 0) {
    timeIndex.value = idx;
  }
  // We may need something like this when we get back the monthly average service.
  //singleDateSelected.value = new Date(ts);
}

watch(molecule, (newMol: MoleculeType) => {
  emit("molecule", newMol);
});
</script>
