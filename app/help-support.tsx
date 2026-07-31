import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  MapPin,
  Clock,
  Gift,
  QrCode,
  Ticket,
} from 'lucide-react-native';

const COLORS = {
  orange: '#F97316',
  orangeLight: '#FED7AA',
  black: '#1a1a1a',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  green: '#10B981',
};

const FAQS = [
  {
    q: '¿Cómo acumulo puntos?',
    a: 'En la caja pedí que carguen tus puntos con tu DNI. Cada compra suma puntos según el monto. Después vas a verlos en la app.',
    icon: Gift,
  },
  {
    q: '¿Cómo canjeo un premio?',
    a: 'Andá a la sección de puntos, elegí “Canjear Premio” y escaneá el QR que te genera el cajero. Necesitás internet y saldo suficiente.',
    icon: QrCode,
  },
  {
    q: 'Me cargaron puntos antes de crear la cuenta',
    a: 'Si te cargaron puntos con tu DNI, al registrarte en la app con el mismo DNI esos puntos se vinculan automáticamente a tu cuenta.',
    icon: Ticket,
  },
  {
    q: 'No me llegan las notificaciones',
    a: 'Revisá que hayas aceptado el permiso de notificaciones en el celular. Si no, cerrá sesión, volvé a entrar y aceptá cuando te lo pida el sistema.',
    icon: MessageCircle,
  },
  {
    q: '¿Puedo cambiar mi nombre?',
    a: 'Si te registraste con Google, sí podés editarlo en Privacidad y Seguridad. Si te registraste con el formulario, el nombre queda fijo por seguridad.',
    icon: HelpCircle,
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const openWhatsApp = () => {
    // Número placeholder — se puede cambiar después
    Linking.openURL('https://wa.me/5493810000000?text=Hola%2C%20necesito%20ayuda%20con%20Eclipse%20App');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.black} />
        </TouchableOpacity>
        <HelpCircle size={22} color={COLORS.orange} />
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Resolvé las dudas más comunes o contactanos si necesitás una mano.
        </Text>

        {/* Info del local */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#DBEAFE' }]}>
              <MapPin size={18} color="#3B82F6" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Local</Text>
              <Text style={styles.infoValue}>Eclipse Minimercado</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={18} color="#F59E0B" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Horario de atención</Text>
              <Text style={styles.infoValue}>Lunes a Sábados · 8:00 a 21:00</Text>
            </View>
          </View>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
        <View style={styles.faqCard}>
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            const Icon = item.icon;
            return (
              <View key={item.q} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setOpenIndex(open ? null : index)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.faqIcon, { backgroundColor: COLORS.orangeLight }]}>
                    <Icon size={16} color={COLORS.orange} />
                  </View>
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  {open ? (
                    <ChevronUp size={18} color={COLORS.gray} />
                  ) : (
                    <ChevronDown size={18} color={COLORS.gray} />
                  )}
                </TouchableOpacity>
                {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
              </View>
            );
          })}
        </View>

        {/* Contacto */}
        <Text style={styles.sectionTitle}>¿Necesitás más ayuda?</Text>
        <TouchableOpacity style={styles.contactBtn} onPress={openWhatsApp}>
          <MessageCircle size={20} color={COLORS.white} />
          <Text style={styles.contactBtnText}>Escribinos por WhatsApp</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          También podés consultar en el local al cajero o administrador.
        </Text>

        <View style={styles.creditsBox}>
          <Text style={styles.creditsLine}>
            Desarrollado por Lionel Adams — Sistemas Informáticos
          </Text>
          <Text style={styles.creditsCopy}>
            © Eclipse — Todos los derechos reservados
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  intro: { color: COLORS.gray, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 8,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.gray },
  infoValue: { fontSize: 15, color: COLORS.black, fontWeight: '600', marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 10,
  },
  faqCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  faqIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingLeft: 56,
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 20,
  },
  contactBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  footerNote: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 14,
    lineHeight: 18,
  },
  creditsBox: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    gap: 6,
  },
  creditsLine: {
    textAlign: 'center',
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '600',
  },
  creditsCopy: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 11,
  },
});
