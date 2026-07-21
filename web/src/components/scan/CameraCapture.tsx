"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, FlipHorizontal, ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onCapture: (file: File) => void;
  disabled?: boolean;
};

export function CameraCapture({ onCapture, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      stop();
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este navegador no permite cámara. Usa subir archivo.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      setError("No se pudo activar la cámara. Revisa permisos o sube una foto.");
      setActive(false);
    }
  }, [facing, stop]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    if (active) void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  const snap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        stop();
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-forest/95 aspect-[4/3] sm:aspect-video",
          !active && "grid place-items-center"
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn("h-full w-full object-cover", !active && "hidden")}
        />
        <canvas ref={canvasRef} className="hidden" />

        {!active && (
          <div className="flex flex-col items-center gap-3 px-6 text-center text-cream/80">
            <Camera className="h-10 w-10 text-leaf-light" />
            <p className="text-sm max-w-xs">
              Activa la cámara del teléfono o laptop para fotografiar la hoja afectada.
            </p>
            {error && <p className="text-xs text-amber-200">{error}</p>}
          </div>
        )}

        {active && (
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10">
            <div className="absolute inset-8 rounded-xl border border-dashed border-white/35" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void start()}
            className="inline-flex items-center gap-2 rounded-xl bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-dark disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
            Activar cámara
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={snap}
              className="inline-flex items-center gap-2 rounded-xl bg-leaf px-4 py-2.5 text-sm font-medium text-white hover:bg-leaf-dark"
            >
              <Camera className="h-4 w-4" />
              Tomar muestra
            </button>
            <button
              type="button"
              onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              className="inline-flex items-center gap-2 rounded-xl border border-forest/15 bg-white px-3 py-2.5 text-sm text-ink"
            >
              <FlipHorizontal className="h-4 w-4" />
              Cambiar
            </button>
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-xl border border-forest/15 bg-white px-3 py-2.5 text-sm text-ink"
            >
              <CameraOff className="h-4 w-4" />
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

type UploadProps = {
  previewUrl: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
};

export function ImageDropzone({ previewUrl, onFile, onClear, disabled }: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  if (previewUrl) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-forest/10 bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={previewUrl} alt="Muestra" className="max-h-72 w-full object-contain bg-mist" />
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-forest/80 text-cream"
          aria-label="Quitar imagen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors",
        dragging ? "border-leaf bg-leaf/5" : "border-forest/20 bg-white hover:border-leaf/50"
      )}
    >
      <ImagePlus className="h-8 w-8 text-leaf" />
      <p className="text-sm font-medium text-ink">Arrastra una foto o elige archivo</p>
      <p className="text-xs text-ink/50">JPG, PNG o WEBP · máx 12MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </button>
  );
}
