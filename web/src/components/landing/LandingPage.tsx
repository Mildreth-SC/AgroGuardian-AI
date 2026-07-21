"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  ArrowRight,
  Bot,
  Camera,
  CloudSun,
  Leaf,
  Map,
  ScanLine,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { cn } from "@/lib/utils";

const MODULES = [
  {
    id: "scan",
    icon: ScanLine,
    title: "Escanear planta",
    desc: "Sube una foto de la hoja. La IA detecta enfermedades como Sigatoka Negra con confianza y recomendaciones.",
  },
  {
    id: "climate",
    icon: CloudSun,
    title: "Clima y suelo",
    desc: "Pronóstico local en tiempo real para decidir cuándo regar, fertilizar o esperar.",
  },
  {
    id: "copilot",
    icon: Bot,
    title: "Asistente IA",
    desc: "Tu agrónomo 24/7 en español. Pregunta sobre plagas, siembra y mercados en Manabí.",
  },
  {
    id: "encyclopedia",
    icon: Shield,
    title: "Enciclopedia de enfermedades",
    desc: "10+ protocolos para Sigatoka, roya, monilia y más — escalable por catálogo.",
  },
  {
    id: "map",
    icon: Map,
    title: "Mapa de fincas",
    desc: "Visualiza lotes con estado sanitario: sano, riesgo o infectado.",
  },
];

const STEPS = [
  { n: "01", title: "Regístrate", text: "Crea tu cuenta y configura tu finca en menos de 2 minutos." },
  { n: "02", title: "Escanea", text: "Toma una foto de la hoja o sube una imagen desde el móvil." },
  { n: "03", title: "Decide", text: "Recibe diagnóstico, clima, mercado y plan de acción con IA." },
];

