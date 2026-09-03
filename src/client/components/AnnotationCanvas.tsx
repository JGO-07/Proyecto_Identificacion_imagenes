import type Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import {
  type BoundingBox,
  type Point,
  createBoxFromPoints,
  toImagePoint,
} from '../lib/canvas-geometry.js';
import type { ApiAnnotation, ApiCategory } from '../types/api.js';

export type CanvasTool = 'select' | 'draw';
export type AnnotationGeometryChanges = Partial<
  Pick<ApiAnnotation, 'x' | 'y' | 'width' | 'height'>
>;

interface AnnotationCanvasProps {
  annotations: ApiAnnotation[];
  categories: ApiCategory[];
  draftCategory: ApiCategory | undefined;
  imageHeight: number;
  imageUrl: string;
  imageWidth: number;
  isBusy?: boolean;
  mode: CanvasTool;
  selectedId: number | null;
  zoom?: number;
  onChange: (id: number, changes: AnnotationGeometryChanges) => void;
  onCreate: (box: BoundingBox) => void;
  onSelect: (id: number | null) => void;
}

interface BoxShapeProps {
  annotation: ApiAnnotation;
  category: ApiCategory | undefined;
  imageHeight: number;
  imageWidth: number;
  isInteractive: boolean;
  isSelected: boolean;
  onChange: AnnotationCanvasProps['onChange'];
  onSelect: AnnotationCanvasProps['onSelect'];
}

function BoxShape({
  annotation,
  category,
  imageHeight,
  imageWidth,
  isInteractive,
  isSelected,
  onChange,
  onSelect,
}: BoxShapeProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const color = category?.color ?? '#FFFFFF';

  return (
    <>
      <Rect
        cornerRadius={8}
        draggable={isInteractive}
        dragBoundFunc={(position) => ({
          x: Math.min(Math.max(0, position.x), imageWidth - annotation.width),
          y: Math.min(Math.max(0, position.y), imageHeight - annotation.height),
        })}
        fill={`${color}20`}
        height={annotation.height}
        listening={isInteractive}
        onClick={() => onSelect(annotation.id)}
        onDragEnd={(event) =>
          onChange(annotation.id, {
            x: Math.round(event.target.x()),
            y: Math.round(event.target.y()),
          })
        }
        onTap={() => onSelect(annotation.id)}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) {
            return;
          }

          const width = Math.min(Math.max(20, node.width() * node.scaleX()), imageWidth);
          const height = Math.min(Math.max(20, node.height() * node.scaleY()), imageHeight);
          const x = Math.min(Math.max(0, node.x()), imageWidth - width);
          const y = Math.min(Math.max(0, node.y()), imageHeight - height);

          node.scaleX(1);
          node.scaleY(1);
          onChange(annotation.id, {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(width),
            height: Math.round(height),
          });
        }}
        ref={shapeRef}
        stroke={color}
        strokeScaleEnabled={false}
        strokeWidth={isSelected ? 4 : 3}
        width={annotation.width}
        x={annotation.x}
        y={annotation.y}
      />
      <Group listening={false} x={annotation.x} y={Math.max(0, annotation.y - 38)}>
        <Rect cornerRadius={[7, 7, 0, 0]} fill={color} height={38} width={160} />
        <Text
          fill="#FFFFFF"
          fontFamily="Inter, sans-serif"
          fontSize={21}
          fontStyle="bold"
          height={38}
          padding={8}
          text={category?.name ?? 'Sin categoría'}
          verticalAlign="middle"
          width={160}
        />
      </Group>
      {isSelected && isInteractive && (
        <Transformer
          anchorCornerRadius={4}
          anchorFill="#FFFFFF"
          anchorSize={14}
          anchorStroke={color}
          borderStroke={color}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
          }
          flipEnabled={false}
          keepRatio={false}
          ref={transformerRef}
          rotateEnabled={false}
        />
      )}
    </>
  );
}

