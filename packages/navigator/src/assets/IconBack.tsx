import React from 'react'

const IconBack: React.FC<{
  className?: string
}> = (props) => {
  return (
    <svg
      className={props.className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.8157 3.18436C17.1282 3.49678 17.1282 4.00331 16.8157 4.31573L8.88142 12.25L16.8157 20.1844C17.1282 20.4968 17.1282 21.0033 16.8157 21.3157C16.5033 21.6281 15.9968 21.6281 15.6844 21.3157L7.18436 12.8157C6.87194 12.5033 6.87194 11.9968 7.18436 11.6844L15.6844 3.18436C15.9968 2.87194 16.5033 2.87194 16.8157 3.18436Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default IconBack
