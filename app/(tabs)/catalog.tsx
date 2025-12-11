import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { Search, ShoppingBag, Filter } from 'lucide-react-native';
import { useFirebaseProducts } from '../../hooks/useFirebaseSync';

// Colores del tema Eclipse
const COLORS = {
  orange: '#F97316',
  orangeLight: '#FED7AA',
  black: '#1a1a1a',
  darkGray: '#2d2d2d',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#10B981',
};

export default function CatalogScreen() {
  const { products, loading } = useFirebaseProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === 'Todos' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ShoppingBag size={28} color={COLORS.orange} />
        <Text style={styles.headerTitle}>Catálogo</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={COLORS.orange} />
        </TouchableOpacity>
      </View>

      {/* Categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              (selectedCategory === category || (!selectedCategory && category === 'Todos')) && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category === 'Todos' ? null : category)}
          >
            <Text style={[
              styles.categoryText,
              (selectedCategory === category || (!selectedCategory && category === 'Todos')) && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de productos */}
      <ScrollView style={styles.productsContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>Cargando productos...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.centerContainer}>
            <ShoppingBag size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No hay productos</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'No se encontraron productos con esa búsqueda' : 'Los productos aparecerán aquí cuando se carguen'}
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard}>
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <ShoppingBag size={40} color={COLORS.gray} />
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{product.category || 'General'}</Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
                  
                  <View style={styles.productFooter}>
                    <Text style={styles.productPrice}>${product.price.toLocaleString()}</Text>
                    {product.stock > 0 ? (
                      <View style={styles.stockBadge}>
                        <Text style={styles.stockText}>Stock: {product.stock}</Text>
                      </View>
                    ) : (
                      <View style={[styles.stockBadge, styles.outOfStock]}>
                        <Text style={[styles.stockText, styles.outOfStockText]}>Agotado</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Espacio al final */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.black,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.orangeLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.orange,
  },
  categoryText: {
    color: COLORS.gray,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  productsContainer: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: COLORS.gray,
    fontSize: 16,
  },
  emptyTitle: {
    color: COLORS.black,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    color: COLORS.gray,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  productsGrid: {
    gap: 16,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.lightGray,
  },
  productImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.orange,
    textTransform: 'uppercase',
  },
  productName: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDescription: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
  },
  productPrice: {
    color: COLORS.orange,
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    color: COLORS.gray,
    fontSize: 12,
  },
  outOfStock: {
    backgroundColor: '#FEE2E2',
  },
  outOfStockText: {
    color: '#EF4444',
  },
});
