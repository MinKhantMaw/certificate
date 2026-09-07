import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";
import Konva from "konva";
import {
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import {
  Copy,
  ImagePlus,
  QrCode,
  RotateCcw,
  Signature,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { storage } from "../services/storage";
import {
  CertificateTemplate,
  TemplateElement,
  TemplateLayout,
  TemplatePageSize,
  TemplateOrientation,
  User,
} from "../types";

const PAGE_SIZES: Record<TemplatePageSize, { width: number; height: number }> =
  {
    A4: { width: 1123, height: 794 },
    BUSINESS_CARD: { width: 1050, height: 600 },
    CUSTOM: { width: 1123, height: 794 },
  };
const SAMPLE_DATA: Record<string, string> = {
  name: "John Doe",
  course: "Full Stack Development",
  certificate_id: "CERT-001",
  issue_date: "2026-09-07",
  department: "Engineering",
};

function useImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    if (!src) {
      setImage(undefined);
      return;
    }
    const next = new window.Image();
    next.onload = () => setImage(next);
    next.src = src;
  }, [src]);
  return image;
}

export function createDefaultLayout(): TemplateLayout {
  return {
    version: 1,
    canvas: {
      width: 1123,
      height: 794,
      pageSize: "A4",
      orientation: "landscape",
    },
    elements: [],
  };
}

