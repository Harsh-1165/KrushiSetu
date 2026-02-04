// Mock data for marketplace
export interface MarketplaceProduct {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  category: string
  subcategory?: string
  price: {
    current: number
    mrp?: number
    unit: string
    currency: string
    negotiable: boolean
  }
  inventory: {
    available: number
    minOrder: number
    maxOrder: number
    sold: number
  }
  attributes: {
    variety?: string
    grade?: string
    isOrganic: boolean
    harvestDate?: string
    expiryDate?: string
    storageInstructions?: string
  }
  images: Array<{
    url: string
    alt: string
    isPrimary: boolean
  }>
  location: {
    state: string
    district: string
  }
  shipping: {
    available: boolean
    freeShippingAbove?: number
    estimatedDays: { min: number; max: number }
  }
  ratings: {
    average: number
    count: number
    distribution: { [key: number]: number }
  }
  seller: {
    _id: string
    name: { first: string; last: string }
    avatar?: string
    farmName: string
    rating: number
    totalProducts: number
    totalSales: number
    memberSince: string
    location: string
    isVerified: boolean
  }
  reviews: Array<{
    _id: string
    reviewer: { name: string; avatar?: string }
    rating: number
    title: string
    content: string
    date: string
    isVerifiedPurchase: boolean
    helpfulCount: number
    images?: string[]
  }>
  tags: string[]
  views: number
  status: string
  createdAt: string
}

export const categories = [
  { name: "grains", label: "Grains & Cereals", count: 156 },
  { name: "vegetables", label: "Fresh Vegetables", count: 234 },
  { name: "fruits", label: "Fruits", count: 189 },
  { name: "pulses", label: "Pulses & Lentils", count: 78 },
  { name: "spices", label: "Spices", count: 112 },
  { name: "dairy", label: "Dairy Products", count: 45 },
  { name: "organic", label: "Organic Products", count: 167 },
  { name: "seeds", label: "Seeds", count: 89 },
]

export const locations = [
  { state: "Maharashtra", districts: ["Pune", "Mumbai", "Nashik", "Nagpur"] },
  { state: "Karnataka", districts: ["Bangalore", "Mysore", "Hubli", "Mangalore"] },
  { state: "Tamil Nadu", districts: ["Chennai", "Coimbatore", "Madurai", "Salem"] },
  { state: "Gujarat", districts: ["Ahmedabad", "Surat", "Vadodara", "Rajkot"] },
  { state: "Punjab", districts: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"] },
  { state: "Uttar Pradesh", districts: ["Lucknow", "Kanpur", "Varanasi", "Agra"] },
]

export const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
  { value: "bestselling", label: "Best Selling" },
]

