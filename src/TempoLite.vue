<template>
  <v-app
    id="app"
    :style="cssVars"
  >
    <header-bar />
    <div ref="root" class="layout-root"></div>

    <teleport
      v-if="mapTarget"
      :to="mapTarget"
    >
      <map-with-controls />
    </teleport>

    <teleport
      v-if="sidePanelTarget"
      :to="sidePanelTarget">
      <dataset-controls />
    </teleport>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref, useTemplateRef, type Ref } from "vue";
import { storeToRefs } from "pinia";
import { GoldenLayout, LayoutConfig } from "golden-layout";
// import { stringify } from "zipson";

import { useTempoStore, deserializeTempoStore, serializeTempoStore } from "@/stores/app";

const root = useTemplateRef("root");
const mapTarget = ref<HTMLElement | null>(null);
const sidePanelTarget = ref<HTMLElement | null>(null);

const store = useTempoStore();
const {
  accentColor,
  accentColor2,
} = storeToRefs(store);

const infoColor = "#092088";
const cssVars = computed(() => {
  return {
    '--accent-color': accentColor.value,
    '--accent-color-2': accentColor2.value,
    '--info-background': infoColor,
  };
});

const localStorageKey = "tempods";

onBeforeMount(() => {
  const storedState = window.localStorage.getItem(localStorageKey);
  if (storedState) {
    const state = deserializeTempoStore(storedState);
    store.$patch(state);
  }
});

onMounted(() => {
  const rootEl = root.value as HTMLElement;
  if (!rootEl) {
    return;
  }
  const layout = new GoldenLayout(rootEl);
  const components: [string, Ref<HTMLElement | null>][] = [
    ["map-panel", mapTarget],
    ["side-panel", sidePanelTarget]
  ];

  components.forEach(([tag, elementRef]) => {
    layout.registerComponentFactoryFunction(tag, container => {
      container.element.id = tag;
      elementRef.value = container.element;
    });
  });

  const config: LayoutConfig = {
    settings: {
      hasHeaders: false,
      responsiveMode: "always",
    },
    root: {
      type: 'row',
      content: [
        {
          type: 'component',
          componentType: 'map-panel',
          title: 'Map',
          draggable: false,
          width: 70,
        },
        {
          type: 'component',
          componentType: 'side-panel',
          title: 'Controls',
          draggable: false,
          width: 30,
        },
      ],
    },
  };
  layout.resizeWithContainerAutomatically = true;
  layout.loadLayout(config);

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const stringified = serializeTempoStore(store); 
      window.localStorage.setItem(localStorageKey, stringified);
    }
  });
});
</script>

<style lang="less">
// NB: The styles here are NOT scoped - these are intended to apply to the overall application,
// as this component is really just a layout container.
// If we do want component-only styles, just add a <style scoped> block below this one

@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("./assets/HighwayGothicNarrow.ttf");
}

// JC: This was commented out, but I put it back in because my browser (Chrome on Ubuntu) didn't already have Lexend
@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap');

html, body .layout-root {
  width: 100%;
  height: 100%;
}

html, body {
  padding: 0;
  margin: 0;
}

body {
  font-family: Verdana, Arial, Helvetica, sans-serif;
}

#app {
  h1, h2, h3, h4, h5, h6, p, div {
    user-select: none;
    -webkit-user-select: none;
  }
  font-family: "Lexend", sans-serif;
}

#side-panel {
  overflow-y: scroll;
}

:root {
  // font-size: clamp(14px, 1.7vw, 16px);
  // --default-font-size: 1rem; // we don't use this
  font-size: 16px; // this is the standard browser default
  --default-line-height: clamp(1rem, min(2.2vh, 2.2vw), 1.6rem); // we don't use this
  --smithsonian-blue: #009ade;
  --smithsonian-yellow: #ffcc33;
  --info-background: #092088;
  --map-height: 500px;
  --tempo-red: #b60e32;
}

@media (max-width: 750px) {
  :root {
    --map-height: 60vh;
    --map-height: 60dvh;
    --map-height: 60svh;
    font-size: 14px;
  }
}

// Some Golden Layout adjustments
.lm_content {
  background: rgb(var(--v-theme-background));
}

.lm_splitter {
  background-color: #333333;
  opacity: 0.7;

  &.lm_dragging {
    background-color: var(--smithsonian-blue);
  }
}

</style>
