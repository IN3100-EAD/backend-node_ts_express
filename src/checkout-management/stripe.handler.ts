// STRIPE INSTANCE USING CLASS : OOP Approach

import Stripe from "stripe";
import { RequestWithUser } from "../types";

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

class StripeHandler {
  private stripe: Stripe;
  private secretKey: string | undefined;

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY;
    if (!this.secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not defined");
    }

    this.stripe = new Stripe(this.secretKey, {
      apiVersion: "2023-10-16",
    });
  }

  async createProduct(
    id: string,
    name: string,
    description: string,
    price: number,
    mainImage: string
  ) {
    await this.stripe.products.create({
      id: `prod_${id}`,
      name,
      description,
      images: [mainImage],
    });

    await this.stripe.prices.create({
      product: `prod_${id}`,
      unit_amount: price * 100,
      currency: "lkr",
    });
  }

  async updateProductPrice(id: string, price: number) {
    // GET PRICE ID
    const prices = await this.stripe.prices.list({
      product: `prod_${id}`,
    });
    const priceId = prices.data[0].id;

    // SET PRICE TO INACTIVE
    await this.stripe.prices.update(priceId, {
      active: false,
    });

    // CREATE NEW PRICE
    await this.stripe.prices.create({
      product: `prod_${id}`,
      unit_amount: price * 100,
      currency: "lkr",
    });
  }

  async createCheckoutSession(
    customer: string,
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    cartItems: string,
    customerIdMongo: string
  ) {
    const session =
      await this.stripe.checkout.sessions.create({
        customer,
        payment_method_types: ["card"],
        line_items: lineItems,
        metadata: {
          cart: cartItems,
          userId: customerIdMongo,
        },
        mode: "payment",
        shipping_address_collection: {
          allowed_countries: ["LK"],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: 0,
                currency: "lkr",
              },
              display_name: "Free shipping",
              // Delivers between 5-7 business days
              delivery_estimate: {
                minimum: {
                  unit: "business_day",
                  value: 3,
                },
                maximum: {
                  unit: "business_day",
                  value: 5,
                },
              },
            },
          },
          {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: 25000,
                currency: "lkr",
              },
              display_name: "Next day air",
              // Delivers in exactly 1 business day
              delivery_estimate: {
                minimum: {
                  unit: "business_day",
                  value: 1,
                },
                maximum: {
                  unit: "business_day",
                  value: 1,
                },
              },
            },
          },
        ],
        success_url: `${process.env.CLIENT_URL}/success`,
        cancel_url: `${process.env.CLIENT_URL}/cart`,
      });

    return session;
  }

  async createLineItem(id: string, quantity: number) {
    const prices = await this.stripe.prices.list({
      product: `prod_${id}`,
    });
    const priceId = prices.data[0].unit_amount || 0;

    return {
      price_data: {
        currency: "lkr",
        product: `prod_${id}`,
        unit_amount: priceId,
      },
      quantity: quantity,
    };
  }

  async createCustomer(
    email: string,
    phoneNumber: string,
    name: string
  ) {
    const customer = await this.stripe.customers.create({
      email,
      phone: phoneNumber,
      name,
    });

    return customer;
  }

  async addAdressToCustomer(
    id: string,
    custName: string,
    phoneNumber: string,
    address: Address
  ) {
    await this.stripe.customers.update(id, {
      shipping: {
        address: {
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        },
        name: custName,
        phone: phoneNumber,
      },
    });
  }

  async validateWebhook(
    endpointSecret: string,
    sig: string | string[] | Buffer,
    req: RequestWithUser
  ) {
    const event = this.stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );

    return event;
  }

  async updateCustomerMetaData(
    id: string,
    key: string,
    value: string
  ) {
    await this.stripe.customers.update(id, {
      metadata: {
        [key]: value,
      },
    });
  }
}

export default StripeHandler;
