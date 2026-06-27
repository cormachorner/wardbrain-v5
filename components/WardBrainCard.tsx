import type { ReactNode } from "react";

export function Card({
  title,
  children,
  className = "",
  titleClassName = "",
  icon,
  actions,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className={`flex items-center gap-2 text-xl font-semibold ${titleClassName}`}>
          {icon && <span className="text-slate-500" aria-hidden="true">{icon}</span>}
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function SecondaryCard({
  title,
  children,
  className = "",
  icon,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-colors hover:border-slate-300 ${className}`}>
      <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-800">
        {icon && <span className="text-slate-500" aria-hidden="true">{icon}</span>}
        {title}
      </h3>
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
    <label className="mt-3 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {helper && <span className="mb-2 block text-xs text-slate-500">{helper}</span>}
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-[var(--brand-navy)] focus:ring-2 focus:ring-[var(--brand-navy)]/10"
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
    <label className="mt-3 block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {helper && <span className="mb-2 block text-xs text-slate-500">{helper}</span>}
      <textarea
        className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-[var(--brand-navy)] focus:ring-2 focus:ring-[var(--brand-navy)]/10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
