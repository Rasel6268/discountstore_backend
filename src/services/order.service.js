// services/order.service.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const mongoose = require("mongoose");

const generateOrderId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD-${year}${month}${day}${random}`;
};

const validateInventory = async (items) => {
  const inventoryErrors = [];
  const productUpdates = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      inventoryErrors.push(`Product "${item.name}" not found`);
      continue;
    }

    // Check for size-based product (with inventory)
    if (item.size && product.hasSizes) {
      const sizeVariant = product.sizes.find(
        (s) =>
          s.name === item.size.name && s.type === (item.size.type || "unisex"),
      );

      if (!sizeVariant) {
        inventoryErrors.push(
          `Size "${item.size.name}" (${item.size.type || "unisex"}) is not available for product "${product.name}"`,
        );
        continue;
      }

      if (sizeVariant.quantity < item.quantity) {
        inventoryErrors.push(
          `Insufficient stock for "${product.name}" - Size ${item.size.name}. Available: ${sizeVariant.quantity}, Requested: ${item.quantity}`,
        );
        continue;
      }

      productUpdates.push({
        productId: product._id,
        product: product,
        size: item.size,
        quantity: item.quantity,
        type: "size",
      });
    }
    // Regular product without sizes (colors don't affect inventory)
    else {
      if (product.quantity < item.quantity) {
        inventoryErrors.push(
          `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`,
        );
        continue;
      }

      productUpdates.push({
        productId: product._id,
        product: product,
        size: null,
        quantity: item.quantity,
        type: "regular",
      });
    }
  }

  return {
    isValid: inventoryErrors.length === 0,
    errors: inventoryErrors,
    productUpdates,
  };
};

const updateInventory = async (productUpdates) => {
  const updatePromises = productUpdates.map(async (update) => {
    const product = update.product;

    if (update.type === "size") {
      const sizeIndex = product.sizes.findIndex(
        (s) =>
          s.name === update.size.name &&
          s.type === (update.size.type || "unisex"),
      );

      if (sizeIndex !== -1) {
        product.sizes[sizeIndex].quantity -= update.quantity;
        product.quantity = product.sizes.reduce(
          (sum, s) => sum + s.quantity,
          0,
        );
        await product.save();
      }
    } else {
      product.quantity -= update.quantity;
      await product.save();
    }
  });

  await Promise.all(updatePromises);
};

const createOrderSRV = async (orderData) => {
  try {
    if (
      !orderData.items ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0
    ) {
      return {
        success: false,
        message: "Order must contain at least one item",
        statusCode: 400,
        data: null,
      };
    }

    const shippingCost =
      orderData.shippingCost || (orderData.shippingArea === "dhaka" ? 70 : 130);

    const inventoryValidation = await validateInventory(orderData.items);
    if (!inventoryValidation.isValid) {
      return {
        success: false,
        message: "Inventory validation failed",
        errors: inventoryValidation.errors,
        statusCode: 400,
        data: null,
      };
    }

    const orderItems = orderData.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku || null,
      price: item.price,
      quantity: item.quantity,
      image: item.image || null,
      size: item.size
        ? {
            name: item.size.name,
            type: item.size.type || "unisex",
            extraPrice: item.size.extraPrice || 0,
            sku: item.size.sku || null,
          }
        : null,
      color: item.color
        ? {
            _id: item.color._id,
            name: item.color.name,
            hexCode: item.color.hexCode || "#000000",
          }
        : null,
      totalPrice:
        item.totalPrice !== undefined && item.totalPrice !== null
          ? item.totalPrice
          : item.price * item.quantity,
    }));

    const orderId = generateOrderId();

    // Get payment method from multiple possible locations
    const paymentMethod =
      orderData.paymentMethod || orderData.payment?.method || "cod";

    const paymentStatus = orderData.payment?.status || "pending";
    const transactionId =
      orderData.transactionId || orderData.payment?.transactionId || null;

    // Prepare coupon applied data if coupon is provided
    let couponApplied = null;
    let couponDiscount = orderData.couponDiscount || 0;
    let discount = (orderData.discount || 0) + couponDiscount;

    if (orderData.couponCode && orderData.couponId) {
      couponApplied = {
        couponId: orderData.couponId,
        code: orderData.couponCode,
        name: orderData.couponName || orderData.couponCode,
        type: orderData.couponType || "percentage",
        value: orderData.couponValue || 0,
        discountAmount: couponDiscount,
        minPurchase: orderData.couponMinPurchase || 0,
        maxDiscount: orderData.couponMaxDiscount || null,
        appliedAt: new Date(),
      };
    }

    const order = new Order({
      orderId: orderId,
      user: {
        userId: orderData.user.userId || null,
        name: orderData.user.name,
        email: orderData.user.email,
        phone: orderData.user.phone,
        guestInfo: !orderData.user.userId,
      },
      shippingAddress: {
        name: orderData.shippingAddress.name,
        addressLine1: orderData.shippingAddress.addressLine1,
        addressLine2: orderData.shippingAddress.addressLine2 || "",
        city: orderData.shippingAddress.city,
        area: orderData.shippingAddress.area,
        postCode: orderData.shippingAddress.postCode,
        country: orderData.shippingAddress.country || "Bangladesh",
      },
      shippingArea: orderData.shippingArea,
      shippingCost: shippingCost,
      estimatedDeliveryDate: orderData.estimatedDeliveryDate || null,
      items: orderItems,
      subtotal: orderData.subtotal,
      discount: discount,
      couponCode: orderData.couponCode || null,
      couponDiscount: couponDiscount,
      couponApplied: couponApplied, // New field
      additionalDiscount: orderData.additionalDiscount || 0,
      additionalDiscountReason: orderData.additionalDiscountReason || null,
      tax: orderData.tax,
      total: orderData.total,
      payment: {
        method: paymentMethod,
        status: paymentStatus,
        amount: orderData.total,
        transactionId: transactionId,
      },
      orderStatus: "pending",
      statusTimeline: [
        {
          status: "pending",
          note: "Order placed successfully",
          updatedBy: orderData.user.name,
          timestamp: new Date(),
        },
      ],
      notes: orderData.notes || "",
      ipAddress: orderData.ipAddress || null,
    });

    const savedOrder = await order.save();

    await updateInventory(inventoryValidation.productUpdates);

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("user.userId", "name email phone")
      .populate("items.productId", "name images slug")
      .populate("couponApplied.couponId", "code name type value");

    return {
      success: true,
      message: "Order created successfully",
      data: populatedOrder,
      orderId: savedOrder.orderId,
      statusCode: 201,
    };
  } catch (error) {
    console.error("Create Order Service Error:", error);
    return {
      success: false,
      message: error.message || "Failed to create order",
      statusCode: 500,
      data: null,
    };
  }
};

const getAllOrdersSRV = async () => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user.userId", "name email phone")
      .populate("items.productId", "name images slug brand category")
      .populate("couponApplied.couponId", "code name type value");
    
    return {
      success: true,
      message: "Orders retrieved successfully",
      data: orders,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to retrieve orders",
      statusCode: 500,
      data: null,
    };
  }
};

const getOrderByIdSRV = async (orderId, userId = null) => {
  try {
    const query = { orderId: orderId };
    if (userId) {
      query["user.userId"] = userId;
    }

    const order = await Order.findOne(query)
      .populate("user.userId", "name email phone")
      .populate("items.productId", "name images slug brand category")
      .populate("couponApplied.couponId", "code name type value");

    if (!order) {
      return {
        success: false,
        message: "Order not found",
        statusCode: 404,
        data: null,
      };
    }

    return {
      success: true,
      data: order,
      statusCode: 200,
    };
  } catch (error) {
    console.error("Get Order By ID Service Error:", error);
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

const getOrdersByUserIdSRV = async (userId, authUser = null) => {
  try {
    const conditions = [];

    // 1. Target ID matching (as ObjectId and as String)
    const rawId = userId ? String(userId).trim() : null;
    if (rawId && rawId !== "undefined" && rawId !== "null" && rawId !== "me") {
      if (mongoose.Types.ObjectId.isValid(rawId)) {
        const objId = new mongoose.Types.ObjectId(rawId);
        conditions.push({ "user.userId": objId });
        conditions.push({ "user._id": objId });
        conditions.push({ user: objId });
        conditions.push({ _id: objId });
      }
      conditions.push({ "user.userId": rawId });
      conditions.push({ "user._id": rawId });
    }

    // 2. Auth user ID matching (from verified token)
    if (authUser && authUser._id) {
      const authObjId = new mongoose.Types.ObjectId(authUser._id);
      conditions.push({ "user.userId": authObjId });
      conditions.push({ "user._id": authObjId });
      conditions.push({ user: authObjId });
      conditions.push({ "user.userId": String(authUser._id) });
    }

    // 3. User email matching (case-insensitive)
    const email = authUser?.email || (rawId && rawId.includes("@") ? rawId : null);
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      conditions.push({ "user.email": cleanEmail });
      conditions.push({ "user.email": new RegExp(`^${cleanEmail}$`, "i") });
      conditions.push({ "shippingAddress.email": new RegExp(`^${cleanEmail}$`, "i") });
    }

    // 4. User phone matching (exact or last 10 digits)
    const phone = authUser?.phone || (rawId && /^\+?[0-9]{8,15}$/.test(rawId) ? rawId : null);
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      if (cleanPhone.length >= 8) {
        const suffix = cleanPhone.slice(-10);
        conditions.push({ "user.phone": phone });
        conditions.push({ "user.phone": new RegExp(suffix + "$") });
        conditions.push({ "shippingAddress.phone": new RegExp(suffix + "$") });
      }
    }

    if (conditions.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const orders = await Order.find({ $or: conditions })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name images slug brand category")
      .populate("couponApplied.couponId", "code name type value");

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("getOrdersByUserIdSRV error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

const getUserOrdersSRV = async (userId, filters = {}) => {
  try {
    const { page = 1, limit = 10, status } = filters;
    const skip = (page - 1) * limit;

    const query = { "user.userId": userId };
    if (status) query.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("items.productId", "name images slug")
        .populate("couponApplied.couponId", "code name type value"),
      Order.countDocuments(query),
    ]);

    return {
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Get User Orders Service Error:", error);
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

const updateOrderStatusSRV = async (
  orderId,
  newStatus,
  note,
  updatedBy = "admin",
) => {
  try {
    const updatedOrderStatus = await Order.findByIdAndUpdate(
      orderId,
      {
        orderStatus: newStatus,
        $push: {
          statusTimeline: {
            status: newStatus,
            note: note || `Order status updated to ${newStatus}`,
            updatedBy,
            timestamp: new Date(),
          },
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    );
    
    if (!updatedOrderStatus) {
      return {
        success: false,
        message: "Order not found",
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Order status updated successfully",
      data: updatedOrderStatus,
      statusCode: 200, 
    };
  } catch (error) {
    console.error("Service error:", error);
    return {
      success: false,
      message: error.message,
      statusCode: 500,
    };
  }
};

const updatePaymentStatusSRV = async (
  orderId,
  paymentStatus,
  transactionId = null,
) => {
  try {
    const order = await Order.findOne({ orderId: orderId });

    if (!order) {
      return {
        success: false,
        message: "Order not found",
        statusCode: 404,
        data: null,
      };
    }

    const oldStatus = order.payment.status;
    order.payment.status = paymentStatus;

    if (transactionId) {
      order.payment.transactionId = transactionId;
    }

    if (paymentStatus === "completed" && !order.payment.paidAt) {
      order.payment.paidAt = new Date();
    }

    order.statusTimeline.push({
      status: order.orderStatus,
      note: `Payment status changed from ${oldStatus} to ${paymentStatus}`,
      updatedBy: "system",
      timestamp: new Date(),
    });

    await order.save();

    return {
      success: true,
      message: "Payment status updated successfully",
      data: {
        orderId: order.orderId,
        oldStatus,
        newStatus: paymentStatus,
        transactionId: order.payment.transactionId,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Update Payment Status Service Error:", error);
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

const cancelOrderSRV = async (orderId, reason, cancelledBy = "customer") => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const order = await Order.findOne({
      $or: [
        { orderId: orderId },
        { _id: isObjectId ? orderId : null },
      ],
    });

    if (!order) {
      return {
        success: false,
        message: "Order not found",
        statusCode: 404,
        data: null,
      };
    }

    const cancellableStatuses = ["pending", "confirmed"];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return {
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus}. Cancellations are only allowed before processing.`,
        statusCode: 400,
        data: null,
      };
    }

    // Restore inventory (only for sizes, colors don't affect inventory)
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (item.size && product.hasSizes) {
          const sizeIndex = product.sizes.findIndex(
            (s) =>
              s.name === item.size.name &&
              s.type === (item.size.type || "unisex"),
          );
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].quantity += item.quantity;
            product.quantity = product.sizes.reduce(
              (sum, s) => sum + s.quantity,
              0,
            );
            await product.save();
          }
        } else {
          product.quantity += item.quantity;
          await product.save();
        }
      }
    }

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by customer before processing";

    order.statusTimeline.push({
      status: "cancelled",
      note: `Order cancelled by ${cancelledBy} before processing. Reason: ${reason || "No reason provided"}`,
      updatedBy: cancelledBy,
      timestamp: new Date(),
    });

    await order.save();

    return {
      success: true,
      message: "Order cancelled successfully",
      data: order,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

const changeOrderSRV = async (orderId, updateData, updatedBy = "customer") => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const order = await Order.findOne({
      $or: [
        { orderId: orderId },
        { _id: isObjectId ? orderId : null },
      ],
    });

    if (!order) {
      return {
        success: false,
        message: "Order not found",
        statusCode: 404,
        data: null,
      };
    }

    // Only allow modifications before order reaches 'processing'
    const editableStatuses = ["pending", "confirmed"];
    if (!editableStatuses.includes(order.orderStatus)) {
      return {
        success: false,
        message: `Order cannot be modified because it is already ${order.orderStatus}. Changes are only allowed before processing.`,
        statusCode: 400,
        data: null,
      };
    }

    const changes = [];

    // 1. Update shipping address
    if (updateData.shippingAddress) {
      const sa = updateData.shippingAddress;
      if (!order.shippingAddress) order.shippingAddress = {};

      if (sa.name && sa.name !== order.shippingAddress.name) {
        changes.push(`Recipient: ${sa.name}`);
        order.shippingAddress.name = sa.name;
      }
      if (sa.phone && sa.phone !== order.shippingAddress.phone) {
        changes.push(`Phone: ${sa.phone}`);
        order.shippingAddress.phone = sa.phone;
      }
      if (sa.addressLine1 && sa.addressLine1 !== order.shippingAddress.addressLine1) {
        changes.push(`Address: ${sa.addressLine1}`);
        order.shippingAddress.addressLine1 = sa.addressLine1;
      }
      if (sa.addressLine2 !== undefined) {
        order.shippingAddress.addressLine2 = sa.addressLine2;
      }
      if (sa.city && sa.city !== order.shippingAddress.city) {
        changes.push(`City: ${sa.city}`);
        order.shippingAddress.city = sa.city;
      }
      if (sa.area && sa.area !== order.shippingAddress.area) {
        changes.push(`Area: ${sa.area}`);
        order.shippingAddress.area = sa.area;
      }
      if (sa.postCode && sa.postCode !== order.shippingAddress.postCode) {
        changes.push(`Postcode: ${sa.postCode}`);
        order.shippingAddress.postCode = sa.postCode;
      }
    }

    // 2. Update shipping area (recalculating delivery fee)
    if (updateData.shippingArea && updateData.shippingArea !== order.shippingArea) {
      order.shippingArea = updateData.shippingArea;
      const newCost = updateData.shippingArea === "dhaka" ? 70 : 130;
      changes.push(`Shipping area: ${updateData.shippingArea} (Fee: ৳${newCost})`);
      order.shippingCost = newCost;
      order.total =
        (order.subtotal || 0) +
        newCost +
        (order.tax || 0) -
        (order.discount || 0) -
        (order.couponDiscount || 0);
    }

    // 3. Update delivery notes
    if (updateData.notes !== undefined && updateData.notes !== order.notes) {
      changes.push(`Notes updated`);
      order.notes = updateData.notes;
    }

    const changeSummary = changes.length > 0 ? changes.join(", ") : "Shipping details updated";

    order.statusTimeline.push({
      status: order.orderStatus,
      note: `Order details updated by ${updatedBy} before processing (${changeSummary})`,
      updatedBy: updatedBy,
      timestamp: new Date(),
    });

    await order.save();

    return {
      success: true,
      message: "Order details updated successfully",
      data: order,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

// New function to get orders by coupon
const getOrdersByCouponSRV = async (couponCode) => {
  try {
    const orders = await Order.find({ 
      couponCode: couponCode.toUpperCase() 
    })
      .sort({ createdAt: -1 })
      .populate("user.userId", "name email phone")
      .populate("couponApplied.couponId", "code name type value");

    return {
      success: true,
      data: orders,
      total: orders.length,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

// New function to get coupon usage statistics
const getCouponUsageStatsSRV = async (couponId) => {
  try {
    const stats = await Order.aggregate([
      { $match: { "couponApplied.couponId": new mongoose.Types.ObjectId(couponId) } },
      {
        $group: {
          _id: "$couponApplied.code",
          totalOrders: { $sum: 1 },
          totalDiscountAmount: { $sum: "$couponDiscount" },
          averageDiscount: { $avg: "$couponDiscount" },
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);

    return {
      success: true,
      data: stats[0] || null,
      statusCode: 200,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

/**
 * Public Order Tracking Service
 * Allows customers (guest or registered) to track their order status,
 * timeline history, courier details, and item details.
 */
const trackOrderSRV = async (orderId, phone = null) => {
  try {
    if (!orderId) {
      return {
        success: false,
        message: "Order ID is required to track your order.",
        statusCode: 400,
        data: null,
      };
    }

    const cleanOrderId = String(orderId).trim();
    const escapedOrderId = cleanOrderId.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

    // Find by unique orderId (e.g. ORD-2611151234, case-insensitive) or by MongoDB ObjectId if valid
    const query = {
      $or: [
        { orderId: cleanOrderId },
        { orderId: cleanOrderId.toUpperCase() },
        { orderId: new RegExp(`^${escapedOrderId}$`, "i") },
        ...(mongoose.Types.ObjectId.isValid(cleanOrderId) ? [{ _id: cleanOrderId }] : []),
      ],
    };

    let orderQuery = Order.findOne(query).populate(
      "items.productId",
      "name images slug brand category"
    );
    try {
      orderQuery = orderQuery.populate("couponApplied.couponId", "code name type value");
    } catch (_) {}

    const order = await orderQuery;

    if (!order) {
      return {
        success: false,
        message: `Order "${cleanOrderId}" could not be found. Please check your Order ID and try again.`,
        statusCode: 404,
        data: null,
      };
    }

    // Optional phone number verification for security / privacy if provided
    if (phone) {
      const cleanInputPhone = String(phone).replace(/\D/g, "");
      const orderUserPhone = String(order.user?.phone || "").replace(/\D/g, "");
      const orderShipPhone = String(order.shippingAddress?.phone || "").replace(/\D/g, "");

      const phoneMatches =
        (orderUserPhone && (orderUserPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(orderUserPhone))) ||
        (orderShipPhone && (orderShipPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(orderShipPhone)));

      if (!phoneMatches) {
        return {
          success: false,
          message: "The phone number entered does not match the contact number on this order.",
          statusCode: 403,
          data: null,
        };
      }
    }

    return {
      success: true,
      message: "Order tracking details fetched successfully.",
      statusCode: 200,
      data: order,
    };
  } catch (error) {
    console.error("Track Order Service Error:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve tracking details.",
      statusCode: 500,
      data: null,
    };
  }
};

module.exports = {
  createOrderSRV,
  getAllOrdersSRV,
  getOrderByIdSRV,
  getUserOrdersSRV,
  updateOrderStatusSRV,
  updatePaymentStatusSRV,
  cancelOrderSRV,
  changeOrderSRV,
  getOrdersByUserIdSRV,
  getOrdersByCouponSRV,
  getCouponUsageStatsSRV,
  trackOrderSRV,
};