// Generate mock products
export const mockProducts: MarketplaceProduct[] = [
  {
    _id: "prod_1",
    name: "Premium Organic Basmati Rice",
    slug: "premium-organic-basmati-rice",
    description: "Premium quality organic Basmati rice grown in the fertile plains of Punjab. This long-grain aromatic rice is perfect for biryanis, pulaos, and everyday meals. Our rice is cultivated using traditional farming methods without any pesticides or chemical fertilizers, ensuring you get the purest and healthiest grain for your family. Each grain is carefully aged for 12 months to enhance its aroma and elongation properties.",
    shortDescription: "Premium aged organic Basmati rice from Punjab farms",
    category: "grains",
    subcategory: "rice",
    price: {
      current: 180,
      mrp: 220,
      unit: "kg",
      currency: "INR",
      negotiable: true,
    },
    inventory: {
      available: 500,
      minOrder: 1,
      maxOrder: 100,
      sold: 1250,
    },
    attributes: {
      variety: "Basmati 1121",
      grade: "premium",
      isOrganic: true,
      harvestDate: "2024-11-15",
      expiryDate: "2026-11-15",
      storageInstructions: "Store in a cool, dry place in an airtight container",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Basmati Rice", isPrimary: true },
      { url: "/placeholder.svg?height=600&width=600", alt: "Rice grains closeup", isPrimary: false },
      { url: "/placeholder.svg?height=600&width=600", alt: "Packaging", isPrimary: false },
    ],
    location: {
      state: "Punjab",
      district: "Amritsar",
    },
    shipping: {
      available: true,
      freeShippingAbove: 500,
      estimatedDays: { min: 3, max: 5 },
    },
    ratings: {
      average: 4.8,
      count: 234,
      distribution: { 5: 180, 4: 40, 3: 10, 2: 3, 1: 1 },
    },
    seller: {
      _id: "seller_1",
      name: { first: "Gurpreet", last: "Singh" },
      avatar: "/placeholder.svg",
      farmName: "Golden Harvest Farms",
      rating: 4.9,
      totalProducts: 24,
      totalSales: 3450,
      memberSince: "2021-03-15",
      location: "Amritsar, Punjab",
      isVerified: true,
    },
    reviews: [
      {
        _id: "rev_1",
        reviewer: { name: "Rahul M.", avatar: "/placeholder.svg" },
        rating: 5,
        title: "Best Basmati I've ever had!",
        content: "The aroma is incredible and each grain cooks perfectly. Will definitely order again.",
        date: "2024-12-10",
        isVerifiedPurchase: true,
        helpfulCount: 45,
      },
      {
        _id: "rev_2",
        reviewer: { name: "Priya S." },
        rating: 5,
        title: "Excellent quality",
        content: "Fresh and aromatic. My family loved it. Quick delivery too!",
        date: "2024-12-08",
        isVerifiedPurchase: true,
        helpfulCount: 32,
      },
      {
        _id: "rev_3",
        reviewer: { name: "Amit K.", avatar: "/placeholder.svg" },
        rating: 4,
        title: "Good rice, slightly pricey",
        content: "Quality is top-notch but a bit expensive. However, worth it for special occasions.",
        date: "2024-12-05",
        isVerifiedPurchase: true,
        helpfulCount: 18,
      },
    ],
    tags: ["organic", "basmati", "rice", "punjab", "premium"],
    views: 3456,
    status: "active",
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    _id: "prod_2",
    name: "Fresh Organic Tomatoes",
    slug: "fresh-organic-tomatoes",
    description: "Vine-ripened organic tomatoes freshly harvested from our farm in Maharashtra. Rich in flavor and nutrients, these tomatoes are perfect for salads, cooking, and making fresh sauces. Grown without pesticides using sustainable farming practices.",
    shortDescription: "Farm-fresh organic tomatoes from Maharashtra",
    category: "vegetables",
    subcategory: "tomatoes",
    price: {
      current: 60,
      mrp: 80,
      unit: "kg",
      currency: "INR",
      negotiable: false,
    },
    inventory: {
      available: 200,
      minOrder: 1,
      maxOrder: 50,
      sold: 890,
    },
    attributes: {
      variety: "Hybrid Cherry",
      grade: "A",
      isOrganic: true,
      harvestDate: "2024-12-18",
      expiryDate: "2024-12-28",
      storageInstructions: "Keep refrigerated for best freshness",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Fresh Tomatoes", isPrimary: true },
      { url: "/placeholder.svg?height=600&width=600", alt: "Tomato vine", isPrimary: false },
    ],
    location: {
      state: "Maharashtra",
      district: "Nashik",
    },
    shipping: {
      available: true,
      freeShippingAbove: 300,
      estimatedDays: { min: 1, max: 2 },
    },
    ratings: {
      average: 4.6,
      count: 156,
      distribution: { 5: 100, 4: 40, 3: 12, 2: 3, 1: 1 },
    },
    seller: {
      _id: "seller_2",
      name: { first: "Suresh", last: "Patil" },
      avatar: "/placeholder.svg",
      farmName: "Green Valley Organics",
      rating: 4.7,
      totalProducts: 18,
      totalSales: 2100,
      memberSince: "2022-06-20",
      location: "Nashik, Maharashtra",
      isVerified: true,
    },
    reviews: [
      {
        _id: "rev_4",
        reviewer: { name: "Sunita D." },
        rating: 5,
        title: "So fresh and tasty!",
        content: "These tomatoes taste like the ones from my grandmother's garden. Absolutely delicious!",
        date: "2024-12-15",
        isVerifiedPurchase: true,
        helpfulCount: 28,
      },
    ],
    tags: ["organic", "tomatoes", "vegetables", "fresh", "nashik"],
    views: 2134,
    status: "active",
    createdAt: "2024-02-10T08:15:00Z",
  },
  {
    _id: "prod_3",
    name: "Alphonso Mangoes (Hapus)",
    slug: "alphonso-mangoes-hapus",
    description: "Premium Ratnagiri Alphonso mangoes, known as the king of mangoes. These GI-tagged Hapus mangoes are famous for their rich, creamy texture and sweet, aromatic flavor. Directly sourced from Ratnagiri orchards. Available during season (April-June).",
    shortDescription: "Premium GI-tagged Ratnagiri Alphonso mangoes",
    category: "fruits",
    subcategory: "mangoes",
    price: {
      current: 800,
      mrp: 1000,
      unit: "dozen",
      currency: "INR",
      negotiable: true,
    },
    inventory: {
      available: 150,
      minOrder: 1,
      maxOrder: 20,
      sold: 567,
    },
    attributes: {
      variety: "Alphonso/Hapus",
      grade: "premium",
      isOrganic: false,
      harvestDate: "2024-04-20",
      storageInstructions: "Store at room temperature until ripe, then refrigerate",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Alphonso Mangoes", isPrimary: true },
      { url: "/placeholder.svg?height=600&width=600", alt: "Mango box", isPrimary: false },
    ],
    location: {
      state: "Maharashtra",
      district: "Ratnagiri",
    },
    shipping: {
      available: true,
      freeShippingAbove: 2000,
      estimatedDays: { min: 2, max: 4 },
    },
    ratings: {
      average: 4.9,
      count: 312,
      distribution: { 5: 280, 4: 25, 3: 5, 2: 1, 1: 1 },
    },
    seller: {
      _id: "seller_3",
      name: { first: "Rajesh", last: "Deshmukh" },
      avatar: "/placeholder.svg",
      farmName: "Konkan Fruit Gardens",
      rating: 4.9,
      totalProducts: 8,
      totalSales: 1890,
      memberSince: "2020-01-10",
      location: "Ratnagiri, Maharashtra",
      isVerified: true,
    },
    reviews: [
      {
        _id: "rev_5",
        reviewer: { name: "Vikram J.", avatar: "/placeholder.svg" },
        rating: 5,
        title: "The real deal!",
        content: "Authentic Ratnagiri Alphonso. The taste and aroma are unmatched. Best mangoes I've had in years!",
        date: "2024-05-10",
        isVerifiedPurchase: true,
        helpfulCount: 89,
      },
    ],
    tags: ["alphonso", "hapus", "mangoes", "ratnagiri", "fruits", "premium"],
    views: 5678,
    status: "active",
    createdAt: "2024-03-01T09:00:00Z",
  },
  {
    _id: "prod_4",
    name: "Farm Fresh Potatoes",
    slug: "farm-fresh-potatoes",
    description: "High-quality potatoes freshly harvested from farms in Uttar Pradesh. Perfect for all your cooking needs - from crispy fries to creamy mashed potatoes. Our potatoes are sorted and graded to ensure consistent quality.",
    shortDescription: "Fresh premium quality potatoes from UP farms",
    category: "vegetables",
    subcategory: "root-vegetables",
    price: {
      current: 35,
      mrp: 45,
      unit: "kg",
      currency: "INR",
      negotiable: true,
    },
    inventory: {
      available: 1000,
      minOrder: 5,
      maxOrder: 200,
      sold: 4560,
    },
    attributes: {
      variety: "Kufri Jyoti",
      grade: "A",
      isOrganic: false,
      harvestDate: "2024-12-10",
      storageInstructions: "Store in a cool, dark, well-ventilated place",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Fresh Potatoes", isPrimary: true },
    ],
    location: {
      state: "Uttar Pradesh",
      district: "Agra",
    },
    shipping: {
      available: true,
      freeShippingAbove: 500,
      estimatedDays: { min: 2, max: 4 },
    },
    ratings: {
      average: 4.4,
      count: 567,
      distribution: { 5: 300, 4: 180, 3: 60, 2: 20, 1: 7 },
    },
    seller: {
      _id: "seller_4",
      name: { first: "Ravi", last: "Kumar" },
      farmName: "Kisan Fresh Produce",
      rating: 4.5,
      totalProducts: 32,
      totalSales: 8900,
      memberSince: "2019-08-15",
      location: "Agra, Uttar Pradesh",
      isVerified: true,
    },
    reviews: [],
    tags: ["potatoes", "vegetables", "fresh", "bulk"],
    views: 3456,
    status: "active",
    createdAt: "2024-01-05T11:30:00Z",
  },
  {
    _id: "prod_5",
    name: "Organic Turmeric Powder",
    slug: "organic-turmeric-powder",
    description: "100% pure organic turmeric powder made from hand-picked turmeric roots from Erode, Tamil Nadu - the turmeric capital of India. High curcumin content with vibrant golden color. Perfect for cooking and health remedies.",
    shortDescription: "Pure Erode organic turmeric with high curcumin",
    category: "spices",
    subcategory: "turmeric",
    price: {
      current: 250,
      mrp: 320,
      unit: "kg",
      currency: "INR",
      negotiable: false,
    },
    inventory: {
      available: 300,
      minOrder: 1,
      maxOrder: 50,
      sold: 1890,
    },
    attributes: {
      variety: "Erode Turmeric",
      grade: "premium",
      isOrganic: true,
      harvestDate: "2024-10-15",
      expiryDate: "2026-10-15",
      storageInstructions: "Store in airtight container away from moisture",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Turmeric Powder", isPrimary: true },
      { url: "/placeholder.svg?height=600&width=600", alt: "Turmeric roots", isPrimary: false },
    ],
    location: {
      state: "Tamil Nadu",
      district: "Erode",
    },
    shipping: {
      available: true,
      freeShippingAbove: 400,
      estimatedDays: { min: 3, max: 5 },
    },
    ratings: {
      average: 4.7,
      count: 423,
      distribution: { 5: 320, 4: 80, 3: 18, 2: 3, 1: 2 },
    },
    seller: {
      _id: "seller_5",
      name: { first: "Lakshmi", last: "Narayanan" },
      avatar: "/placeholder.svg",
      farmName: "Spice Heritage Farms",
      rating: 4.8,
      totalProducts: 15,
      totalSales: 5670,
      memberSince: "2020-05-20",
      location: "Erode, Tamil Nadu",
      isVerified: true,
    },
    reviews: [
      {
        _id: "rev_6",
        reviewer: { name: "Meera R." },
        rating: 5,
        title: "Authentic quality",
        content: "The color and aroma are amazing. You can tell this is genuine Erode turmeric. Great for golden milk!",
        date: "2024-11-20",
        isVerifiedPurchase: true,
        helpfulCount: 56,
      },
    ],
    tags: ["organic", "turmeric", "spices", "erode", "health"],
    views: 2890,
    status: "active",
    createdAt: "2024-02-20T14:00:00Z",
  },
  {
    _id: "prod_6",
    name: "Fresh Farm Eggs",
    slug: "fresh-farm-eggs",
    description: "Free-range farm fresh eggs from happy hens raised in natural environment. Rich in nutrients with bright orange yolks. Our hens are fed organic feed and have access to open pastures.",
    shortDescription: "Free-range eggs from naturally raised hens",
    category: "dairy",
    subcategory: "eggs",
    price: {
      current: 90,
      mrp: 110,
      unit: "dozen",
      currency: "INR",
      negotiable: false,
    },
    inventory: {
      available: 500,
      minOrder: 1,
      maxOrder: 30,
      sold: 2340,
    },
    attributes: {
      grade: "A",
      isOrganic: true,
      harvestDate: "2024-12-19",
      expiryDate: "2025-01-10",
      storageInstructions: "Refrigerate immediately upon receipt",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Fresh Eggs", isPrimary: true },
    ],
    location: {
      state: "Karnataka",
      district: "Bangalore",
    },
    shipping: {
      available: true,
      freeShippingAbove: 300,
      estimatedDays: { min: 1, max: 2 },
    },
    ratings: {
      average: 4.5,
      count: 289,
      distribution: { 5: 180, 4: 80, 3: 20, 2: 6, 1: 3 },
    },
    seller: {
      _id: "seller_6",
      name: { first: "Venkat", last: "Reddy" },
      farmName: "Happy Hens Farm",
      rating: 4.6,
      totalProducts: 6,
      totalSales: 3450,
      memberSince: "2021-09-01",
      location: "Bangalore, Karnataka",
      isVerified: true,
    },
    reviews: [],
    tags: ["eggs", "free-range", "organic", "farm-fresh", "protein"],
    views: 1890,
    status: "active",
    createdAt: "2024-03-15T07:00:00Z",
  },
  {
    _id: "prod_7",
    name: "Moong Dal (Split Green Gram)",
    slug: "moong-dal-split-green-gram",
    description: "Premium quality split moong dal sourced from the best farms in Madhya Pradesh. Easy to cook, highly nutritious, and perfect for dal, khichdi, and various Indian dishes. Carefully cleaned and sorted for uniform quality.",
    shortDescription: "Premium split moong dal from MP",
    category: "pulses",
    subcategory: "dal",
    price: {
      current: 140,
      mrp: 170,
      unit: "kg",
      currency: "INR",
      negotiable: true,
    },
    inventory: {
      available: 400,
      minOrder: 1,
      maxOrder: 50,
      sold: 1670,
    },
    attributes: {
      grade: "premium",
      isOrganic: false,
      harvestDate: "2024-09-20",
      expiryDate: "2025-09-20",
      storageInstructions: "Store in cool, dry place in airtight container",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Moong Dal", isPrimary: true },
    ],
    location: {
      state: "Madhya Pradesh",
      district: "Indore",
    },
    shipping: {
      available: true,
      freeShippingAbove: 500,
      estimatedDays: { min: 3, max: 5 },
    },
    ratings: {
      average: 4.6,
      count: 198,
      distribution: { 5: 140, 4: 45, 3: 10, 2: 2, 1: 1 },
    },
    seller: {
      _id: "seller_7",
      name: { first: "Anil", last: "Joshi" },
      farmName: "Malwa Grains",
      rating: 4.7,
      totalProducts: 20,
      totalSales: 4560,
      memberSince: "2020-11-10",
      location: "Indore, Madhya Pradesh",
      isVerified: true,
    },
    reviews: [],
    tags: ["moong", "dal", "pulses", "protein", "healthy"],
    views: 1456,
    status: "active",
    createdAt: "2024-01-25T12:00:00Z",
  },
  {
    _id: "prod_8",
    name: "Organic Green Spinach",
    slug: "organic-green-spinach",
    description: "Fresh organic spinach leaves harvested daily from our hydroponic farm. Rich in iron, vitamins, and antioxidants. Perfect for salads, smoothies, and cooking. Grown without pesticides in a controlled environment.",
    shortDescription: "Fresh hydroponic organic spinach",
    category: "vegetables",
    subcategory: "leafy-greens",
    price: {
      current: 45,
      mrp: 60,
      unit: "bunch",
      currency: "INR",
      negotiable: false,
    },
    inventory: {
      available: 150,
      minOrder: 1,
      maxOrder: 20,
      sold: 890,
    },
    attributes: {
      variety: "Baby Spinach",
      grade: "A",
      isOrganic: true,
      harvestDate: "2024-12-20",
      storageInstructions: "Keep refrigerated, consume within 3-4 days",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Fresh Spinach", isPrimary: true },
    ],
    location: {
      state: "Maharashtra",
      district: "Pune",
    },
    shipping: {
      available: true,
      freeShippingAbove: 200,
      estimatedDays: { min: 1, max: 1 },
    },
    ratings: {
      average: 4.8,
      count: 156,
      distribution: { 5: 130, 4: 20, 3: 5, 2: 1, 1: 0 },
    },
    seller: {
      _id: "seller_8",
      name: { first: "Priya", last: "Sharma" },
      avatar: "/placeholder.svg",
      farmName: "Urban Greens Hydroponics",
      rating: 4.8,
      totalProducts: 12,
      totalSales: 2340,
      memberSince: "2022-03-01",
      location: "Pune, Maharashtra",
      isVerified: true,
    },
    reviews: [],
    tags: ["spinach", "organic", "leafy", "healthy", "iron-rich"],
    views: 1234,
    status: "active",
    createdAt: "2024-04-10T09:30:00Z",
  },
  {
    _id: "prod_9",
    name: "Premium Cashew Nuts",
    slug: "premium-cashew-nuts",
    description: "Grade W320 premium whole cashew nuts from Goa. Creamy, crunchy, and fresh. Ideal for snacking, cooking, and making sweets. Sourced directly from Goan cashew processing units.",
    shortDescription: "W320 grade whole cashews from Goa",
    category: "organic",
    subcategory: "dry-fruits",
    price: {
      current: 950,
      mrp: 1100,
      unit: "kg",
      currency: "INR",
      negotiable: true,
    },
    inventory: {
      available: 100,
      minOrder: 1,
      maxOrder: 20,
      sold: 456,
    },
    attributes: {
      variety: "W320",
      grade: "premium",
      isOrganic: false,
      harvestDate: "2024-08-15",
      expiryDate: "2025-08-15",
      storageInstructions: "Store in airtight container in cool, dry place",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Cashew Nuts", isPrimary: true },
    ],
    location: {
      state: "Goa",
      district: "North Goa",
    },
    shipping: {
      available: true,
      freeShippingAbove: 1500,
      estimatedDays: { min: 3, max: 5 },
    },
    ratings: {
      average: 4.7,
      count: 134,
      distribution: { 5: 100, 4: 25, 3: 7, 2: 1, 1: 1 },
    },
    seller: {
      _id: "seller_9",
      name: { first: "Anthony", last: "Fernandes" },
      farmName: "Goan Cashew Exports",
      rating: 4.8,
      totalProducts: 5,
      totalSales: 1230,
      memberSince: "2021-06-15",
      location: "North Goa, Goa",
      isVerified: true,
    },
    reviews: [],
    tags: ["cashews", "dry-fruits", "snacks", "premium", "goa"],
    views: 2345,
    status: "active",
    createdAt: "2024-02-05T10:00:00Z",
  },
  {
    _id: "prod_10",
    name: "Organic Wheat Flour (Atta)",
    slug: "organic-wheat-flour-atta",
    description: "Stone-ground organic whole wheat flour made from premium Sharbati wheat. Perfect for making soft rotis and parathas. Retains all natural nutrients and fiber. Chemical-free processing.",
    shortDescription: "Stone-ground organic Sharbati wheat atta",
    category: "grains",
    subcategory: "flour",
    price: {
      current: 65,
      mrp: 80,
      unit: "kg",
      currency: "INR",
      negotiable: true,
    },
    inventory: {
      available: 800,
      minOrder: 5,
      maxOrder: 100,
      sold: 3450,
    },
    attributes: {
      variety: "Sharbati",
      grade: "premium",
      isOrganic: true,
      harvestDate: "2024-04-10",
      expiryDate: "2025-04-10",
      storageInstructions: "Store in airtight container in cool, dry place",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Wheat Flour", isPrimary: true },
    ],
    location: {
      state: "Madhya Pradesh",
      district: "Sehore",
    },
    shipping: {
      available: true,
      freeShippingAbove: 500,
      estimatedDays: { min: 3, max: 5 },
    },
    ratings: {
      average: 4.5,
      count: 567,
      distribution: { 5: 380, 4: 140, 3: 35, 2: 10, 1: 2 },
    },
    seller: {
      _id: "seller_10",
      name: { first: "Ramesh", last: "Patel" },
      farmName: "Organic Mills MP",
      rating: 4.6,
      totalProducts: 10,
      totalSales: 7890,
      memberSince: "2019-04-20",
      location: "Sehore, Madhya Pradesh",
      isVerified: true,
    },
    reviews: [],
    tags: ["wheat", "atta", "flour", "organic", "sharbati"],
    views: 4567,
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    _id: "prod_11",
    name: "Fresh Onions",
    slug: "fresh-onions",
    description: "Premium quality fresh onions from Nasik, the onion capital of India. Medium-sized, firm, and pungent. Perfect for all Indian cooking. Sorted and graded for consistent quality.",
    shortDescription: "Premium Nasik onions",
    category: "vegetables",
    subcategory: "onions",
    price: {
      current: 40,
      mrp: 50,
      unit: "kg",
      currency: "INR",
      negotiable: true,
    },
    inventory: {
      available: 2000,
      minOrder: 5,
      maxOrder: 500,
      sold: 8900,
    },
    attributes: {
      variety: "Red Onion",
      grade: "A",
      isOrganic: false,
      harvestDate: "2024-12-01",
      storageInstructions: "Store in cool, dry, well-ventilated place",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "Fresh Onions", isPrimary: true },
    ],
    location: {
      state: "Maharashtra",
      district: "Nashik",
    },
    shipping: {
      available: true,
      freeShippingAbove: 500,
      estimatedDays: { min: 2, max: 4 },
    },
    ratings: {
      average: 4.3,
      count: 789,
      distribution: { 5: 450, 4: 230, 3: 80, 2: 20, 1: 9 },
    },
    seller: {
      _id: "seller_11",
      name: { first: "Prakash", last: "More" },
      farmName: "Nashik Vegetables",
      rating: 4.4,
      totalProducts: 15,
      totalSales: 12340,
      memberSince: "2018-06-01",
      location: "Nashik, Maharashtra",
      isVerified: true,
    },
    reviews: [],
    tags: ["onions", "vegetables", "nashik", "bulk"],
    views: 5678,
    status: "active",
    createdAt: "2024-01-02T07:00:00Z",
  },
  {
    _id: "prod_12",
    name: "A2 Desi Cow Milk",
    slug: "a2-desi-cow-milk",
    description: "Pure A2 milk from indigenous Gir cows. Rich in A2 beta-casein protein, easier to digest. Our cows are grass-fed and raised in natural environment. Delivered fresh daily.",
    shortDescription: "Pure A2 milk from Gir cows",
    category: "dairy",
    subcategory: "milk",
    price: {
      current: 80,
      mrp: 90,
      unit: "liter",
      currency: "INR",
      negotiable: false,
    },
    inventory: {
      available: 100,
      minOrder: 1,
      maxOrder: 10,
      sold: 3456,
    },
    attributes: {
      variety: "Gir Cow A2",
      grade: "premium",
      isOrganic: true,
      harvestDate: "2024-12-20",
      expiryDate: "2024-12-23",
      storageInstructions: "Keep refrigerated at 4°C",
    },
    images: [
      { url: "/placeholder.svg?height=600&width=600", alt: "A2 Milk", isPrimary: true },
    ],
    location: {
      state: "Gujarat",
      district: "Ahmedabad",
    },
    shipping: {
      available: true,
      freeShippingAbove: 200,
      estimatedDays: { min: 1, max: 1 },
    },
    ratings: {
      average: 4.9,
      count: 234,
      distribution: { 5: 210, 4: 20, 3: 3, 2: 1, 1: 0 },
    },
    seller: {
      _id: "seller_12",
      name: { first: "Jayesh", last: "Patel" },
      avatar: "/placeholder.svg",
      farmName: "Gir Gaushala",
      rating: 4.9,
      totalProducts: 8,
      totalSales: 5670,
      memberSince: "2020-02-15",
      location: "Ahmedabad, Gujarat",
      isVerified: true,
    },
    reviews: [],
    tags: ["a2-milk", "desi-cow", "gir", "organic", "dairy"],
    views: 3456,
    status: "active",
    createdAt: "2024-02-01T06:00:00Z",
  },
]

