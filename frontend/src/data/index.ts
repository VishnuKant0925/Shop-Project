import { Product, Service, Category } from '@/types';

export const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Spice Powders',
    slug: 'spice-powders',
    description: 'Premium quality ground spices',
    imageUrl: '/images/red-chili-powder.jpg',
  },
  {
    id: 'cat-2',
    name: 'Oils',
    slug: 'oils',
    description: 'Pure cold-pressed oils',
    imageUrl: '/images/mustard-oil.jpg',
  },
];

export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'Red Chili Powder',
    slug: 'red-chili-powder',
    description: 'Premium quality red chili powder made from hand-picked Mathania chilies. Known for its vibrant color, authentic aroma, and perfectly balanced heat that brings life to every dish. Stone-ground to preserve natural oils and flavor.',
    price: 280,
    unit: 'kg',
    stockQuantity: 50,
    imageUrl: '/images/red-chili-powder.jpg',
    categoryId: 'cat-1',
    isActive: true,
    badge: 'Bestseller',
  },
  {
    id: 'prod-2',
    name: 'Turmeric Powder',
    slug: 'turmeric-powder',
    description: 'Pure turmeric powder from the finest Lakadong turmeric roots. Rich in curcumin with a deep golden color and earthy flavor. Naturally processed without any additives or artificial coloring.',
    price: 220,
    unit: 'kg',
    stockQuantity: 40,
    imageUrl: '/images/turmeric-powder.jpg',
    categoryId: 'cat-1',
    isActive: true,
    badge: 'Pure',
  },
  {
    id: 'prod-3',
    name: 'Coriander Powder',
    slug: 'coriander-powder',
    description: 'Freshly ground coriander powder with a rich, citrusy aroma. Made from select coriander seeds that are carefully roasted and ground to perfection. Essential for authentic Indian gravies and curries.',
    price: 200,
    unit: 'kg',
    stockQuantity: 35,
    imageUrl: '/images/coriander-powder.jpg',
    categoryId: 'cat-1',
    isActive: true,
  },
  {
    id: 'prod-4',
    name: 'Mustard Oil',
    slug: 'mustard-oil',
    description: 'Pure cold-pressed mustard oil (Kachi Ghani) extracted from premium quality mustard seeds. Rich in omega-3 fatty acids with a distinctive pungent taste. Perfect for pickling, cooking, and traditional recipes.',
    price: 190,
    unit: 'litre',
    stockQuantity: 60,
    imageUrl: '/images/mustard-oil.jpg',
    categoryId: 'cat-2',
    isActive: true,
    badge: 'Cold Pressed',
  },
];

export const services: Service[] = [
  {
    id: 'srv-1',
    name: 'Mustard Oil Milling',
    slug: 'mustard-oil-milling',
    description: 'Get pure, cold-pressed mustard oil extracted from your own mustard seeds. Our traditional kachi ghani (cold-press) process preserves all nutrients and delivers authentic, pungent flavor.',
    rate: 15,
    rateUnit: 'per kg of seeds',
    imageUrl: '/images/mustard-oil.jpg',
    icon: '🫒',
    isActive: true,
    features: ['Cold-press extraction', 'No chemicals used', 'Retain natural nutrients', 'Same-day processing'],
  },
  {
    id: 'srv-2',
    name: 'Flour Milling (Atta Chakki)',
    slug: 'flour-milling',
    description: 'Fresh stone-ground flour from your wheat, bajra, or jowar. Our traditional chakki preserves the fiber, germ, and bran for wholesome, nutritious flour that makes softer rotis.',
    rate: 8,
    rateUnit: 'per kg',
    imageUrl: '/images/flour-milling.jpg',
    icon: '🌾',
    isActive: true,
    features: ['Stone-ground process', 'Multiple grain support', 'Preserves nutrients', 'Custom coarseness'],
  },
  {
    id: 'srv-3',
    name: 'Poha Milling',
    slug: 'poha-milling',
    description: 'Transform raw rice into light, fluffy poha (flattened rice). Perfect for making batches of fresh poha from your own rice. Available in thin and thick variants.',
    rate: 12,
    rateUnit: 'per kg of rice',
    imageUrl: '/images/flour-milling.jpg',
    icon: '🍚',
    isActive: true,
    features: ['Thin & thick variants', 'Hygienic process', 'Bulk orders welcome', 'Fresh same-day'],
  },
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
