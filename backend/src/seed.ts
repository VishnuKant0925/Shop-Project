import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './models/User';
import { Category } from './models/Category';
import { Product } from './models/Product';
import { Service } from './models/Service';

const seedDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pandit_mill';

  try {
    console.log('Connecting to MongoDB database for seeding...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Service.deleteMany({}),
    ]);

    // 1. Seed Users
    console.log('Seeding initial users...');
    const admin = await User.create({
      name: 'Asharfi Pandit (Admin)',
      email: 'asharfipandit844121@gmail.com',
      phone: '+91 9934787476',
      password: 'asharfi@123',
      role: 'admin',
    });

    const customer = await User.create({
      name: 'Ramesh Sharma',
      email: 'customer@newpandit.com',
      phone: '+91 99887 76655',
      password: 'customer123',
      role: 'customer',
    });

    console.log(`Created admin: ${admin.email} (password: admin123)`);
    console.log(`Created customer: ${customer.email} (password: customer123)`);

    // 2. Seed Categories
    console.log('Seeding categories...');
    const spiceCategory = await Category.create({
      name: 'Spice Powders',
      slug: 'spice-powders',
      description: 'Premium quality ground spices stone-milled under cool temperatures',
      imageUrl: '/images/red-chili-powder.jpg',
    });

    const oilCategory = await Category.create({
      name: 'Oils',
      slug: 'oils',
      description: 'Pure cold-pressed kachi ghani oils',
      imageUrl: '/images/mustard-oil.jpg',
    });

    console.log(`Created ${2} categories.`);

    // 3. Seed Products
    console.log('Seeding products...');
    await Product.create([
      {
        name: 'Red Chili Powder',
        slug: 'red-chili-powder',
        description:
          'Premium quality red chili powder made from hand-picked Mathania chilies. Known for its vibrant color, authentic aroma, and perfectly balanced heat that brings life to every dish. Stone-ground to preserve natural oils and flavor.',
        price: 280,
        unit: 'kg',
        stockQuantity: 50,
        imageUrl: '/images/red-chili-powder.jpg',
        category: spiceCategory._id,
        isActive: true,
        badge: 'Bestseller',
      },
      {
        name: 'Turmeric Powder',
        slug: 'turmeric-powder',
        description:
          'Pure turmeric powder from the finest Lakadong turmeric roots. Rich in curcumin with a deep golden color and earthy flavor. Naturally processed without any additives or artificial coloring.',
        price: 220,
        unit: 'kg',
        stockQuantity: 40,
        imageUrl: '/images/turmeric-powder.jpg',
        category: spiceCategory._id,
        isActive: true,
        badge: 'Pure',
      },
      {
        name: 'Coriander Powder',
        slug: 'coriander-powder',
        description:
          'Freshly ground coriander powder with a rich, citrusy aroma. Made from select coriander seeds that are carefully roasted and ground to perfection. Essential for authentic Indian gravies and curries.',
        price: 200,
        unit: 'kg',
        stockQuantity: 35,
        imageUrl: '/images/coriander-powder.jpg',
        category: spiceCategory._id,
        isActive: true,
      },
      {
        name: 'Mustard Oil',
        slug: 'mustard-oil',
        description:
          'Pure cold-pressed mustard oil (Kachi Ghani) extracted from premium quality mustard seeds. Rich in omega-3 fatty acids with a distinctive pungent taste. Perfect for pickling, cooking, and traditional recipes.',
        price: 190,
        unit: 'litre',
        stockQuantity: 60,
        imageUrl: '/images/mustard-oil.jpg',
        category: oilCategory._id,
        isActive: true,
        badge: 'Cold Pressed',
      },
    ]);
    console.log('Created 4 initial products.');

    // 4. Seed Services
    console.log('Seeding milling services...');
    await Service.create([
      {
        name: 'Mustard Oil Milling',
        slug: 'mustard-oil-milling',
        description:
          'Get pure, cold-pressed mustard oil extracted from your own mustard seeds. Our traditional kachi ghani (cold-press) process preserves all nutrients and delivers authentic, pungent flavor.',
        rate: 15,
        rateUnit: 'per kg of seeds',
        imageUrl: '/images/mustard-oil.jpg',
        icon: '🫒',
        isActive: true,
        features: [
          'Cold-press extraction',
          'No chemicals used',
          'Retain natural nutrients',
          'Same-day processing',
        ],
      },
      {
        name: 'Flour Milling (Atta Chakki)',
        slug: 'flour-milling',
        description:
          'Fresh stone-ground flour from your wheat, bajra, or jowar. Our traditional chakki preserves the fiber, germ, and bran for wholesome, nutritious flour that makes softer rotis.',
        rate: 8,
        rateUnit: 'per kg',
        imageUrl: '/images/flour-milling.jpg',
        icon: '🌾',
        isActive: true,
        features: [
          'Stone-ground process',
          'Multiple grain support',
          'Preserves nutrients',
          'Custom coarseness',
        ],
      },
      {
        name: 'Poha Milling',
        slug: 'poha-milling',
        description:
          'Transform raw rice into light, fluffy poha (flattened rice). Perfect for making batches of fresh poha from your own rice. Available in thin and thick variants.',
        rate: 12,
        rateUnit: 'per kg of rice',
        imageUrl: '/images/flour-milling.jpg',
        icon: '🍚',
        isActive: true,
        features: [
          'Thin & thick variants',
          'Hygienic process',
          'Bulk orders welcome',
          'Fresh same-day',
        ],
      },
    ]);
    console.log('Created 3 initial milling services.');

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
