import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Gift, Clock, Percent, AlertCircle } from 'lucide-react-native';
import { useFirebasePromotions } from '../../hooks/useFirebaseSync';

// Colores del tema Eclipse
const COLORS = {
  orange: '#F97316',
  orangeLight: '#FED7AA',
  black: '#1a1a1a',
  darkGray: '#2d2d2d',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
};

// Formatear fecha
const formatDate = (date: Date) => {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function PromotionsScreen() {
  const { promotions, loading } = useFirebasePromotions();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Gift size={28} color={COLORS.orange} />
          <Text style={styles.headerTitle}>Promociones</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.orange} />
          <Text style={styles.loadingText}>Cargando promociones...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Gift size={28} color={COLORS.orange} />
        <Text style={styles.headerTitle}>Promociones</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner principal */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>🎉 Ofertas Especiales</Text>
          <Text style={styles.bannerSubtitle}>
            Aprovecha nuestras promociones exclusivas
          </Text>
        </View>

        {/* Lista de promociones */}
        {promotions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AlertCircle size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No hay promociones activas</Text>
            <Text style={styles.emptyText}>
              Las promociones aparecerán aquí cuando estén disponibles
            </Text>
          </View>
        ) : (
          promotions.map((promo) => (
            <TouchableOpacity key={promo.id} style={styles.promotionCard}>
              {promo.image ? (
                <Image source={{ uri: promo.image }} style={styles.promotionImage} />
              ) : (
                <View style={[styles.promotionImage, styles.noImage]}>
                  <Gift size={48} color={COLORS.gray} />
                </View>
              )}
              
              {promo.discount && (
                <View style={styles.discountBadge}>
                  <Percent size={12} color={COLORS.white} />
                  <Text style={styles.discountText}>{promo.discount}</Text>
                </View>
              )}
              
              <View style={styles.promotionContent}>
                {promo.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{promo.category}</Text>
                  </View>
                )}
                
                <Text style={styles.promotionTitle}>{promo.title}</Text>
                <Text style={styles.promotionDescription}>{promo.description}</Text>
                
                <View style={styles.validityContainer}>
                  <Clock size={14} color={COLORS.gray} />
                  <Text style={styles.validityText}>
                    Válido hasta: {formatDate(promo.endDate)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  banner: {
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
  promotionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  promotionImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
    resizeMode: 'cover',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.orange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  promotionContent: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.orange,
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  promotionDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 12,
  },
  validityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validityText: {
    fontSize: 13,
    color: COLORS.gray,
  },
});
