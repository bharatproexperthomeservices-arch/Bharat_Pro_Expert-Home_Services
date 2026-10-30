import React from 'react';

/**
 * Reusable Skeleton Component for Tailwind CSS & React
 *
 * @param {Object} props
 * @param {'rectangle' | 'circle' | 'line'} [props.variant='rectangle'] - Shape of the skeleton
 * @param {string|number} [props.width] - Custom width (e.g., '100%', '80px', 40)
 * @param {string|number} [props.height] - Custom height (e.g., '1rem', '200px', 40)
 * @param {number} [props.count=1] - Number of skeleton items to render
 * @param {string} [props.className=''] - Additional Tailwind CSS classes
 * @param {Object} [props.style={}] - Additional inline styles
 * @param {boolean} [props.isLoading=true] - Controls loading state when used as wrapper
 * @param {React.ReactNode} [props.children] - Real content to show when isLoading is false
 */
export default function Skeleton({
  variant = 'rectangle',
  width,
  height,
  count = 1,
  className = '',
  style = {},
  isLoading,
  children
}) {
  // If used as a wrapper component and loading is complete, smoothly transition in real children
  if (typeof isLoading === 'boolean' && !isLoading) {
    return (
      <div className="transition-opacity duration-300 ease-in-out opacity-100">
        {children}
      </div>
    );
  }

  // Define base variant styles with Tailwind CSS
  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full aspect-square';
      case 'line':
        return 'rounded-md h-4 w-full';
      case 'rectangle':
      default:
        return 'rounded-xl w-full';
    }
  };

  const inlineStyles = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style
  };

  const skeletonItems = Array.from({ length: count });

  return (
    <>
      {skeletonItems.map((_, index) => (
        <div
          key={index}
          className={`
            relative overflow-hidden
            animate-pulse bg-slate-200 dark:bg-slate-700
            before:absolute before:inset-0 before:-translate-x-full
            before:animate-[shimmer_1.8s_infinite]
            before:bg-gradient-to-r before:from-transparent before:via-white/30 dark:before:via-white/10 before:to-transparent
            ${getVariantClasses()}
            ${className}
          `.trim()}
          style={inlineStyles}
          aria-hidden="true"
          data-testid="skeleton-placeholder"
        />
      ))}
    </>
  );
}

/**
 * SkeletonWrapper - Smoothly toggles between Skeleton loader and children with fade animation
 */
export function SkeletonWrapper({ isLoading, skeleton, children, className = '' }) {
  return (
    <div className={`relative transition-all duration-300 ${className}`}>
      {isLoading ? (
        <div className="transition-opacity duration-300 opacity-100">
          {skeleton}
        </div>
      ) : (
        <div className="transition-opacity duration-300 opacity-100">
          {children}
        </div>
      )}
    </div>
  );
}
