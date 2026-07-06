import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Rnd } from "react-rnd";
import { toPng } from "html-to-image";
import {
  BriefcaseBusiness,
  ChevronDown,
  Copy,
  Download,
  Expand,
  FileUp,
  Link,
  Mail,
  MapPin,
  Minus,
  Phone,
  QrCode,
  Send,
  Sparkles,
  Type,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";
import QRCode from "qrcode";
import jsQR from "jsqr";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type PdfDoc = any;

type CardInfo = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

type CardFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type LogoFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type ThemeId =
  | "auto"
  | "midnight"
  | "navy"
  | "royal"
  | "azure"
  | "teal"
  | "emerald"
  | "forest"
  | "olive"
  | "gold"
  | "amber"
  | "sunset"
  | "coral"
  | "rose"
  | "plum"
  | "violet"
  | "charcoal"
  | "slate"
  | "deepRed"
  | "bloodRed";
type LayoutId = "split" | "stack" | "classic";
type QrMode = "link" | "image";
type QrPlatformId = "zalo" | "wechat" | "whatsapp" | "facebook" | "youtube" | "instagram" | "telegram";
type QrPlatformInfo = {
  id: QrPlatformId;
  label: string;
  mark: string;
  color: string;
};
type QrRenderItem = {
  dataUrl: string;
  platform: QrPlatformInfo | null;
};
type TextStyle = {
  fontSize: number;
  fontFamily: string;
  color: string;
  weight: number;
};
type QrItem = {
  id: string;
  mode: QrMode;
  link: string;
  decodedText?: string;
  status?: string;
};

const defaultInfo: CardInfo = {
  name: "Full Name",
  phone: "0909090909",
  email: "PDF@businesscard.com",
  address: "Hai Phong, Vietnam",
};

const previousDefaultInfo: CardInfo = {
  name: "Nguyen Minh Anh",
  phone: "+84 912 345 678",
  email: "hello@company.vn",
  address: "42 Nguyen Hue, District 1, Ho Chi Minh City",
};

const fonts = [
  "Inter",
  "Manrope",
  "Montserrat",
  "Roboto",
  "Source Sans 3",
  "Nunito Sans",
  "Playfair Display",
];

const qrPlatforms: Array<QrPlatformInfo & { patterns: string[] }> = [
  {
    id: "zalo",
    label: "Zalo",
    mark: "Z",
    color: "#0068ff",
    patterns: ["zalo.me", "zaloapp.com", "oa.zalo.me", "zalo://", "zalo"],
  },
  {
    id: "wechat",
    label: "WeChat",
    mark: "We",
    color: "#07c160",
    patterns: ["wechat", "weixin", "weixin.qq.com", "u.wechat.com", "wx.qq.com", "weixin://"],
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    mark: "Wa",
    color: "#25d366",
    patterns: ["wa.me", "whatsapp.com", "whatsapp://"],
  },
  {
    id: "facebook",
    label: "Facebook",
    mark: "f",
    color: "#1877f2",
    patterns: ["facebook.com", "fb.com", "fb.me", "m.me", "fb://"],
  },
  {
    id: "youtube",
    label: "YouTube",
    mark: "YT",
    color: "#ff0033",
    patterns: ["youtube.com", "youtu.be", "youtube://"],
  },
  {
    id: "instagram",
    label: "Instagram",
    mark: "IG",
    color: "#e4405f",
    patterns: ["instagram.com", "instagr.am", "instagram://"],
  },
  {
    id: "telegram",
    label: "Telegram",
    mark: "Tg",
    color: "#229ed9",
    patterns: ["t.me", "telegram.me", "telegram.org", "telegram://", "tg://"],
  },
];

const defaultTextStyles: Record<keyof CardInfo, TextStyle> = {
  name: { fontSize: 18, fontFamily: "Inter", color: "#111827", weight: 800 },
  phone: { fontSize: 11, fontFamily: "Inter", color: "#344054", weight: 600 },
  email: { fontSize: 11, fontFamily: "Inter", color: "#344054", weight: 600 },
  address: { fontSize: 10, fontFamily: "Inter", color: "#475467", weight: 500 },
};

const fieldLabels: Record<keyof CardInfo, string> = {
  name: "Tên",
  phone: "Số điện thoại",
  email: "Email",
  address: "Địa chỉ",
};

const themePresets: Record<ThemeId, { label: string; accent: string; secondary: string; ink: string; soft: string }> = {
  auto: {
    label: "Auto",
    accent: "#0f766e",
    secondary: "#d6a94a",
    ink: "#111827",
    soft: "#ecfdf7",
  },
  midnight: {
    label: "Midnight Blue",
    accent: "#1d4ed8",
    secondary: "#7c3aed",
    ink: "#111827",
    soft: "#eef4ff",
  },
  navy: {
    label: "Navy Blue",
    accent: "#0b2a5b",
    secondary: "#1e5aa8",
    ink: "#0b1220",
    soft: "#edf4ff",
  },
  royal: {
    label: "Royal Blue",
    accent: "#1e40af",
    secondary: "#2563eb",
    ink: "#111827",
    soft: "#eff6ff",
  },
  azure: {
    label: "Azure",
    accent: "#0284c7",
    secondary: "#22d3ee",
    ink: "#0f172a",
    soft: "#ecfeff",
  },
  teal: {
    label: "Teal",
    accent: "#0f766e",
    secondary: "#14b8a6",
    ink: "#10251f",
    soft: "#ecfdf7",
  },
  emerald: {
    label: "Emerald",
    accent: "#059669",
    secondary: "#65a30d",
    ink: "#10251f",
    soft: "#ecfdf5",
  },
  forest: {
    label: "Forest",
    accent: "#166534",
    secondary: "#84cc16",
    ink: "#132016",
    soft: "#f0fdf4",
  },
  olive: {
    label: "Olive",
    accent: "#4d7c0f",
    secondary: "#a3a03a",
    ink: "#1f2414",
    soft: "#f7fee7",
  },
  gold: {
    label: "Champagne Gold",
    accent: "#a16207",
    secondary: "#d4af37",
    ink: "#241a0b",
    soft: "#fffbeb",
  },
  amber: {
    label: "Amber",
    accent: "#b45309",
    secondary: "#f59e0b",
    ink: "#271605",
    soft: "#fff7ed",
  },
  sunset: {
    label: "Sunset",
    accent: "#ea580c",
    secondary: "#db2777",
    ink: "#221316",
    soft: "#fff7ed",
  },
  coral: {
    label: "Coral",
    accent: "#e11d48",
    secondary: "#fb7185",
    ink: "#2a1117",
    soft: "#fff1f2",
  },
  rose: {
    label: "Rose Gold",
    accent: "#be6074",
    secondary: "#b58245",
    ink: "#28131b",
    soft: "#fff1f2",
  },
  plum: {
    label: "Plum",
    accent: "#86198f",
    secondary: "#c084fc",
    ink: "#241126",
    soft: "#faf5ff",
  },
  violet: {
    label: "Violet",
    accent: "#6d28d9",
    secondary: "#a78bfa",
    ink: "#1f1633",
    soft: "#f5f3ff",
  },
  charcoal: {
    label: "Charcoal",
    accent: "#334155",
    secondary: "#0f766e",
    ink: "#111827",
    soft: "#f1f5f9",
  },
  slate: {
    label: "Cool Slate",
    accent: "#475569",
    secondary: "#38bdf8",
    ink: "#111827",
    soft: "#f8fafc",
  },
  deepRed: {
    label: "Deep Red",
    accent: "#7f1d1d",
    secondary: "#b91c1c",
    ink: "#211010",
    soft: "#fef2f2",
  },
  bloodRed: {
    label: "Blood Red",
    accent: "#8a0303",
    secondary: "#dc2626",
    ink: "#240909",
    soft: "#fff1f1",
  },
};

const snapDistance = 10;
const storageKey = "pdf-business-card-state";
const cardReferenceZoom = 0.72;
const wechatQrPayload = "https://u.wechat.com/kNE1QLDxXUun5q04_FphdtE?s=2";
const canvasRenderLocks = new WeakMap<HTMLCanvasElement, Promise<void>>();

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const value = Number.parseInt(full, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function readableTextColor(primary: string, secondary: string) {
  const blended = (relativeLuminance(primary) + relativeLuminance(secondary)) / 2;
  return blended > 0.52 ? "#111827" : "#ffffff";
}

function readableInkOnWhite(primary: string) {
  return relativeLuminance(primary) > 0.36 ? "#111827" : primary;
}

function detectQrPlatform(payload?: string | null): QrPlatformInfo | null {
  const value = payload?.trim().toLowerCase();
  if (!value) return null;

  const match = qrPlatforms.find((platform) => platform.patterns.some((pattern) => value.includes(pattern)));
  if (!match) return null;

  const { patterns: _patterns, ...platform } = match;
  return platform;
}

async function extractLogoColors(dataUrl: string) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  const size = 80;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas unavailable");
  }

  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 40) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    if (brightness > 245 || brightness < 12) continue;
    const key = `${Math.round(r / 32)}-${Math.round(g / 32)}-${Math.round(b / 32)}`;
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  const sorted = [...buckets.values()].sort((a, b) => b.count - a.count);
  if (!sorted.length) {
    return { primary: "#192033", secondary: "#e7c46a" };
  }

  const primaryBucket = sorted[0];
  const secondaryBucket = sorted.find((bucket) => {
    const pr = primaryBucket.r / primaryBucket.count;
    const pg = primaryBucket.g / primaryBucket.count;
    const pb = primaryBucket.b / primaryBucket.count;
    const sr = bucket.r / bucket.count;
    const sg = bucket.g / bucket.count;
    const sb = bucket.b / bucket.count;
    return Math.hypot(pr - sr, pg - sg, pb - sb) > 85;
  }) ?? sorted[Math.min(1, sorted.length - 1)];

  const toHex = (bucket: { count: number; r: number; g: number; b: number }) =>
    rgbToHex(
      Math.round(bucket.r / bucket.count),
      Math.round(bucket.g / bucket.count),
      Math.round(bucket.b / bucket.count),
    );

  return {
    primary: toHex(primaryBucket),
    secondary: toHex(secondaryBucket),
  };
}

