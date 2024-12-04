const IconBack: React.FC<{
  className?: string;
}> = (props) => (
  <svg
    className={props.className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.7241 2.76052C17.105 3.16043 17.0896 3.79341 16.6897 4.17431L8.45 12.0222L16.6896 19.8689C17.0896 20.2498 17.105 20.8827 16.7242 21.2827C16.3433 21.6826 15.7103 21.6981 15.3104 21.3172L6.31037 12.7464C6.11218 12.5576 6.00001 12.2959 6 12.0222C5.99999 11.7486 6.11215 11.4868 6.31032 11.2981L15.3103 2.72608C15.7102 2.34518 16.3432 2.3606 16.7241 2.76052Z"
      fill="currentColor"
    />
  </svg>
);

export default IconBack;
