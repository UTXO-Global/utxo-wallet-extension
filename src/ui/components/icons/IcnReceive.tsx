export const IcnReceive = ({ className, onClick }: { className?: string, onClick?: () => void }) => {
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
            d="M5.875 17.5L19.875 3.5"
            stroke="#0D0D0D"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M5.875 7.22998V17.5H16.145"
            stroke="#0D0D0D"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4.375 22H21.375"
            stroke="#0D0D0D"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
}