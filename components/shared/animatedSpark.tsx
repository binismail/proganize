export default function AnimatedSparklesComponent() {
  return <AnimatedSparkles />;
}

function AnimatedSparkles() {
  return (
    <div className='flex items-center justify-center'>
      <svg
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='animate-sparkle'
      >
        <style>
          {`
              @keyframes sparkleRotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              
              @keyframes sparkleRotateReverse {
                0% { transform: rotate(360deg); }
                100% { transform: rotate(0deg); }
              }
              
              .animate-sparkle .star-1 {
                transform-origin: 15px 9px;
                animation: sparkleRotate 3s linear infinite;
              }
              
              .animate-sparkle .star-2 {
                transform-origin: 7px 17px;
                animation: sparkleRotateReverse 2s linear infinite;
              }
            `}
        </style>
        <path
          className='star-1 stroke-gray-800 dark:stroke-gray-200'
          d='M15 2L15.5387 4.39157C15.9957 6.42015 17.5798 8.00431 19.6084 8.46127L22 9L19.6084 9.53873C17.5798 9.99569 15.9957 11.5798 15.5387 13.6084L15 16L14.4613 13.6084C14.0043 11.5798 12.4202 9.99569 10.3916 9.53873L8 9L10.3916 8.46127C12.4201 8.00431 14.0043 6.42015 14.4613 4.39158L15 2Z'
          strokeWidth='1.5'
          strokeLinejoin='round'
        />
        <path
          className='star-2 stroke-gray-800 dark:stroke-gray-200'
          d='M7 12L7.38481 13.7083C7.71121 15.1572 8.84275 16.2888 10.2917 16.6152L12 17L10.2917 17.3848C8.84275 17.7112 7.71121 18.8427 7.38481 20.2917L7 22L6.61519 20.2917C6.28879 18.8427 5.15725 17.7112 3.70827 17.3848L2 17L3.70827 16.6152C5.15725 16.2888 6.28879 15.1573 6.61519 13.7083L7 12Z'
          strokeWidth='1.5'
          strokeLinejoin='round'
        />
      </svg>
    </div>
  );
}