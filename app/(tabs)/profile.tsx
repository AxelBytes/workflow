import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { User, Mail, Phone, LogOut, Settings, HelpCircle, Shield, ChevronRight, Gift, Bell, CreditCard } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useAuthContext } from '../../contexts/AuthContext';
import { useCustomerData } from '../../hooks/useFirebaseSync';

// Colores del tema Eclipse
const COLORS = {
  orange: '#F97316',
  orangeLight: '#FED7AA',
  black: '#1a1a1a',
  darkGray: '#2d2d2d',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  red: '#EF4444',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userEmail, isLoading: authLoading, isAuthenticated } = useAuthContext();
  const { customer, totalPoints } = useCustomerData(userEmail);

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/login');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
            }
          },
        },
      ]
    );
  };

  // Mostrar carga mientras verifica autenticación
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

  if (!isAuthenticated || !userEmail) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <User size={28} color={COLORS.orange} />
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>
        
        <View style={styles.centerContainer}>
          <View style={styles.avatarLarge}>
            <User size={48} color={COLORS.gray} />
          </View>
          <Text style={styles.notLoggedInTitle}>Inicia Sesión</Text>
          <Text style={styles.notLoggedInText}>
            Accede a tu cuenta para ver tu perfil y gestionar tu información.
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerButtonText}>Crear Cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <User size={28} color={COLORS.orange} />
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de perfil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(customer?.name || userEmail || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.userName}>{customer?.name || user?.displayName || 'Usuario Eclipse'}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          
          <View style={styles.pointsBadge}>
            <Gift size={16} color={COLORS.orange} />
            <Text style={styles.pointsBadgeText}>{totalPoints.toLocaleString()} puntos</Text>
          </View>
        </View>

        {/* Información del usuario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Mail size={20} color={COLORS.orange} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userEmail}</Text>
              </View>
            </View>
            
            {customer?.phone && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Phone size={20} color={COLORS.orange} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{customer.phone}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Opciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Bell size={20} color="#F59E0B" />
                </View>
                <Text style={styles.optionText}>Notificaciones</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <CreditCard size={20} color="#3B82F6" />
                </View>
                <Text style={styles.optionText}>Métodos de Pago</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Shield size={20} color="#6366F1" />
                </View>
                <Text style={styles.optionText}>Privacidad y Seguridad</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#D1FAE5' }]}>
                  <HelpCircle size={20} color="#10B981" />
                </View>
                <Text style={styles.optionText}>Ayuda y Soporte</Text>
              </View>
              <ChevronRight size={20} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Eclipse App v1.0.0</Text>
          <Text style={styles.footerSubtext}>Conectado a Firebase ✓</Text>
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
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  notLoggedInTitle: {
    color: COLORS.black,
    fontSize: 24,
    fontWeight: 'bold',
  },
  notLoggedInText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: COLORS.orange,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 16,
  },
  registerButtonText: {
    color: COLORS.orange,
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.orange,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    color: COLORS.black,
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: 4,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.orangeLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  pointsBadgeText: {
    color: COLORS.orange,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.orangeLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.gray,
    fontSize: 12,
  },
  infoValue: {
    color: COLORS.black,
    fontSize: 16,
    marginTop: 2,
  },
  optionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    color: COLORS.black,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  logoutText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  footerSubtext: {
    color: '#10B981',
    fontSize: 12,
    marginTop: 4,
  },
});
