const Category = require('../models/Category');

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

  // Get all categories with subcategories
  async getAllCategories() {
    try {
      const mainCategories = await Category.find({
        level: 0,
        isActive: true
      }).sort({ order: 1 });

      const result = await Promise.all(
        mainCategories.map(async (cat) => {
          const subcategories = await Category.find({
            parentCategory: cat._id,
            isActive: true
          }).sort({ order: 1 });

          return {
            ...cat.toObject(),
            subcategories
          };
        })
      );

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get single category
  async getCategoryById(id) {
    try {
      const category = await Category.findById(id);

      if (!category) {
        return { success: false, error: 'Category not found' };
      }

      const subcategories = await Category.find({
        parentCategory: id
      });

      return {
        success: true,
        data: { ...category.toObject(), subcategories }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update category
  async updateCategory(id, data) {
    try {
      const allowed = ['name', 'description', 'order', 'isActive'];

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

  // Get main categories
  async getMainCategories() {
    try {
      const categories = await Category.find({
        level: 0,
        isActive: true
      }).sort({ order: 1 });

      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new CategoryService();