export function TemplateBuilder({
  template,
  onChange,
}: {
  template: CertificateTemplate;
  onChange: (layout: TemplateLayout) => void;
}) {
  const [layout, setLayout] = useState<TemplateLayout>(
    template.layout || createDefaultLayout(),
  );
  const [selectedId, setSelectedId] = useState<string>();
  const [zoom, setZoom] = useState(0.52);
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const signatures = storage.getUsers().filter((user) => user.signatureImage);
  const selected = layout.elements.find((element) => element.id === selectedId);
  const update = (next: TemplateLayout) => {
    setLayout(next);
    onChange(next);
  };

  useEffect(() => {
    const node = stageRef.current?.findOne(`#${selectedId}`);
    if (node && transformerRef.current) {
      transformerRef.current.nodes([node]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, layout.elements.length]);

  const addElement = (type: TemplateElement["type"]) => {
    const id = `${type}-${crypto.randomUUID()}`;
    const element: TemplateElement = {
      id,
      type,
      x: layout.canvas.width / 2 - 150,
      y: layout.canvas.height / 2 - 30,
      width: type === "qr" ? 120 : type === "signature" ? 180 : 300,
      height: type === "qr" ? 120 : type === "signature" ? 80 : 70,
      rotation: 0,
      key: type === "text" ? "name" : undefined,
      signatureId: type === "signature" ? signatures[0]?.id : undefined,
      style:
        type === "text"
          ? {
              fontFamily: "Arial",
              fontSize: 40,
              fontWeight: "bold",
              color: "#111827",
              align: "center",
              lineHeight: 1.2,
            }
          : undefined,
      fill: type === "shape" ? "#dbeafe" : undefined,
      stroke: type === "shape" ? "#2563eb" : undefined,
    };
    update({ ...layout, elements: [...layout.elements, element] });
    setSelectedId(id);
  };

  const patchSelected = (
    patch:
      | Partial<TemplateElement>
      | { style: Partial<NonNullable<TemplateElement["style"]>> },
  ) => {
    if (!selected) return;
    const next = layout.elements.map((element) => {
      if (element.id !== selected.id) return element;
      if ("style" in patch)
        return { ...element, style: { ...element.style, ...patch.style } };
      return { ...element, ...patch };
    });
    update({ ...layout, elements: next });
  };

  const removeSelected = () => {
    if (!selected) return;
    update({
      ...layout,
      elements: layout.elements.filter((element) => element.id !== selected.id),
    });
    setSelectedId(undefined);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = {
      ...selected,
      id: `${selected.type}-${crypto.randomUUID()}`,
      x: selected.x + 20,
      y: selected.y + 20,
    };
    update({ ...layout, elements: [...layout.elements, copy] });
    setSelectedId(copy.id);
  };

  const uploadFile = (
    event: ChangeEvent<HTMLInputElement>,
    kind: "background" | "image",
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (kind === "background")
        update({ ...layout, background: String(reader.result) });
      else if (selected) patchSelected({ src: String(reader.result) });
    };
    reader.readAsDataURL(file);
  };

  const setCanvas = (
    pageSize: TemplatePageSize,
    orientation: TemplateOrientation,
    width = layout.canvas.width,
    height = layout.canvas.height,
  ) => {
    const base =
      pageSize === "CUSTOM" ? { width, height } : PAGE_SIZES[pageSize];
    const dimensions =
      orientation === "landscape" || (pageSize === "CUSTOM" && width >= height)
        ? {
            width: Math.max(base.width, base.height),
            height: Math.min(base.width, base.height),
          }
        : {
            width: Math.min(base.width, base.height),
            height: Math.max(base.width, base.height),
          };
    update({
      ...layout,
      canvas: { ...layout.canvas, ...dimensions, pageSize, orientation },
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[180px_minmax(500px,1fr)_260px]">
      <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Elements
        </p>
        <ToolButton
          icon={<Type size={16} />}
          label="Text"
          onClick={() => addElement("text")}
        />
        <ToolButton
          icon={<ImagePlus size={16} />}
          label="Image"
          onClick={() => addElement("image")}
        />
        <ToolButton
          icon={<Signature size={16} />}
          label="Signature"
          onClick={() => addElement("signature")}
        />
        <ToolButton
          icon={<QrCode size={16} />}
          label="QR code"
          onClick={() => addElement("qr")}
        />
        <ToolButton
          icon={<Square size={16} />}
          label="Shape"
          onClick={() => addElement("shape")}
        />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <ImagePlus size={16} /> Background
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => uploadFile(event, "background")}
          />
        </label>
        {layout.background && (
          <button
            type="button"
            onClick={() => update({ ...layout, background: undefined })}
            className="text-xs text-rose-700"
          >
            Remove background
          </button>
        )}
      </aside>

      <section className="min-w-0 rounded-xl border border-slate-200 bg-slate-100 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <select
              value={layout.canvas.pageSize}
              onChange={(event) =>
                setCanvas(
                  event.target.value as TemplatePageSize,
                  layout.canvas.orientation,
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="A4">A4</option>
              <option value="BUSINESS_CARD">Business card</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <select
              value={layout.canvas.orientation}
              onChange={(event) =>
                setCanvas(
                  layout.canvas.pageSize,
                  event.target.value as TemplateOrientation,
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="landscape">Landscape</option>
              <option value="portrait">Portrait</option>
            </select>
            {layout.canvas.pageSize === "CUSTOM" && (
              <>
                <input
                  aria-label="Canvas width"
                  type="number"
                  min="100"
                  value={layout.canvas.width}
                  onChange={(event) =>
                    setCanvas(
                      "CUSTOM",
                      layout.canvas.orientation,
                      Number(event.target.value),
                      layout.canvas.height,
                    )
                  }
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
                <input
                  aria-label="Canvas height"
                  type="number"
                  min="100"
                  value={layout.canvas.height}
                  onChange={(event) =>
                    setCanvas(
                      "CUSTOM",
                      layout.canvas.orientation,
                      layout.canvas.width,
                      Number(event.target.value),
                    )
                  }
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
              </>
            )}
          </div>
          <label className="text-xs text-slate-500">
            Zoom{" "}
            <input
              type="range"
              min="0.3"
              max="0.8"
              step="0.01"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="overflow-auto rounded-lg bg-slate-300 p-4">
          <Stage
            ref={stageRef}
            width={layout.canvas.width * zoom}
            height={layout.canvas.height * zoom}
            scaleX={zoom}
            scaleY={zoom}
            onMouseDown={(event) => {
              if (event.target === event.target.getStage())
                setSelectedId(undefined);
            }}
          >
            <Layer>
              <Rect
                width={layout.canvas.width}
                height={layout.canvas.height}
                fill="white"
              />
              {layout.background && (
                <CanvasImage
                  src={layout.background}
                  x={0}
                  y={0}
                  width={layout.canvas.width}
                  height={layout.canvas.height}
                />
              )}
              {layout.elements.map((element) => (
                <EditorElement
                  key={element.id}
                  element={element}
                  selected={element.id === selectedId}
                  signatures={signatures}
                  onSelect={() => setSelectedId(element.id)}
                  onChange={(patch) => patchSelected(patch)}
                  onUpload={(event) => uploadFile(event, "image")}
                />
              ))}
              <Transformer
                ref={transformerRef}
                rotateEnabled
                keepRatioEnabled
                boundBoxFunc={(oldBox, newBox) =>
                  newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
                }
              />
            </Layer>
          </Stage>
        </div>
      </section>

      <aside className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Properties
        </p>
        {!selected ? (
          <p className="mt-4 text-sm text-slate-500">
            Select an element to edit it.
          </p>
        ) : (
          <Properties
            element={selected}
            signatures={signatures}
            onChange={patchSelected}
            onUpload={(event) => uploadFile(event, "image")}
            onDelete={removeSelected}
            onDuplicate={duplicateSelected}
          />
        )}
      </aside>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:border-teal-400 hover:bg-teal-50"
    >
      {icon}
      {label}
    </button>
  );
}

function CanvasImage({
  src,
  ...props
}: {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const image = useImage(src);
  return image ? <KonvaImage image={image} {...props} /> : null;
}

function EditorElement({
  element,
  selected,
  signatures,
  onSelect,
  onChange,
  onUpload,
}: {
  element: TemplateElement;
  selected: boolean;
  signatures: User[];
  onSelect: () => void;
  onChange: (patch: Partial<TemplateElement>) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const common = {
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) =>
      onChange({ x: event.target.x(), y: event.target.y() }),
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      const node = event.target;
      onChange({
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(20, node.width() * node.scaleX()),
        height: Math.max(20, node.height() * node.scaleY()),
      });
      node.scaleX(1);
      node.scaleY(1);
    },
  };
  if (element.type === "text")
    return (
      <Text
        {...common}
        text={`{{${element.key || "name"}}}`}
        fontFamily={element.style?.fontFamily}
        fontSize={element.style?.fontSize}
        fontStyle={element.style?.fontWeight === "bold" ? "bold" : "normal"}
        fill={element.style?.color}
        align={element.style?.align}
        verticalAlign="middle"
        padding={8}
      />
    );
  if (element.type === "shape")
    return (
      <Rect
        {...common}
        fill={element.fill}
        stroke={element.stroke}
        cornerRadius={4}
      />
    );
  if (element.type === "qr")
    return <Rect {...common} fill="#f8fafc" stroke="#334155" dash={[8, 6]} />;
  const src =
    element.type === "signature"
      ? signatures.find((user) => user.id === element.signatureId)
          ?.signatureImage
      : element.src;
  return src ? (
    <CanvasImage src={src} {...common} />
  ) : (
    <Rect
      {...common}
      fill="#e2e8f0"
      stroke={selected ? "#0f766e" : "#94a3b8"}
      dash={[8, 6]}
    />
  );
}

function Properties({
  element,
  signatures,
  onChange,
  onUpload,
  onDelete,
  onDuplicate,
}: {
  element: TemplateElement;
  signatures: User[];
  onChange: (
    patch:
      | Partial<TemplateElement>
      | { style: Partial<NonNullable<TemplateElement["style"]>> },
  ) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const setNumber = (
    key: "x" | "y" | "width" | "height" | "rotation",
    value: string,
  ) => onChange({ [key]: Number(value) } as Partial<TemplateElement>);
  return (
    <div className="mt-4 space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-2">
        {(["x", "y", "width", "height", "rotation"] as const).map((key) => (
          <label key={key} className="text-xs text-slate-500">
            {key}
            <input
              type="number"
              value={Math.round(element[key])}
              onChange={(event) => setNumber(key, event.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
            />
          </label>
        ))}
      </div>
      {element.type === "text" && (
        <>
          <label className="block text-xs text-slate-500">
            Placeholder key
            <input
              value={element.key || ""}
              onChange={(event) =>
                onChange({
                  key: event.target.value.replace(/^\{\{|\}\}$/g, "").trim(),
                })
              }
              placeholder="name"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-500">
              Font size
              <input
                type="number"
                value={element.style?.fontSize || 40}
                onChange={(event) =>
                  onChange({ style: { fontSize: Number(event.target.value) } })
                }
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
              />
            </label>
            <label className="text-xs text-slate-500">
              Color
              <input
                type="color"
                value={element.style?.color || "#111827"}
                onChange={(event) =>
                  onChange({ style: { color: event.target.value } })
                }
                className="mt-1 h-8 w-full"
              />
            </label>
          </div>
          <select
            value={element.style?.align || "center"}
            onChange={(event) =>
              onChange({
                style: {
                  align: event.target.value as "left" | "center" | "right",
                },
              })
            }
            className="w-full rounded border border-slate-300 px-2 py-1.5"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </>
      )}
      {element.type === "image" && (
        <label className="flex cursor-pointer items-center gap-2 rounded border border-slate-300 px-3 py-2 text-slate-700">
          <ImagePlus size={16} /> Upload image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
        </label>
      )}
      {element.type === "signature" && (
        <select
          value={element.signatureId || ""}
          onChange={(event) => onChange({ signatureId: event.target.value })}
          className="w-full rounded border border-slate-300 px-2 py-1.5"
        >
          <option value="">Select signature</option>
          {signatures.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex items-center gap-1 text-slate-600"
        >
          <Copy size={15} /> Duplicate
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 text-rose-700"
        >
          <Trash2 size={15} /> Delete
        </button>
        <button
          type="button"
          onClick={() => onChange({ rotation: 0 })}
          className="inline-flex items-center gap-1 text-slate-600"
        >
          <RotateCcw size={15} /> Reset
        </button>
      </div>
    </div>
  );
}
