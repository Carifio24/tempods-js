// Types

import M, { GeoJSONSource, } from 'maplibre-gl';
import { type MaybeRef, type Ref, toValue } from 'vue';

// eslint-disable-next-line @typescript-eslint/ban-types
export type Prettify<T> = { [K in keyof T]: T[K]; } & {};

// eslint-disable-next-line @typescript-eslint/naming-convention
type LocationOrderedPair<T extends string> = [number, number] & {_order: T};

export type LatLngPair = LocationOrderedPair<'(Lat,Lng)'>;
// eslint-disable-next-line @typescript-eslint/naming-convention
export type LngLatPair = LocationOrderedPair<'(Lng,Lat)'>;

export type MappingBackends = 'maplibre';


export interface InitMapOptions {
  loc: LatLngPair,
  zoom: number,
  t?: number | null,
}

export interface LocationOfInterest {
  latlng: LatLngPair;
  zoom: number;
  text: string;
  description: string;
  time: string;
  index?: number;
}

export interface InterestingEvent {
  date: Date;
  endDate?: Date;
  dateString: string;
  locations: LocationOfInterest[];
  label?: string;
  info?: string;
  highlighted?: boolean;
  hasFeature?: boolean;
}

export type MapType<T extends MappingBackends> = 
  T extends 'maplibre' ? M.Map :
  never;

export type RegionType<T extends MappingBackends> =
  T extends 'maplibre' ? GeoJSONSource:
  never;


export function isMaplibre<T extends MappingBackends>(backend: Ref<T> | T, map: unknown): map is MapType<'maplibre'> {
  return toValue(backend) === 'maplibre' && toValue(map) instanceof M.Map;
}



// Library-agnostic bounds representation
export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type BoundsSelector = (date: Date | null) => BoundingBox;

export interface DragInfo {
  el: HTMLElement | undefined;
  title: HTMLElement;
  mouseStartX: number;
  mouseStartY: number;
  elStartX: number;
  elStartY: number;
  oldTransition?: string;
  overlays: NodeList;
}

export interface RectangleSelectionInfo {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface PointSelectionInfo {
  x: number;
  y: number;
}

// Unified selection types
export type SelectionGeometry = RectangleSelectionInfo | PointSelectionInfo;

export interface RectangleSelection {
  id: string;
  name: string;
  geometryInfo: RectangleSelectionInfo; // renamed from rectangle for future shape generalization
  geometryType: 'rectangle';
  color: string;
  source?: GeoJSONSource;
}

// Add to types.ts
export interface PointSelection {
  id: string;
  name: string;
  geometryInfo: PointSelectionInfo;
  geometryType: 'point';
  color: string;
  source?: GeoJSONSource;
}

export type AggValue = {
  value: number | null;
  date: Date;
};

export interface DataPointError {
  lower: number | null;
  upper: number | null;
}

export interface MillisecondRange {
  start: number;
  end: number;
}

export interface TimeRange {
  id: string;
  name: string; // user editable
  description: string; // not editable
  range: MillisecondRange | MillisecondRange[];
}

export interface UserDataset {
  id: string;
  loading?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  region: any;
  timeRange: TimeRange;
  molecule: string;
  samples?: Record<number, AggValue>;
  errors?: Record<number, DataPointError>;
  locations?: {x: number, y: number}[];
}

export interface SelectionHandler<EventType, SelectionInfo> {
  selectionInfo: Ref<SelectionInfo | null>;
  onMouseup?: (event: EventType) => void;
  onMousedown?: (event: EventType) => void;
  onMousemove?: (event: EventType) => void;
}

export interface UseSelectionOptions<MapType, EventType, SelectionInfo> {
  map: Ref<MapType | null>;
  handler: SelectionHandler<EventType, SelectionInfo>;
  active?: MaybeRef<boolean>;
}

export type UnifiedRegion = RectangleSelection | PointSelection;

export type SelectionType = "rectangle" | "point" | null;
