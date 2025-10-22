<template>
  <div id="dataset-sections" :style="cssVars">
    <h2>Investigate Patterns with Time</h2>
      <v-btn
        v-if="regions.length > 0 || timeRanges.length > 1"
        :color="accentColor2"
        @click="showConfirmReset = true"
      >
        Delete ALL selections
      </v-btn>
      <v-dialog
        v-model="showConfirmReset"
        max-width="35%"
      >
        <v-card>
          <v-card-text>
            Are you sure you want to delete all of your selections? 
            This will remove all of your regions, time ranges, 
            and datasets, and cannot be undone.
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="error"
              @click="showConfirmReset = false"
            >
              No
            </v-btn>
            <v-btn
              color="success"
              @click="() => {
                store.reset();
                serializeTempoStore(store);
                showConfirmReset = false;
              }"
            >
              Yes
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    <div id="add-region-time">
      <v-expansion-panels
        v-model="openPanels"
        variant="accordion"
        id="user-options-panels"
        multiple
        class="pl-3"
      >
        <v-expansion-panel
          title="Time Ranges"
          class="mt-3 h3-panel-titles"
        >
          <template #text>
            <v-btn
              size="small"
              :active="createTimeRangeActive"
              :color="accentColor2"
              @click="createTimeRangeActive = !createTimeRangeActive"
            >
              <template #prepend>
                <v-icon v-if="!createTimeRangeActive" icon="mdi-plus"></v-icon>
              </template>
              {{ createTimeRangeActive ? "Cancel" : "New Time Range" }}
            </v-btn>
            <date-time-range-selection
              v-if="createTimeRangeActive"
              :current-date="singleDateSelected"
              :allowed-dates="uniqueDays"
              @ranges-change="handleDateTimeRangeSelectionChange"
            />
            <div class="my-selections" v-if="timeRanges.length>0" style="margin-top: 1em;">
              <h4>My Time Ranges</h4>
              <v-list>
                <v-list-item
                  v-for="(timeRange, index) in timeRanges"
                  :key="index"
                  :title="timeRange.name === 'Displayed Day' ? `Displayed Day: ${ formatTimeRange(timeRange.range) }` : (timeRange.name ?? formatTimeRange(timeRange.range))"
                  style="background-color: #444444"
                >

                  <template #append>
                    <v-btn
                      v-if="timeRange.id !== 'displayed-day' && !datasets.some(s => areEquivalentTimeRanges(s.timeRange, timeRange))"
                      variant="plain"
                      v-tooltip="'Delete'"
                      icon="mdi-delete"
                      color="white"
                      @click="() => store.deleteTimeRange(timeRange)"
                    >
                    </v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </template>
        </v-expansion-panel>
        <v-expansion-panel
          title="Regions"
          class="mt-3 h3-panel-titles"
        >
          <template #text>
            <div id="add-region-buttons">
              <v-btn
                size="small"
                :active="selectionActive === 'rectangle'"
                :disabled="selectionActive === 'point'"
                :color="accentColor2"
                @click="() => {
                  selectionActive = (selectionActive === 'rectangle') ? null : 'rectangle';
                }"
              >
                <template #prepend>
                  <v-icon v-if="selectionActive !== 'rectangle'" icon="mdi-plus"></v-icon>
                </template>
                {{ selectionActive === 'rectangle' ? "Cancel" : "New Region" }}
              </v-btn>
            </div>
            <div class="my-selections" v-if="regions.length>0" style="margin-top: 1em;">
            <h4>My Regions</h4>                   
              <v-list>
                <v-list-item
                  v-for="(region, index) in regions"
                  :key="index"
                  :title="region.name"
                  :style="{ 'background-color': region.color }"
                  @click="() => focusRegion = region"
                >
                  <template #append>
                    <!-- New: Edit Geometry button (disabled if any selection using region has samples) -->
                    <!-- <v-btn
                      variant="plain"
                      :icon="region.geometryType === 'rectangle' ? 'mdi-select' : 'mdi-plus'"
                      color="white"
                      :disabled="regionHasSamples(region as UnifiedRegionType)"
                      v-tooltip="regionHasSamples(region as UnifiedRegionType) ? 'Cannot edit geometry after samples are fetched for a selection using this region' : 'Edit Geometry'"
                      @click="() => editRegionGeometry(region as UnifiedRegionType)"
                    ></v-btn> -->
                    <v-btn
                      variant="plain"
                      v-tooltip="'Edit Name'"
                      icon="mdi-pencil"
                      color="white"
                      @click="(event: MouseEvent | KeyboardEvent) => {
                        editRegionName(region as UnifiedRegionType);
                        event.stopPropagation();
                      }"
                    ></v-btn>
                    <v-btn
                      v-if="!store.regionHasDatasets(region as UnifiedRegionType)"
                      variant="plain"
                      v-tooltip="'Delete'"
                      icon="mdi-delete"
                      color="white"
                      @click="(event: MouseEvent | KeyboardEvent) => {
                        store.deleteRegion(region as UnifiedRegionType);
                        event.stopPropagation();
                      }"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>
          </template>
        </v-expansion-panel>

        <v-divider
          class="mt-3"
          opacity="1"
        >
        </v-divider>

        <v-expansion-panel
          title="Datasets"
          class="mt-3 h3-panel-titles"
        >
        <template #text>
          <v-btn
            size="small"
            :active="createDatasetActive"
            :color="accentColor2"                    
            @click="createDatasetActive = !createDatasetActive"
            class="mt-3"
          >
            <template #prepend>
              <v-icon v-if="!createDatasetActive" icon="mdi-plus"></v-icon>
            </template>
            {{ createDatasetActive ? "Cancel" : "New Dataset" }}
          </v-btn>
          <selection-composer
            v-show="createDatasetActive"
            :backend="backend"
            :time-ranges="timeRanges"
            :regions="regions"
            :disabled="{ region: selectionActive === 'rectangle', point: selectionActive === 'point', timeRange: createTimeRangeActive }"
            @create="handleDatasetCreated"
          >
          </selection-composer>
          <div class="my-selections" v-if="datasets.length>0" style="margin-top: 1em;">

            <h4>My Datasets</h4>
            
            <dataset-card
              :datasets="datasets"
              :turn-on-selection="allDatasetSelection"
              v-model:selected-datasets="selectedDatasets"
              >
              <template #action-row="{ isHovering, dataset }">
                    <div
                      v-if="(dataset.loading || !dataset.samples)  && !(dataset.timeRange?.type === 'folded' && dataset.plotlyDatasets)"
                      class="dataset-loading"
                    > <hr/>
                      <v-progress-linear
                        :class="['dataset-loading-progress', !(dataset.loading && dataset.samples) ? 'dataset-loading-failed' : '']"
                        :active="dataset.loading || !dataset.samples"
                        :color="dataset.loading ? 'primary' : 'red'"
                        :indeterminate="dataset.loading"
                        :value="!dataset.loading ? 100 : 0"
                        :striped="!dataset.loading"
                        bottom
                        rounded
                        height="20"
                      >
                        <template #default>
                          <span class="text-subtitle-2">
                            {{ dataset.loading ? 'Data Loading' : (!dataset.samples ? 'Error Loading Data' : '') }}
                          </span>
                        </template>
                      </v-progress-linear>
                      <div v-if="!(dataset.loading || dataset.samples || dataset.plotlyDatasets)">
                        <hr/>
                        <v-tooltip
                          text="Failure info"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-help-circle"
                              variant="plain"
                              @click="() => sampleErrorID = dataset.id"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip
                          text="Remove selection"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-trash-can"
                              variant="plain"
                              @click="() => removeDataset(dataset)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                      </div>
                    </div>

                    <v-expand-transition>
                      <div
                        class="selection-icons"
                        v-show="(dataset.samples || dataset.plotlyDatasets) && (touchscreen ? openSelection == dataset.id : isHovering)"
                      >
                        <v-tooltip
                          text="Get Center Point Sample"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              :loading="loadingPointSample === dataset.id"
                              icon="mdi-image-filter-center-focus"
                              variant="plain"
                              @click="() => store.fetchCenterPointDataForDataset(dataset)"
                            ></v-btn>
                          </template>
                        </v-tooltip> 
                        <v-tooltip
                          text="Show table"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-table"
                              :disabled="!dataset.samples && !dataset.folded"
                              variant="plain"
                              @click="() => tableSelection = dataset"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip
                          text="Show graph"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-chart-line"
                              :disabled="!(dataset.samples || dataset.plotlyDatasets)"
                              variant="plain"
                              @click="() => openGraphs[dataset.id] = true"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip
                          v-if="dataset.timeRange.type === 'pattern' || dataset.timeRange.type === 'daterange' || dataset.timeRange.type === 'monthrange'"
                          text="Aggregate Data"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-chart-box"
                              :disabled="!dataset.samples"
                              variant="plain"
                              @click="() => openAggregationDialog(dataset)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip
                          text="Edit Dataset Name/Color"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-pencil"
                              variant="plain"
                              @click="() => handleEditDataset(dataset)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                        <v-tooltip
                          text="Remove selection"
                          location="top"
                        >
                          <template #activator="{ props }">
                            <v-btn
                              v-bind="props"
                              size="x-small"
                              icon="mdi-trash-can"
                              variant="plain"
                              @click="() => removeDataset(dataset)"
                            ></v-btn>
                          </template>
                        </v-tooltip>
                      </div>
                    </v-expand-transition>
                    <cds-dialog
                      :title="graphTitle(dataset)"
                      v-model="openGraphs[dataset.id]"
                      title-color="#F44336"
                      draggable
                      persistent
                      :scrim="false"
                      :modal="false"
                      :drag-predicate="plotlyDragPredicate"
                    >
                      <v-checkbox
                        v-model="showErrorBands"
                        label="Show Errors"
                        density="compact"
                        hide-details
                      >
                      </v-checkbox>
                      <template v-if="dataset.timeRange.type === 'folded' && dataset.plotlyDatasets">
                        <folded-plotly-graph
                          :datasets="dataset.plotlyDatasets"
                          :show-errors="showErrorBands"
                          :colors="[dataset.customColor ?? dataset.region.color, '#333']"
                          :data-options="[{mode: 'markers'}, {mode: 'lines+markers'}]"
                          :names="[`Original Data`, `Binned`]"
                          :layout-options="{width: 600, height: 400}"
                          :fold-type="dataset.folded?.foldType"
                          :timezones="dataset.folded?.timezone"
                        />
                      </template>
                      <template v-else>
                        <plotly-graph
                          :datasets="dataset ? [userDatasetToPlotly(dataset, true)] : []"
                          :colors="[dataset.customColor || dataset.region.color]"
                          show-errors
                          :data-options="[{mode: 'lines+markers'}]"
                          :names="dataset.name ? [dataset.name] : undefined"
                          :layout-options="{
                            width: 600, 
                            height: 400,
                            // https://plotly.com/javascript/reference/layout/xaxis/#layout-xaxis-title-text
                            xaxis: {title: {text: 'Local Time for Region'}},
                            }"
                        />
                          
                      </template>
                    </cds-dialog>
                    <v-dialog
                      :model-value="sampleErrorID !== null"
                      max-width="50%"
                    >
                      <v-card>
                        <v-toolbar
                          density="compact"
                        >
                          <v-toolbar-title text="Error Loading Data"></v-toolbar-title>
                          <v-spacer></v-spacer>
                          <v-btn
                            icon="mdi-close"
                            @click="sampleErrorID = null"
                          >
                          </v-btn>
                        </v-toolbar>
                        <v-card-text>
                          There was an error loading data for this selection. Either there is no data for the
                          region/time range/molecule combination that you selected, or there was an error loading
                          data from the server. You can delete this selection and try making a new one.
                        </v-card-text>
                      </v-card>
                    </v-dialog>
                  </template>
            </dataset-card>
          </div>
          <div v-if="datasets.some(s => s.timeRange.type === 'folded')" class="pa-2 mb-2 explainer-text">
            Note: You can only overlay datasets with the same molecule and fold type.
          </div>
          <v-btn color="#ffcc33" size="small" :block="false" @click="allDatasetSelection = !allDatasetSelection">
            {{ allDatasetSelection ? 'Cancel Selection' : 'Select Datasets to Graph' }}
          </v-btn>
        </template>
      </v-expansion-panel>
    </v-expansion-panels>
    </div>

    <div class="d-flex flex-wrap flex-row ma-2 align-center justify-center ga-1">
    <v-btn v-if="no2GraphData.length > 0" @click="showNO2Graph = true">
      Show NO₂ Graph
    </v-btn>
    <cds-dialog
      title="Nitrogen Dioxide Data"
      v-model="showNO2Graph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
      :drag-predicate="plotlyDragPredicate"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <plotly-graph
        :datasets="no2GraphData.map(d => userDatasetToPlotly(d, true))"
        :colors="no2GraphData.map(d => d.customColor || d.region.color)"
        :show-errors="showErrorBands"
        :data-options="no2GraphData.map(() => ({mode: 'lines+markers'}))"
        :names="no2GraphData.map(d => d.name ?? '')"
        :layout-options="{
          width: 600, 
          height: 400,
          xaxis: {title: {text: 'Local Time for Region'}},
        }"
      />
    </cds-dialog>

    <v-btn v-if="o3GraphData.length > 0" @click="showO3Graph = true">
      Show Ozone Graph
    </v-btn>
    <cds-dialog
      title="Ozone Data"
      v-model="showO3Graph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
      :drag-predicate="plotlyDragPredicate"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <plotly-graph
        :datasets="o3GraphData.map(d => userDatasetToPlotly(d, true))"
        :colors="o3GraphData.map(d => d.customColor || d.region.color)"
        :show-errors="showErrorBands"
        :data-options="o3GraphData.map(() => ({mode: 'lines+markers'}))"
        :names="o3GraphData.map(d => d.name ?? '')"
        :layout-options="{
          width: 600, 
          height: 400,
          xaxis: {title: {text: 'Local Time for Region'}},
        }"
      />
    </cds-dialog>
    
    <v-btn v-if="hchoGraphData.length > 0" @click="showHCHOGraph = true">
      Show Formaldehyde Graph
    </v-btn>
    <cds-dialog
      title="Formaldehyde Data"
      v-model="showHCHOGraph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
      :drag-predicate="plotlyDragPredicate"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <plotly-graph
        :datasets="hchoGraphData.map(d => userDatasetToPlotly(d, true))"
        :colors="hchoGraphData.map(d => d.customColor || d.region.color)"
        :show-errors="showErrorBands"
        :data-options="hchoGraphData.map(() => ({mode: 'lines+markers'}))"
        :names="hchoGraphData.map(d => d.name ?? '')"
        :layout-options="{
          width: 600, 
          height: 400,
          xaxis: {title: {text: 'Local Time for Region'}},
        }"
      />
    </cds-dialog>
    
    <div 
      v-if="!allEqual(no2foldedGraphData.map(v => v.foldType)) || 
            !allEqual(o3foldedGraphData.map(v => v.foldType)) || 
            !allEqual(hchofoldedGraphData.map(v => v.foldType))"
      class="mixed-foldType-warning pa-2 ma-2 text-large text-red explainer-text"
    >
    Warning: Be sure to only select datasets that have the same type of fold. It is not possible to overlay different FoldTypes.
    </div>
    
    <v-btn v-if="no2foldedGraphData.length > 0" @click="showfoldedNO2Graph = true">
      Show Folded NO₂ Data
    </v-btn>
    <cds-dialog
      title="Nitrogen Dioxide Data"
      v-model="showfoldedNO2Graph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
      :drag-predicate="plotlyDragPredicate"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <folded-plotly-graph
        :datasets="no2foldedGraphData.length > 0 ? no2foldedGraphData : []"
        :show-errors="showErrorBands"
        :colors="no2foldedGraphData.map( v => v.color) ?? ['#FF5733', '#333']"
        :data-options="[{mode: 'lines+markers'}, {mode: 'lines+markers'}]"
        :layout-options="{width: 600, height: 400}"
        :fold-type="no2foldedGraphData[0].foldType"
        :timezones="no2foldedGraphData.map(v => v.timezone) ?? 'UTC'"
      />
    </cds-dialog>

    <v-btn v-if="o3foldedGraphData.length > 0" @click="showfoldedO3Graph = true">
      Show Folded O₃ Data
    </v-btn>
    <cds-dialog
      title="Ozone Data"
      v-model="showfoldedO3Graph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
      :drag-predicate="plotlyDragPredicate"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <folded-plotly-graph
        :datasets="o3foldedGraphData.length > 0 ? o3foldedGraphData : []"
        :show-errors="showErrorBands"
        :colors="o3foldedGraphData.map( v => v.color) ?? ['#FF5733', '#333']"
        :data-options="[{mode: 'lines+markers'}, {mode: 'lines+markers'}]"
        :layout-options="{width: 600, height: 400}"
        :fold-type="o3foldedGraphData[0].foldType"
        :timezones="o3foldedGraphData.map(v => v.timezone) ?? 'UTC'"
      />
    </cds-dialog>

    <v-btn v-if="hchofoldedGraphData.length > 0" @click="showfoldedHCHOGraph = true">
      Show Folded HCHO Data
    </v-btn>
    <cds-dialog
      title="Formaldehyde Data"
      v-model="showfoldedHCHOGraph"
      draggable
      persistent
      :modal="false"
      :scrim="false"
      :drag-predicate="plotlyDragPredicate"
    >
      <v-checkbox
        v-model="showErrorBands"
        label="Show Errors"
        density="compact"
        hide-details
      >
      </v-checkbox>
      <folded-plotly-graph
        :datasets="hchofoldedGraphData.length > 0 ? hchofoldedGraphData : []"
        :show-errors="showErrorBands"
        :colors="hchofoldedGraphData.map( v => v.color) ?? ['#FF5733', '#333']"
        :data-options="[{mode: 'lines+markers'}, {mode: 'lines+markers'}]"
        :layout-options="{width: 600, height: 400}"
        :fold-type="hchofoldedGraphData[0].foldType"
        :timezones="hchofoldedGraphData.map(v => v.timezone) ?? 'UTC'"
      />
    </cds-dialog>
    </div>

    <v-dialog
      v-model="showEditRegionNameDialog"
    >
      <!-- text field that requires a confirmation -->
        <c-text-field
          label="Region Name"
          title="Enter a new name for this region"
          hide-details
          dense
          :button-color="accentColor"
          @confirm="(name: string) => {
            if (regionBeingEdited) {
              store.setRegionName(regionBeingEdited as UnifiedRegionType, name);
              showEditRegionNameDialog = false;
            }
          }"
          @cancel="() => {
            showEditRegionNameDialog = false;
            regionBeingEdited = null;
          }"
        ></c-text-field>

        </v-dialog>
        
      <v-dialog
        v-model="showDatasetEditor"
      >
        <user-dataset-editor
          v-if="currentlyEditingDataset !== null"
          v-model="currentlyEditingDataset" 
          :name-only="datasetEditorNameOnly"
          @complete="() => {
            showDatasetEditor = false;
            currentlyEditingDataset = null;
          }"
          />
        </v-dialog>
        
    <!-- Data Aggregation Dialog -->
    <advanced-operations
      v-model="showAggregationDialog"
      :selection="aggregationDataset"
      @save="handleAggregationSaved"
    />
    
    <v-dialog
      v-model="showUserDatasetTable"
      max-width="800px"
      persistent
    >
      <v-card>
        <v-toolbar
          density="compact"
        >
          <v-toolbar-title text="Dataset Table View"></v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            @click="showUserDatasetTable = false; tableSelection = null"
          >
          </v-btn>
        </v-toolbar>
        <v-card-text>
          <user-dataset-table
            v-if="tableSelection !== null"
            :dataset="tableSelection"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>

