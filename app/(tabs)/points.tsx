import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { Gift, TrendingUp, TrendingDown, Clock, Star, ArrowLeft } from 'lucide-react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCustomerData } from '../../hooks/useFirebaseSync';
import { useRouter } from 'expo-router';

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
  red: '#EF4444',
};

export default function PointsScreen() {
  const router = useRouter();
  const { userEmail, isLoading: authLoading, isAuthenticated } = useAuthContext();
  const { customer, transactions, totalPoints, loading: dataLoading } = useCustomerData(userEmail);

  // Si no está autenticado, mostrar pantalla de login
  if (!isAuthenticated || !userEmail) {
    if (authLoading) {
      return (
        <View style={styles.container}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.orange} />
            <Text style={styles.loadingText}>Verificando sesión...</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Puntos</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.centerContainer}>
          <Gift size={64} color={COLORS.orange} />
          <Text style={styles.notLoggedInTitle}>Inicia Sesión</Text>
          <Text style={styles.notLoggedInText}>
            Para ver tus puntos Eclipse y tu historial de transacciones, inicia sesión con tu cuenta.
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Calcular próximo beneficio (cada 500 puntos)
  const nextBenefit = Math.ceil((totalPoints + 1) / 500) * 500;
  const pointsToNext = nextBenefit - totalPoints;
  const progressPercent = ((totalPoints % 500) / 500) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Puntos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de puntos principal */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsCardHeader}>
            <Star size={32} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.pointsLabel}>Puntos Eclipse</Text>
          </View>
          
          <Text style={styles.pointsValue}>
            {dataLoading && !customer ? '...' : totalPoints.toLocaleString()}
          </Text>
          
          <Text style={styles.pointsSubtitle}>
            {dataLoading && !customer 
              ? 'Cargando tus datos...' 
              : customer 
                ? `Hola, ${customer.name || userEmail}` 
                : `Email: ${userEmail}`}
          </Text>

          {/* Barra de progreso */}
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              Próximo beneficio en {pointsToNext} puntos
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {/* Botón canjear premio */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.redeemBanner}
            onPress={() => router.push('/scan-reward')}
            activeOpacity={0.85}
          >
            <View style={styles.redeemBannerLeft}>
              <Gift size={32} color={COLORS.white} />
              <View>
                <Text style={styles.redeemBannerTitle}>Canjear un Premio</Text>
                <Text style={styles.redeemBannerSub}>Escaneá el QR del cajero</Text>
              </View>
            </View>
            <Text style={styles.redeemBannerArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Cómo funcionan los puntos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Cómo funcionan?</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#D1FAE5' }]}>
                <TrendingUp size={20} color={COLORS.green} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Acumula puntos</Text>
                <Text style={styles.infoText}>Por cada compra en Eclipse ganas puntos automáticamente</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: COLORS.orangeLight }]}>
                <Gift size={20} color={COLORS.orange} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Canjea premios</Text>
                <Text style={styles.infoText}>Usa tus puntos para obtener productos gratis o descuentos</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
                <Star size={20} color="#F59E0B" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Beneficios exclusivos</Text>
                <Text style={styles.infoText}>Mientras más puntos tengas, mejores beneficios obtienes</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Historial de transacciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Puntos</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Clock size={48} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>Sin movimientos</Text>
              <Text style={styles.emptyText}>Tus transacciones de puntos aparecerán aquí</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((tx) => (
                <View key={tx.id} style={styles.transactionCard}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: tx.transactionType === 'load' ? '#D1FAE5' : '#FEE2E2' }
                  ]}>
                    {tx.transactionType === 'load' ? (
                      <TrendingUp size={20} color={COLORS.green} />
                    ) : (
                      <TrendingDown size={20} color={COLORS.red} />
                    )}
                  </View>
                  
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>
                      {tx.transactionType === 'load' ? 'Puntos cargados' : 'Puntos canjeados'}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {tx.timestamp.toLocaleDateString('es-AR', { 
                        day: 'numeric', 
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                    {tx.notes && <Text style={styles.transactionNotes}>{tx.notes}</Text>}
                  </View>
                  
                  <Text style={[
                    styles.transactionAmount,
                    { color: tx.transactionType === 'load' ? COLORS.green : COLORS.red }
                  ]}>
                    {tx.transactionType === 'load' ? '+' : '-'}{tx.pointsAmount}
                  </Text>
                </View>
              ))}
            </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: COLORS.gray,
    fontSize: 16,
    marginTop: 16,
  },
  notLoggedInTitle: {
    color: COLORS.black,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
  },
  notLoggedInText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  pointsCard: {
    backgroundColor: COLORS.orange,
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
  },
  pointsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsLabel: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    opacity: 0.9,
  },
  pointsValue: {
    color: COLORS.white,
    fontSize: 56,
    fontWeight: 'bold',
    marginTop: 8,
  },
  pointsSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  progressText: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  emptyHistory: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: 8,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 4,
  },
  transactionNotes: {
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  redeemBanner: {
    backgroundColor: COLORS.orange,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  redeemBannerTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  redeemBannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  redeemBannerArrow: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
});
