export const IcnSend = ({ className, onClick }: { className?: string, onClick?: () => void }) => {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25"
        height="24"
        viewBox="0 0 25 24"
        fill="none"
        className={className}
        onClick={typeof onClick === "function" ? () => onClick() : () => { }}
    >
        <path
            d="M21.125 22H4.125"
            stroke="#0D0D0D"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M19.625 3.5L5.625 17.5"
            stroke="#0D0D0D"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M19.625 13.77V3.5H9.355"
            stroke="#0D0D0D"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
}