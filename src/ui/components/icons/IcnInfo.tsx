import cn from "classnames";
export default function IcnInfo({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn(className ? className : "")}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <path
        d="M7.99967 14.6673C11.6663 14.6673 14.6663 11.6673 14.6663 8.00065C14.6663 4.33398 11.6663 1.33398 7.99967 1.33398C4.33301 1.33398 1.33301 4.33398 1.33301 8.00065C1.33301 11.6673 4.33301 14.6673 7.99967 14.6673Z"
        stroke="#787575"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 5.33398V8.66732"
        stroke="#787575"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.99609 10.666H8.00208"
        stroke="#787575"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
