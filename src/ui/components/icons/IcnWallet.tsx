export const IcnWallet = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <svg
      className={className}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
      viewBox="0 0 33 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#0D0D0D"
    >
      <path
        d="M29.8337 15.9999V22.6666C29.8337 26.6666 27.167 29.3333 23.167 29.3333H9.83366C5.83366 29.3333 3.16699 26.6666 3.16699 22.6666V15.9999C3.16699 12.3733 5.35366 9.83992 8.75366 9.41325C9.10033 9.35992 9.46033 9.33325 9.83366 9.33325H23.167C23.5137 9.33325 23.847 9.34657 24.167 9.3999C27.607 9.7999 29.8337 12.3466 29.8337 15.9999Z"
        stroke="inherit"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.1682 9.40008C23.8482 9.34675 23.5149 9.33343 23.1682 9.33343H9.83488C9.46155 9.33343 9.10155 9.36009 8.75488 9.41343C8.94155 9.04009 9.20822 8.69343 9.52822 8.37343L13.8616 4.02675C15.6882 2.21341 18.6482 2.21341 20.4749 4.02675L22.8082 6.38677C23.6615 7.22677 24.1149 8.29341 24.1682 9.40008Z"
        stroke="inherit"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M29.8337 16.6667H25.8337C24.367 16.6667 23.167 17.8667 23.167 19.3334C23.167 20.8001 24.367 22.0001 25.8337 22.0001H29.8337"
        stroke="inherit"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
