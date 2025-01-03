import cn from "classnames";
export const IcnRightPanel = ({
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
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className ? className : "")}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <path d="M21.3281 3.54102V27.916" stroke="black" strokeWidth="2" />
      <rect
        x="5"
        y="4"
        width="24"
        height="24"
        rx="3"
        stroke="black"
        strokeWidth="2"
      />
    </svg>
  );
};
