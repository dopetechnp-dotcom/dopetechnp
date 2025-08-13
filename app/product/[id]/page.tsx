import { allProducts } from "@/lib/products-data"
import ProductPageClient from "./product-page-client"

// Required for static export - generates all possible product pages at build time
export async function generateStaticParams() {
  return allProducts.map((product) => ({
    id: product.id.toString(),
  }))
}

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const productId = parseInt(params.id)
  const product = allProducts.find(p => p.id === productId)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <a href="/" className="bg-[#F7DD0F] text-black px-4 py-2 rounded-lg hover:bg-[#F7DD0F]/90">
            Go back home
          </a>
        </div>
      </div>
    )
  }

  // Mock related products (you can replace with actual related products logic)
  const relatedProducts = allProducts.filter(p => p.id !== productId).slice(0, 6)

  return <ProductPageClient product={product} relatedProducts={relatedProducts} />
}
