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
        d="M16.7732 3.22676C17.0756 3.5291 17.0756 4.01929 16.7732 4.32163L9.09487 12L16.7732 19.6784C17.0756 19.9807 17.0756 20.4709 16.7732 20.7732C16.4709 21.0756 15.9807 21.0756 15.6784 20.7732L7.45256 12.5474C7.15022 12.2451 7.15022 11.7549 7.45256 11.4526L15.6784 3.22676C15.9807 2.92441 16.4709 2.92441 16.7732 3.22676Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default IconBack
