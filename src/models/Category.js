const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    lowercase: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});


// 🔥 Generate unique slug
async function generateUniqueSlug(model, name, currentId = null) {
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = await model.findOne({ slug });

    if (!existing || (currentId && existing._id.toString() === currentId)) {
      return slug;
    }

    slug = `${baseSlug}-${count++}`;
  }
}


// ✅ CREATE (no next)
categorySchema.pre('save', async function () {
  if (this.isModified('name')) {
    this.slug = await generateUniqueSlug(
      mongoose.models.Category,
      this.name,
      this._id
    );
  }
});


// ✅ UPDATE (no next)
categorySchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();

  if (update.name) {
    update.slug = await generateUniqueSlug(
      mongoose.models.Category,
      update.name
    );
  }
});

module.exports = mongoose.model('Category', categorySchema);