</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { v4 } from "uuid";
import { supportsTouchscreen } from "@cosmicds/vue-toolkit";

import type { MillisecondRange, TimeRange, UserDataset, UnifiedRegion } from "../types";
import { serializeTempoStore, useTempoStore } from "../stores/app";
import { MOLECULE_OPTIONS } from "../esri/utils";
import { areEquivalentTimeRanges, formatTimeRange } from "../utils/timeRange";
import { atleast1d } from "../utils/atleast1d";

import DateTimeRangeSelection from "../date_time_range_selection/DateTimeRangeSelection.vue";
import AdvancedOperations from "./AdvancedOperations.vue";
import { TimeRangeSelectionType } from "@/types/datetime";
import PlotlyGraph from "./plotly/PlotlyGraph.vue";
import FoldedPlotlyGraph from "./FoldedPlotlyGraph.vue";
import CTextField from "./CTextField.vue";
import DatasetCard from "./DatasetCard.vue";
import { toZonedTime } from "date-fns-tz";
import { allEqual } from "@/utils/array_operations/array_math";
import { userDatasetToPlotly } from "@/utils/data_converters";
import UserDatasetTable from "./UserDatasetTable.vue";

type UnifiedRegionType = UnifiedRegion;

const store = useTempoStore();
const {
  accentColor,
  accentColor2,
  backend,
  regions,
  datasets,
  timeRanges,
  singleDateSelected,
  uniqueDays,
  selectionActive,
  focusRegion,
} = storeToRefs(store);

