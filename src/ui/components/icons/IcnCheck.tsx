export const IcnCheck = ({ className, onClick }: { className?: string, onClick?: () => void }) => {
    return <svg
        className={className}
        onClick={typeof onClick === "function" ? () => onClick() : () => { }}
        width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.00015 16.1701L5.53015 12.7001C5.34317 12.5131 5.08957 12.4081 4.82515 12.4081C4.56072 12.4081 4.30712 12.5131 4.12015 12.7001C3.93317 12.8871 3.82813 13.1407 3.82812 13.4051C3.82813 13.536 3.85391 13.6657 3.90402 13.7866C3.95412 13.9076 4.02756 14.0175 4.12015 14.1101L8.30015 18.2901C8.69015 18.6801 9.32015 18.6801 9.71015 18.2901L20.2901 7.71008C20.4771 7.5231 20.5822 7.2695 20.5822 7.00508C20.5822 6.74065 20.4771 6.48706 20.2901 6.30008C20.1032 6.1131 19.8496 6.00806 19.5851 6.00806C19.3207 6.00806 19.0671 6.1131 18.8801 6.30008L9.00015 16.1701Z" fill="black" />
    </svg>
}