import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../../schemas/order.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const count = await this.orderModel.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial orders into MongoDB...');
      const defaultOrders = [
        { id: 'KOR-2401', customer: 'Priya Sharma',  email: 'priya@gmail.com',  date: '28 May 2026', items: 2, total: 9998,  status: 'delivered',  payment: 'paid',     city: 'Mumbai', address: 'Flat 402, Sea Breeze, Bandra, Mumbai, Maharashtra - 400050' },
        { id: 'KOR-2402', customer: 'Arjun Mehta',   email: 'arjun@gmail.com',  date: '27 May 2026', items: 1, total: 7999,  status: 'shipped',    payment: 'paid',     city: 'Delhi', address: 'H-12, Green Park Extension, New Delhi, Delhi - 110016' },
        { id: 'KOR-2403', customer: 'Kavya Reddy',   email: 'kavya@gmail.com',  date: '27 May 2026', items: 3, total: 16497, status: 'processing', payment: 'paid',     city: 'Bangalore', address: '45, Lavender Lane, Koramangala, Bangalore, Karnataka - 560034' },
        { id: 'KOR-2404', customer: 'Rohan Gupta',   email: 'rohan@gmail.com',  date: '26 May 2026', items: 1, total: 3499,  status: 'pending',    payment: 'pending',  city: 'Pune', address: 'Plot 89, Tech Colony, Hinjewadi, Pune, Maharashtra - 411057' },
        { id: 'KOR-2405', customer: 'Sneha Patel',   email: 'sneha@gmail.com',  date: '25 May 2026', items: 2, total: 12498, status: 'delivered',  payment: 'paid',     city: 'Ahmedabad', address: 'A-21, River View Apartments, Ashram Road, Ahmedabad, Gujarat - 380009' }
      ];
      await this.orderModel.insertMany(defaultOrders);
      console.log('✅ Seeded initial orders successfully.');
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByEmailOrCustomerId(email?: string, customerId?: string): Promise<Order[]> {
    const query: any = {};
    const conditions: any[] = [];
    if (email && email !== 'undefined' && email !== 'null') {
      conditions.push({ email: email.toLowerCase() });
    }
    if (customerId && customerId !== 'undefined' && customerId !== 'null') {
      conditions.push({ customerId: customerId });
    }
    if (conditions.length > 0) {
      query.$or = conditions;
      return this.orderModel.find(query).sort({ createdAt: -1 }).exec();
    }
    return [];
  }

  async create(payload: any): Promise<Order> {
    if (!payload.customerId) {
      throw new Error('Customer ID is required. Please login to place an order.');
    }
    const orders = await this.findAll();
    
    // Generate order ID following legacy pattern (KOR-2401, etc.)
    const orderNum = 2400 + orders.length + 1;
    const orderId = `KOR-${orderNum}`;

    const dateStr = new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    const calculatedTotal = parseInt(payload.total) || 2999;
    
    // Build address dynamically fallback to shippingAddress fields
    const shipping = payload.shippingAddress;
    const fullAddress = shipping
      ? `${shipping.address1}${shipping.address2 ? ', ' + shipping.address2 : ''}, ${shipping.city}, ${shipping.state} - ${shipping.pincode}`
      : (payload.address1 
          ? `${payload.address1}, ${payload.city}, ${payload.state} - ${payload.pincode}`
          : payload.address || 'Address not specified');

    const savedOrder = new this.orderModel({
      id: orderId,
      customerId: payload.customerId || '',
      customer: payload.customer || 'Guest Customer',
      email: payload.email.toLowerCase(),
      date: dateStr,
      items: parseInt(payload.itemsCount) || 1,
      itemsDetails: payload.items || [],
      total: calculatedTotal,
      status: 'pending',
      payment: payload.paymentMethod === 'cod' ? 'pending' : 'paid',
      city: payload.city || (shipping ? shipping.city : ''),
      address: fullAddress,
      shippingAddress: payload.shippingAddress || null,
      billingAddress: payload.billingAddress || null,
    });

    const newOrder = await savedOrder.save();

    // Fire email notifications via SMTP dynamically
    this.sendOrderEmail(newOrder, payload.paymentMethod || 'cod');

    return newOrder;
  }

  async updateStatus(orderId: string, status: string): Promise<Order | null> {
    const updateData: any = { status };
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'completed' || s === 'complete') {
      updateData.payment = 'paid';
    }
    return this.orderModel.findOneAndUpdate({ id: orderId }, { $set: updateData }, { new: true }).exec();
  }

  private async sendOrderEmail(order: Order, paymentMethod: string) {
    try {
      const emailUser = this.configService.get<string>('EMAIL_USER');
      if (!emailUser) return;

      console.log(`✉️ Sending luxury HTML invoice email for Order ${order.id}...`);

      const itemsRows = order.itemsDetails.map((item: any) => `
        <tr style="border-bottom: 1px solid #E8DFC8;">
          <td style="padding: 12px; font-size: 14px; color: #1A1208;"><strong>${item.name}</strong> (${item.size})</td>
          <td style="padding: 12px; font-size: 14px; color: #1A1208; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; font-size: 14px; color: #C9A84C; font-weight: bold; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const emailHtml = `
        <div style="font-family: 'Lato', sans-serif; background-color: #FFFDF7; padding: 40px 20px; color: #1A1208; max-width: 600px; margin: 0 auto; border: 1px solid #E8DFC8;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #C9A84C; padding-bottom: 20px;">
            <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; margin: 0; color: #1A1208; letter-spacing: 2px;">KIORA LIFE Style</h1>
            <span style="font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #C9A84C; display: block; margin-top: 5px;">The Art of Fragrance</span>
          </div>
          
          <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #8B6914; margin-top: 0; font-weight: 500;">Order Confirmed!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #4A3B1F;">
            Dear <strong>${order.customer}</strong>,<br />
            Thank you for shopping with KIORA. Your order has been placed successfully and is currently being processed. Here is your transaction summary:
          </p>
          
          <div style="background-color: #FAF6EE; padding: 15px; border-radius: 4px; border: 1px solid #E8DFC8; margin: 20px 0; font-size: 13px;">
            <table style="width: 100%;">
              <tr>
                <td style="color: #8A7A5A; padding: 3px 0;">Order Reference:</td>
                <td style="font-weight: bold; text-align: right; color: #1A1208;">${order.id}</td>
              </tr>
              <tr>
                <td style="color: #8A7A5A; padding: 3px 0;">Order Date:</td>
                <td style="text-align: right; color: #1A1208;">${order.date}</td>
              </tr>
              <tr>
                <td style="color: #8A7A5A; padding: 3px 0;">Payment Option:</td>
                <td style="text-align: right; text-transform: uppercase; color: #1A1208;">${paymentMethod}</td>
              </tr>
            </table>
          </div>
          
          <h3 style="font-family: 'Playfair Display', serif; font-size: 16px; color: #1A1208; border-bottom: 1px solid #C9A84C; padding-bottom: 5px; margin-top: 30px;">Items Purchased</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #FAF6EE; border-bottom: 1px solid #E8DFC8;">
                <th style="padding: 10px; font-size: 12px; color: #8A7A5A; text-align: left;">Fragrance Scent</th>
                <th style="padding: 10px; font-size: 12px; color: #8A7A5A; text-align: center; width: 60px;">Qty</th>
                <th style="padding: 10px; font-size: 12px; color: #8A7A5A; text-align: right; width: 100px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px 12px 5px; font-size: 14px; font-weight: bold; color: #1A1208;">Grand Total:</td>
                <td style="padding: 15px 12px 5px; font-size: 16px; font-weight: bold; color: #8B6914; text-align: right;">₹${order.total.toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
          
          <h3 style="font-family: 'Playfair Display', serif; font-size: 16px; color: #1A1208; border-bottom: 1px solid #C9A84C; padding-bottom: 5px; margin-top: 30px;">Shipping Location</h3>
          <p style="font-size: 13px; line-height: 1.6; color: #4A3B1F; background-color: #FAF6EE; padding: 15px; border-radius: 4px; border: 1px solid #E8DFC8;">
            ${order.address}
          </p>
          
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #E8DFC8; padding-top: 20px; font-size: 11px; color: #8A7A5A;">
            <p style="margin: 0;">© 2026 KIORA LIFE Style. All rights reserved.</p>
            <p style="margin: 5px 0 0;">Need assistance? Get in touch at <a href="mailto:${emailUser}" style="color: #C9A84C; text-decoration: none;">${emailUser}</a></p>
          </div>
        </div>
      `;

      await this.mailerService.sendMail({
        to: order.email,
        from: `KIORA LIFE Style <${emailUser}>`,
        subject: `✨ Order Placed Successfully — ${order.id}`,
        html: emailHtml,
      });

      console.log(`✅ Automated confirmation invoice email sent to ${order.email}.`);
    } catch (err) {
      console.error('❌ Failed to dispatch SMTP order confirmation email:', err);
    }
  }

  // ─── Razorpay: Create Order ────────────────────────────────────────────────
  async createRazorpayOrder(amountInRupees: number): Promise<any> {
    const razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    });

    const options = {
      amount: Math.round(amountInRupees * 100), // convert ₹ to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // auto capture
    };

    const order = await razorpay.orders.create(options);
    console.log(`💳 Razorpay order created: ${order.id} for ₹${amountInRupees}`);
    return order;
  }

  // ─── Razorpay: Verify Signature & Save Order ──────────────────────────────
  async verifyAndSaveOrder(payload: any): Promise<Order> {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = payload;

    // 1. Verify HMAC-SHA256 signature
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Razorpay signature mismatch! Possible tampered request.');
      throw new BadRequestException('Payment verification failed. Invalid signature.');
    }

    console.log(`✅ Razorpay payment signature verified for ${razorpay_payment_id}`);

    // 2. Build and save the order with payment='paid'
    const orders = await this.findAll();
    const orderNum = 2400 + orders.length + 1;
    const orderId = `KOR-${orderNum}`;

    const dateStr = new Date().toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });

    const shipping = orderData.shippingAddress;
    const fullAddress = shipping
      ? `${shipping.address1}${shipping.address2 ? ', ' + shipping.address2 : ''}, ${shipping.city}, ${shipping.state} - ${shipping.pincode}`
      : (orderData.address1
          ? `${orderData.address1}, ${orderData.city}, ${orderData.state} - ${orderData.pincode}`
          : orderData.address || 'Address not specified');

    const savedOrder = new this.orderModel({
      id: orderId,
      customerId: orderData.customerId || '',
      customer: orderData.customer || 'Guest Customer',
      email: orderData.email.toLowerCase(),
      date: dateStr,
      items: parseInt(orderData.itemsCount) || 1,
      itemsDetails: orderData.items || [],
      total: parseInt(orderData.total) || 0,
      status: 'pending',
      payment: 'paid',  // ← Razorpay payment confirmed
      city: orderData.city || (shipping ? shipping.city : ''),
      address: fullAddress,
      shippingAddress: orderData.shippingAddress || null,
      billingAddress: orderData.billingAddress || null,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    const newOrder = await savedOrder.save();

    // 3. Fire email confirmation
    this.sendOrderEmail(newOrder, orderData.paymentMethod || 'razorpay');

    return newOrder;
  }
}