const cssVars = computed(() => {
  return {
    '--accent-color': accentColor.value,
    '--accent-color-2': accentColor2.value,
  };
});

function plotlyDragPredicate(element: HTMLElement): boolean {
  return element.closest(".plotly") === null;
}

const touchscreen = supportsTouchscreen();

const openPanels = ref<number[]>([]);
const openGraphs = ref<Record<string,boolean>>({});
const openSelection = ref<string | null>(null);
const tableSelection = ref<UserDataset | null>(null);
const currentlyEditingDataset = ref<UserDataset | null>(null);
const showConfirmReset = ref(false);

const createTimeRangeActive = ref(false);
const createDatasetActive = ref(false);
const datasetRowRefs = ref({});
const sampleErrorID = ref<string | null>(null);
const loadingPointSample = ref<string | false>(false);

const showEditRegionNameDialog = ref(false);
const regionBeingEdited = ref<UnifiedRegionType | null>(null);

const aggregationDataset = ref<UserDataset | null>(null);
const showAggregationDialog = ref(false);
function openAggregationDialog(selection: UserDataset) {
  aggregationDataset.value = selection;
  showAggregationDialog.value = true;
}
function handleAggregationSaved(aggregatedSelection: UserDataset) {
  aggregatedSelection.name = `${aggregatedSelection.name} ${datasets.value.length + 1}`;
  store.addDataset(aggregatedSelection, false); // no need to fetch anything
  showAggregationDialog.value = false;
  aggregationDataset.value = null;
}

