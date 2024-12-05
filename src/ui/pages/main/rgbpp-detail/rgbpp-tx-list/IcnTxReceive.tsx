export default function IcnTxReceive({ className }: { className?: string }) {
  return (
    <svg
      className={`${className}`}
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="29.5"
        y="29.5"
        width="29"
        height="29"
        rx="14.5"
        transform="rotate(180 29.5 29.5)"
        fill="#0D0D0D"
      />
      <rect
        x="29.5"
        y="29.5"
        width="29"
        height="29"
        rx="14.5"
        transform="rotate(180 29.5 29.5)"
        stroke="white"
      />
      <path
        d="M15 20L15 10M15 20L10 15M15 20L20 15"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
