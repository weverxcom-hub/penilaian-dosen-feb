interface ScoreInputProps {
  value: number;
  onChange: (value: number) => void;
  name: string;
}

const LABELS: Record<number, { label: string; tone: string }> = {
  1: { label: "Sangat Kurang", tone: "bg-rose-100 text-rose-700 border-rose-300" },
  2: { label: "Cukup", tone: "bg-amber-100 text-amber-700 border-amber-300" },
  3: { label: "Baik", tone: "bg-sky-100 text-sky-700 border-sky-300" },
  4: { label: "Sangat Baik", tone: "bg-emerald-100 text-emerald-700 border-emerald-300" },
};

export function ScoreInput({ value, onChange, name }: ScoreInputProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {[1, 2, 3, 4].map((n) => {
        const active = value === n;
        const config = LABELS[n];
        return (
          <button
            key={n}
            type="button"
            aria-label={`${name} - ${config.label}`}
            onClick={() => onChange(n)}
            className={
              "rounded-md border px-2 py-2 text-xs sm:text-sm font-medium transition-colors text-center " +
              (active
                ? config.tone + " ring-2 ring-offset-1 ring-indigo-400"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")
            }
          >
            <div className="text-base font-bold">{n}</div>
            <div className="text-[10px] sm:text-xs leading-tight">{config.label}</div>
          </button>
        );
      })}
    </div>
  );
}
