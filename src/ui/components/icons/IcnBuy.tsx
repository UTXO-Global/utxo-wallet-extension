export const IcnBuy = ({ className, onClick }: { className?: string, onClick?: () => void }) => {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25" height="24" viewBox="0 0 25 24" fill="none"
        className={className}
        onClick={typeof onClick === "function" ? () => onClick() : () => { }}
    >
        <path d="M18.667 8.148C18.667 5.858 15.794 4 12.25 4C8.706 4 5.833 5.857 5.833 8.148C5.833 10.439 7.583 11.704 12.25 11.704C16.917 11.704 19.25 12.889 19.25 15.852C19.25 18.815 16.116 20 12.25 20C8.384 20 5.25 18.143 5.25 15.852M12.25 2V22" stroke="#0D0D0D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
}