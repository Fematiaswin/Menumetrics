import type { DishStatus } from "@/lib/menu-metrics/demo-dashboard";

const styles: Record<DishStatus, string> = {
  healthy: "bg-[#e6f4eb] text-basil",
  attention: "bg-[#fff3d6] text-[#8a5b08]",
  loss: "bg-[#ffe9e2] text-tomato"
};

const labels: Record<DishStatus, string> = {
  healthy: "Lucro bom",
  attention: "Ajustar",
  loss: "Prejuizo"
};

export function StatusPill({ status }: { status: DishStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>;
}
