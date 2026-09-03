import { beforeEach, describe, expect, it } from 'vitest';
import { useAnnotationStore } from './annotation-store.js';

beforeEach(() => {
  useAnnotationStore.getState().resetDemo();
});

describe('annotationStore', () => {
  it('conserva explícitamente la categoría seleccionada', () => {
    useAnnotationStore.getState().selectCategory(2);

    expect(useAnnotationStore.getState().selectedCategoryId).toBe(2);
  });

  it('crea una caja con categoría, área y estado de imagen coherentes', () => {
    useAnnotationStore.getState().createAnnotation(2, 2, {
      x: 100,
      y: 120,
      width: 300,
      height: 180,
    });

    const state = useAnnotationStore.getState();
    const created = state.annotations.at(-1);
    const image = state.images.find((item) => item.id === 2);

    expect(created).toMatchObject({
      imageId: 2,
      categoryId: 2,
      x: 100,
      y: 120,
      width: 300,
      height: 180,
      area: 54_000,
      isCrowd: 0,
    });
    expect(state.selectedAnnotationId).toBe(created?.id);
    expect(image).toMatchObject({ status: 'in_progress', annotationCount: 1 });
  });
});
