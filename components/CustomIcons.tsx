import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Home, 
  Package, 
  ShoppingBag, 
  User, 
  Search, 
  Filter, 
  Grid3x3, 
  List, 
  Plus, 
  Minus, 
  Trash2, 
  Heart, 
  Star, 
  Clock, 
  Truck, 
  Sparkles, 
  TrendingUp, 
  Zap,
  ChevronRight,
  Edit3,
  Award,
  Shield,
  CreditCard,
  ArrowRight,
  Store,
  Bell,
  MapPin,
  CircleHelp,
  LogOut
} from 'lucide-react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  style?: any;
}

const iconComponents = {
  home: Home,
  package: Package,
  shoppingBag: ShoppingBag,
  user: User,
  search: Search,
  filter: Filter,
  grid: Grid3x3,
  list: List,
  plus: Plus,
  minus: Minus,
  trash: Trash2,
  heart: Heart,
  star: Star,
  clock: Clock,
  truck: Truck,
  sparkles: Sparkles,
  trendingUp: TrendingUp,
  zap: Zap,
  chevronRight: ChevronRight,
  edit: Edit3,
  award: Award,
  shield: Shield,
  creditCard: CreditCard,
  arrowRight: ArrowRight,
  store: Store,
  bell: Bell,
  mapPin: MapPin,
  help: CircleHelp,
  logout: LogOut,
};

export const CustomIcon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  color = "#000000", 
  strokeWidth = 2,
  fill,
  style 
}) => {
  const IconComponent = iconComponents[name as keyof typeof iconComponents];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent 
      size={size} 
      color={color} 
      strokeWidth={strokeWidth}
      fill={fill}
      style={style}
    />
  );
};

interface IconBadgeProps {
  children: React.ReactNode;
  count?: number;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const IconBadge: React.FC<IconBadgeProps> = ({ 
  children, 
  count, 
  size = 20, 
  color = "#FFFFFF",
  backgroundColor = "#F9C80E"
}) => {
  if (!count || count <= 0) {
    return <>{children}</>;
  }

  return (
    <View style={styles.badgeContainer}>
      {children}
      <View style={[styles.badge, { backgroundColor, width: size, height: size }]}>
        <CustomIcon 
          name="star" 
          size={size * 0.4} 
          color={color} 
          strokeWidth={2}
        />
      </View>
    </View>
  );
};

interface AnimatedIconProps extends IconProps {
  animated?: boolean;
  onPress?: () => void;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({ 
  animated = false, 
  onPress, 
  ...props 
}) => {
  const icon = <CustomIcon {...props} />;
  
  if (!onPress) {
    return icon;
  }

  return (
    <View style={[styles.animatedContainer, animated && styles.animated]}>
      {icon}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  animatedContainer: {
    padding: 4,
    borderRadius: 8,
  },
  animated: {
    backgroundColor: 'rgba(46, 2, 73, 0.1)',
  },
});

export default CustomIcon; 