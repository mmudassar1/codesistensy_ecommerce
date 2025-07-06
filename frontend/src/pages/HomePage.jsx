import { useEffect } from "react";
import CategoryItem from "../components/CategoryItem";
import FeaturedProducts from "../components/FeaturedProducts";
import { useProductStore } from "../stores/useProductStore";

const categories = [
  { href: "/jeans", name: "Jeans", imageUrl: "/jeans.jpg" },
  { href: "/t-shirts", name: "Tshirts", imageUrl: "/tshirts.jpg" },
  { href: "/shoes", name: "Shoes", imageUrl: "/shoes.jpg" },
  { href: "/glasses", name: "Glasses", imageUrl: "/glasses.png" },
  { href: "/jackets", name: "Jackets", imageUrl: "/jackets.jpg" },
  { href: "/suits", name: "Suits", imageUrl: "/suits.jpg" },
  { href: "/bags", name: "Bags", imageUrl: "/bags.jpg" },
];

const HomePage = () => {
  const { fetchFeaturedProducts, isLoading, products } = useProductStore();

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);
  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-center text-5xl sm:text-6xl font-bold text-emerald-400 mb-4">
          Welcome to Category
        </h1>
        <p className="text-center text-xl text-gray-300 mb-12">
          Explore our latest collections and find your perfect outfit.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryItem categoory={category} key={category.href} />
          ))}
        </div>
        {!isLoading && products.length > 0 && 
          <FeaturedProducts featuredProducts={products} />
        }
      </div>
    </div>
  );
};

export default HomePage;
