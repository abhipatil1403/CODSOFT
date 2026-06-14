import { connectDB } from './db.js';
import Product from './models/Product.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

const products = [
  {
    name: 'Jaipur Blue Pottery Vase',
    description: 'A traditional hand-glazed vase crafted by master artisans in Jaipur, Rajasthan. Using the historic cobalt-blue dye technique, this pottery is unique because it does not use clay—instead, it is made from quartz stone powder, raw glaze, and multani mitti.',
    price: 1850,
    images: [
      '/jaipur_vase.png'
    ],
    category: 'Decor',
    stock: 8,
    features: [
      'Genuine hand-painted cobalt blue pottery',
      'Crafted in Jaipur, Rajasthan',
      'No clay construction (pure quartz & natural glaze)',
      'Dimensions: 25cm height'
    ]
  },
  {
    name: 'Chanderi Silk Throw',
    description: 'A luxurious throw handwoven in Chanderi, Madhya Pradesh. Known for its lightweight sheer texture and glossy transparency, this throw blends fine silk yarn with gold zari borders, adding an understated elegance to any living room sofa or study chair.',
    price: 4200,
    images: [
      '/chanderi_saree.png'
    ],
    category: 'Textiles',
    stock: 6,
    features: [
      'Blend of pure mulberry silk and fine cotton',
      'Woven by traditional handloom weavers in Madhya Pradesh',
      'Intricate gold zari borders',
      'Dry clean only'
    ]
  },
  {
    name: 'Mysore Sandalwood Incense Set',
    description: 'Hand-rolled sticks prepared with pure Mysore sandalwood powder, natural resins, and essential oils. Captures a rich, warm, woody aroma that cleanses the environment and aids deep meditation. Includes a solid brass dome holder.',
    price: 480,
    images: [
      '/sandalwood_incense.png'
    ],
    category: 'Wellness',
    stock: 25,
    features: [
      '100% natural, chemical-free ingredients',
      'Made with authentic Mysore sandalwood paste',
      'Set of 40 incense sticks',
      'Solid brass holder included'
    ]
  },
  {
    name: 'Brass Kumkum & Incense Tray',
    description: 'A heavy, solid brass ritual tray featuring modern clean lines. Crafted using traditional sand-casting techniques in Moradabad, the brassware capital of India. Designed to acquire a beautiful antiqued patina over time.',
    price: 1550,
    images: [
      '/kumkum_incense.png'
    ],
    category: 'Decor',
    stock: 10,
    features: [
      '100% solid brass construction',
      'Handmade in Moradabad, Uttar Pradesh',
      'Brushed matte exterior finish',
      'Weight: 650g'
    ]
  },
  {
    name: 'Dhurrie Handwoven Rug',
    description: 'A flat-weave floor covering handwoven by rural weavers in Mirzapur. Styled with geometric block shapes, it features durable organic cotton fibers that are cool in summer and warm in winter.',
    price: 3800,
    images: [
      '/dhurrie_handwoven.png'
    ],
    category: 'Textiles',
    stock: 4,
    features: [
      'Flat-weave technique on traditional pit-looms',
      '100% organic, hand-spun cotton yarn',
      'Washable and highly durable',
      'Size: 4ft x 6ft'
    ]
  },
  {
    name: 'Indigo Block-Print Cushion Set',
    description: 'A set of three cushion covers featuring hand-block prints using natural indigo extract. Crafted in Bagru, Rajasthan, by artisans using carved teakwood blocks to print traditional geometric motifs.',
    price: 1250,
    images: [
      '/indigo_block_print.png'
    ],
    category: 'Textiles',
    stock: 14,
    features: [
      'Made from heavy woven khadi cotton',
      'Hand-printed using organic indigo dye blocks',
      'Hidden zipper design',
      'Set of 3 covers (16x16 inches)'
    ]
  },
  {
    name: 'Kashmiri Kahwa Tea Blend',
    description: 'A sensory blend of green tea leaves, saffron strands, green cardamom pods, cloves, and cinnamon bark sourced directly from Srinagar, Jammu & Kashmir. Traditionally served warm with slivered almonds.',
    price: 890,
    images: [
      '/kashmiri_kahwa.png'
    ],
    category: 'Wellness',
    stock: 30,
    features: [
      'Premium loose leaf green tea base',
      'Infused with pure Pampore saffron strands',
      'Aromatically spiced, rich in antioxidants',
      '150g tin container'
    ]
  },
  {
    name: 'White Marble Carving Catch-all',
    description: 'An elegant shallow bowl carved from pure white Makrana marble—the same stone used to build the Taj Mahal. The bowl features a hand-chiseled scalloped rim honoring classical Mughal motifs.',
    price: 2400,
    images: [
      '/white_marble.png'
    ],
    category: 'Decor',
    stock: 7,
    features: [
      'Carved from a single piece of Makrana marble',
      'Delicately hand-scalloped rim details',
      'Ideal for keys, jewelry, or floral displays',
      'Polished interior, raw-textured exterior'
    ]
  }
];

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products.');

    // Insert products
    await Product.insertMany(products);
    console.log('Seeded accurate Indian products successfully!');

    // Add a default user if not existing
    const adminExists = await User.findOne({ email: 'admin@kaar.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      await User.create({
        name: 'KAAR Curator',
        email: 'admin@kaar.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Created default admin account: admin@kaar.com / password123');
    }

    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
