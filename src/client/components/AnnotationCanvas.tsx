import type Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import {
  type BoundingBox,
  type Point,
  createBoxFromPoints,
  toImagePoint,
} from '../lib/canvas-geometry.js';
import type { ApiAnnotation, ApiCategory } from '../types/api.js';

export type CanvasTool = 'select' | 'draw';

interface AnnotationCanvasProps {
  annotations: ApiAnnotation[];
  categories: ApiCategory[];
  draftCategory: ApiCategory | undefined;
  imageHeight: number;
  imageWidth: number;
  mode: CanvasTool;
  selectedId: number | null;
  onChange: (id: number, changes: Partial<ApiAnnotation>) => void;
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

function SceneBackdrop({ height, width }: { height: number; width: number }) {
  const horizon = height * 0.58;

  return (
    <>
      <Rect fill="#A9D3E8" height={height} width={width} />
      <Circle fill="#F5C965" radius={height * 0.07} x={width * 0.86} y={height * 0.16} />
      <Group opacity={0.92}>
        <Rect fill="#73879A" height={height * 0.38} width={width * 0.18} x={0} y={height * 0.2} />
        <Rect
          fill="#596E82"
          height={height * 0.48}
          width={width * 0.19}
          x={width * 0.16}
          y={height * 0.1}
        />
        <Rect
          fill="#8195A7"
          height={height * 0.32}
          width={width * 0.2}
          x={width * 0.34}
          y={height * 0.26}
        />
        <Rect
          fill="#667B8E"
          height={height * 0.42}
          width={width * 0.18}
          x={width * 0.69}
          y={height * 0.16}
        />
        <Rect
          fill="#8599A8"
          height={height * 0.3}
          width={width * 0.14}
          x={width * 0.86}
          y={height * 0.28}
        />
      </Group>
      <Rect fill="#A8B0A7" height={height * 0.12} width={width} y={horizon} />
      <Rect
        fill="#46515B"
        height={height - horizon - height * 0.08}
        width={width}
        y={horizon + height * 0.08}
      />
      <Line
        dash={[width * 0.07, width * 0.045]}
        points={[0, height * 0.84, width, height * 0.84]}
        stroke="#F4E8C8"
        strokeWidth={height * 0.012}
      />
      <Group x={width * 0.43} y={height * 0.62}>
        <Rect
          cornerRadius={height * 0.025}
          fill="#E3E8EB"
          height={height * 0.15}
          width={width * 0.27}
        />
        <Rect
          fill="#91B9CC"
          height={height * 0.065}
          width={width * 0.11}
          x={width * 0.08}
          y={height * 0.015}
        />
        <Circle fill="#25313A" radius={height * 0.035} x={width * 0.055} y={height * 0.15} />
        <Circle fill="#25313A" radius={height * 0.035} x={width * 0.225} y={height * 0.15} />
      </Group>
      <Group x={width * 0.22} y={height * 0.42}>
        <Circle fill="#D59B79" radius={height * 0.027} x={0} y={0} />
        <Rect
          cornerRadius={10}
          fill="#E9C46A"
          height={height * 0.19}
          width={width * 0.045}
          x={-width * 0.0225}
          y={height * 0.03}
        />
        <Line
          points={[0, height * 0.22, -width * 0.02, height * 0.33]}
          stroke="#263642"
          strokeWidth={height * 0.025}
        />
        <Line
          points={[0, height * 0.22, width * 0.025, height * 0.33]}
          stroke="#263642"
          strokeWidth={height * 0.025}
        />
      </Group>
    </>
  );
}

export function AnnotationCanvas({
  annotations,
  categories,
  draftCategory,
  imageHeight,
  imageWidth,
  mode,
  selectedId,
  onChange,
  onCreate,
  onSelect,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(960);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [draftBox, setDraftBox] = useState<BoundingBox | null>(null);

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

  const scale = containerWidth / imageWidth;
  const stageHeight = imageHeight * scale;
  const imageSize = { width: imageWidth, height: imageHeight };

  const getImagePointer = (stage: Konva.Stage) => {
    const position = stage.getPointerPosition();
    return position ? toImagePoint(position, scale) : null;
  };

  const handlePointerDown = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
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
    if (mode !== 'draw' || !drawStart) {
      return;
    }

    const stage = event.target.getStage();
    const point = stage ? getImagePointer(stage) : null;
    if (point) {
      setDraftBox(createBoxFromPoints(drawStart, point, imageSize, 1));
    }
  };

  const handlePointerUp = (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (mode !== 'draw' || !drawStart) {
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
        width={containerWidth}
      >
        <Layer>
          <Group listening={false}>
            <SceneBackdrop height={imageHeight} width={imageWidth} />
          </Group>
          {annotations.map((annotation) => (
            <BoxShape
              annotation={annotation}
              category={categories.find((category) => category.id === annotation.categoryId)}
              imageHeight={imageHeight}
              imageWidth={imageWidth}
              isInteractive={mode === 'select'}
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
