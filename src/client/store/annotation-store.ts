import { create } from 'zustand';
import { demoAnnotations, demoCategories, demoImages } from '../data/mock-data.js';
import type { ApiAnnotation } from '../types/api.js';

interface AnnotationState {
  annotations: ApiAnnotation[];
  categories: typeof demoCategories;
  images: typeof demoImages;
  selectedAnnotationId: number | null;
  selectAnnotation: (id: number | null) => void;
  updateAnnotation: (id: number, changes: Partial<ApiAnnotation>) => void;
  resetDemo: () => void;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  annotations: demoAnnotations,
  categories: demoCategories,
  images: demoImages,
  selectedAnnotationId: demoAnnotations[0]?.id ?? null,
  selectAnnotation: (id) => set({ selectedAnnotationId: id }),
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
      annotations: demoAnnotations,
      selectedAnnotationId: demoAnnotations[0]?.id ?? null,
    }),
}));
