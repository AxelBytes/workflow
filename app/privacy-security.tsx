import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Mail, Phone, User, Lock, Save } from 'lucide-react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateEmail, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useAuthContext } from '../contexts/AuthContext';
import { useCustomerData } from '../hooks/useFirebaseSync';

const COLORS = {
  orange: '#F97316',
  orangeLight: '#FED7AA',
  black: '#1a1a1a',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  red: '#EF4444',
  green: '#10B981',
};

function splitName(fullName: string): { first: string; last: string } {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { user, userEmail, isAuthenticated } = useAuthContext();
  const { customer } = useCustomerData(userEmail);

  // Nombre editable solo con Google (o si el perfil lo marca explícitamente)
  const isGoogleUser = useMemo(() => {
    const fromProvider = !!user?.providerData?.some((p) => p.providerId === 'google.com');
    const fromProfile = (customer as any)?.nameEditable === true;
    const lockedByForm = (customer as any)?.nameEditable === false || (customer as any)?.source === 'mobile_app';
    if (lockedByForm && !fromProvider) return false;
    return fromProvider || fromProfile;
  }, [user, customer]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sourceName = customer?.name || user?.displayName || '';
    const { first, last } = splitName(sourceName);
    setFirstName(first);
    setLastName(last);
    setEmail(userEmail || customer?.email || '');
    setPhone(customer?.phone || '');
  }, [customer, userEmail, user?.displayName]);

  if (!isAuthenticated || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacidad y Seguridad</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.muted}>Iniciá sesión para editar tu información.</Text>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      Alert.alert('Email inválido', 'Ingresá un correo válido.');
      return;
    }
    if (cleanPhone && cleanPhone.length < 8) {
      Alert.alert('Teléfono inválido', 'Ingresá un número válido (mínimo 8 dígitos).');
      return;
    }
    if (isGoogleUser && !firstName.trim()) {
      Alert.alert('Nombre requerido', 'Ingresá tu nombre.');
      return;
    }

    setSaving(true);
    try {
      // Actualizar email en Firebase Auth si cambió
      if (cleanEmail !== (user.email || '').toLowerCase()) {
        try {
          await updateEmail(user, cleanEmail);
        } catch (err: any) {
          if (err?.code === 'auth/requires-recent-login') {
            Alert.alert(
              'Confirmá tu identidad',
              'Para cambiar el correo tenés que cerrar sesión e iniciar de nuevo, y después intentar otra vez.'
            );
            setSaving(false);
            return;
          }
          if (err?.code === 'auth/email-already-in-use') {
            Alert.alert('Email en uso', 'Ese correo ya está registrado en otra cuenta.');
            setSaving(false);
            return;
          }
          throw err;
        }
      }

      // Nombre solo editable si es Google
      if (isGoogleUser) {
        await updateProfile(user, { displayName: fullName });
      }

      const customerId = customer?.id || user.uid;
      const customerRef = doc(db, 'customers', customerId);

      const payload: Record<string, unknown> = {
        email: cleanEmail,
        phone: cleanPhone,
        lastActivity: serverTimestamp(),
      };

      if (isGoogleUser) {
        payload.name = fullName;
        payload.firstName = firstName.trim();
        payload.lastName = lastName.trim();
      }

      await setDoc(customerRef, payload, { merge: true });

      Alert.alert('Listo', 'Tus datos se actualizaron correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.black} />
        </TouchableOpacity>
        <Shield size={22} color={COLORS.orange} />
        <Text style={styles.headerTitle}>Privacidad y Seguridad</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionHint}>
          Actualizá tus datos de contacto. El nombre y apellido solo se pueden editar si ingresaste con Google.
        </Text>

        {/* Nombre / Apellido */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={18} color={COLORS.orange} />
            <Text style={styles.cardTitle}>Nombre y apellido</Text>
            {!isGoogleUser && (
              <View style={styles.lockBadge}>
                <Lock size={12} color={COLORS.gray} />
                <Text style={styles.lockText}>Fijo</Text>
              </View>
            )}
          </View>

          {!isGoogleUser && (
            <Text style={styles.lockNote}>
              Te registraste con el formulario. El nombre no se puede modificar por seguridad.
            </Text>
          )}

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, !isGoogleUser && styles.inputDisabled]}
            value={firstName}
            onChangeText={setFirstName}
            editable={isGoogleUser}
            placeholder="Nombre"
            placeholderTextColor={COLORS.gray}
          />

          <Text style={styles.label}>Apellido</Text>
          <TextInput
            style={[styles.input, !isGoogleUser && styles.inputDisabled]}
            value={lastName}
            onChangeText={setLastName}
            editable={isGoogleUser}
            placeholder="Apellido"
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {/* Email */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Mail size={18} color={COLORS.orange} />
            <Text style={styles.cardTitle}>Correo electrónico</Text>
          </View>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="tu@email.com"
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {/* Teléfono */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Phone size={18} color={COLORS.orange} />
            <Text style={styles.cardTitle}>Teléfono</Text>
          </View>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^\d+\s-]/g, ''))}
            keyboardType="phone-pad"
            placeholder="Ej: 3815551234"
            placeholderTextColor={COLORS.gray}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Save size={18} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightGray },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.black, flex: 1 },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  muted: { color: COLORS.gray, fontSize: 15, textAlign: 'center' },
  sectionHint: { color: COLORS.gray, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, flex: 1 },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockText: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  lockNote: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 12,
    lineHeight: 18,
  },
  label: { fontSize: 12, color: COLORS.gray, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 8,
  },
  inputDisabled: { opacity: 0.65 },
  saveBtn: {
    backgroundColor: COLORS.orange,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
