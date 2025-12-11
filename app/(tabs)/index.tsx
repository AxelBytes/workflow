import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Gift, Menu, ChevronRight, TrendingUp, Calendar, MapPin, AlertCircle } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useFirebaseProducts, useCustomerData, useFirebasePromotions, useFirebaseRaffles } from '../../hooks/useFirebaseSync';
import { useAuthContext } from '../../contexts/AuthContext';
import EclipseLogo from '../../components/EclipseLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function HomeScreen() {
  const router = useRouter();
  const { products, loading } = useFirebaseProducts();
  const { promotions: firebasePromotions, loading: promotionsLoading } = useFirebasePromotions();
  const { raffles: firebaseRaffles, loading: rafflesLoading } = useFirebaseRaffles();
  const { userEmail, isAuthenticated } = useAuthContext();
  const { customer, totalPoints } = useCustomerData(userEmail);
  
  // Carrusel refs y state
  const carouselRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Nombre del usuario
  const userName = customer?.name || 'Usuario';
  
  // Calcular próximo beneficio (cada 500 puntos)
  const nextBenefit = Math.ceil((totalPoints + 1) / 500) * 500;
  const pointsToNext = nextBenefit - totalPoints;
  const progressPercent = ((totalPoints % 500) / 500) * 100;

  // Usar promociones de Firebase (sin fallback)
  const promotions = firebasePromotions.map(p => ({ id: p.id, title: p.title, image: p.image }));

  // Usar sorteos de Firebase - solo activos (sin fallback)
  const raffles = firebaseRaffles
    .filter(r => r.status === 'active')
    .slice(0, 3) // Mostrar máximo 3 en inicio
    .map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      date: r.drawDate,
      image: r.image,
    }));

  // Formatear fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Auto-scroll del carrusel cada 3 segundos
  useEffect(() => {
    if (promotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % promotions.length;
        carouselRef.current?.scrollToIndex({ 
          index: nextIndex, 
          animated: true 
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [promotions.length]);

  // Manejar cambio manual del carrusel
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Render item del carrusel
  const renderCarouselItem = ({ item }: { item: typeof promotions[0] }) => (
    <TouchableOpacity 
      style={styles.carouselItem}
      onPress={() => router.push('/(tabs)/promotions')}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.carouselImage} />
      <View style={styles.carouselOverlay} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Menu size={24} color={COLORS.black} />
        </TouchableOpacity>
        
        {/* Logo ECLIPSE */}
        <EclipseLogo size="medium" showAppText={true} />
        
        <TouchableOpacity 
          style={styles.pointsBadge}
          onPress={() => router.push('/(tabs)/points')}
        >
          <TrendingUp size={16} color={COLORS.orange} />
          <Text style={styles.pointsBadgeText}>
            {isAuthenticated ? totalPoints.toLocaleString() : '---'}pts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Saludo */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>
            ¡Hola, {isAuthenticated ? userName : 'Visitante'}!
          </Text>
        </View>

        {/* Carrusel de Promociones */}
        {promotionsLoading ? (
          <View style={styles.carouselLoading}>
            <ActivityIndicator size="small" color={COLORS.orange} />
          </View>
        ) : promotions.length > 0 ? (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={carouselRef}
              data={promotions}
              renderItem={renderCarouselItem}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH - 32,
                offset: (SCREEN_WIDTH - 32) * index,
                index,
              })}
            />
            
            {/* Indicadores del carrusel */}
            <View style={styles.carouselIndicators}>
              {promotions.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentIndex === index && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.emptyCarousel}
            onPress={() => router.push('/(tabs)/promotions')}
          >
            <Gift size={32} color={COLORS.gray} />
            <Text style={styles.emptyCarouselText}>Sin promociones activas</Text>
          </TouchableOpacity>
        )}

        {/* Tarjeta de Puntos */}
        <TouchableOpacity 
          style={styles.pointsCard}
          onPress={() => isAuthenticated ? router.push('/(tabs)/points') : router.push('/login')}
        >
          <View style={styles.pointsCardHeader}>
            <Text style={styles.pointsCardTitle}>Tus Puntos</Text>
            <View style={styles.pointsValueBadge}>
              <Text style={styles.pointsValueText}>
                {isAuthenticated ? totalPoints.toLocaleString() : '---'} pts
              </Text>
            </View>
          </View>
          
          <Text style={styles.pointsCardSubtitle}>
            {isAuthenticated 
              ? `Próximo beneficio en ${pointsToNext} puntos`
              : 'Inicia sesión para ver tus puntos'}
          </Text>
          
          {isAuthenticated && (
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
          )}
        </TouchableOpacity>

        {/* Próximos Sorteos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MapPin size={20} color={COLORS.orange} />
              <Text style={styles.sectionTitle}>Próximos Sorteos</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/raffles')}>
              <ChevronRight size={24} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {rafflesLoading ? (
            <View style={styles.raffleLoadingContainer}>
              <ActivityIndicator size="small" color={COLORS.orange} />
            </View>
          ) : raffles.length > 0 ? (
            raffles.map((raffle) => (
              <TouchableOpacity 
                key={raffle.id} 
                style={styles.raffleCard}
                onPress={() => router.push('/(tabs)/raffles')}
              >
                {raffle.image ? (
                  <Image 
                    source={{ uri: raffle.image }} 
                    style={styles.raffleImage}
                  />
                ) : (
                  <View style={[styles.raffleImage, styles.noRaffleImage]}>
                    <Gift size={32} color={COLORS.gray} />
                  </View>
                )}
                <View style={styles.raffleContent}>
                  <Text style={styles.raffleTitle}>{raffle.title}</Text>
                  <Text style={styles.raffleDescription} numberOfLines={2}>{raffle.description}</Text>
                  <View style={styles.raffleDateContainer}>
                    <Calendar size={14} color={COLORS.orange} />
                    <Text style={styles.raffleDate}>Sorteo: {formatDate(raffle.date)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity 
              style={styles.emptyRaffles}
              onPress={() => router.push('/(tabs)/raffles')}
            >
              <AlertCircle size={24} color={COLORS.gray} />
              <Text style={styles.emptyRafflesText}>No hay sorteos activos</Text>
            </TouchableOpacity>
          )}
        </View>

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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 4,
  },
  pointsBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.orange,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  greetingSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  // Carrusel styles
  carouselContainer: {
    marginBottom: 20,
  },
  carouselItem: {
    width: SCREEN_WIDTH - 32,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.darkGray,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray,
    opacity: 0.4,
  },
  indicatorActive: {
    backgroundColor: COLORS.orange,
    opacity: 1,
    width: 24,
  },
  // Puntos card
  pointsCard: {
    backgroundColor: COLORS.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  pointsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  pointsValueBadge: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  pointsCardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#4B5563',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.orange,
    borderRadius: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  raffleCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  raffleImage: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.lightGray,
  },
  raffleContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  raffleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  raffleDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  raffleDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raffleDate: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.orange,
  },
  carouselLoading: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyCarousel: {
    height: 120,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
  },
  emptyCarouselText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  raffleLoadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRaffleImage: {
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRaffles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
  },
  emptyRafflesText: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
