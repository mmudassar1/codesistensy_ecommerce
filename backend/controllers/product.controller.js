import cloudinary from "../lib/cloudinary.js";
import redis from "../lib/redis.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({ products });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get("featured_products");
		if (featuredProducts) {
			return res.json(JSON.parse(featuredProducts));
		}

		// if not in redis, fetch from mongodb
		// .lean() is gonna return a plain javascript object instead of a mongodb document
		// which is good for performance
		featuredProducts = await Product.find({ isFeatured: true }).lean();

		if (!featuredProducts) {
			return res.status(404).json({ message: "No featured products found" });
		}

		// store in redis for future quick access

		await redis.set("featured_products", JSON.stringify(featuredProducts));

		res.json(featuredProducts);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    let cloudinaryResponse = null;
    if (image) {
      cloudinaryResponse = await cloudinary.uploader.upload(image, {
        folder: "products",
      });
    }
    const product = await Product.create({
      name,
      price,
      description,
      image: cloudinaryResponse?.secure_url
        ? cloudinaryResponse.secure_url
        : "",
      category,
    });
    res.status(201).json({
      message: "Product created successfully",
      product: product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Delete the product image from Cloudinary
    if (product.image) {
      const publicId = product.image.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
        console.log("deleted image from Cloudinary successfully");
      } catch (error) {
        console.log("error deleting image from Cloudinary:", error);
      }
    }
    // Remove from Redis cache
    await redis.del("featured_products");
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};

export const getRecomendedProducts = async (req, res) => {
  try {
    
    const products = await Product.aggregate([
      {
        $sample: { size: 4 }, // Randomly select 3 products
      },
      {
        $project: {
          name: 1,
          price: 1,
          description: 1,
          image: 1,
          category: 1,
        },
      },
    ]);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching recommended products",
      error: error.message,
    });
  }
};

export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found in this category" });
    }
    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products by category",
      error: error.message,
    });
  }
};

export const toggleFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (product) {
      product.isFeatured = !product.isFeatured;
      const updateProduct = await product.save();
      await updatefeaturedProductsCache();
      res.status(200).json({ updateProduct });
      return res.status(404).json({ message: "Product not found" });
    }
    {
      res.status(400).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Error toggling featured product",
      error: error.message,
    });
  }
};

async function updatefeaturedProductsCache() {
  try {
    const featuredProducts = await Product.find({ isFeatured: true }).lean();
    await redis.set("featured_products", JSON.stringify(featuredProducts));
    console.log("Updated featured products cache in Redis");
  } catch (error) {
    console.error("Error updating featured products cache:", error);
  }
}
