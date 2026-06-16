const Category = require('../models/Category');
const Product = require('../models/Product'); // Assuming you have a Product model

class CategoryService {

  // Create main category
  async createMainCategory(data) {
    try {
      const category = new Category({
        ...data,
        level: 0,
        parentCategory: null
      });

      await category.save();

      return { success: true, data: category };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create subcategory
  async createSubCategory(parentId, data) {
    try {
      const parent = await Category.findById(parentId);

      if (!parent) {
        return { success: false, error: 'Parent category not found' };
      }

      const category = new Category({
        ...data,
        parentCategory: parentId,
        level: 1
      });

      await category.save();

      return { success: true, data: category };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all categories with subcategories and product counts
  async getAllCategories() {
    try {
      // Get all main categories
      const mainCategories = await Category.find({
        level: 0,
        isActive: true
      }).sort({ order: 1 });

      // Get all subcategories
      const subcategories = await Category.find({
        level: 1,
        isActive: true
      });

      // Get product counts for all categories using aggregation
      const productCounts = await Product.aggregate([
        {
          $match: { 
            isActive: true,
            category: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      // Create a map of categoryId -> product count
      const countMap = {};
      productCounts.forEach(item => {
        countMap[item._id.toString()] = item.count;
      });

      // Build the result with counts
      const result = mainCategories.map((cat) => {
        const catObj = cat.toObject();
        
        // Find subcategories for this main category
        const subCats = subcategories.filter(
          (sub) => sub.parentCategory.toString() === cat._id.toString()
        );

        // Add product count for main category
        catObj.productCount = countMap[cat._id.toString()] || 0;

        // Add subcategories with their product counts
        catObj.subcategories = subCats.map((sub) => {
          const subObj = sub.toObject();
          subObj.productCount = countMap[sub._id.toString()] || 0;
          return subObj;
        });

        return catObj;
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      return { success: false, error: error.message };
    }
  }

  // Get single category with subcategories and product counts
  async getCategoryById(id) {
    try {
      const category = await Category.findById(id);

      if (!category) {
        return { success: false, error: 'Category not found' };
      }

      // Get subcategories
      const subcategories = await Category.find({
        parentCategory: id,
        isActive: true
      });

      // Get product counts using aggregation
      const categoryIds = [id, ...subcategories.map(sub => sub._id)];
      
      const productCounts = await Product.aggregate([
        {
          $match: {
            isActive: true,
            category: { $in: categoryIds }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      // Create count map
      const countMap = {};
      productCounts.forEach(item => {
        countMap[item._id.toString()] = item.count;
      });

      // Build result
      const result = {
        ...category.toObject(),
        productCount: countMap[category._id.toString()] || 0,
        subcategories: subcategories.map((sub) => ({
          ...sub.toObject(),
          productCount: countMap[sub._id.toString()] || 0
        }))
      };

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get main categories with product counts
  async getMainCategories() {
    try {
      const categories = await Category.find({
        level: 0,
        isActive: true
      }).sort({ order: 1 });

      // Get product counts for main categories
      const categoryIds = categories.map(cat => cat._id);
      
      const productCounts = await Product.aggregate([
        {
          $match: {
            isActive: true,
            category: { $in: categoryIds }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      // Create count map
      const countMap = {};
      productCounts.forEach(item => {
        countMap[item._id.toString()] = item.count;
      });

      // Add counts to categories
      const result = categories.map((cat) => ({
        ...cat.toObject(),
        productCount: countMap[cat._id.toString()] || 0
      }));

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get categories with product counts using lookup aggregation
  async getCategoriesWithProductCounts() {
    try {
      const categories = await Category.aggregate([
        {
          $match: {
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $addFields: {
            productCount: { $size: '$products' }
          }
        },
        {
          $project: {
            products: 0 // Remove the products array from the result
          }
        },
        {
          $sort: { order: 1 }
        }
      ]);

      // Separate main and subcategories
      const mainCategories = categories.filter(cat => cat.level === 0);
      const subCategories = categories.filter(cat => cat.level === 1);

      // Build hierarchical structure
      const result = mainCategories.map((main) => ({
        ...main,
        subcategories: subCategories.filter(
          (sub) => sub.parentCategory && 
          sub.parentCategory.toString() === main._id.toString()
        )
      }));

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in getCategoriesWithProductCounts:', error);
      return { success: false, error: error.message };
    }
  }

  // Get category tree with product counts (most efficient)
  async getCategoryTree() {
    try {
      const categories = await Category.aggregate([
        {
          $match: {
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'products',
            let: { categoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$category', '$$categoryId'] },
                      { $eq: ['$isActive', true] }
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'productCounts'
          }
        },
        {
          $addFields: {
            productCount: {
              $ifNull: [
                { $arrayElemAt: ['$productCounts.count', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            productCounts: 0
          }
        },
        {
          $sort: { level: 1, order: 1 }
        }
      ]);

      // Build hierarchical structure
      const mainCategories = categories.filter(cat => cat.level === 0);
      const subCategories = categories.filter(cat => cat.level === 1);

      const result = mainCategories.map((main) => ({
        ...main,
        subcategories: subCategories.filter(
          (sub) => sub.parentCategory && 
          sub.parentCategory.toString() === main._id.toString()
        )
      }));

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in getCategoryTree:', error);
      return { success: false, error: error.message };
    }
  }

  // Get category by slug with product count
  async getCategoryBySlug(slug) {
    try {
      const category = await Category.aggregate([
        {
          $match: {
            slug: slug,
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'products',
            let: { categoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$category', '$$categoryId'] },
                      { $eq: ['$isActive', true] }
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'productCounts'
          }
        },
        {
          $addFields: {
            productCount: {
              $ifNull: [
                { $arrayElemAt: ['$productCounts.count', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            productCounts: 0
          }
        }
      ]);

      if (!category || category.length === 0) {
        return { success: false, error: 'Category not found' };
      }

      // Get subcategories with product counts
      const subcategories = await Category.aggregate([
        {
          $match: {
            parentCategory: category[0]._id,
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'products',
            let: { categoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$category', '$$categoryId'] },
                      { $eq: ['$isActive', true] }
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'productCounts'
          }
        },
        {
          $addFields: {
            productCount: {
              $ifNull: [
                { $arrayElemAt: ['$productCounts.count', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            productCounts: 0
          }
        },
        {
          $sort: { order: 1 }
        }
      ]);

      return {
        success: true,
        data: {
          ...category[0],
          subcategories
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get categories with product counts by level
  async getCategoriesByLevel(level = 0) {
    try {
      const categories = await Category.aggregate([
        {
          $match: {
            level: level,
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'products',
            let: { categoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$category', '$$categoryId'] },
                      { $eq: ['$isActive', true] }
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'productCounts'
          }
        },
        {
          $addFields: {
            productCount: {
              $ifNull: [
                { $arrayElemAt: ['$productCounts.count', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            productCounts: 0
          }
        },
        {
          $sort: { order: 1 }
        }
      ]);

      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update category
  async updateCategory(id, data) {
    try {
      const allowed = ['name', 'description', 'order', 'isActive', 'slug', 'image'];

      const filtered = {};
      allowed.forEach((field) => {
        if (data[field] !== undefined) {
          filtered[field] = data[field];
        }
      });

      const category = await Category.findByIdAndUpdate(
        id,
        filtered,
        { new: true, runValidators: true }
      );

      if (!category) {
        return { success: false, error: 'Category not found' };
      }

      return { success: true, data: category };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete category
  async deleteCategory(id) {
    try {
      const sub = await Category.find({ parentCategory: id });

      if (sub.length > 0) {
        return {
          success: false,
          error: 'Delete subcategories first'
        };
      }

      const category = await Category.findByIdAndDelete(id);

      if (!category) {
        return { success: false, error: 'Category not found' };
      }

      return { success: true, data: category };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all categories (flat list) with product counts
  async getAllCategoriesFlat() {
    try {
      const categories = await Category.aggregate([
        {
          $match: {
            isActive: true
          }
        },
        {
          $lookup: {
            from: 'products',
            let: { categoryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$category', '$$categoryId'] },
                      { $eq: ['$isActive', true] }
                    ]
                  }
                }
              },
              { $count: 'count' }
            ],
            as: 'productCounts'
          }
        },
        {
          $addFields: {
            productCount: {
              $ifNull: [
                { $arrayElemAt: ['$productCounts.count', 0] },
                0
              ]
            }
          }
        },
        {
          $project: {
            productCounts: 0
          }
        },
        {
          $sort: { level: 1, order: 1 }
        }
      ]);

      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CategoryService();