async function decodeQrImage(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !canvas.width || !canvas.height) {
    throw new Error("Không đọc được ảnh QR.");
  }

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });

  if (!result?.data) {
    throw new Error("Không nhận diện được QR trong ảnh này.");
  }

  return result.data;
}

async function renderPdfPageToCanvas({
  page,
  canvas,
  viewport,
  onRenderTask,
}: {
  page: any;
  canvas: HTMLCanvasElement;
  viewport: any;
  onRenderTask: (task: any) => void;
}) {
  const previous = canvasRenderLocks.get(canvas);
  if (previous) {
    await previous.catch(() => undefined);
  }

  const context = canvas.getContext("2d");
  if (!context) return;
  const outputScale = window.devicePixelRatio || 1;
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

  const renderTask = page.render({ canvasContext: context, viewport });
  onRenderTask(renderTask);
  const renderDone = renderTask.promise.finally(() => {
    if (canvasRenderLocks.get(canvas) === renderDone) {
      canvasRenderLocks.delete(canvas);
    }
  });
  canvasRenderLocks.set(canvas, renderDone);
  await renderDone;
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1];
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function downloadBytes(bytes: Uint8Array, filename: string, type: string) {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const blob = new Blob([arrayBuffer], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? { ...fallback, ...JSON.parse(stored) } : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [key, value]);

  return [value, setValue] as const;
}

function FieldIcon({ type }: { type: keyof CardInfo }) {
  const icons = {
    name: User,
    phone: Phone,
    email: Mail,
    address: MapPin,
  };
  const Icon = icons[type];
  return <Icon size={16} aria-hidden />;
}

