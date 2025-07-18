import { ref, computed } from 'vue';

interface Manifest {
  timestamps: number[];
  clouds?: number[];
}

export function useTimestamps(manifestUrl: string, dataUrl: string, lowResDataUrl: string) {
  const timestamps = ref<number[]>([]);
  const timestampSet = ref<Set<number>>(new Set());
  const cloudTimestamps = ref<number[]>([]);
  const cloudTimestampSet = ref<Set<number>>(new Set());

  async function fetchManifest(): Promise<Manifest> {
    const url = `${manifestUrl}?version=${Date.now()}`;
    return fetch(url)
      .then((response) => response.json())
      .catch(() => fetch(manifestUrl).then((response) => response.json()));
  }

  async function loadTimestamps() {
    const manifest = await fetchManifest();
    timestamps.value = manifest.timestamps;
    timestampSet.value = new Set(manifest.timestamps);
    if (manifest.clouds) {
      cloudTimestamps.value = manifest.clouds;
      cloudTimestampSet.value = new Set(manifest.clouds);
    }
  }

  function getFilename(date: Date): string {
    const zpad = (n: number, width: number = 2, character: string = "0"): string => n.toString().padStart(width, character);
    return `tempo_${date.getUTCFullYear()}-${zpad(date.getUTCMonth() + 1)}-${zpad(date.getUTCDate())}T${zpad(date.getUTCHours())}h${zpad(date.getUTCMinutes())}m.png`;
  }

  function getDataUrl(timestamp: number, highRes: boolean): string {
    const url = highRes ? dataUrl : lowResDataUrl;
    return `${url}${getFilename(new Date(timestamp))}`;
  }

  function getCloudUrl(timestamp: number, highRes: boolean): string {
    if (!cloudTimestampSet.value.has(timestamp)) {
      return '';
    }
    const url = highRes ? dataUrl : lowResDataUrl;
    return `${url}${getFilename(new Date(timestamp))}`;
  }

  return {
    timestamps: computed(() => timestamps.value),
    cloudTimestamps: computed(() => cloudTimestamps.value),
    loadTimestamps,
    getDataUrl,
    getCloudUrl,
  };
}