function handleDatasetCreated(dataset: UserDataset) {
  dataset.name = `Dataset ${datasets.value.length + 1}`; // give it a default name
  store.addDataset(dataset);
  createDatasetActive.value = false;
}

import UserDatasetEditor from "./UserDatasetEditor.vue";
const showDatasetEditor = ref(false);
const datasetEditorNameOnly = ref(false);
function handleEditDataset(dataset: UserDataset, nameOnly = false) {
  datasetEditorNameOnly.value = nameOnly;
  currentlyEditingDataset.value = dataset;
  showDatasetEditor.value = true;
}

function removeDataset(dataset: UserDataset) {
  store.deleteDataset(dataset);

  delete openGraphs[dataset.id];
  delete datasetRowRefs[dataset.id];
}

function handleDateTimeRangeSelectionChange(timeRanges: MillisecondRange[], selectionType: TimeRangeSelectionType, customName: string) {
  if (!Array.isArray(timeRanges) || timeRanges.length === 0) {
    console.error('No time ranges received from DateTimeRangeSelection');
    return;
  }
  console.log(`Received ${timeRanges.length} time ranges of type ${selectionType} and name ${customName}`);
  const normalized = atleast1d(timeRanges);
  // No dedup tracking now
  const tr: TimeRange = {
    id: v4(),
    name: customName,
    description: customName,
    range: normalized.length === 1 ? normalized[0] : normalized,
    type: selectionType,
  };
  store.addTimeRange(tr);

  createTimeRangeActive.value = false;
  console.log(`Registered ${tr.name}: ${tr.description}`);
}