// Helper function to filter products
export function filterProducts(
  products: MarketplaceProduct[],
  filters: {
    search?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    location?: string
    organic?: boolean
    minRating?: number
    inStock?: boolean
  }
): MarketplaceProduct[] {
  return products.filter((product) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.tags.some((tag) => tag.toLowerCase().includes(searchLower)) ||
        product.seller.farmName.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Category filter
    if (filters.category && product.category !== filters.category) {
      return false
    }

    // Price filter
    if (filters.minPrice !== undefined && product.price.current < filters.minPrice) {
      return false
    }
    if (filters.maxPrice !== undefined && product.price.current > filters.maxPrice) {
      return false
    }

    // Location filter
    if (filters.location && product.location.state !== filters.location) {
      return false
    }

    // Organic filter
    if (filters.organic && !product.attributes.isOrganic) {
      return false
    }

    // Rating filter
    if (filters.minRating !== undefined && product.ratings.average < filters.minRating) {
      return false
    }

    // Stock filter
    if (filters.inStock && product.inventory.available <= 0) {
      return false
    }

    return true
  })
}

// Helper function to sort products
export function sortProducts(
  products: MarketplaceProduct[],
  sortBy: string
): MarketplaceProduct[] {
  const sorted = [...products]
  
  switch (sortBy) {
    case "price-low":
      return sorted.sort((a, b) => a.price.current - b.price.current)
    case "price-high":
      return sorted.sort((a, b) => b.price.current - a.price.current)
    case "rating":
      return sorted.sort((a, b) => b.ratings.average - a.ratings.average)
    case "newest":
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case "bestselling":
      return sorted.sort((a, b) => b.inventory.sold - a.inventory.sold)
    default:
      return sorted
  }
}

// Get product by ID
export function getProductById(id: string): MarketplaceProduct | undefined {
  return mockProducts.find((product) => product._id === id)
}

// Get related products
export function getRelatedProducts(product: MarketplaceProduct, limit = 4): MarketplaceProduct[] {
  return mockProducts
    .filter((p) => p._id !== product._id && p.category === product.category)
    .slice(0, limit)
}

// Get products by seller
export function getSellerProducts(sellerId: string, excludeId?: string, limit = 4): MarketplaceProduct[] {
  return mockProducts
    .filter((p) => p.seller._id === sellerId && p._id !== excludeId)
    .slice(0, limit)
}
