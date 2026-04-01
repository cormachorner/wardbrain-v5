import type { ReactNode } from "react";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function SecondaryCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

export function SimpleList({
  title,
  items,
  ordered = false,
}: {
  title: string;
  items: string[];
  ordered?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  const ListTag = ordered ? "ol" : "ul";

  return (
    <div>
      <div className="mb-1 text-sm font-medium text-slate-500">{title}</div>
      <ListTag className="space-y-1 text-sm text-slate-700">
        {items.map((item, index) => (
          <li key={item}>{ordered ? `${index + 1}. ${item}` : `• ${item}`}</li>
        ))}
      </ListTag>
    </div>
  );
}

export function Field({
  label,
  helper,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {helper && <span className="mb-2 block text-xs text-slate-500">{helper}</span>}
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function TextArea({
  label,
  helper,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-4 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {helper && <span className="mb-2 block text-xs text-slate-500">{helper}</span>}
      <textarea
        className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