function editRegionName(region: UnifiedRegionType) {
  console.log(`Editing ${region.geometryType}: ${region.name}`);
  // Set the region to edit

  // eslint-disable-next-line
  // @ts-ignore it is not actually deep
  const existing = (regions.value as UnifiedRegionType[]).find(r => r.id === region.id);
  if (!existing) {
    console.error(`Region with ID ${region.id} not found.`);
    return;
  }
  regionBeingEdited.value = region;
  // Open dialog for renaming
  showEditRegionNameDialog.value = true;
}

function graphTitle(dataset: UserDataset): string {
  const molecule = dataset.molecule;
  const molTitle = MOLECULE_OPTIONS.find(m => m.value === molecule)?.title || '';
  return `${molTitle} Time Series for ${dataset.region.name}`;
}

const showNO2Graph = ref(false);
const no2GraphData = computed(() =>{
  return datasets.value.filter(s => s.molecule.includes('no2') && store.datasetHasSamples(s));
});

// ozone version
const showO3Graph = ref(false);
const o3GraphData = computed(() =>{
  return datasets.value.filter(s => s.molecule.includes('o3') && store.datasetHasSamples(s));
});


// formaldehyde version
const showHCHOGraph = ref(false);
const hchoGraphData = computed(() =>{
  return datasets.value.filter(s => s.molecule.includes('hcho') && store.datasetHasSamples(s));
});