export function AnnotationCanvas({
  annotations,
  categories,
  draftCategory,
  imageHeight,
  imageUrl,
  imageWidth,
  isBusy = false,
  mode,
  selectedId,
  onChange,
  onCreate,
  onSelect,
  zoom = 1,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(960);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [draftBox, setDraftBox] = useState<BoundingBox | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateWidth = () => setContainerWidth(container.clientWidth);
    const observer = new ResizeObserver(updateWidth);
    updateWidth();
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    const image = new window.Image();
    setBackgroundImage(null);
    setImageLoadFailed(false);
    image.onload = () => {
      if (active) {
        setBackgroundImage(image);
      }
    };
    image.onerror = () => {
      if (active) {
        setImageLoadFailed(true);
      }
    };
    image.src = imageUrl;

    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [imageUrl]);

  const scale = (containerWidth / imageWidth) * zoom;
  const stageWidth = imageWidth * scale;
  const stageHeight = imageHeight * scale;
  const imageSize = { width: imageWidth, height: imageHeight };

  const getImagePointer = (stage: Konva.Stage) => {
    const position = stage.getPointerPosition();
    return position ? toImagePoint(position, scale) : null;
  };

  const handlePointerDown = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!backgroundImage || isBusy) {
      return;
    }

    const stage = event.target.getStage();
    if (!stage) {
      return;
    }

    if (mode === 'draw') {
      const point = getImagePointer(stage);
      if (point) {
        setDrawStart(point);
        setDraftBox(null);
        onSelect(null);
      }
      return;
    }

    if (event.target === stage) {
      onSelect(null);
    }
  };

  const handlePointerMove = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (mode !== 'draw' || !drawStart || isBusy) {
      return;
    }

    const stage = event.target.getStage();
    const point = stage ? getImagePointer(stage) : null;
    if (point) {
      setDraftBox(createBoxFromPoints(drawStart, point, imageSize, 1));
    }
  };

  const handlePointerUp = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (mode !== 'draw' || !drawStart || isBusy) {
      return;
    }

    const stage = event.target.getStage();
    const point = stage ? getImagePointer(stage) : null;
    const completedBox = point ? createBoxFromPoints(drawStart, point, imageSize) : null;
    setDrawStart(null);
    setDraftBox(null);

    if (completedBox) {
      onCreate(completedBox);
    }
  };

  return (
    <div
      aria-label="Canvas de anotación. Dibuja, selecciona, mueve o redimensiona una caja."
      className={`canvas-container${mode === 'draw' ? ' drawing' : ''}`}
      ref={containerRef}
      role="application"
    >
      <Stage
        height={stageHeight}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchStart={handlePointerDown}
        scaleX={scale}
        scaleY={scale}
        width={stageWidth}
      >
        <Layer>
          <Rect fill="#252D36" height={imageHeight} listening={false} width={imageWidth} />
          {backgroundImage ? (
            <KonvaImage
              height={imageHeight}
              image={backgroundImage}
              listening={false}
              width={imageWidth}
            />
          ) : (
            <Text
              align="center"
              fill={imageLoadFailed ? '#FCA5A5' : '#CBD5E1'}
              fontSize={Math.max(18, imageWidth * 0.018)}
              listening={false}
              text={imageLoadFailed ? 'No se pudo cargar la imagen' : 'Cargando imagen…'}
              verticalAlign="middle"
              width={imageWidth}
              height={imageHeight}
            />
          )}
          {annotations.map((annotation) => (
            <BoxShape
              annotation={annotation}
              category={categories.find((category) => category.id === annotation.categoryId)}
              imageHeight={imageHeight}
              imageWidth={imageWidth}
              isInteractive={mode === 'select' && !isBusy && Boolean(backgroundImage)}
              isSelected={annotation.id === selectedId}
              key={annotation.id}
              onChange={onChange}
              onSelect={onSelect}
            />
          ))}
          {draftBox && (
            <Rect
              dash={[18, 10]}
              fill={`${draftCategory?.color ?? '#FFFFFF'}18`}
              height={draftBox.height}
              listening={false}
              stroke={draftCategory?.color ?? '#FFFFFF'}
              strokeScaleEnabled={false}
              strokeWidth={3}
              width={draftBox.width}
              x={draftBox.x}
              y={draftBox.y}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}
