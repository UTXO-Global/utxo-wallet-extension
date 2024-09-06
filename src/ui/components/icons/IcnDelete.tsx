export const IcnDelete = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <path
        d="M14 3.98665C11.78 3.76665 9.54667 3.65332 7.32 3.65332C6 3.65332 4.68 3.71999 3.36 3.85332L2 3.98665"
        stroke="#FF3333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.66699 3.31325L5.81366 2.43992C5.92033 1.80659 6.00033 1.33325 7.12699 1.33325H8.87366C10.0003 1.33325 10.087 1.83325 10.187 2.44659L10.3337 3.31325"
        stroke="#FF3333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5669 6.09326L12.1336 12.8066C12.0603 13.8533 12.0003 14.6666 10.1403 14.6666H5.86026C4.00026 14.6666 3.94026 13.8533 3.86693 12.8066L3.43359 6.09326"
        stroke="#FF3333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.88672 11H9.10672"
        stroke="#FF3333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.33301 8.33325H9.66634"
        stroke="#FF3333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
