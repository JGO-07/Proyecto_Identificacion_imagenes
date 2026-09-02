import type { ApiAnnotation, ApiCategory, ApiImage } from '../types/api.js';

export type SceneKind = 'city' | 'park' | 'crosswalk';

export interface DemoImage extends ApiImage {
  annotationCount: number;
  scene: SceneKind;
}

export const demoCategories: ApiCategory[] = [
  { id: 1, name: 'Persona', color: '#E05D44', createdAt: '2026-09-01T15:00:00Z' },
  { id: 2, name: 'Automóvil', color: '#2D6CDF', createdAt: '2026-09-01T15:00:00Z' },
  { id: 3, name: 'Bicicleta', color: '#7A5AF8', createdAt: '2026-09-01T15:00:00Z' },
];

export const demoImages: DemoImage[] = [
  {
    id: 1,
    fileName: 'calle-centro-001.jpg',
    originalName: 'calle-centro.jpg',
    storagePath: 'demo/calle-centro-001.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2_480_000,
    width: 1920,
    height: 1080,
    status: 'in_progress',
    createdAt: '2026-09-01T16:30:00Z',
    updatedAt: '2026-09-01T17:05:00Z',
    annotationCount: 2,
    scene: 'city',
  },
  {
    id: 2,
    fileName: 'parque-002.webp',
    originalName: 'parque.webp',
    storagePath: 'demo/parque-002.webp',
    mimeType: 'image/webp',
    sizeBytes: 1_840_000,
    width: 1600,
    height: 900,
    status: 'pending',
    createdAt: '2026-09-01T16:42:00Z',
    updatedAt: '2026-09-01T16:42:00Z',
    annotationCount: 0,
    scene: 'park',
  },
  {
    id: 3,
    fileName: 'cruce-peatonal-003.png',
    originalName: 'cruce-peatonal.png',
    storagePath: 'demo/cruce-peatonal-003.png',
    mimeType: 'image/png',
    sizeBytes: 4_210_000,
    width: 1920,
    height: 1080,
    status: 'completed',
    createdAt: '2026-09-01T17:12:00Z',
    updatedAt: '2026-09-01T18:20:00Z',
    annotationCount: 5,
    scene: 'crosswalk',
  },
];

export const demoAnnotations: ApiAnnotation[] = [
  {
    id: 1,
    imageId: 1,
    categoryId: 2,
    x: 790,
    y: 590,
    width: 570,
    height: 300,
    area: 171_000,
    isCrowd: 0,
    createdAt: '2026-09-01T17:00:00Z',
    updatedAt: '2026-09-01T17:00:00Z',
  },
  {
    id: 2,
    imageId: 1,
    categoryId: 1,
    x: 390,
    y: 390,
    width: 190,
    height: 510,
    area: 96_900,
    isCrowd: 0,
    createdAt: '2026-09-01T17:02:00Z',
    updatedAt: '2026-09-01T17:02:00Z',
  },
  {
    id: 3,
    imageId: 3,
    categoryId: 1,
    x: 280,
    y: 360,
    width: 170,
    height: 480,
    area: 81_600,
    isCrowd: 0,
    createdAt: '2026-09-01T18:00:00Z',
    updatedAt: '2026-09-01T18:00:00Z',
  },
];
