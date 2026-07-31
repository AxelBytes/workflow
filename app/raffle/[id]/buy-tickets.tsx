import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { firebaseSyncService, FirebaseRaffle } from '@/lib/firebaseSync';
import { useAuthContext } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TicketPackage {
  tickets: number;
  price: number;
  priceDisplay: string;
  badge?: string;
  popular?: boolean;
}

export default function BuyTicketsScreen() {
  const { id: raffleId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthContext();

  const [raffle, setRaffle] = useState<FirebaseRaffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [myTickets, setMyTickets] = useState(0);
  const [ticketPackages, setTicketPackages] = useState<TicketPackage[]>([]);
  // Guard síncrono: `processing` (state) recién se refleja en el próximo
  // render, así que dos taps rápidos en un paquete podían crear dos
  // preferencias de pago antes de que el botón se deshabilitara.
  const submittingRef = useRef(false);

  useEffect(() => {
    loadRaffleInfo();
    // Recalcula "mis tickets" también cuando cambia el usuario (por ej. si
    // `raffleId` llega antes de que termine de resolverse la sesión).
  }, [raffleId, user]);

  const loadRaffleInfo = async () => {
    try {
      setLoading(true);
      
      if (!raffleId) {
        throw new Error('No raffle ID');
      }

      // Obtener información del sorteo desde Firestore
      const raffleRef = doc(db, 'raffles', raffleId);
      const raffleSnap = await getDoc(raffleRef);
      
      if (!raffleSnap.exists()) {
        throw new Error('Sorteo no encontrado');
      }

      const data = raffleSnap.data();
      
      const raffleData: FirebaseRaffle = {
        id: raffleSnap.id,
        title: data.title || '',
        prize: data.prize || '',
        description: data.description || '',
        image: data.image || '',
        pointsCost: data.pointsCost || 0,
        maxParticipants: data.maxParticipants || 0,
        currentParticipants: data.currentParticipants || 0,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        drawDate: data.drawDate?.toDate() || new Date(),
        status: data.status || 'active',
        active: data.active ?? true,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
      
      setRaffle(raffleData);

      // Cargar paquetes de tickets configurados por el admin
      const packages: TicketPackage[] = data.ticketPackages || [
        // Valores por defecto si no hay configuración
        { tickets: 5, price: 0.99, priceDisplay: '$0.99', badge: '' },
        { tickets: 15, price: 2.49, priceDisplay: '$2.49', badge: '20% OFF', popular: true },
        { tickets: 50, price: 6.99, priceDisplay: '$6.99', badge: 'MEJOR VALOR' },
      ];

      setTicketPackages(packages);
      
      // Obtener mis tickets actuales
      if (user) {
        const isParticipating = await firebaseSyncService.isParticipating(raffleId);
        setMyTickets(isParticipating ? 1 : 0); // TODO: Obtener cantidad real
      } else {
        setMyTickets(0);
      }
      
    } catch (error) {
      console.error('[BuyTickets] Error cargando sorteo:', error);
      Alert.alert('Error', 'No se pudo cargar la información del sorteo');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyTickets = async (ticketPackage: TicketPackage) => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para comprar tickets');
      return;
    }

    if (!raffle) return;

    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      setProcessing(true);

      console.log('[BuyTickets] Iniciando compra:', {
        raffleId,
        tickets: ticketPackage.tickets,
        price: ticketPackage.price,
      });

      // Llamar a la API para crear la preferencia de Mercado Pago
      const idToken = await user.getIdToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/mercadopago/create-preference`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          raffleId,
          raffleTitle: raffle.title,
          ticketPackage: {
            tickets: ticketPackage.tickets,
            price: ticketPackage.price, // Ya está en formato decimal
          },
          customerEmail: user.email,
          customerId: user.uid,
          customerName: user.displayName || user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear preferencia de pago');
      }

      const data = await response.json();
      
      console.log('[BuyTickets] Preferencia creada:', data);

      // Abrir Mercado Pago en el navegador
      const initPoint = __DEV__ ? data.sandboxInitPoint : data.initPoint;
      
      const canOpen = await Linking.canOpenURL(initPoint);
      if (canOpen) {
        await Linking.openURL(initPoint);
        
        // Mostrar mensaje al usuario
        Alert.alert(
          '¡Completá tu pago!',
          'Serás redirigido a Mercado Pago para completar tu compra. Una vez confirmado el pago, recibirás tus números de sorteo automáticamente.',
          [
            {
              text: 'Entendido',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error('No se pudo abrir Mercado Pago');
      }

    } catch (error) {
      console.error('[BuyTickets] Error:', error);
      Alert.alert('Error', 'No se pudo procesar la compra. Intenta nuevamente.');
    } finally {
      submittingRef.current = false;
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!raffle) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Sorteo no encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const spotsRemaining = raffle.maxParticipants - raffle.currentParticipants;
  const percentageFilled = (raffle.currentParticipants / raffle.maxParticipants) * 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comprar Tickets</Text>
      </View>

      {/* Raffle Info */}
      <View style={styles.raffleInfo}>
        <Text style={styles.raffleTitle}>{raffle.title}</Text>
        <Text style={styles.rafflePrize}>🎁 {raffle.prize}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{myTickets}</Text>
            <Text style={styles.statLabel}>Mis Tickets</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{raffle.currentParticipants}</Text>
            <Text style={styles.statLabel}>Participantes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{spotsRemaining}</Text>
            <Text style={styles.statLabel}>Lugares</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percentageFilled}%` }]} />
          </View>
          <Text style={styles.progressText}>{percentageFilled.toFixed(0)}% completo</Text>
        </View>
      </View>

      {/* Ticket Packages */}
      <View style={styles.packagesContainer}>
        <Text style={styles.sectionTitle}>Elegí tu paquete</Text>
        
        {ticketPackages.map((pkg, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.packageCard,
              pkg.popular && styles.packageCardPopular,
            ]}
            onPress={() => handleBuyTickets(pkg)}
            disabled={processing}
          >
            {pkg.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pkg.badge}</Text>
              </View>
            )}
            
            <View style={styles.packageContent}>
              <View style={styles.packageLeft}>
                <Text style={styles.packageTickets}>{pkg.tickets} Tickets</Text>
                <Text style={styles.packagePerTicket}>
                  ${(pkg.price / pkg.tickets).toFixed(3)} por ticket
                </Text>
              </View>
              
              <View style={styles.packageRight}>
                <Text style={styles.packagePrice}>
                  {pkg.priceDisplay || `$${pkg.price.toFixed(2)}`}
                </Text>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* How It Works */}
      <View style={styles.howItWorks}>
        <Text style={styles.sectionTitle}>¿Cómo funciona?</Text>
        
        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Elegí tu paquete</Text>
            <Text style={styles.stepDescription}>
              Mientras más tickets compres, mayor es tu probabilidad de ganar
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pagá con Mercado Pago</Text>
            <Text style={styles.stepDescription}>
              Pago seguro con tarjeta, débito o efectivo
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Recibí tus números</Text>
            <Text style={styles.stepDescription}>
              Apenas se confirme el pago, recibirás tus números de sorteo automáticamente
            </Text>
          </View>
        </View>

        <View style={styles.stepContainer}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>¡Esperá el sorteo!</Text>
            <Text style={styles.stepDescription}>
              El ganador se selecciona de forma aleatoria y transparente
            </Text>
          </View>
        </View>
      </View>

      {/* Free Options */}
      <View style={styles.freeOptions}>
        <Text style={styles.freeOptionsTitle}>También podés ganar tickets gratis:</Text>
        <Text style={styles.freeOption}>• 1 ticket por cada $20 en compras</Text>
        <Text style={styles.freeOption}>• 3 tickets por referir un amigo</Text>
        <Text style={styles.freeOption}>• 1 ticket por completar tu perfil</Text>
      </View>

      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.processingText}>Procesando...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  raffleInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  raffleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  rafflePrize: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  packagesContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  packageCardPopular: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F0',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageLeft: {
    flex: 1,
  },
  packageTickets: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  packagePerTicket: {
    fontSize: 14,
    color: '#6B7280',
  },
  packageRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
    marginRight: 8,
  },
  howItWorks: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  freeOptions: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
  },
  freeOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  freeOption: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
});
