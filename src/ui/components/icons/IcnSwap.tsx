export const IcnSwap = ({ className, onClick }: { className?: string, onClick?: () => void }) => {
    return <svg
        xmlns="http://www.w3.org/2000/svg"
        width="25" height="24" viewBox="0 0 25 24" fill="none" stroke="#0D0D0D"
        className={className}
        onClick={typeof onClick === "function" ? () => onClick() : () => { }}
    >
        <path d="M4.33008 5.15991H18.1701C19.8301 5.15991 21.1701 6.49991 21.1701 8.15991V11.4799" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.49008 2L4.33008 5.15997L7.49008 8.32001" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21.1701 18.84H7.33008C5.67008 18.84 4.33008 17.5 4.33008 15.84V12.52" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.0098 21.9999L21.1698 18.84L18.0098 15.6799" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
}