function _toZonedTime(date: number | Date | string, timezone): number | Date {
  if (typeof date === 'number') {
    date = new Date(date);
  } else if (typeof date === 'string') {
    date = new Date(date);
  }
  return toZonedTime(date, timezone);
}

const allDatasetSelection = ref(false);
const selectedDatasets = ref<string[]>([]);
watch(allDatasetSelection, (newVal) => {
  if (!newVal) {
    selectedDatasets.value = [];
  }
});
watch(selectedDatasets, (newVal) => {
  console.log('Selected datasets changed:', newVal);
});

const showfoldedNO2Graph = ref(false);
const no2foldedGraphData = computed(() =>{
  const validFoldedDatasets = datasets.value
    .filter(
      s => s.molecule.includes('no2') && 
      s.timeRange?.type === 'folded' && 
      s.plotlyDatasets && 
      s.plotlyDatasets.length > 0 &&
      selectedDatasets.value.includes(s.id)
    );
  return validFoldedDatasets.map(s => {    
    return {
      ...s.plotlyDatasets![1],
      foldType: s.folded?.foldType,
      timezone: s.folded?.timezone,
      color: s.customColor || s.region.color,
    };
  }); // "!" tells TS that we know it's not undefined
});

const showfoldedO3Graph = ref(false);
const o3foldedGraphData = computed(() =>{
  const validFoldedDatasets = datasets.value
    .filter(
      s => s.molecule.includes('o3') && 
      s.timeRange?.type === 'folded' && 
      s.plotlyDatasets && 
      s.plotlyDatasets.length > 0 &&
      selectedDatasets.value.includes(s.id)
    );
  return validFoldedDatasets.map(s => {
    return {
      ...s.plotlyDatasets![1],
      foldType: s.folded?.foldType,
      timezone: s.folded?.timezone,
      color: s.customColor || s.region.color,
    };
  }); // "!" tells TS that we know it's not undefined
}); 

