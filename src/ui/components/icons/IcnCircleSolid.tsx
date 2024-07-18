export const IcnCircleSolid = ({ className, onClick }: { className?: string, onClick?: () => void }) => {
    return <svg
        viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"
        className={className}
        onClick={typeof onClick === "function" ? () => onClick() : () => { }}
    >
        <mask id="mask0_3228_4038" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="0" y="0" width="18" height="18">
            <path d="M9.00033 17.3334C10.0949 17.3348 11.1789 17.1199 12.1902 16.7011C13.2014 16.2822 14.1199 15.6676 14.8928 14.8926C15.6678 14.1196 16.2824 13.2012 16.7013 12.1899C17.1202 11.1787 17.3351 10.0946 17.3337 9.00009C17.3351 7.90554 17.1201 6.8215 16.7013 5.81027C16.2824 4.79904 15.6678 3.88055 14.8928 3.10759C14.1199 2.3326 13.2014 1.718 12.1902 1.29912C11.1789 0.880243 10.0949 0.665337 9.00033 0.666755C7.90578 0.66536 6.82174 0.880277 5.81051 1.29916C4.79928 1.71804 3.88079 2.33262 3.10783 3.10759C2.33286 3.88055 1.71828 4.79904 1.2994 5.81027C0.880521 6.8215 0.665604 7.90554 0.666999 9.00009C0.665581 10.0946 0.880488 11.1787 1.29937 12.1899C1.71825 13.2012 2.33284 14.1196 3.10783 14.8926C3.88079 15.6676 4.79928 16.2821 5.81051 16.701C6.82174 17.1199 7.90578 17.3348 9.00033 17.3334Z" fill="white" stroke="white" strokeWidth="1.33333" strokeLinejoin="round" />
            <path d="M5.66699 9L8.16699 11.5L13.167 6.5" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
        <g mask="url(#mask0_3228_4038)">
            <path d="M-1 -1H19V19H-1V-1Z" fill="black" />
        </g>
    </svg>
}