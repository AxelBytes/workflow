import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../lib/notifications';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  weight: string;
  rating: number;
  badge?: string;
  isFavorite: boolean;
  isActive: boolean;
  stock: number;
  lowStockThreshold: number; // Umbral para stock bajo
  createdAt: Date;
  updatedAt: Date;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  discount: number;
  code: string;
  backgroundColor: string;
  image: string;
  isActive: boolean;
  validFrom: Date;
  validTo: Date;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  gradient: string[];
  isActive: boolean;
}

interface ProductState {
  products: Product[];
  promotions: Promotion[];
  categories: Category[];
  isLoading: boolean;
  
  // Product actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  updateStock: (id: string, newStock: number) => void; // Nueva función para actualizar stock
  
  // Promotion actions
  addPromotion: (promotion: Omit<Promotion, 'id' | 'createdAt'>) => void;
  updatePromotion: (id: string, updates: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  togglePromotionActive: (id: string) => void;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Getters
  getActiveProducts: () => Product[];
  getProductsByCategory: (category: string) => Product[];
  getActivePromotions: () => Promotion[];
  getActiveCategories: () => Category[];
  getProductById: (id: string) => Product | undefined;
  getLowStockProducts: () => Product[]; // Nueva función para productos con stock bajo
  
  // Admin actions
  setLoading: (loading: boolean) => void;
  loadSampleData: () => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      promotions: [],
      categories: [],
      isLoading: false,
      
      // Product actions
      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: Date.now().toString(),
          lowStockThreshold: product.lowStockThreshold || 10, // Valor por defecto
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set(state => ({
          products: [...state.products, newProduct]
        }));
      },
      
      updateProduct: (id, updates) => {
        set(state => ({
          products: state.products.map(product =>
            product.id === id 
              ? { ...product, ...updates, updatedAt: new Date() }
              : product
          )
        }));
      },
      
      deleteProduct: (id) => {
        set(state => ({
          products: state.products.filter(product => product.id !== id)
        }));
      },
      
      toggleProductActive: (id) => {
        set(state => ({
          products: state.products.map(product =>
            product.id === id 
              ? { ...product, isActive: !product.isActive, updatedAt: new Date() }
              : product
          )
        }));
      },

      // Nueva función para actualizar stock con notificaciones push
      updateStock: (productId: string, newStock: number) => {
        set((state) => {
          const product = state.products.find(p => p.id === productId);
          if (product) {
            const updatedProduct = { ...product, stock: newStock };
            
            // Verificar si el stock está bajo o agotado
            if (newStock <= 0) {
              notificationService.sendOutOfStockNotification(product.name);
            } else if (newStock <= product.lowStockThreshold) {
              notificationService.sendLowStockNotification(product.name, newStock);
            }
            
            return {
              products: state.products.map(p => 
                p.id === productId ? updatedProduct : p
              )
            };
          }
          return state;
        });
      },
      
      // Promotion actions
      addPromotion: (promotion) => {
        const newPromotion: Promotion = {
          ...promotion,
          id: Date.now().toString(),
          createdAt: new Date(),
        };

        set((state) => ({
          promotions: [...state.promotions, newPromotion]
        }));

        notificationService.sendNewOfferNotification(
          newPromotion.title,
          newPromotion.description
        );
      },
      
      updatePromotion: (id, updates) => {
        set(state => ({
          promotions: state.promotions.map(promotion =>
            promotion.id === id 
              ? { ...promotion, ...updates }
              : promotion
          )
        }));
      },
      
      deletePromotion: (id) => {
        set(state => ({
          promotions: state.promotions.filter(promotion => promotion.id !== id)
        }));
      },
      
      togglePromotionActive: (id) => {
        set(state => ({
          promotions: state.promotions.map(promotion =>
            promotion.id === id 
              ? { ...promotion, isActive: !promotion.isActive }
              : promotion
          )
        }));
      },
      
