import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { View, StyleSheet } from 'react-native';
import { getStatusColor, getStatusIcon } from '@/src/domains/shared/types/status.types';

interface StatusBadgeProps {
  status: number;
  statusDescription: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

/**
 * Componente para mostrar badges de estado
 * El backend envía status (número) y statusDescription (texto traducido)
 */
export const StatusBadge = ({ 
  status, 
  statusDescription, 
  size = 'medium',
  showIcon = true 
}: StatusBadgeProps) => {
  const color = getStatusColor(status);
  const icon = getStatusIcon(status);
  
  const sizes = {
    small: { 
      fontSize: 12, 
      iconSize: 14, 
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    medium: { 
      fontSize: 14, 
      iconSize: 16, 
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    large: { 
      fontSize: 16, 
      iconSize: 18, 
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 14,
    },
  };
  
  const currentSize = sizes[size];
  
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '20', // 20 = 12% opacity
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
          borderRadius: currentSize.borderRadius,
        },
      ]}
    >
      {showIcon && (
        <Ionicons
          name={icon as any}
          size={currentSize.iconSize}
          color={color}
          style={styles.icon}
        />
      )}
      <ThemedText
        style={{
          color: color,
          fontSize: currentSize.fontSize,
          fontWeight: '600',
        }}
      >
        {statusDescription}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});

