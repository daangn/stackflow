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
      d="M16.66 3.23C16.96 3.53 16.96 4.02 16.66 4.32L8.97999 12L16.66 19.68C16.96 19.98 16.96 20.47 16.66 20.77C16.36 21.07 15.87 21.07 15.57 20.77L7.33999 12.55C7.03999 12.25 7.03999 11.76 7.33999 11.46L15.56 3.23C15.86 2.93 16.35 2.93 16.65 3.23H16.66Z"
      fill="currentColor"
    />
  </svg>
);

export default IconBack;
