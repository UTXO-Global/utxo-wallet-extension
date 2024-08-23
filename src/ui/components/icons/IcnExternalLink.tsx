export const IcnExternalLink = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="#ABA8A1"
      className={className}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <path
        d="M13.75 1H19V6.25M17.875 2.125L12.25 7.75M10 2.5H3.25C2.65326 2.5 2.08097 2.73705 1.65901 3.15901C1.23705 3.58097 1 4.15326 1 4.75V16.75C1 17.3467 1.23705 17.919 1.65901 18.341C2.08097 18.7629 2.65326 19 3.25 19H15.25C15.8467 19 16.419 18.7629 16.841 18.341C17.2629 17.919 17.5 17.3467 17.5 16.75V10"
        stroke="inherit"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
