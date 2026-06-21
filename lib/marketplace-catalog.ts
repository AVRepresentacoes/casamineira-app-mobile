export type MarketplaceProduct = {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  price: number;
  oldPrice?: number;
  rating: number;
  stock: number;
  deliveryKm: number;
};

export const MARKETPLACE_CATEGORIES = [
  "Todos",
  "Ferramentas",
  "Elétrica",
  "Hidráulica",
  "Pintura",
  "Acabamento",
  "Jardinagem",
] as const;

export const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: "p1",
    fornecedorId: "f1",
    fornecedorNome: "Casa Forte Materiais",
    title: "Furadeira de Impacto 650W",
    subtitle: "Ideal para alvenaria e madeira",
    category: "Ferramentas",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=60",
    price: 289.9,
    oldPrice: 349.9,
    rating: 4.8,
    stock: 12,
    deliveryKm: 18,
  },
  {
    id: "p2",
    fornecedorId: "f2",
    fornecedorNome: "Elétrica Minas Pro",
    title: "Kit Disjuntores Residenciais",
    subtitle: "Proteção completa do quadro",
    category: "Elétrica",
    image: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=60",
    price: 174.5,
    oldPrice: 209.9,
    rating: 4.7,
    stock: 20,
    deliveryKm: 15,
  },
  {
    id: "p3",
    fornecedorId: "f3",
    fornecedorNome: "Hidro Master",
    title: "Torneira Gourmet Inox",
    subtitle: "Monocomando com bico flexível",
    category: "Hidráulica",
    image: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=60",
    price: 329,
    oldPrice: 399,
    rating: 4.9,
    stock: 8,
    deliveryKm: 12,
  },
  {
    id: "p4",
    fornecedorId: "f1",
    fornecedorNome: "Casa Forte Materiais",
    title: "Tinta Acrílica Branco Neve 18L",
    subtitle: "Alta cobertura e baixo odor",
    category: "Pintura",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=60",
    price: 259.9,
    rating: 4.6,
    stock: 30,
    deliveryKm: 18,
  },
  {
    id: "p5",
    fornecedorId: "f4",
    fornecedorNome: "Acabamento Prime",
    title: "Porcelanato Polido 90x90",
    subtitle: "Linha premium sala/cozinha",
    category: "Acabamento",
    image: "https://images.unsplash.com/photo-1616594039964-3bb0f437a889?auto=format&fit=crop&w=800&q=60",
    price: 124.9,
    oldPrice: 149.9,
    rating: 4.5,
    stock: 120,
    deliveryKm: 20,
  },
  {
    id: "p6",
    fornecedorId: "f5",
    fornecedorNome: "Verde Jardim Center",
    title: "Kit Irrigação Inteligente",
    subtitle: "Programador + mangueira + conectores",
    category: "Jardinagem",
    image: "https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?auto=format&fit=crop&w=800&q=60",
    price: 219.9,
    rating: 4.4,
    stock: 14,
    deliveryKm: 10,
  },
];
