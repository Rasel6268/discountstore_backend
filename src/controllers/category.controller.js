const service = require('../services/category.service');

class CategoryController {

  async createMainCategory(req, res) {
    const result = await service.createMainCategory(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }

  async createSubCategory(req, res) {
    const result = await service.createSubCategory(
      req.params.parentId,
      req.body
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.data);
  }

  async getAllCategories(req, res) {
    const result = await service.getAllCategories();

    res.status(200).json(result.data);
  }

  async getCategoryById(req, res) {
    const result = await service.getCategoryById(req.params.id);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.status(200).json(result.data);
  }

  async updateCategory(req, res) {
    const result = await service.updateCategory(
      req.params.id,
      req.body
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result.data);
  }

  async deleteCategory(req, res) {
    const result = await service.deleteCategory(req.params.id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(200).json(result.data);
  }

  async getMainCategories(req, res) {
    const result = await service.getMainCategories();

    

    res.status(200).json(result.data);
  }
}

module.exports = new CategoryController();