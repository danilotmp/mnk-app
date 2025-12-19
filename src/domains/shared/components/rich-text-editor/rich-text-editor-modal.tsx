import { Button } from '@/components/ui/button';
import { CenteredModal } from '@/components/ui/centered-modal';
import { useResponsive } from '@/hooks/use-responsive';
import { useTranslation } from '@/src/infrastructure/i18n';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { RichTextEditor } from './rich-text-editor';

export interface RichTextEditorModalProps {
  visible: boolean;
  value: string;
  title?: string;
  onClose: () => void;
  onSave: (value: string) => void;
}

export function RichTextEditorModal({
  visible,
  value,
  title,
  onClose,
  onSave,
}: RichTextEditorModalProps) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const { height: windowHeight } = useWindowDimensions();
  const [currentValue, setCurrentValue] = useState(value);

  // Sincronizar cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setCurrentValue(value);
    }
  }, [visible, value]);

  const handleSave = () => {
    onSave(currentValue);
    onClose();
  };

  /**
   * Cálculo dinámico de la altura usable para el editor Jodit.
   * Basado en la altura del CenteredModal (90% en desktop, 100% en mobile).
   * Restamos el espacio ocupado por header, footer y paddings internos.
   */
  const calculateUsableHeight = () => {
    const modalPercentage = isMobile ? 1 : 0.9;
    const modalHeight = windowHeight * modalPercentage;
    
    // Header: padding vertical (20*2) + altura estimada texto (28) + border (1) = ~69px
    const headerHeight = 80; 
    
    // Footer: padding vertical (16*2) + altura botones (40) + border (1) = ~73px
    const footerHeight = 75; 
    
    // Paddings: CenteredModal scrollContent (24*2) + RichTextEditorModal container (16*2) = 80px
    const totalPaddings = 80; 
    
    const usableHeight = modalHeight - headerHeight - footerHeight - totalPaddings;
    
    // Asegurar una altura mínima razonable
    return Math.max(usableHeight, 300);
  };

  const editorHeight = calculateUsableHeight();

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={title || 'Editor de Texto'}
      width={isMobile ? '100%' : '90%'}
      height={isMobile ? '100%' : '90%'}
      footer={
        <View style={styles.footer}>
          <Button
            title={t.common?.cancel || 'Cancelar'}
            onPress={onClose}
            variant="outlined"
          />
          <Button
            title={t.common?.save || 'Guardar cambios'}
            onPress={handleSave}
            variant="primary"
          />
        </View>
      }
    >
      <View style={styles.container}>
        <RichTextEditor
          value={currentValue}
          onChange={setCurrentValue}
          style={{ flex: 1 }}
          height={editorHeight}
        />
      </View>
    </CenteredModal>
  );
}

const styles = StyleSheet.create({  
  container: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
});
