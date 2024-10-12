import React from "react";

const SkeletonLoader: React.FC = () => {
  return (
    <div className='space-y-2'>
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className='animate-pulse flex items-center space-x-2 p-2 rounded-md bg-gray-100'
        >
          <div className='w-8 h-8 bg-gray-300 rounded-full'></div>
          <div className='flex-1 space-y-2'>
            <div className='h-4 bg-gray-300 rounded w-3/4'></div>
            <div className='h-3 bg-gray-300 rounded w-1/2'></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
