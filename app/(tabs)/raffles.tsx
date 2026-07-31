import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Award, Calendar, Users, Gift, AlertCircle, Trophy, CheckCircle } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useFirebaseRaffles } from '../../hooks/useFirebaseSync';
import { useAuthContext } from '../../contexts/AuthContext';
import { firebaseSyncService } from '../../lib/firebaseSync';
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

// Formatear fecha
const formatDate = (date: Date) => {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function RafflesScreen() {
  const { raffles, loading } = useFirebaseRaffles();
  const { user, isAuthenticated } = useAuthContext();
  const router = useRouter();
  const [participatingIn, setParticipatingIn] = useState<string | null>(null);
  const [myParticipations, setMyParticipations] = useState<Set<string>>(new Set());
  // Guard síncrono contra doble-tap: setParticipatingIn (state) no se aplica
  // hasta el siguiente render, así que dos taps rápidos podían disparar dos
  // participaciones antes de que el botón se deshabilitara.
  const submittingRef = useRef<string | null>(null);

  // Verificar participaciones del usuario
  useEffect(() => {
    let cancelled = false;

    const checkParticipations = async () => {
      if (!isAuthenticated || !user) return;

      const participations = new Set<string>();
      for (const raffle of raffles) {
        const isParticipating = await firebaseSyncService.isParticipating(raffle.id);
        if (isParticipating) {
          participations.add(raffle.id);
        }
      }
      if (!cancelled) {
        setMyParticipations(participations);
      }
    };

    checkParticipations();
    return () => {
      cancelled = true;
    };
  }, [raffles, user, isAuthenticated]);

  // Función para participar
  const handleParticipate = async (raffleId: string) => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Iniciar Sesión',
        'Debes iniciar sesión para participar en sorteos',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => router.push('/login') }
        ]
      );
      return;
    }

    if (submittingRef.current === raffleId) return;
    submittingRef.current = raffleId;
    setParticipatingIn(raffleId);

    try {
      const result = await firebaseSyncService.participateInRaffle(raffleId);

      if (result.success) {
        setMyParticipations(prev => new Set([...prev, raffleId]));
        Alert.alert('¡Éxito!', result.message);
      } else {
        Alert.alert('Aviso', result.message);
      }
    } catch (error) {
      console.error('[Raffles] Error al participar:', error);
      Alert.alert('Error', 'No se pudo registrar la participación');
    } finally {
      submittingRef.current = null;
      setParticipatingIn(null);
    }
  };

  // Separar sorteos activos, próximos y completados
  const activeRaffles = raffles.filter(r => r.status === 'active');
  const closedRaffles = raffles.filter(r => r.status === 'closed' && !r.winnerId);
  const completedRaffles = raffles.filter(r => r.status === 'completed' || r.winnerId);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Award size={28} color={COLORS.orange} />
          <Text style={styles.headerTitle}>Sorteos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.orange} />
          <Text style={styles.loadingText}>Cargando sorteos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Award size={28} color={COLORS.orange} />
        <Text style={styles.headerTitle}>Sorteos</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner de puntos */}
        <View style={styles.pointsBanner}>
          <View style={styles.pointsBannerContent}>
            <Gift size={32} color={COLORS.orange} />
            <View style={styles.pointsBannerText}>
              <Text style={styles.pointsBannerTitle}>¿Cómo participar?</Text>
              <Text style={styles.pointsBannerSubtitle}>
                Acumula puntos para obtener participaciones en nuestros sorteos
              </Text>
            </View>
          </View>
        </View>

        {raffles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AlertCircle size={48} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No hay sorteos disponibles</Text>
            <Text style={styles.emptyText}>
              Los sorteos aparecerán aquí cuando estén disponibles
            </Text>
          </View>
        ) : (
          <>
            {/* Sorteos Activos */}
            {activeRaffles.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎰 Sorteos Activos</Text>
                
                {activeRaffles.map((raffle) => (
                  <TouchableOpacity key={raffle.id} style={styles.raffleCard}>
                    {raffle.image ? (
                      <Image source={{ uri: raffle.image }} style={styles.raffleImage} />
                    ) : (
                      <View style={[styles.raffleImage, styles.noImage]}>
                        <Award size={48} color={COLORS.gray} />
                      </View>
                    )}
                    
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Activo</Text>
                    </View>
                    
                    <View style={styles.raffleContent}>
                      <Text style={styles.raffleTitle}>{raffle.title}</Text>
                      <Text style={styles.raffleDescription}>{raffle.description}</Text>
                      
                      <View style={styles.prizeBadge}>
                        <Text style={styles.prizeText}>🎁 {raffle.prize}</Text>
                      </View>
                      
                      <View style={styles.raffleFooter}>
                        <View style={styles.raffleInfo}>
                          <Calendar size={14} color={COLORS.orange} />
                          <Text style={styles.raffleInfoText}>Sorteo: {formatDate(raffle.drawDate)}</Text>
                        </View>
                        <View style={styles.raffleInfo}>
                          <Users size={14} color={COLORS.gray} />
                          <Text style={styles.raffleInfoText}>
                            {raffle.currentParticipants}/{raffle.maxParticipants} participantes
                          </Text>
                        </View>
                      </View>

                      {raffle.pointsCost > 0 && (
                        <View style={styles.pointsCostContainer}>
                          <Text style={styles.pointsCostText}>
                            Costo: {raffle.pointsCost} puntos
                          </Text>
                        </View>
                      )}
                      
                      {myParticipations.has(raffle.id) ? (
                        <View style={styles.participatingButton}>
                          <CheckCircle size={20} color={COLORS.green} />
                          <Text style={styles.participatingButtonText}>Ya participas</Text>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={[
                            styles.participateButton,
                            participatingIn === raffle.id && styles.participateButtonDisabled
                          ]}
                          onPress={() => handleParticipate(raffle.id)}
                          disabled={participatingIn === raffle.id}
                        >
                          {participatingIn === raffle.id ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <Text style={styles.participateButtonText}>Participar</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sorteos Cerrados (pendientes de sortear) */}
            {closedRaffles.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⏳ Próximo Sorteo</Text>
                
                {closedRaffles.map((raffle) => (
                  <TouchableOpacity key={raffle.id} style={[styles.raffleCard, styles.closedCard]}>
                    {raffle.image ? (
                      <Image source={{ uri: raffle.image }} style={styles.raffleImage} />
                    ) : (
                      <View style={[styles.raffleImage, styles.noImage]}>
                        <Award size={48} color={COLORS.gray} />
                      </View>
                    )}
                    
                    <View style={[styles.statusBadge, styles.closedBadge]}>
                      <Text style={styles.statusText}>Cerrado</Text>
                    </View>
                    
                    <View style={styles.raffleContent}>
                      <Text style={styles.raffleTitle}>{raffle.title}</Text>
                      <Text style={styles.raffleDescription}>{raffle.description}</Text>
                      
                      <View style={styles.prizeBadge}>
                        <Text style={styles.prizeText}>🎁 {raffle.prize}</Text>
                      </View>
                      
                      <View style={styles.raffleFooter}>
                        <View style={styles.raffleInfo}>
                          <Calendar size={14} color={COLORS.orange} />
                          <Text style={styles.raffleInfoText}>Sorteo: {formatDate(raffle.drawDate)}</Text>
                        </View>
                        <View style={styles.raffleInfo}>
                          <Users size={14} color={COLORS.gray} />
                          <Text style={styles.raffleInfoText}>
                            {raffle.currentParticipants} participantes
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sorteos Completados */}
            {completedRaffles.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏆 Sorteos Realizados</Text>
                
                {completedRaffles.map((raffle) => (
                  <TouchableOpacity key={raffle.id} style={[styles.raffleCard, styles.completedCard]}>
                    {raffle.image ? (
                      <Image source={{ uri: raffle.image }} style={styles.raffleImage} />
                    ) : (
                      <View style={[styles.raffleImage, styles.noImage]}>
                        <Trophy size={48} color={COLORS.orange} />
                      </View>
                    )}
                    
                    <View style={[styles.statusBadge, styles.completedBadge]}>
                      <Text style={styles.statusText}>Finalizado</Text>
                    </View>
                    
                    <View style={styles.raffleContent}>
                      <Text style={styles.raffleTitle}>{raffle.title}</Text>
                      
                      <View style={styles.prizeBadge}>
                        <Text style={styles.prizeText}>🎁 {raffle.prize}</Text>
                      </View>

                      {raffle.winnerName && (
                        <View style={styles.winnerContainer}>
                          <Trophy size={18} color={COLORS.orange} />
                          <Text style={styles.winnerText}>
                            Ganador: {raffle.winnerName}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.raffleFooter}>
                        <View style={styles.raffleInfo}>
                          <Calendar size={14} color={COLORS.gray} />
                          <Text style={styles.raffleInfoText}>
                            Sorteado: {formatDate(raffle.drawDate)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
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
  pointsBanner: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: COLORS.orangeLight,
  },
  pointsBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pointsBannerText: {
    flex: 1,
  },
  pointsBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  pointsBannerSubtitle: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 16,
  },
  raffleCard: {
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
  closedCard: {
    opacity: 0.9,
  },
  completedCard: {
    opacity: 0.85,
  },
  raffleImage: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.lightGray,
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closedBadge: {
    backgroundColor: COLORS.orange,
  },
  completedBadge: {
    backgroundColor: COLORS.gray,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  raffleContent: {
    padding: 16,
  },
  raffleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  raffleDescription: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 12,
  },
  prizeBadge: {
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  prizeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.orange,
  },
  raffleFooter: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  raffleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  raffleInfoText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  pointsCostContainer: {
    backgroundColor: COLORS.darkGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  pointsCostText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.white,
  },
  winnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.orange,
  },
  participateButton: {
    backgroundColor: COLORS.orange,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  participateButtonDisabled: {
    opacity: 0.7,
  },
  participateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  participatingButton: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  participatingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.green,
  },
});
