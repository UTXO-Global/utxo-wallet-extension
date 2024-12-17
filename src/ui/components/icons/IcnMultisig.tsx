import cn from "classnames";
export const IcnMultisig = ({
  className,
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <svg
      width="49"
      height="22"
      viewBox="0 0 49 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className ? className : "")}
      onClick={typeof onClick === "function" ? () => onClick() : () => {}}
    >
      <g clip-path="url(#clip0_7659_72256)">
        <path
          d="M32.7533 5.73405C32.7526 5.06377 32.7885 4.88163 32.4888 4.26923C32.1891 3.65682 31.7515 3.10831 31.2043 2.65905C30.6571 2.20978 30.0125 1.86974 29.3118 1.66083C28.6112 1.45193 27.8703 1.3788 27.1367 1.44616C26.4031 1.51353 25.6931 1.71988 25.0526 2.05194C24.4121 2.38399 23.8553 2.83436 23.418 3.37402C22.9807 3.91369 22.6726 4.53067 22.5137 5.18519"
          stroke="black"
          stroke-width="1.43929"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M20.2769 5.84986H29.7764C32.7613 5.84986 34.2548 5.84986 35.1815 6.69423C36.1093 7.53668 36.1093 10.2118 36.1093 12.9272V14.8472C36.1093 17.5626 36.1093 18.9203 35.1815 19.7637C34.2548 20.6071 32.7613 20.6071 29.7764 20.6071H23.4434C19.4631 20.6071 17.2363 20.6245 16.0004 19.5C14.7644 18.3755 15.0098 17.5 15.0101 17M23.4434 3.33594H21.3324C18.7148 3.37048 17.2318 3.54703 16.2365 4.45185C15.253 5.34665 15.0514 5.67386 15.0101 8"
          stroke="black"
          stroke-width="1.43929"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M31.8422 12.0502C31.7017 12.0502 31.567 11.9933 31.4677 11.8921C31.3683 11.7909 31.3125 11.6536 31.3125 11.5104C31.3125 11.3673 31.3683 11.23 31.4677 11.1288C31.567 11.0276 31.7017 10.9707 31.8422 10.9707C31.9827 10.9707 32.1175 11.0276 32.2168 11.1288C32.3162 11.23 32.372 11.3673 32.372 11.5104C32.372 11.6536 32.3162 11.7909 32.2168 11.8921C32.1175 11.9933 31.9827 12.0502 31.8422 12.0502Z"
          fill="black"
          stroke="black"
          stroke-width="1.58921"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M14.0834 16.5762C14.3828 16.5762 14.6372 16.4716 14.8464 16.2624C15.0556 16.0532 15.1602 15.7988 15.1602 15.4994C15.1602 15.2 15.0556 14.9456 14.8464 14.7364C14.6372 14.5272 14.3828 14.4226 14.0834 14.4226C13.7839 14.4226 13.5296 14.5272 13.3204 14.7364C13.1112 14.9456 13.0066 15.2 13.0066 15.4994C13.0066 15.7988 13.1112 16.0532 13.3204 16.2624C13.5296 16.4716 13.7839 16.5762 14.0834 16.5762ZM14.0834 18.2592C13.3056 18.2592 12.6511 17.9935 12.1199 17.4623C11.5894 16.9315 11.3242 16.2772 11.3242 15.4994C11.3242 14.7216 11.5898 14.0671 12.1211 13.5359C12.6523 13.0047 13.3064 12.7395 14.0834 12.7402C14.7437 12.7402 15.3156 12.9265 15.799 13.2991C16.2824 13.6716 16.5921 14.1136 16.7282 14.625H22.0068L22.8783 15.4965L21.4316 17.0336L20.3653 16.2292L19.2996 17.0703L18.3913 16.375H16.7288C16.5904 16.8957 16.2777 17.34 15.7908 17.7079C15.3039 18.0758 14.7348 18.2593 14.0834 18.2586"
          fill="black"
        />
        <path
          d="M14.0834 10.5762C14.3828 10.5762 14.6372 10.4716 14.8464 10.2624C15.0556 10.0532 15.1602 9.79885 15.1602 9.4994C15.1602 9.19996 15.0556 8.94563 14.8464 8.7364C14.6372 8.52718 14.3828 8.42257 14.0834 8.42257C13.7839 8.42257 13.5296 8.52718 13.3204 8.7364C13.1112 8.94563 13.0066 9.19996 13.0066 9.4994C13.0066 9.79885 13.1112 10.0532 13.3204 10.2624C13.5296 10.4716 13.7839 10.5762 14.0834 10.5762ZM14.0834 12.2592C13.3056 12.2592 12.6511 11.9935 12.1199 11.4623C11.5894 10.9315 11.3242 10.2772 11.3242 9.4994C11.3242 8.72162 11.5898 8.06712 12.1211 7.5359C12.6523 7.00468 13.3064 6.73946 14.0834 6.74024C14.7437 6.74024 15.3156 6.92651 15.799 7.29907C16.2824 7.67162 16.5921 8.1136 16.7282 8.62499H22.0068L22.8783 9.49649L21.4316 11.0336L20.3653 10.2292L19.2996 11.0703L18.3913 10.375H16.7288C16.5904 10.8957 16.2777 11.34 15.7908 11.7079C15.3039 12.0758 14.7348 12.2593 14.0834 12.2586"
          fill="black"
        />
      </g>
      <defs>
        <clipPath id="clip0_7659_72256">
          <rect
            width="48"
            height="22"
            fill="white"
            transform="translate(0.75)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};