export function LandingPage() {
  const [activeModule, setActiveModule] = useState(MODULES[0].id);
  const { isSignedIn, isLoaded } = useAuth();
  const current = MODULES.find((m) => m.id === activeModule) ?? MODULES[0];

  return (
    <div className="min-h-dvh bg-field">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-leaf/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-leaf-light/20 blur-3xl" />

        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-leaf/10 px-3 py-1 text-xs font-medium text-leaf-dark">
              <Sparkles className="h-3.5 w-3.5" />
              Sanidad vegetal con IA · Manabí, Ecuador
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-forest mt-5 leading-[1.08] tracking-tight">
              Tu agrónomo inteligente, siempre contigo
            </h1>
            <p className="mt-5 text-base sm:text-lg text-ink/65 max-w-xl leading-relaxed">
              AgroGuardian AI convierte una foto de tu cultivo en diagnóstico, alertas climáticas y
              recomendaciones accionables. Diseñado para pequeños productores que necesitan decidir
              mejor, no adivinar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {isLoaded && !isSignedIn && (
                <>
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center gap-2 rounded-xl bg-forest px-6 py-3.5 text-sm font-semibold text-cream hover:bg-leaf-dark transition-all hover:gap-3"
                  >
                    Empezar gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex items-center rounded-xl border border-forest/15 bg-white/80 px-6 py-3.5 text-sm font-semibold text-forest hover:bg-white transition-colors"
                  >
                    Iniciar sesión
                  </Link>
                </>
              )}
              {isLoaded && isSignedIn && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-leaf px-6 py-3.5 text-sm font-semibold text-white hover:bg-leaf-dark transition-all"
                >
                  Entrar a mi finca
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <a
                href="#como-funciona"
                className="inline-flex items-center rounded-xl px-4 py-3.5 text-sm font-medium text-ink/55 hover:text-leaf transition-colors"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
              {[
                { v: "94%", l: "Precisión demo IA" },
                { v: "24/7", l: "Asistente activo" },
                { v: "5", l: "Cultivos clave" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-2xl border border-forest/8 bg-cream/70 backdrop-blur px-3 py-3 text-center"
                >
                  <p className="font-display text-xl text-forest">{s.v}</p>
                  <p className="text-[10px] text-ink/45 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive preview card */}
          <div className="animate-fade-up [animation-delay:120ms] lg:justify-self-end w-full max-w-md mx-auto lg:mx-0">
            <div className="rounded-3xl border border-forest/10 bg-cream/90 backdrop-blur p-5 shadow-xl ring-1 ring-forest/5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-wider text-ink/45">Vista previa del panel</p>
                <span className="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 animate-pulse-soft">
                  ALERTA
                </span>
              </div>
              <div className="rounded-2xl bg-forest p-4 text-cream mb-3">
                <p className="text-xs text-cream/60">Finca La Esperanza</p>
                <p className="font-display text-2xl mt-1">Sigatoka detectada</p>
                <p className="text-sm text-cream/75 mt-1">Plátano · 94% confianza · Riesgo alto</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { icon: Camera, label: "Visión IA", val: "Activo" },
                  { icon: CloudSun, label: "Humedad", val: "87%" },
                  { icon: Leaf, label: "Salud", val: "72%" },
                  { icon: TrendingUp, label: "Mercado", val: "Sube" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-forest/8 bg-white px-3 py-2.5 hover:border-leaf/30 transition-colors"
                  >
                    <m.icon className="h-4 w-4 text-leaf mb-1" />
                    <p className="text-[10px] text-ink/45">{m.label}</p>
                    <p className="text-sm font-semibold text-forest">{m.val}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink/50 leading-relaxed">
                Simula tu finca, escanea una hoja y recibe un plan de tratamiento en minutos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="problema" className="px-4 py-16 sm:px-6 bg-forest text-cream">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.2em] text-cream/50">El problema</p>
          <h2 className="font-display text-3xl sm:text-4xl mt-2 max-w-2xl">
            Decisiones agrícolas a ciegas cuestan cosecha y dinero
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Uso excesivo de agua y pesticidas",
              "Pérdidas por enfermedades no detectadas a tiempo",
              "Malas decisiones de venta sin datos de mercado",
              "Sin integración entre clima, cultivo e historial",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-cream/80 hover:bg-white/10 transition-colors"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solucion" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-leaf">La solución</p>
            <h2 className="font-display text-3xl sm:text-4xl text-forest mt-2">
              Un copiloto agrícola que une IA, clima y tu finca
            </h2>
            <p className="mt-4 text-ink/65 leading-relaxed">
              AgroGuardian AI no es otro dashboard. Es tu sistema de sanidad vegetal: foto →
              diagnóstico → clima → recomendaciones → reporte. Pensado para plátano, cacao, maíz,
              café y arroz en la costa ecuatoriana.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Detección temprana con visión artificial (OpenRouter)",
                "Agentes IA: enfermedad, clima, agrónomo y reportes",
                "Mapa de fincas y alertas en tiempo real",
                "Asistente conversacional en español",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-sm text-ink/70">
                  <Shield className="h-4 w-4 text-leaf shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-forest/10 bg-cream p-6 shadow-sm">
            <p className="text-xs text-ink/45 mb-4">Flujo de agentes IA</p>
            <ol className="space-y-3">
              {[
                "Vision Agent — analiza la hoja",
                "Climate Agent — consulta Open-Meteo",
                "Agronomist — genera plan en español",
                "Report Agent — PDF e historial",
              ].map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-xl bg-mist/80 px-4 py-3 text-sm hover:bg-mist transition-colors"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-leaf text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Modules - interactive tabs */}
      <section id="modulos" className="px-4 py-16 sm:px-6 bg-cream/60">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.2em] text-leaf text-center">Módulos</p>
          <h2 className="font-display text-3xl sm:text-4xl text-forest mt-2 text-center">
            Todo lo que necesitas en un solo lugar
          </h2>
          <div className="mt-10 grid lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-2">
              {MODULES.map((m) => {
                const Icon = m.icon;
                const active = m.id === activeModule;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveModule(m.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-all",
                      active
                        ? "border-leaf bg-leaf text-white shadow-md scale-[1.02]"
                        : "border-forest/10 bg-white text-ink/70 hover:border-leaf/30"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {m.title}
                  </button>
                );
              })}
            </div>
            <div className="lg:col-span-3 rounded-3xl border border-forest/10 bg-white p-6 sm:p-8 min-h-[220px] flex flex-col justify-center animate-fade-up">
              {(() => {
                const Icon = current.icon;
                return <Icon className="h-10 w-10 text-leaf mb-4" />;
              })()}
              <h3 className="font-display text-2xl text-forest">{current.title}</h3>
              <p className="mt-3 text-ink/65 leading-relaxed">{current.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs uppercase tracking-[0.2em] text-leaf text-center">Cómo funciona</p>
          <h2 className="font-display text-3xl sm:text-4xl text-forest mt-2 text-center">
            De registro a diagnóstico en 3 pasos
          </h2>
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="group rounded-2xl border border-forest/10 bg-cream p-6 hover:border-leaf/30 hover:shadow-lg transition-all"
              >
                <p className="font-display text-4xl text-leaf/25 group-hover:text-leaf/40 transition-colors">
                  {s.n}
                </p>
                <h3 className="font-display text-xl text-forest mt-2">{s.title}</h3>
                <p className="text-sm text-ink/60 mt-2 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl rounded-3xl bg-forest px-6 py-12 sm:px-12 text-center text-cream shadow-xl">
          <h2 className="font-display text-3xl sm:text-4xl">Simula tu finca hoy</h2>
          <p className="mt-3 text-cream/75 max-w-xl mx-auto">
            Regístrate gratis, configura tus cultivos y prueba el escaneo con IA. Sin tarjeta de
            crédito.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isLoaded && !isSignedIn && (
              <>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-xl bg-cream px-6 py-3.5 text-sm font-semibold text-forest hover:bg-white transition-colors"
                >
                  Crear cuenta gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center rounded-xl border border-cream/25 px-6 py-3.5 text-sm font-semibold text-cream hover:bg-white/10 transition-colors"
                >
                  Ya tengo cuenta
                </Link>
              </>
            )}
            {isLoaded && isSignedIn && (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-cream px-6 py-3.5 text-sm font-semibold text-forest"
              >
                Ir al panel
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-forest/8 px-4 py-8 sm:px-6 text-center text-xs text-ink/45">
        <p>AgroGuardian AI · Sanidad vegetal para Manabí · ODS 2 · 12 · 15</p>
        <p className="mt-1">Clerk · Supabase · OpenRouter · Open-Meteo</p>
      </footer>
    </div>
  );
}
