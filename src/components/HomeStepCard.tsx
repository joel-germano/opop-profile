import type { LucideIcon } from "lucide-react";

type StepColor = "primary" | "secondary" | "success" | "danger";

type Props = {
  icon: LucideIcon;
  color: StepColor;
  label: string;
  title: string;
  description: string;
};

const COLOR_CLASSES: Record<StepColor, string> = {
  primary: "bg-primary/15 text-primary-light",
  secondary: "bg-secondary/15 text-secondary-light",
  success: "bg-success/15 text-success-light",
  danger: "bg-danger/15 text-danger-light",
};

export function HomeStepCard({ icon: Icon, color, label, title, description }: Props) {
  return (
    <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full ${COLOR_CLASSES[color]}`}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
      <span className="mt-4 block text-xs font-bold uppercase tracking-widest text-white/40">
        {label}
      </span>
      <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm leading-snug text-white/60">{description}</p>
    </div>
  );
}
