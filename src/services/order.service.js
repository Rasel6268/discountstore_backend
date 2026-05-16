// services/order.service.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const generateOrderId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
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

    if (item.size && product.hasSizes) {
      const sizeVariant = product.sizes.find(
        s => s.name === item.size.name && s.type === item.size.type
      );

      if (!sizeVariant) {
        inventoryErrors.push(`Size "${item.size.name}" (${item.size.type}) is not available for product "${product.name}"`);
        continue;
      }

      if (sizeVariant.quantity < item.quantity) {
        inventoryErrors.push(`Insufficient stock for "${product.name}" - Size ${item.size.name}. Available: ${sizeVariant.quantity}, Requested: ${item.quantity}`);
        continue;
      }

      productUpdates.push({
        productId: product._id,
        product: product,
        size: item.size,
        quantity: item.quantity,
        type: "size"
      });
    } else {
      if (product.quantity < item.quantity) {
        inventoryErrors.push(`Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`);
        continue;
      }

      productUpdates.push({
        productId: product._id,
        product: product,
        size: null,
        quantity: item.quantity,
        type: "regular"
      });
    }
  }

  return { isValid: inventoryErrors.length === 0, errors: inventoryErrors, productUpdates };
};

const updateInventory = async (productUpdates) => {
  const updatePromises = productUpdates.map(async (update) => {
    const product = update.product;
    
    if (update.type === "size") {
      const sizeIndex = product.sizes.findIndex(
        s => s.name === update.size.name && s.type === update.size.type
      );
      
      if (sizeIndex !== -1) {
        product.sizes[sizeIndex].quantity -= update.quantity;
        product.quantity = product.sizes.reduce((sum, s) => sum + s.quantity, 0);
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
    console.log("Creating order with data:", JSON.stringify(orderData, null, 2));
    
    const shippingCost = orderData.shippingCost || (orderData.shippingArea === "dhaka" ? 60 : 130);
    
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

    const orderItems = orderData.items.map(item => ({
      productId: item.productId,
      name: item.name,
      sku: item.sku || null,
      price: item.price,
      quantity: item.quantity,
      image: item.image || null,
      size: item.size ? {
        name: item.size.name,
        type: item.size.type || "unisex",
        extraPrice: item.size.extraPrice || 0,
        sku: item.size.sku || null,
      } : null,
      totalPrice: item.totalPrice || (item.price * item.quantity),
    }));

    const orderId = generateOrderId();

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
      discount: (orderData.discount || 0) + (orderData.couponDiscount || 0),
      couponCode: orderData.couponCode || null,
      couponDiscount: orderData.couponDiscount || 0,
      tax: orderData.tax,
      total: orderData.total,
      payment: {
        method: orderData.paymentMethod,
        status: "pending",
        amount: orderData.total,
        transactionId: orderData.transactionId || null,
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
      userAgent: orderData.userAgent || null,
    });

    const savedOrder = await order.save();
    console.log("Order saved successfully:", savedOrder.orderId);

    await updateInventory(inventoryValidation.productUpdates);
    console.log("Inventory updated successfully");

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate("user.userId", "name email phone")
      .populate("items.productId", "name images slug");

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

const getOrderByIdSRV = async (orderId, userId = null) => {
  try {
    const query = { orderId: orderId };
    if (userId) {
      query["user.userId"] = userId;
    }

    const order = await Order.findOne(query)
      .populate("user.userId", "name email phone")
      .populate("items.productId", "name images slug brand category");

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
        .populate("items.productId", "name images slug"),
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

const updateOrderStatusSRV = async (orderId, status, note, updatedBy = "admin") => {
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

    const oldStatus = order.orderStatus;
    order.orderStatus = status;
    
    order.statusTimeline.push({
      status: status,
      note: note || `Status changed from ${oldStatus} to ${status}`,
      updatedBy: updatedBy,
      timestamp: new Date(),
    });

    if (status === "delivered" && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    if (status === "cancelled" && !order.cancelledAt) {
      order.cancelledAt = new Date();
      if (note) order.cancellationReason = note;
    }

    await order.save();

    return {
      success: true,
      message: "Order status updated successfully",
      data: {
        orderId: order.orderId,
        oldStatus,
        newStatus: status,
        order: order,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Update Order Status Service Error:", error);
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

const updatePaymentStatusSRV = async (orderId, paymentStatus, transactionId = null) => {
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
    const order = await Order.findOne({ orderId: orderId });
    
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
        message: `Order cannot be cancelled because it is ${order.orderStatus}`,
        statusCode: 400,
        data: null,
      };
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (item.size && product.hasSizes) {
          const sizeIndex = product.sizes.findIndex(
            s => s.name === item.size.name && s.type === item.size.type
          );
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].quantity += item.quantity;
            product.quantity = product.sizes.reduce((sum, s) => sum + s.quantity, 0);
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
    order.cancellationReason = reason;
    
    order.statusTimeline.push({
      status: "cancelled",
      note: `Order cancelled by ${cancelledBy}. Reason: ${reason}`,
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
    console.error("Cancel Order Service Error:", error);
    return {
      success: false,
      message: error.message,
      statusCode: 500,
      data: null,
    };
  }
};

module.exports = {
  createOrderSRV,
  getOrderByIdSRV,
  getUserOrdersSRV,
  updateOrderStatusSRV,
  updatePaymentStatusSRV,
  cancelOrderSRV,
};