      // Category actions
      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: Date.now().toString(),
        };
        set(state => ({
          categories: [...state.categories, newCategory]
        }));
      },
      
      updateCategory: (id, updates) => {
        set(state => ({
          categories: state.categories.map(category =>
            category.id === id 
              ? { ...category, ...updates }
              : category
          )
        }));
      },
      
      deleteCategory: (id) => {
        set(state => ({
          categories: state.categories.filter(category => category.id !== id)
        }));
      },
      
      // Getters
      getActiveProducts: () => {
        return get().products.filter(product => product.isActive);
      },
      
      getProductsByCategory: (category) => {
        return get().products.filter(product => 
          product.category === category && product.isActive
        );
      },
      
      getActivePromotions: () => {
        return get().promotions.filter(promotion => promotion.isActive);
      },
      
      getActiveCategories: () => {
        return get().categories.filter(category => category.isActive);
      },
      
      getProductById: (id) => {
        return get().products.find(product => product.id === id);
      },

      // Nueva función para obtener productos con stock bajo
      getLowStockProducts: () => {
        return get().products.filter(product => 
          product.stock <= product.lowStockThreshold && product.stock > 0
        );
      },
      
      // Admin actions
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      loadSampleData: () => {
        const sampleProducts: Product[] = [
          {
            id: '1',
            name: 'Leche Entera Premium',
            description: 'Leche fresca de alta calidad, rica en calcio y vitaminas',
            price: 3500,
            originalPrice: 4200,
            image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
            category: 'Lácteos',
            weight: '1L',
            rating: 4.8,
            badge: 'Popular',
            isFavorite: false,
            isActive: true,
            stock: 15,
            lowStockThreshold: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            name: 'Pan Integral Artesanal',
            description: 'Pan integral hecho con harina de trigo integral y semillas',
            price: 2800,
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
            category: 'Panadería',
            weight: '500g',
            rating: 4.6,
            isFavorite: false,
            isActive: true,
            stock: 8,
            lowStockThreshold: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '3',
            name: 'Manzanas Rojas Orgánicas',
            description: 'Manzanas rojas orgánicas, dulces y crujientes',
            price: 12000,
            originalPrice: 15000,
            image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
            category: 'Frutas',
            weight: '1kg',
            rating: 4.9,
            badge: 'Orgánico',
            isFavorite: false,
            isActive: true,
            stock: 25,
            lowStockThreshold: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '4',
            name: 'Pollo Entero Fresco',
            description: 'Pollo entero fresco, perfecto para asar o cocinar',
            price: 18500,
            image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400',
            category: 'Carnes',
            weight: '2kg',
            rating: 4.7,
            isFavorite: false,
            isActive: true,
            stock: 12,
            lowStockThreshold: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '5',
            name: 'Aceite de Oliva Extra Virgen',
            description: 'Aceite de oliva extra virgen, prensado en frío',
            price: 22000,
            originalPrice: 28000,
            image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
            category: 'Aceites',
            weight: '500ml',
            rating: 4.8,
            badge: 'Premium',
            isFavorite: false,
            isActive: true,
            stock: 18,
            lowStockThreshold: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '6',
            name: 'Yogur Griego Natural',
            description: 'Yogur griego natural, alto en proteínas y cremoso',
            price: 4500,
            image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
            category: 'Lácteos',
            weight: '170g',
            rating: 4.5,
            isFavorite: false,
            isActive: true,
            stock: 5,
            lowStockThreshold: 10,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];

        const samplePromotions: Promotion[] = [
          {
            id: '1',
            title: 'Descuento del 20%',
            subtitle: 'En todos los lácteos',
            description: 'Aprovecha nuestro descuento especial en productos lácteos',
            discount: 20,
            code: 'LACTEOS20',
            backgroundColor: '#FF6B6B',
            image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
            isActive: true,
            validFrom: new Date(),
            validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
            createdAt: new Date(),
          },
          {
            id: '2',
            title: '2x1 en Frutas',
            subtitle: 'Lleva 2, paga 1',
            description: 'Oferta especial en frutas frescas seleccionadas',
            discount: 50,
            code: 'FRUTAS2X1',
            backgroundColor: '#4ECDC4',
            image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
            isActive: true,
            validFrom: new Date(),
            validTo: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
            createdAt: new Date(),
          },
        ];

        const sampleCategories: Category[] = [
          {
            id: '1',
            name: 'Lácteos',
            icon: '🥛',
            gradient: ['#FF6B6B', '#FF8E8E'],
            isActive: true,
          },
          {
            id: '2',
            name: 'Frutas',
            icon: '🍎',
            gradient: ['#4ECDC4', '#6EE7DF'],
            isActive: true,
          },
          {
            id: '3',
            name: 'Verduras',
            icon: '🥬',
            gradient: ['#45B7D1', '#67C9E1'],
            isActive: true,
          },
          {
            id: '4',
            name: 'Carnes',
            icon: '🥩',
            gradient: ['#FFA07A', '#FFB894'],
            isActive: true,
          },
          {
            id: '5',
            name: 'Panadería',
            icon: '🍞',
            gradient: ['#9B59B6', '#BB7BC8'],
            isActive: true,
          },
          {
            id: '6',
            name: 'Bebidas',
            icon: '🥤',
            gradient: ['#2ECC71', '#4EDC91'],
            isActive: true,
          },
        ];

        set({
          products: sampleProducts,
          promotions: samplePromotions,
          categories: sampleCategories,
        });
      },
    }),
    {
      name: 'eclipse-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 