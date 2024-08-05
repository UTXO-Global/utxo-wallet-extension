export const IcnArrowLeftOnRectangle = ({
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
    >
      <path
        d="M12.3662 10.0801C12.7795 5.28007 15.2462 3.32007 20.6462 3.32007H20.8195C26.7795 3.32007 29.1662 5.70674 29.1662 11.6667V20.3601C29.1662 26.3201 26.7795 28.7067 20.8195 28.7067H20.6462C15.2862 28.7067 12.8195 26.7734 12.3795 22.0534"
        stroke="#0D0D0D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5005 16H5.32715"
        stroke="#0D0D0D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.29967 11.5334L3.83301 16.0001L8.29967 20.4668"
        stroke="#0D0D0D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
