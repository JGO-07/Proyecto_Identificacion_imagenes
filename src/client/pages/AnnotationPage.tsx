import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnnotationCanvas, type CanvasTool } from '../components/AnnotationCanvas.js';
import { DemoBadge } from '../components/DemoBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useAnnotationStore } from '../store/annotation-store.js';

export function AnnotationPage() {
  const { imageId } = useParams();
  const numericImageId = Number(imageId);
  const images = useAnnotationStore((state) => state.images);
  const categories = useAnnotationStore((state) => state.categories);
  const annotations = useAnnotationStore((state) => state.annotations);
  const selectedAnnotationId = useAnnotationStore((state) => state.selectedAnnotationId);
  const selectedCategoryId = useAnnotationStore((state) => state.selectedCategoryId);
  const createAnnotation = useAnnotationStore((state) => state.createAnnotation);
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);
  const selectCategory = useAnnotationStore((state) => state.selectCategory);
  const updateAnnotation = useAnnotationStore((state) => state.updateAnnotation);
  const resetDemo = useAnnotationStore((state) => state.resetDemo);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [feedback, setFeedback] = useState(
    'Selecciona “Nueva caja” y arrastra sobre la imagen para crear una anotación.',
  );

  const image = images.find((item) => item.id === numericImageId);
  const imageAnnotations = annotations.filter(
    (annotation) => annotation.imageId === numericImageId,
  );
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

  if (!image) {
    return (
      <div className="page-wrap">
        <section className="empty-state">
          <span aria-hidden="true" className="empty-icon">
            ?
          </span>
          <h1>Imagen no encontrada</h1>
          <p>La imagen solicitada no existe en los datos de demostración.</p>
          <Link className="button button-primary" to="/images">
            Volver a imágenes
          </Link>
        </section>
      </div>
    );
  }

  const currentIndex = images.findIndex((item) => item.id === image.id);
  const previousImage = currentIndex > 0 ? images[currentIndex - 1] : undefined;
  const nextImage = currentIndex < images.length - 1 ? images[currentIndex + 1] : undefined;

  return (
    <div className="annotation-page">
      <header className="annotation-header">
        <div className="annotation-title">
          <Link aria-label="Volver a imágenes" className="back-link" to="/images">
            ←
          </Link>
          <div>
            <span className="eyebrow">Portal de anotación</span>
            <h1>{image.originalName}</h1>
            <p>
              {image.width} × {image.height} px · {imageAnnotations.length}{' '}
              {imageAnnotations.length === 1 ? 'caja' : 'cajas'}
            </p>
          </div>
        </div>
        <div className="annotation-header-actions">
          <DemoBadge />
          <StatusBadge status={image.status} />
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="tool-panel category-panel">
          <div className="tool-panel-heading">
            <span className="eyebrow">Paso 1</span>
            <h2>Categoría</h2>
            <p>Selecciona la clase antes de dibujar una caja.</p>
          </div>
          <div className="category-list">
            {categories.map((category, index) => (
              <button
                className={
                  category.id === selectedCategoryId ? 'category-option active' : 'category-option'
                }
                key={category.id}
                onClick={() => {
                  selectCategory(category.id);
                  setFeedback(`Categoría “${category.name}” seleccionada.`);
                }}
                type="button"
              >
                <span className="category-color" style={{ backgroundColor: category.color }} />
                <span>{category.name}</span>
                <kbd>{index + 1}</kbd>
              </button>
            ))}
          </div>
          <div className="tool-tip">
            <span aria-hidden="true">i</span>
            <p>Las cajas nuevas, sus movimientos y cambios de tamaño permanecen en memoria.</p>
          </div>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div className="toolbar-group">
              <button
                className={`tool-button${activeTool === 'select' ? ' active' : ''}`}
                onClick={() => setActiveTool('select')}
                type="button"
              >
                <span aria-hidden="true">↖</span>
                Seleccionar
              </button>
              <button
                className={`tool-button${activeTool === 'draw' ? ' active' : ''}`}
                disabled={!selectedCategory}
                onClick={() => {
                  setActiveTool('draw');
                  setFeedback(
                    `Dibuja una caja para la categoría “${selectedCategory?.name ?? ''}”.`,
                  );
                }}
                type="button"
              >
                <span aria-hidden="true">□</span>
                Nueva caja
              </button>
            </div>
            <div className="toolbar-group">
              <span className="zoom-indicator">Ajustar</span>
              <button
                aria-label="Restaurar cajas simuladas"
                className="icon-button"
                onClick={resetDemo}
                title="Restaurar demostración"
                type="button"
              >
                ↻
              </button>
            </div>
          </div>
          <AnnotationCanvas
            annotations={imageAnnotations}
            categories={categories}
            draftCategory={selectedCategory}
            imageHeight={image.height}
            imageWidth={image.width}
            mode={activeTool}
            onChange={updateAnnotation}
            onCreate={(box) => {
              if (!selectedCategory) {
                setFeedback('Selecciona una categoría antes de dibujar.');
                return;
              }

              createAnnotation(image.id, selectedCategory.id, box);
              setActiveTool('select');
              setFeedback(`Caja de “${selectedCategory.name}” creada. El cambio aún es local.`);
            }}
            onSelect={selectAnnotation}
            selectedId={selectedAnnotationId}
          />
          <div className="canvas-caption">
            <span>
              <i className="caption-dot" /> Coordenadas en píxeles absolutos
            </span>
            <span aria-live="polite">{feedback}</span>
          </div>
        </section>

        <aside className="tool-panel annotations-panel">
          <div className="tool-panel-heading row-heading">
            <div>
              <span className="eyebrow">Objetos</span>
              <h2>Anotaciones</h2>
            </div>
            <span className="count-pill">{imageAnnotations.length}</span>
          </div>
          {imageAnnotations.length > 0 ? (
            <div className="annotation-list">
              {imageAnnotations.map((annotation) => {
                const category = categories.find((item) => item.id === annotation.categoryId);
                const isSelected = annotation.id === selectedAnnotationId;
                return (
                  <button
                    className={`annotation-item${isSelected ? ' active' : ''}`}
                    key={annotation.id}
                    onClick={() => selectAnnotation(annotation.id)}
                    type="button"
                  >
                    <span className="annotation-index">#{annotation.id}</span>
                    <span className="annotation-copy">
                      <strong>
                        <i style={{ background: category?.color }} />
                        {category?.name ?? 'Sin categoría'}
                      </strong>
                      <small>
                        {Math.round(annotation.width)} × {Math.round(annotation.height)} px
                      </small>
                    </span>
                    <span aria-hidden="true" className="annotation-chevron">
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="panel-empty">
              <span aria-hidden="true">□</span>
              <p>Esta imagen todavía no tiene cajas.</p>
            </div>
          )}
        </aside>
      </div>

      <footer className="annotation-footer">
        <div className="image-navigation">
          {previousImage ? (
            <Link className="button button-ghost" to={`/annotate/${previousImage.id}`}>
              ← Anterior
            </Link>
          ) : (
            <button className="button button-ghost" disabled type="button">
              ← Anterior
            </button>
          )}
          <span>
            Imagen {currentIndex + 1} de {images.length}
          </span>
          {nextImage ? (
            <Link className="button button-ghost" to={`/annotate/${nextImage.id}`}>
              Siguiente →
            </Link>
          ) : (
            <button className="button button-ghost" disabled type="button">
              Siguiente →
            </button>
          )}
        </div>
        <div className="save-actions">
          <button
            className="button button-secondary"
            onClick={() => window.alert('Demostración: la persistencia se conecta en Fase 1.')}
            type="button"
          >
            Guardar
          </button>
          {nextImage ? (
            <Link className="button button-primary" to={`/annotate/${nextImage.id}`}>
              Guardar y siguiente
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <button className="button button-primary" disabled type="button">
              Guardar y siguiente
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
