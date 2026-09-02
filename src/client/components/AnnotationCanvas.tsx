import type Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import type { ApiAnnotation, ApiCategory } from '../types/api.js';

interface AnnotationCanvasProps {
  annotations: ApiAnnotation[];
  categories: ApiCategory[];
  imageHeight: number;
  imageWidth: number;
  selectedId: number | null;
  onChange: (id: number, changes: Partial<ApiAnnotation>) => void;
  onSelect: (id: number | null) => void;
}

interface BoxShapeProps {
  annotation: ApiAnnotation;
  category: ApiCategory | undefined;
  imageHeight: number;
  imageWidth: number;
  isSelected: boolean;
  onChange: AnnotationCanvasProps['onChange'];
  onSelect: AnnotationCanvasProps['onSelect'];
}

function BoxShape({
  annotation,
  category,
  imageHeight,
  imageWidth,
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
        draggable
        dragBoundFunc={(position) => ({
          x: Math.min(Math.max(0, position.x), imageWidth - annotation.width),
          y: Math.min(Math.max(0, position.y), imageHeight - annotation.height),
        })}
        fill={`${color}20`}
        height={annotation.height}
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
      <Group x={annotation.x} y={Math.max(0, annotation.y - 38)}>
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
      {isSelected && (
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
  imageHeight,
  imageWidth,
  selectedId,
  onChange,
  onSelect,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(960);

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

  return (
    <div
      aria-label="Canvas de anotación simulado. Selecciona, mueve o redimensiona una caja."
      className="canvas-container"
      ref={containerRef}
      role="application"
    >
      <Stage
        height={stageHeight}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) {
            onSelect(null);
          }
        }}
        onTouchStart={(event) => {
          if (event.target === event.target.getStage()) {
            onSelect(null);
          }
        }}
        scaleX={scale}
        scaleY={scale}
        width={containerWidth}
      >
        <Layer>
          <SceneBackdrop height={imageHeight} width={imageWidth} />
          {annotations.map((annotation) => (
            <BoxShape
              annotation={annotation}
              category={categories.find((category) => category.id === annotation.categoryId)}
              imageHeight={imageHeight}
              imageWidth={imageWidth}
              isSelected={annotation.id === selectedId}
              key={annotation.id}
              onChange={onChange}
              onSelect={onSelect}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
