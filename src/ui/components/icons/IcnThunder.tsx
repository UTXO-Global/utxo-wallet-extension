export const IcnThunder = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <svg
      width="16"
      height="24"
      viewBox="0 0 16 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <path d="M11.6674 0L0.128906 13.3846H6.12891L4.28275 24L15.8212 10.6154H9.35968L11.6674 0Z" />
    </svg>
  );
};
