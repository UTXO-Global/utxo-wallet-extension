export const IcnGlobal = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      stroke="#ABA8A1"
      className={className}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <path
        d="M12.8252 22C18.348 22 22.8252 17.5228 22.8252 12C22.8252 6.47715 18.348 2 12.8252 2C7.30235 2 2.8252 6.47715 2.8252 12C2.8252 17.5228 7.30235 22 12.8252 22Z"
        stroke="inherit"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.8252 22C15.0343 22 16.8252 17.5228 16.8252 12C16.8252 6.47715 15.0343 2 12.8252 2C10.6161 2 8.8252 6.47715 8.8252 12C8.8252 17.5228 10.6161 22 12.8252 22Z"
        stroke="inherit"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.8252 12H22.8252"
        stroke="inherit"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