const showfoldedHCHOGraph = ref(false);
const hchofoldedGraphData = computed(() =>{
  const validFoldedDatasets = datasets.value
    .filter(
      s => s.molecule.includes('hcho') && 
      s.timeRange?.type === 'folded' && 
      s.plotlyDatasets && 
      s.plotlyDatasets.length > 0 &&
      selectedDatasets.value.includes(s.id)
    );
  return validFoldedDatasets.map(s => {
    return {
      ...s.plotlyDatasets![1],
      foldType: s.folded?.foldType,
      timezone: s.folded?.timezone,
      color: s.customColor || s.region.color,
    };
  }); // "!" tells TS that we know it's not undefined
}); 

const showErrorBands = ref(true);

const showUserDatasetTable = ref(false);
watch(tableSelection, (newVal) => {
  if (newVal) {
    console.log('Table selection changed:', newVal);
    showUserDatasetTable.value = true;
  }
});

</script>

<style scoped lang="less">
#dataset-sections {
  padding: 0.5rem 1rem;
  border: 5px solid var(--tempo-red);
  border-radius: 10px;
  margin: 10px;
}

// prevent overflows of the content
#add-region-time {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 5px;
}

.my-selections {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 5px;
  padding: 0.5rem;
  border-radius: 10px;
  // background-color: #555555;
}

.h3-panel-titles .v-expansion-panel-title {
  font-size: 1.17em;
  font-weight: bold;
}
</style>

<style>
.explainer-text {
  border-radius: 5px;
  padding: 5px;
  padding-inline-start: 10px;
  background-color: rgb(var(--v-theme-surface-bright));
  font-size: 0.8em;
  color: rgb(var(--v-theme-on-surface-bright));
  
}

.explainer-text hr {
  border: none;
  border-top: 1px solid rgb(var(--v-theme-on-surface-bright));
  margin-inline: 0;
  margin-block: 1em;
}

.explainer-text dt {
  font-weight: bold;
}

.explainer-text dd {
  margin-left: 0;
  margin-bottom: 8px;
}
</style>
