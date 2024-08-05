export const IcnChevronDown = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#787575"
      className={className}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <path
        d="M9.96102 4.4751L6.70102 7.7351C6.31602 8.1201 5.68602 8.1201 5.30102 7.7351L2.04102 4.4751"
        strokeWidth="1.125"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
