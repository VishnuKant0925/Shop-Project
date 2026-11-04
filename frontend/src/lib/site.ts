// Single source of truth for business details used in metadata, structured data and UI.
export const siteConfig = {
  name: 'New Pandit Masala & Tel Mill',
  shortName: 'New Pandit Mill',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://newpanditmasala.shop').replace(/\/$/, ''),
  description:
    'Buy pure cold-pressed (Kachi Ghani) mustard oil and stone-ground turmeric, red chilli and coriander powder from New Pandit Masala & Tel Mill, Lalganj, Vaishali. Custom oil expelling, atta chakki and poha milling services. FSSAI certified.',
  ogImage: '/images/hero-banner.jpg',
  phones: ['+919934787476', '+918226889960'],
  phoneDisplay: '+91 99347 87476',
  whatsapp: 'https://wa.me/919934787476',
  email: 'asharfipandit844121@gmail.com',
  address: {
    street: 'Vaishali Bus Stand Road',
    locality: 'Lalganj',
    region: 'Bihar',
    postalCode: '844121',
    country: 'IN',
  },
  hours: { opens: '08:00', closes: '21:00' },
};

export const absoluteUrl = (path = '/') => `${siteConfig.url}${path.startsWith('/') ? path : `/${path}`}`;
