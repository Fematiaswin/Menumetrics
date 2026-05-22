type IconName =
  | "gauge"
  | "plate"
  | "coin"
  | "box"
  | "alert"
  | "chart"
  | "calculator"
  | "settings"
  | "arrow-up"
  | "arrow-down";

const paths: Record<IconName, string> = {
  gauge: "M4 14a8 8 0 1 1 16 0M12 14l4-5M7 17h10",
  plate: "M6 3v18M4 3v6a2 2 0 0 0 4 0V3M14 3v18M18 3v18M14 8h4",
  coin: "M12 4c4.4 0 8 1.8 8 4s-3.6 4-8 4-8-1.8-8-4 3.6-4 8-4ZM4 8v8c0 2.2 3.6 4 8 4s8-1.8 8-4V8M4 12c0 2.2 3.6 4 8 4s8-1.8 8-4",
  box: "M3 7l9-4 9 4-9 4-9-4ZM3 7v10l9 4 9-4V7M12 11v10",
  alert: "M12 3l10 18H2L12 3ZM12 9v5M12 17h.01",
  chart: "M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8",
  calculator: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 7h8M8 11h2M12 11h2M16 11h.01M8 15h2M12 15h2M16 15h.01",
  settings: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4",
  "arrow-up": "M12 19V5M5 12l7-7 7 7",
  "arrow-down": "M12 5v14M5 12l7 7 7-7"
};

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={paths[name]} />
    </svg>
  );
}
