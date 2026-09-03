import { create } from 'zustand';
import { demoAnnotations, demoCategories, demoImages } from '../data/mock-data.js';
import type { BoundingBox } from '../lib/canvas-geometry.js';
import type { ApiAnnotation } from '../types/api.js';

const cloneDemoAnnotations = () => demoAnnotations.map((annotation) => ({ ...annotation }));
const cloneDemoImages = () => demoImages.map((image) => ({ ...image }));

interface AnnotationState {
  annotations: ApiAnnotation[];
  categories: typeof demoCategories;
  images: typeof demoImages;
  selectedAnnotationId: number | null;
  selectedCategoryId: number | null;
  createAnnotation: (imageId: number, categoryId: number, box: BoundingBox) => void;
  selectAnnotation: (id: number | null) => void;
  selectCategory: (id: number) => void;
  updateAnnotation: (id: number, changes: Partial<ApiAnnotation>) => void;
  resetDemo: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  annotations: cloneDemoAnnotations(),
  categories: demoCategories,
  images: cloneDemoImages(),
  selectedAnnotationId: demoAnnotations[0]?.id ?? null,
  selectedCategoryId: demoCategories[0]?.id ?? null,
  createAnnotation: (imageId, categoryId, box) =>
    set((state) => {
      const now = new Date().toISOString();
      const id = Math.max(0, ...state.annotations.map((annotation) => annotation.id)) + 1;
      const annotation: ApiAnnotation = {
        id,
        imageId,
        categoryId,
        ...box,
        area: box.width * box.height,
        isCrowd: 0,
        createdAt: now,
        updatedAt: now,
      };

      return {
        annotations: [...state.annotations, annotation],
        images: state.images.map((image) =>
          image.id === imageId
            ? {
                ...image,
                annotationCount: image.annotationCount + 1,
                status: image.status === 'pending' ? 'in_progress' : image.status,
                updatedAt: now,
              }
            : image,
        ),
        selectedAnnotationId: id,
      };
    }),
  selectAnnotation: (id) => set({ selectedAnnotationId: id }),
  selectCategory: (id) => set({ selectedCategoryId: id }),
  updateAnnotation: (id, changes) =>
    set((state) => ({
      annotations: state.annotations.map((annotation) =>
        annotation.id === id
          ? {
              ...annotation,
              ...changes,
              area: (changes.width ?? annotation.width) * (changes.height ?? annotation.height),
              updatedAt: new Date().toISOString(),
            }
          : annotation,
      ),
    })),
  resetDemo: () =>
    set({
      annotations: cloneDemoAnnotations(),
      images: cloneDemoImages(),
      selectedAnnotationId: demoAnnotations[0]?.id ?? null,
      selectedCategoryId: demoCategories[0]?.id ?? null,
    }),
}));
