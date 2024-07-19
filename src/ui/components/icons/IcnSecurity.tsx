export const IcnSecurity = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <svg
      width="33"
      height="32"
      viewBox="0 0 33 32"
      fill="none"
      stroke="#0D0D0D"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <path
        d="M14.4869 2.97333L7.83354 5.48C6.30021 6.05333 5.04688 7.86666 5.04688 9.49333V19.4C5.04688 20.9733 6.08687 23.04 7.35354 23.9867L13.0869 28.2667C14.9669 29.68 18.0602 29.68 19.9402 28.2667L25.6735 23.9867C26.9402 23.04 27.9802 20.9733 27.9802 19.4V9.49333C27.9802 7.85333 26.7269 6.04 25.1935 5.46666L18.5402 2.97333C17.4069 2.56 15.5935 2.56 14.4869 2.97333Z"
        stroke="inherit"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5664 15.8267L14.7131 17.9733L20.4464 12.24"
        stroke="inherit"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
