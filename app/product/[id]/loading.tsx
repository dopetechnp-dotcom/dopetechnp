export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header Skeleton */}
      <div className="bg-black backdrop-blur-md border-b border-[#F7DD0F]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="h-8 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 w-24 sm:w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-12 sm:w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 xl:gap-12">
          {/* Product Images Skeleton */}
          <div className="space-y-3 sm:space-y-4">
                         {/* Main Image Skeleton */}
             <div className="aspect-square bg-black rounded-xl sm:rounded-2xl animate-pulse border border-[#F7DD0F]/30"></div>
            
                         {/* Thumbnail Images Skeleton */}
             <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
               {Array.from({ length: 6 }, (_, i) => (
                 <div key={i} className="aspect-square bg-black rounded-lg sm:rounded-xl animate-pulse border border-[#F7DD0F]/30"></div>
               ))}
             </div>
          </div>

          {/* Product Details Skeleton */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Title Skeleton */}
            <div className="space-y-3 sm:space-y-4">
              <div className="h-6 sm:h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="h-5 sm:h-6 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-5 sm:h-6 w-16 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Price Skeleton */}
            <div className="space-y-2">
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Discount Banner Skeleton */}
            <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

            {/* Variant Selection Skeleton */}
            <div className="space-y-3">
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Seller Info Skeleton */}
            <div className="h-16 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

            {/* Shipping Info Skeleton */}
            <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

            {/* Service Info Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Quantity Skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="space-y-3">
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>

            {/* Social Skeleton */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Related Items Skeleton */}
        <div className="mt-12 sm:mt-16">
          <div className="h-6 sm:h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 sm:mb-6 mx-auto"></div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
             {Array.from({ length: 6 }, (_, i) => (
               <div key={i} className="bg-black backdrop-blur-sm rounded-lg overflow-hidden shadow-md border border-[#F7DD0F]/30">
                 <div className="aspect-square bg-black animate-pulse border border-[#F7DD0F]/30"></div>
                 <div className="p-2 sm:p-3 space-y-1 sm:space-y-2">
                   <div className="h-3 sm:h-4 w-full bg-black rounded animate-pulse"></div>
                   <div className="h-4 sm:h-6 w-16 sm:w-20 bg-black rounded animate-pulse"></div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}
