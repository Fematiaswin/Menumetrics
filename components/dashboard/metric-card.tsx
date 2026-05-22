import { Icon } from "@/components/ui/icon";

type Tone = "green" | "amber" | "red" | "neutral";

const toneStyles: Record<Tone, string> = {
  green: "border-basil/20 bg-[#eef7f1] text-basil",
  amber: "border-saffron/25 bg-[#fff6e4] text-[#8a5b08]",
  red: "border-tomato/20 bg-[#fff0ec] text-tomato",
  neutral: "border-line bg-white text-ink"
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon
}: {
  label: string;
  value: string;
  detail: string;
  tone?: Tone;
  icon: Parameters<typeof Icon>[0]["name"];
}) {
  return (
    <section className={`rounded-lg border p-4 shadow-soft ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] opacity-75">{label}</p>
          <strong className="mt-2 block text-2xl font-semibold leading-tight">{value}</strong>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/70">
          <Icon className="h-5 w-5" name={icon} />
        </span>
      </div>
      <p className="mt-3 text-sm leading-5 opacity-80">{detail}</p>
    </section>
  );
}
