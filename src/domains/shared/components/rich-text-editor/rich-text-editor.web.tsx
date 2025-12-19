import { useTheme } from '@/hooks/use-theme';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createRichTextEditorStyles } from './rich-text-editor.styles';
import { RichTextEditorProps } from './rich-text-editor.types';

declare const Jodit: any;

/**
 * Versión WEB del Editor de Texto Enriquecido.
 * No usa WebView, sino que renderiza Jodit directamente en el DOM.
 */
export function RichTextEditor({
  value,
  onChange,
  style,
  placeholder = 'Empieza a escribir...',
  height,
  readOnly = false,
}: Readonly<RichTextEditorProps>) {
  const { colors, isDark } = useTheme();
  const styles = createRichTextEditorStyles(colors);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Determinar altura final
  const finalHeight = height ?? '100%';

  useEffect(() => {
    // 1. Cargar Scripts y Estilos si no están presentes
    const loadResources = async () => {
      if (typeof globalThis.window === 'undefined') return;

      if (!document.getElementById('jodit-style')) {
        const link = document.createElement('link');
        link.id = 'jodit-style';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/jodit/3.24.9/jodit.min.css';
        document.head.appendChild(link);
      }

      if (typeof globalThis.Jodit === 'undefined' && !document.getElementById('jodit-script')) {
        const script = document.createElement('script');
        script.id = 'jodit-script';
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jodit/3.24.9/jodit.min.js';
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);
      } else if (typeof globalThis.Jodit !== 'undefined') {
        setIsLoaded(true);
      }
    };

    loadResources();
  }, []);

  useEffect(() => {
    if (isLoaded && containerRef.current && !editorRef.current) {
      // 2. Inicializar Jodit - Forzamos tema light (default) para mejor legibilidad
      editorRef.current = new Jodit(containerRef.current, {
        theme: 'default',
        placeholder,
        readonly: readOnly,
        height: finalHeight,
        width: '100%',
        autofocus: true,
        toolbarSticky: false,
        useSearch: true,
        spellcheck: true,
        buttons: [
          'source', '|',
          'bold', 'italic', 'underline', 'strikethrough', 'eraser', '|',
          'superscript', 'subscript', '|',
          'ul', 'ol', 'outdent', 'indent', '|',
          'font', 'fontsize', 'brush', 'paragraph', '|',
          'image', 'video', 'table', 'link', 'hr', '|',
          'align', 'undo', 'redo', '|',
          'copyformat', 'symbol', 'fullsize', 'print', 'about'
        ],
        buttonsMD: [
          'bold', 'italic', 'underline', 'eraser', '|',
          'ul', 'ol', '|',
          'image', 'table', 'link', '|',
          'align', 'undo', 'redo', '|',
          'fullsize'
        ],
        buttonsSM: [
          'bold', 'italic', '|',
          'ul', 'ol', '|',
          'image', 'link', '|',
          'undo', 'redo'
        ],
        uploader: { insertImageAsBase64URI: true }
      });

      editorRef.current.value = value || '';

      // Escuchar cambios
      editorRef.current.events.on('change', (newValue: string) => {
        onChange(newValue);
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destruct();
        editorRef.current = null;
      }
    };
  }, [isLoaded, isDark, placeholder, readOnly]);

  // Sincronizar valor externo
  useEffect(() => {
    if (editorRef.current && editorRef.current.value !== value) {
      editorRef.current.value = value || '';
    }
  }, [value]);

  return (
    <View style={[{ height: finalHeight, borderColor: colors.border }, style, styles.container]}>
      {!isLoaded && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      )}
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}
