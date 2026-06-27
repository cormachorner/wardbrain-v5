type WardBrainLogoProps = {
  variant?: "horizontal" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const iconSizes = {
  sm: "h-9 w-9",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

const wordmarkSizes = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-5xl",
};

function WardBrainMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 112"
      fill="none"
      className={className}
    >
      <path
        d="M48 6C36.5 13.2 23.2 18.4 10 21.5V49.6C10 72.4 24.4 92.6 48 105C71.6 92.6 86 72.4 86 49.6V21.5C72.8 18.4 59.5 13.2 48 6Z"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M47.9 31.2C45.1 23.8 34.9 22.5 30.4 29C21.3 29.4 16.8 38.2 20.8 45.2C14.2 50.4 14.4 61.2 21.2 66C17.8 74.6 25.5 83.4 34.4 80.7C37.9 88.4 47.9 86 47.9 76.9V31.2Z"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48.1 31.2C50.9 23.8 61.1 22.5 65.6 29C74.7 29.4 79.2 38.2 75.2 45.2C81.8 50.4 81.6 61.2 74.8 66C78.2 74.6 70.5 83.4 61.6 80.7C58.1 88.4 48.1 86 48.1 76.9V31.2Z"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M30.5 43.4C34.1 45.2 36.2 47.8 36.6 51.3M28.8 61.5C33.1 62 36.1 64.2 37.8 68.2M65.5 43.4C61.9 45.2 59.8 47.8 59.4 51.3M67.2 61.5C62.9 62 59.9 64.2 58.2 68.2"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WardBrainLogo({
  variant = "horizontal",
  size = "md",
  className = "",
}: WardBrainLogoProps) {
  if (variant === "icon") {
    return (
      <span
        aria-label="WardBrain"
        className={`inline-flex text-[var(--brand-navy)] ${className}`}
      >
        <WardBrainMark className={iconSizes[size]} />
      </span>
    );
  }

  return (
    <span
      aria-label="WardBrain"
      className={`inline-flex items-center gap-3 text-[var(--brand-navy)] ${className}`}
    >
      <WardBrainMark className={iconSizes[size]} />
      <span className={`${wordmarkSizes[size]} font-bold tracking-tight`}>
        WardBrain
      </span>
    </span>
  );
}
