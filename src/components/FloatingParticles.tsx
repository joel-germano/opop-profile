type Particle = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
};

// Posições/tempos fixos (não Math.random()) — gerado uma vez, evita qualquer
// divergência entre o HTML do servidor e a primeira renderização no cliente.
// Espalhadas nas bordas da caixa (não no centro) pra não brigar com a foto.
const PARTICLES: Particle[] = [
  { left: 4, top: 78, size: 5, duration: 9, delay: -1.5, drift: 10 },
  { left: 92, top: 70, size: 4, duration: 11, delay: -4, drift: -12 },
  { left: 12, top: 20, size: 3, duration: 8, delay: -6, drift: 8 },
  { left: 86, top: 14, size: 6, duration: 12, delay: -2, drift: -8 },
  { left: -2, top: 48, size: 4, duration: 10, delay: -7, drift: 12 },
  { left: 100, top: 42, size: 3, duration: 9, delay: -3, drift: -10 },
  { left: 22, top: 92, size: 4, duration: 13, delay: -5, drift: 6 },
  { left: 76, top: 96, size: 5, duration: 10, delay: -8, drift: -6 },
  { left: 50, top: 6, size: 3, duration: 8.5, delay: -1, drift: 4 },
  { left: 6, top: 4, size: 4, duration: 11.5, delay: -9, drift: 6 },
  { left: 38, top: 88, size: 3, duration: 10.5, delay: -2.5, drift: -7 },
  { left: 64, top: 4, size: 5, duration: 9.5, delay: -6.5, drift: 9 },
  { left: 98, top: 12, size: 4, duration: 12.5, delay: -3.5, drift: -6 },
  { left: 0, top: 22, size: 3, duration: 8.2, delay: -5.5, drift: 8 },
  { left: 34, top: 2, size: 4, duration: 11, delay: -1, drift: -5 },
  { left: 60, top: 98, size: 5, duration: 9.8, delay: -7.5, drift: 7 },
  { left: 8, top: 60, size: 3, duration: 13.5, delay: -4.5, drift: -9 },
  { left: 90, top: 88, size: 4, duration: 10.2, delay: -8.5, drift: 6 },
  { left: 18, top: 52, size: 4, duration: 12.2, delay: -0.5, drift: 9 },
  { left: 82, top: 56, size: 3, duration: 8.8, delay: -5, drift: -7 },
  { left: 46, top: 96, size: 4, duration: 11.2, delay: -2, drift: 5 },
  { left: 54, top: 30, size: 3, duration: 9.2, delay: -7, drift: -6 },
  { left: 28, top: 10, size: 5, duration: 10.8, delay: -3, drift: 8 },
  { left: 72, top: 34, size: 4, duration: 13.2, delay: -6, drift: -8 },
  { left: -4, top: 34, size: 3, duration: 9.6, delay: -1.2, drift: 7 },
  { left: 100, top: 60, size: 4, duration: 11.6, delay: -8, drift: -6 },
  { left: 42, top: 46, size: 3, duration: 8.6, delay: -4, drift: 6 },
  { left: 16, top: 8, size: 4, duration: 12.8, delay: -9.5, drift: -5 },
];

// Efeito de brilho ao redor de um destaque (o 1º lugar do ranking) — pontos
// pequenos subindo devagar e sumindo nas pontas, puro CSS (ver keyframe
// `particle-float` em globals.css), sem custo de JS/canvas. `color` tinge as
// partículas e o glow com a cor do próprio candidato.
export function FloatingParticles({
  color = "#FFFFFF",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute overflow-visible ${className}`}
      aria-hidden
    >
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="absolute animate-particle-float rounded-full"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              backgroundColor: color,
              boxShadow: `0 0 ${p.size * 2.5}px ${color}`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--particle-drift": `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