function InlineField({
  value,
  field,
  textStyle,
  accent,
  onChange,
  onActivate,
  className = "",
}: {
  value: string;
  field: keyof CardInfo;
  textStyle: TextStyle;
  accent: string;
  onChange: (field: keyof CardInfo, value: string) => void;
  onActivate: (field: keyof CardInfo) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value]);

  return (
    <div
      className={`inline-field ${className}`}
      style={{
        color: textStyle.color,
        fontFamily: textStyle.fontFamily,
        fontSize: `${textStyle.fontSize}px`,
        fontWeight: textStyle.weight,
      }}
    >
      {field !== "name" ? <FieldIcon type={field} /> : null}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onFocus={() => onActivate(field)}
        onMouseDown={() => onActivate(field)}
        onInput={(event) => onChange(field, event.currentTarget.textContent ?? "")}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            (event.currentTarget as HTMLDivElement).blur();
          }
        }}
      >
        {value}
      </div>
      <i className="inline-accent" style={{ background: accent }} />
    </div>
  );
}

function TextProperties({
  field,
  value,
  onChange,
}: {
  field: keyof CardInfo;
  value: TextStyle;
  onChange: (field: keyof CardInfo, patch: Partial<TextStyle>) => void;
}) {
  return (
    <div className="text-properties">
      <div className="property-grid">
        <label>
          <input
            aria-label="Cỡ chữ"
            title="Cỡ chữ"
            type="number"
            min={8}
            max={30}
            value={value.fontSize}
            onChange={(event) => onChange(field, { fontSize: Number(event.target.value) })}
          />
        </label>
        <label>
          <input
            aria-label="Màu chữ"
            title="Màu chữ"
            type="color"
            value={value.color}
            onChange={(event) => onChange(field, { color: event.target.value })}
          />
        </label>
      </div>
      <label>
        <select
          aria-label="Font chữ"
          title="Font chữ"
          value={value.fontFamily}
          onChange={(event) => onChange(field, { fontFamily: event.target.value })}
        >
          {fonts.map((font) => (
            <option value={font} key={font}>
              {font}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          aria-label="Độ đậm"
          title="Độ đậm"
          type="range"
          min={400}
          max={900}
          step={100}
          value={value.weight}
          onChange={(event) => onChange(field, { weight: Number(event.target.value) })}
        />
      </label>
    </div>
  );
}

function PdfCanvas({
  pdfDoc,
  pageNumber,
  zoom,
  onSize,
}: {
  pdfDoc: PdfDoc | null;
  pageNumber: number;
  zoom: number;
  onSize?: (size: { width: number; height: number }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let canceled = false;
    let renderTask: any;

    async function render() {
      try {
        setRenderError("");
        if (!pdfDoc || !canvasRef.current) return;
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.35 * zoom });
        const canvas = canvasRef.current;
        onSize?.({ width: viewport.width, height: viewport.height });
        if (canceled) return;
        await renderPdfPageToCanvas({
          page,
          canvas,
          viewport,
          onRenderTask: (task) => {
            renderTask = task;
          },
        });
      } catch (error) {
        if (canceled || (error as Error).name === "RenderingCancelledException") return;
        setRenderError((error as Error).message || "Không render được trang PDF này.");
      }
    }

    void render();

    return () => {
      canceled = true;
      renderTask?.cancel?.();
    };
  }, [onSize, pageNumber, pdfDoc, zoom]);

  return (
    <>
      <canvas ref={canvasRef} className="pdf-canvas" />
      {renderError ? <div className="render-error">{renderError}</div> : null}
    </>
  );
}

function Thumbnail({
  pdfDoc,
  pageNumber,
  selected,
  onSelect,
}: {
  pdfDoc: PdfDoc;
  pageNumber: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(pageNumber <= 4);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    if (!wrapRef.current || isVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    let canceled = false;
    let renderTask: any;

    async function render() {
      try {
        setRenderError("");
        if (!isVisible) return;
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.22 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (canceled) return;
        await renderPdfPageToCanvas({
          page,
          canvas,
          viewport,
          onRenderTask: (task) => {
            renderTask = task;
          },
        });
      } catch (error) {
        if (canceled || (error as Error).name === "RenderingCancelledException") return;
        setRenderError("Lỗi thumbnail");
      }
    }

    void render();

    return () => {
      canceled = true;
      renderTask?.cancel?.();
    };
  }, [isVisible, pageNumber, pdfDoc]);

  return (
    <button ref={wrapRef} className={`thumbnail ${selected ? "selected" : ""}`} onClick={onSelect}>
      <canvas ref={canvasRef} />
      {renderError ? <small>{renderError}</small> : null}
      <span>{pageNumber}</span>
    </button>
  );
}

function BusinessCard({
  info,
  logo,
  qrCodes,
  theme,
  opacity,
  layout,
  logoFrame,
  textStyles,
  onInfoChange,
  onActivateField,
  onLogoFrameChange,
}: {
  info: CardInfo;
  logo: string | null;
  qrCodes: QrRenderItem[];
  theme: { accent: string; secondary: string; ink: string; soft: string };
  opacity: number;
  layout: LayoutId;
  logoFrame: LogoFrame;
  textStyles: Record<keyof CardInfo, TextStyle>;
  onInfoChange: (field: keyof CardInfo, value: string) => void;
  onActivateField: (field: keyof CardInfo) => void;
  onLogoFrameChange: (frame: LogoFrame) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardSize, setCardSize] = useState({ width: 1, height: 1 });
  const layoutClass = `layout-${layout}`;

  const updateLogo = (next: Partial<LogoFrame>) => {
    onLogoFrameChange({ ...logoFrame, ...next });
  };

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setCardSize({
        width: entry.contentRect.width || 1,
        height: entry.contentRect.height || 1,
      });
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`card-package ${qrCodes.length ? "with-qr" : ""}`}
      style={{
        "--accent": theme.accent,
        "--accent-2": theme.secondary,
        "--ink": theme.ink,
        "--soft": theme.soft,
      } as CSSProperties}
    >
      <div
        ref={cardRef}
        className={`business-card ${layoutClass} ${logo ? "has-logo" : "no-logo"} ${qrCodes.length ? "has-qr" : "no-qr"} qr-count-${qrCodes.length}`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        }}
      >
        <div className="card-paper" />
        <div className="card-decoration top" />
        <div className="card-decoration bottom" />
        <div className="card-rule" />
        {logo ? (
          <Rnd
            bounds="parent"
            className="logo-rnd"
            position={{
              x: logoFrame.x * cardSize.width,
              y: logoFrame.y * cardSize.height,
            }}
            size={{
              width: `${logoFrame.w * 100}%`,
              height: `${logoFrame.h * 100}%`,
            }}
            minWidth={34}
            minHeight={28}
            onDragStop={(_, data) => {
              const rect = cardRef.current?.getBoundingClientRect();
              if (!rect) return;
              updateLogo({
                x: clamp(data.x / rect.width, 0, 1 - logoFrame.w),
                y: clamp(data.y / rect.height, 0, 1 - logoFrame.h),
              });
            }}
            onResizeStop={(_, __, ref, ___, position) => {
              const rect = cardRef.current?.getBoundingClientRect();
              if (!rect) return;
              updateLogo({
                x: clamp(position.x / rect.width, 0, 0.95),
                y: clamp(position.y / rect.height, 0, 0.95),
                w: clamp(ref.offsetWidth / rect.width, 0.08, 0.7),
                h: clamp(ref.offsetHeight / rect.height, 0.08, 0.7),
              });
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <img src={logo} alt="Logo" draggable={false} />
          </Rnd>
        ) : null}

        <div className="card-content">
          <InlineField
            field="name"
            value={info.name}
            textStyle={textStyles.name}
            accent={theme.accent}
            onChange={onInfoChange}
            onActivate={onActivateField}
            className="name"
          />
          <InlineField
            field="phone"
            value={info.phone}
            textStyle={textStyles.phone}
            accent={theme.accent}
            onChange={onInfoChange}
            onActivate={onActivateField}
          />
          <InlineField
            field="email"
            value={info.email}
            textStyle={textStyles.email}
            accent={theme.accent}
            onChange={onInfoChange}
            onActivate={onActivateField}
          />
          <InlineField
            field="address"
            value={info.address}
            textStyle={textStyles.address}
            accent={theme.accent}
            onChange={onInfoChange}
            onActivate={onActivateField}
          />
        </div>

        {qrCodes.length ? (
          <div className="qr-module">
            {qrCodes.slice(0, 2).map((qrCode, index) => (
              <div className="qr-stack" key={`${qrCode.dataUrl}-${index}`}>
                {qrCode.platform || qrCodes.length > 1 ? (
                  <div
                    className={`qr-platform ${qrCode.platform ? "" : "placeholder"}`}
                    style={{ "--platform-color": qrCode.platform?.color ?? theme.accent } as CSSProperties}
                  >
                    <span className="qr-platform-mark">{qrCode.platform?.mark ?? ""}</span>
                    <span>{qrCode.platform?.label ?? "QR"}</span>
                  </div>
                ) : null}
                <img className="qr-code" src={qrCode.dataUrl} alt={`QR code ${index + 1}`} draggable={false} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function App() {
  const [saved, setSaved] = useStoredState(storageKey, {
    info: defaultInfo,
    textStyles: defaultTextStyles,
    fontSize: 13,
    fontFamily: "Inter",
    textColor: "#111827",
    theme: "auto" as ThemeId,
    layout: "split" as LayoutId,
    opacity: 0.96,
    logoFrame: { x: 0.08, y: 0.22, w: 0.25, h: 0.42 } as LogoFrame,
    showQr: false,
    qrMode: "link" as QrMode,
    qrLink: "https://company.vn",
    qrItems: [] as QrItem[],
    defaultNameSizeMigrated: false,
    defaultFontInterMigrated: false,
    defaultInfoPlaceholderMigrated: false,
  });

  const [pdfDoc, setPdfDoc] = useState<PdfDoc | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [selectedPage, setSelectedPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [frame, setFrame] = useState<CardFrame>({ x: 0.5, y: 0.66, w: 0.42, h: 0.18 });
  const [logo, setLogo] = useState<string | null>(null);
  const [autoTheme, setAutoTheme] = useState(themePresets.auto);
  const [zoom, setZoom] = useState(cardReferenceZoom);
  const [selectedCard, setSelectedCard] = useState(false);
  const [guides, setGuides] = useState<{ x?: number; y?: number }>({});
  const [qrCodes, setQrCodes] = useState<QrRenderItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activeTextField, setActiveTextField] = useState<keyof CardInfo | null>(null);
  const [activeQrItemId, setActiveQrItemId] = useState<string | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const [wechatOpen, setWechatOpen] = useState(false);
  const [wechatQrCode, setWechatQrCode] = useState("");

  const cardCaptureRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const canvasStageRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const themeDropdownRef = useRef<HTMLElement>(null);
  const mainUploadRef = useRef<HTMLInputElement>(null);
  const workspaceUploadRef = useRef<HTMLInputElement>(null);

  const textStyles = (Object.keys(defaultTextStyles) as Array<keyof CardInfo>).reduce(
    (styles, field) => ({
      ...styles,
      [field]: {
        ...defaultTextStyles[field],
        ...(saved.textStyles?.[field] ?? {}),
      },
    }),
    {} as Record<keyof CardInfo, TextStyle>,
  );
  const activeTheme = saved.theme === "auto" ? autoTheme : themePresets[saved.theme];
  const qrItems: QrItem[] = useMemo(() => {
    const storedItems = (saved.qrItems ?? []).slice(0, 2).map((item) => ({
      ...item,
      mode: (item.mode === "image" ? "image" : "link") as QrMode,
    }));
    if (storedItems.length) {
      return storedItems;
    }
    if (saved.showQr) {
      return [{
        id: "qr-legacy",
        mode: saved.qrMode === "image" ? "image" : "link",
        link: saved.qrLink ?? "https://company.vn",
      }];
    }
    return [];
  }, [saved.qrItems, saved.qrLink, saved.qrMode, saved.showQr]);

  useEffect(() => {
    if (activeQrItemId && !qrItems.some((item) => item.id === activeQrItemId)) {
      setActiveQrItemId(null);
    }
  }, [activeQrItemId, qrItems]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    let canceled = false;
    QRCode.toDataURL(wechatQrPayload, {
      margin: 1,
      width: 360,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    }).then((dataUrl) => {
      if (!canceled) setWechatQrCode(dataUrl);
    });

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const closeFloatingControls = (event: PointerEvent) => {
      const target = event.target as Node;
      const isInsideDropdown = themeDropdownRef.current?.contains(target);

      if (!isInsideDropdown) {
        setThemeOpen(false);
      }

      if (!(target instanceof Element) || !target.closest(".field-stack")) {
        setActiveTextField(null);
      }

      if (!(target instanceof Element) || !target.closest(".qr-item-card")) {
        setActiveQrItemId(null);
      }
    };

    document.addEventListener("pointerdown", closeFloatingControls);
    return () => document.removeEventListener("pointerdown", closeFloatingControls);
  }, []);

  useEffect(() => {
    if (saved.defaultNameSizeMigrated) return;
    const currentSize = saved.textStyles?.name?.fontSize ?? defaultTextStyles.name.fontSize;
    setSaved((current) => ({
      ...current,
      defaultNameSizeMigrated: true,
      textStyles: {
        ...defaultTextStyles,
        ...(current.textStyles ?? {}),
        name: {
          ...defaultTextStyles.name,
          ...(current.textStyles?.name ?? {}),
          fontSize: currentSize <= 17 ? 18 : currentSize,
        },
      },
    }));
  }, [saved.defaultNameSizeMigrated, saved.textStyles?.name?.fontSize, setSaved]);

  useEffect(() => {
    if (saved.defaultFontInterMigrated) return;
    setSaved((current) => {
      const nextTextStyles = (Object.keys(defaultTextStyles) as Array<keyof CardInfo>).reduce(
        (styles, field) => {
          const currentStyle = current.textStyles?.[field];
          styles[field] = {
            ...defaultTextStyles[field],
            ...(currentStyle ?? {}),
            fontFamily: !currentStyle?.fontFamily || currentStyle.fontFamily === "Manrope" ? "Inter" : currentStyle.fontFamily,
          };
          return styles;
        },
        {} as Record<keyof CardInfo, TextStyle>,
      );

      return {
        ...current,
        defaultFontInterMigrated: true,
        fontFamily: current.fontFamily === "Manrope" ? "Inter" : current.fontFamily,
        textStyles: nextTextStyles,
      };
    });
  }, [saved.defaultFontInterMigrated, setSaved]);

  useEffect(() => {
    if (saved.defaultInfoPlaceholderMigrated) return;
    setSaved((current) => {
      const currentInfo = current.info ?? defaultInfo;
      const shouldReplaceInfo = (Object.keys(previousDefaultInfo) as Array<keyof CardInfo>).every(
        (field) => currentInfo[field] === previousDefaultInfo[field],
      );

      return {
        ...current,
        defaultInfoPlaceholderMigrated: true,
        info: shouldReplaceInfo ? defaultInfo : currentInfo,
      };
    });
  }, [saved.defaultInfoPlaceholderMigrated, setSaved]);

  const handleInfoChange = (field: keyof CardInfo, value: string) => {
    setSaved((current) => ({
      ...current,
      info: {
        ...current.info,
        [field]: value,
      },
    }));
  };

  const updateTextStyle = (field: keyof CardInfo, patch: Partial<TextStyle>) => {
    setSaved((current) => ({
      ...current,
      textStyles: {
        ...defaultTextStyles,
        ...(current.textStyles ?? {}),
        [field]: {
          ...defaultTextStyles[field],
          ...(current.textStyles?.[field] ?? {}),
          ...patch,
        },
      },
    }));
  };

  const loadPdf = async (file: File) => {
    setIsLoadingPdf(true);
    setLoadError("");
    setPdfDoc(null);
    setPageCount(0);
    setPageSize({ width: 0, height: 0 });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const loadingTask = pdfjsLib.getDocument({
        data: bytes.slice(),
        stopAtErrors: false,
      });
      const document = await loadingTask.promise;
      setPdfBytes(bytes);
      setPdfDoc(document);
      setFileName(file.name);
      setSelectedPage(1);
      setZoom(cardReferenceZoom);
      setPageCount(document.numPages);
    } catch (error) {
      const message = (error as Error).message || "Không đọc được file PDF này.";
      setLoadError(message);
      setPdfBytes(null);
      setPdfDoc(null);
      setFileName("");
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const uploadLogo = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setLogo(dataUrl);
      setSaved((current) => ({ ...current, theme: "auto" }));
      try {
        const colors = await extractLogoColors(dataUrl);
        setAutoTheme({
          label: "Auto",
          accent: readableInkOnWhite(colors.primary),
          secondary: colors.secondary,
          ink: "#111827",
          soft: "#f8fafc",
        });
        setSaved((current) => ({
          ...current,
          textStyles: {
            ...defaultTextStyles,
            ...(current.textStyles ?? {}),
            name: {
              ...defaultTextStyles.name,
              ...(current.textStyles?.name ?? {}),
              color: readableInkOnWhite(colors.primary),
            },
          },
        }));
      } catch {
        setAutoTheme(themePresets.auto);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!qrItems.length) {
      setQrCodes([]);
      return;
    }

    let canceled = false;
    Promise.all(
      qrItems.map(async (item) => {
        const payload = item.mode === "image" ? item.decodedText : item.link.trim();

        if (!payload) return null;

        const dataUrl = await QRCode.toDataURL(payload, {
          margin: 0,
          width: 180,
          color: {
            dark: activeTheme.accent,
            light: "#ffffff",
          },
        });
        return {
          dataUrl,
          platform: detectQrPlatform(payload),
        };
      }),
    ).then((codes) => {
      if (!canceled) {
        setQrCodes(codes.filter(Boolean) as QrRenderItem[]);
      }
    });

    return () => {
      canceled = true;
    };
  }, [activeTheme.accent, qrItems]);

  const setQrItems = (items: QrItem[]) => {
    setSaved((current) => ({
      ...current,
      showQr: items.length > 0,
      qrItems: items.slice(0, 2),
    }));
  };

  const addQrItem = () => {
    if (qrItems.length >= 2) return;
    const id = `qr-${Date.now()}`;
    setQrItems([
      ...qrItems,
      {
        id,
        mode: "link",
        link: qrItems.length ? "" : (saved.qrLink || "https://company.vn"),
      },
    ]);
    setActiveQrItemId(id);
  };

  const updateQrItem = (id: string, patch: Partial<QrItem>) => {
    setQrItems(qrItems.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const removeQrItem = (id: string) => {
    setQrItems(qrItems.filter((item) => item.id !== id));
    if (activeQrItemId === id) setActiveQrItemId(null);
  };

  const uploadQrImage = async (id: string, file: File) => {
    updateQrItem(id, { mode: "image", status: "Đang đọc QR..." });
    try {
      const decodedText = await decodeQrImage(file);
      updateQrItem(id, {
        mode: "image",
        decodedText,
        status: "",
      });
    } catch (error) {
      updateQrItem(id, {
        mode: "image",
        decodedText: "",
        status: (error as Error).message || "Không đọc được QR.",
      });
    }
  };

  const framePixels = useMemo(() => {
    return {
      x: frame.x * pageSize.width,
      y: frame.y * pageSize.height,
      width: frame.w * pageSize.width,
      height: frame.h * pageSize.height,
    };
  }, [frame, pageSize]);
  const cardPreviewScale = zoom / cardReferenceZoom;
  const cardDesignSize = {
    width: framePixels.width / cardPreviewScale,
    height: framePixels.height / cardPreviewScale,
  };

  const applySnap = useCallback(
    (next: { x: number; y: number; width: number; height: number }) => {
      let snappedX = next.x;
      let snappedY = next.y;
      const activeGuides: { x?: number; y?: number } = {};
      const xTargets = [0, pageSize.width / 2, pageSize.width];
      const yTargets = [0, pageSize.height / 2, pageSize.height];
      const xEdges = [next.x, next.x + next.width / 2, next.x + next.width];
      const yEdges = [next.y, next.y + next.height / 2, next.y + next.height];

      xEdges.forEach((edge, index) => {
        xTargets.forEach((target) => {
          if (Math.abs(edge - target) < snapDistance) {
            snappedX += target - edge;
            activeGuides.x = target;
          }
        });
        if (index === 0 && Math.abs(edge) < snapDistance) activeGuides.x = 0;
      });

      yEdges.forEach((edge) => {
        yTargets.forEach((target) => {
          if (Math.abs(edge - target) < snapDistance) {
            snappedY += target - edge;
            activeGuides.y = target;
          }
        });
      });

      snappedX = clamp(snappedX, 0, pageSize.width - next.width);
      snappedY = clamp(snappedY, 0, pageSize.height - next.height);
      setGuides(activeGuides);

      return {
        x: snappedX / pageSize.width,
        y: snappedY / pageSize.height,
        w: next.width / pageSize.width,
        h: next.height / pageSize.height,
      };
    },
    [pageSize],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedCard || !pageSize.width || ["INPUT", "SELECT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)) {
        return;
      }
      const moves: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      const amount = event.shiftKey ? 10 : 1;
      setFrame((current) => ({
        ...current,
        x: clamp(current.x + (move[0] * amount) / pageSize.width, 0, 1 - current.w),
        y: clamp(current.y + (move[1] * amount) / pageSize.height, 0, 1 - current.h),
      }));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageSize, selectedCard]);

  const exportPdf = async () => {
    if (!pdfBytes || !cardCaptureRef.current) return;
    setIsExporting(true);
    try {
      await document.fonts?.ready;
      const pngDataUrl = await toPng(cardCaptureRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "transparent",
      });
      const pdf = await PDFDocument.load(pdfBytes.slice());
      const embeddedCard = await pdf.embedPng(dataUrlToBytes(pngDataUrl));
      const pages = pdf.getPages();
      const page = pages[selectedPage - 1];
      const { width, height } = page.getSize();
      page.drawImage(embeddedCard, {
        x: frame.x * width,
        y: height - (frame.y + frame.h) * height,
        width: frame.w * width,
        height: frame.h * height,
        rotate: degrees(0),
      });

      const output = await pdf.save();
      const baseName = fileName.replace(/\.pdf$/i, "") || "document";
      downloadBytes(output, `${baseName}_with-card.pdf`, "application/pdf");
    } finally {
      setIsExporting(false);
    }
  };

  const openFullscreen = () => {
    workspaceRef.current?.requestFullscreen?.();
  };

  useEffect(() => {
    const stage = canvasStageRef.current;
    if (!stage) return;

    const handleWheel = (event: globalThis.WheelEvent) => {
      event.preventDefault();

      if (event.ctrlKey) {
        stage.scrollTop += event.deltaY;
        return;
      }

      if (event.altKey) {
        stage.scrollLeft += event.deltaY || event.deltaX;
        return;
      }

      const currentZoom = zoomRef.current;
      const rect = stage.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      const pointerX = localX + stage.scrollLeft;
      const pointerY = localY + stage.scrollTop;
      const nextZoom = clamp(currentZoom - event.deltaY * 0.0012, 0.45, 2.2);
      const ratio = nextZoom / currentZoom;

      zoomRef.current = nextZoom;
      setZoom(nextZoom);
      window.requestAnimationFrame(() => {
        stage.scrollLeft = pointerX * ratio - localX;
        stage.scrollTop = pointerY * ratio - localY;
      });
    };

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <>
    <div className="app-shell">
      <aside className="left-panel">
        <div className="brand-row">
          <BriefcaseBusiness size={24} />
          <div>
            <strong>PDF - Business Card</strong>
          </div>
        </div>

        {loadError ? (
          <div className="load-error">
            <strong>Không mở được PDF</strong>
            <span>{loadError}</span>
          </div>
        ) : null}

        <section className="control-section">
          <div className="section-title">
            <User size={16} />
            <span>Thông tin</span>
          </div>
          {(["name", "phone", "email", "address"] as Array<keyof CardInfo>).map((field) => (
            <div className={`field-stack ${activeTextField === field ? "active" : ""}`} key={field}>
              <label className={`icon-input ${activeTextField === field ? "active" : ""}`}>
                <input
                  aria-label={fieldLabels[field]}
                  placeholder={fieldLabels[field]}
                  value={saved.info[field]}
                  onFocus={() => setActiveTextField(field)}
                  onChange={(event) => handleInfoChange(field, event.target.value)}
                />
              </label>
              {activeTextField === field ? (
                <TextProperties field={field} value={textStyles[field]} onChange={updateTextStyle} />
              ) : null}
            </div>
          ))}
        </section>

        <section className="control-section legacy-text-section">
          <div className="section-title">
            <Type size={16} />
            <span>Chữ</span>
          </div>
          <div className="two-cols">
            <label>
              <span>Cỡ</span>
              <input
                type="number"
                min={8}
                max={28}
                value={saved.fontSize}
                onChange={(event) => setSaved((current) => ({ ...current, fontSize: Number(event.target.value) }))}
              />
            </label>
            <label>
              <span>Màu</span>
              <input
                type="color"
                value={saved.textColor}
                onChange={(event) => setSaved((current) => ({ ...current, textColor: event.target.value }))}
              />
            </label>
          </div>
          <label>
            <span>Google Font</span>
            <select
              value={saved.fontFamily}
              onChange={(event) => setSaved((current) => ({ ...current, fontFamily: event.target.value }))}
            >
              {fonts.map((font) => (
                <option value={font} key={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="control-section">
          <div className="section-title qr-section-title">
            <div className="qr-section-label">
              <QrCode size={16} />
              <span>QR</span>
              {qrItems.length ? <span className="qr-count-badge">{qrItems.length}/2</span> : null}
            </div>
            <button
              className="qr-add-button"
              onClick={addQrItem}
              disabled={qrItems.length >= 2}
              title="Thêm QR"
              type="button"
            >
              +
            </button>
          </div>
          {qrItems.length ? (
            <div className="qr-controls">
              {qrItems.map((item, index) => {
                const detectedPlatform = detectQrPlatform(item.mode === "image" ? item.decodedText : item.link);
                const isActive = activeQrItemId === item.id;
                return (
                <div className={`qr-item-card ${isActive ? "active" : "collapsed"}`} key={item.id}>
                  <div
                    className="qr-item-head"
                    onClick={() => setActiveQrItemId((current) => (current === item.id ? null : item.id))}
                  >
                    <div className="qr-item-title">
                      <span>QR {index + 1}</span>
                      {detectedPlatform ? (
                        <span
                          className="qr-detected compact"
                          style={{ "--platform-color": detectedPlatform.color } as CSSProperties}
                        >
                          <span className="qr-detected-mark">{detectedPlatform.mark}</span>
                          <span>{detectedPlatform.label}</span>
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        removeQrItem(item.id);
                      }}
                      title="Xóa QR"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                  {isActive ? (
                    <div className="qr-item-body">
                      <div className="segmented two">
                        <button
                          className={item.mode === "link" ? "active" : ""}
                          onClick={() => updateQrItem(item.id, { mode: "link" })}
                        >
                          Link
                        </button>
                        <button
                          className={item.mode === "image" ? "active" : ""}
                          onClick={() => updateQrItem(item.id, { mode: "image" })}
                        >
                          Ảnh
                        </button>
                      </div>
                      {item.mode === "link" ? (
                        <label className="icon-input">
                          <Link size={16} />
                          <input
                            aria-label={`QR ${index + 1} link`}
                            value={item.link}
                            onChange={(event) => updateQrItem(item.id, { link: event.target.value })}
                          />
                        </label>
                      ) : null}
                      {item.mode === "image" ? (
                        <>
                          <label className="icon-input qr-upload-input">
                            <FileUp size={16} />
                            <span>Upload ảnh QR</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void uploadQrImage(item.id, file);
                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                          {item.decodedText ? (
                            <div className="qr-status qr-decoded" title={item.decodedText}>
                              <span className="qr-decoded-text">{item.decodedText}</span>
                              <button
                                className="qr-copy-button"
                                type="button"
                                title="Copy link QR"
                                onClick={() => void navigator.clipboard?.writeText(item.decodedText ?? "")}
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          ) : item.status ? (
                            <div className="qr-status">{item.status}</div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                );
              })}
            </div>
          ) : null}
        </section>

        <div className="panel-bottom">
          <section className="control-section compact-section theme-dock" ref={themeDropdownRef}>
            <button
              className="dropdown-trigger"
              onClick={() => {
                setThemeOpen((value) => !value);
              }}
            >
              <span>
                <i
                  className="theme-trigger-swatch"
                  style={{ background: `linear-gradient(135deg, ${activeTheme.accent}, ${activeTheme.secondary})` }}
                />
                Theme: {themePresets[saved.theme].label}
              </span>
              <ChevronDown size={16} className={themeOpen ? "open" : ""} />
            </button>
            {themeOpen ? (
              <div className="dropdown-panel">
                <div className="theme-grid">
                  {(Object.keys(themePresets) as ThemeId[]).map((themeId) => {
                    const theme = themeId === "auto" ? autoTheme : themePresets[themeId];
                    return (
                      <button
                        key={themeId}
                        className={`theme-chip ${saved.theme === themeId ? "active" : ""}`}
                        onClick={() => setSaved((current) => ({ ...current, theme: themeId }))}
                      >
                        <i style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.secondary})` }} />
                        <span>{themePresets[themeId].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

        <div className="designer-credit" aria-label="Tool designer contact">
          <div className="credit-head">
            <strong>Dư Ngọc Minh Hoàng</strong>
            <span className="credit-kicker">APP DESIGN</span>
          </div>
          <div className="credit-row">
            <Phone size={14} />
            <span>(+84) 904002301</span>
            <a className="credit-zalo" href="https://zalo.me/0904002301" target="_blank" rel="noreferrer">
              Zalo
            </a>
          </div>
          <div className="credit-row">
            <Send size={14} />
            <a className="credit-link" href="https://t.me/dungocminhhoang" target="_blank" rel="noreferrer">
              @dungocminhhoang
            </a>
            <button className="credit-wechat" type="button" onClick={() => setWechatOpen(true)}>
              WeChat
            </button>
          </div>
        </div>
        </div>

      </aside>

      <main className="workspace" ref={workspaceRef}>
        <div className="topbar">
          <div>
            <strong>{pdfDoc ? `Trang ${selectedPage}/${pageCount}` : "Chưa có PDF"}</strong>
            <span>Chèn vào trang đang chọn</span>
          </div>
          <div className="toolbar">
            <button onClick={() => setZoom((value) => clamp(value - 0.1, 0.45, 2.2))} title="Zoom out">
              <ZoomOut size={18} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((value) => clamp(value + 0.1, 0.45, 2.2))} title="Zoom in">
              <ZoomIn size={18} />
            </button>
            <button onClick={openFullscreen} title="Xem toàn màn hình">
              <Expand size={18} />
            </button>
            <button className="download-button" onClick={exportPdf} disabled={!pdfDoc || isExporting} title="Xuất PDF">
              {isExporting ? <Sparkles size={18} /> : <Download size={18} />}
              <span>{isExporting ? "Đang xuất" : "Xuất PDF"}</span>
            </button>
          </div>
        </div>

        <div
          className="canvas-stage"
          ref={canvasStageRef}
          onMouseDown={() => setSelectedCard(false)}
        >
          {pdfDoc ? (
            <button
              className="workspace-upload-button"
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => workspaceUploadRef.current?.click()}
            >
              <FileUp size={15} />
              <span>Upload PDF</span>
              <input
                ref={workspaceUploadRef}
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void loadPdf(file);
                  event.currentTarget.value = "";
                }}
              />
            </button>
          ) : null}
          {pdfDoc ? (
            <div className="page-wrap" style={{ width: pageSize.width || undefined, height: pageSize.height || undefined }}>
              <PdfCanvas pdfDoc={pdfDoc} pageNumber={selectedPage} zoom={zoom} onSize={setPageSize} />
              {pageSize.width ? (
                <>
                  {guides.x !== undefined ? <div className="snap-guide x" style={{ left: guides.x }} /> : null}
                  {guides.y !== undefined ? <div className="snap-guide y" style={{ top: guides.y }} /> : null}
                  <Rnd
                    className={`card-rnd ${selectedCard ? "selected" : ""}`}
                    bounds="parent"
                    position={{ x: framePixels.x, y: framePixels.y }}
                    size={{ width: framePixels.width, height: framePixels.height }}
                    minWidth={160}
                    minHeight={86}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                      setSelectedCard(true);
                    }}
                    onDrag={(_, data) => {
                      setFrame(applySnap({ x: data.x, y: data.y, width: framePixels.width, height: framePixels.height }));
                    }}
                    onDragStop={() => setGuides({})}
                    onResize={(_, __, ref, ___, position) => {
                      setFrame(
                        applySnap({
                          x: position.x,
                          y: position.y,
                          width: ref.offsetWidth,
                          height: ref.offsetHeight,
                        }),
                      );
                    }}
                    onResizeStop={() => setGuides({})}
                  >
                    <div className="capture-card" ref={cardCaptureRef}>
                      <div
                        className="card-scale-layer"
                        style={{
                          width: `${cardDesignSize.width}px`,
                          height: `${cardDesignSize.height}px`,
                          transform: `scale(${cardPreviewScale})`,
                        }}
                      >
                        <BusinessCard
                          info={saved.info}
                          logo={logo}
                          qrCodes={qrCodes}
                          theme={activeTheme}
                          opacity={saved.opacity}
                          layout={saved.layout}
                          logoFrame={saved.logoFrame}
                          textStyles={textStyles}
                          onInfoChange={handleInfoChange}
                          onActivateField={setActiveTextField}
                          onLogoFrameChange={(logoFrame) => setSaved((current) => ({ ...current, logoFrame }))}
                        />
                      </div>
                    </div>
                  </Rnd>
                </>
              ) : null}
            </div>
          ) : (
            <div className="empty-state">
              <label className={`main-upload-zone ${isLoadingPdf ? "loading" : ""}`}>
                <FileUp size={46} />
                <strong>{isLoadingPdf ? "Đang đọc PDF..." : "Upload PDF"}</strong>
                <span>Chọn file PDF để chèn business card ngay trên trình duyệt.</span>
                <input
                  ref={mainUploadRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void loadPdf(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              {loadError ? <p className="empty-error">{loadError}</p> : null}
            </div>
          )}
        </div>
      </main>

      <aside className="right-panel">
        <div className="thumb-list">
          {pdfDoc ? (
            Array.from({ length: pageCount }, (_, index) => (
              <Thumbnail
                key={index + 1}
                pdfDoc={pdfDoc}
                pageNumber={index + 1}
                selected={selectedPage === index + 1}
                onSelect={() => setSelectedPage(index + 1)}
              />
            ))
          ) : null}
        </div>

      </aside>
    </div>
    {wechatOpen ? (
      <div className="wechat-modal-backdrop" onMouseDown={() => setWechatOpen(false)}>
        <div className="wechat-modal" onMouseDown={(event) => event.stopPropagation()}>
          {wechatQrCode ? <img src={wechatQrCode} alt="WeChat QR" /> : <QrCode size={96} />}
          <span>Wechat ID: DuNgocMinhHoang</span>
        </div>
      </div>
    ) : null}
    </>
  );
}
