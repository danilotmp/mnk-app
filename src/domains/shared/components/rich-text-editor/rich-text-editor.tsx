import { useTheme } from '@/hooks/use-theme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { createRichTextEditorStyles } from './rich-text-editor.styles';
import { RichTextEditorProps } from './rich-text-editor.types';

/**
 * Componente genérico de Editor de Texto Enriquecido basado en Jodit Editor.
 * Funciona mediante un WebView para garantizar consistencia entre Web y Móvil.
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
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);

  // Determinar altura final
  const finalHeight = height ?? 400;

  // Generar HTML con Jodit Editor
  const getHtml = useCallback(() => {
    // Forzamos tema light para el editor
    const theme = 'default';
    
    // Inyectar el valor inicial escapando caracteres de JS
    const initialContent = value ? JSON.stringify(value) : '""';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/jodit/3.24.9/jodit.min.css" />
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jodit/3.24.9/jodit.min.js"></script>
          <style>
            body, html { height: 100%; margin: 0; padding: 0; overflow: hidden; background-color: white; }
            .jodit-container { border: none !important; height: 100% !important; background-color: white !important; }
            .jodit-workplace { height: calc(100% - 50px) !important; background-color: white !important; }
            .jodit-wysiwyg { background-color: white !important; color: black !important; }
          </style>
        </head>
        <body>
          <textarea id="editor"></textarea>
          <script>
            const editor = Jodit.make('#editor', {
              theme: '${theme}',
              placeholder: '${placeholder}',
              readonly: ${readOnly},
              height: ${typeof finalHeight === 'number' ? finalHeight : `'${finalHeight}'`},
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

            // Set initial content
            editor.value = ${initialContent};

            // Notify React Native on change
            editor.events.on('change', (newValue) => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(newValue);
              }
            });

            // Signal ready
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('__READY__');
            }
          </script>
        </body>
      </html>
    `;
  }, [isDark, placeholder, readOnly, value]);

  const handleMessage = (event: any) => {
    const data = event.nativeEvent.data;
    if (data === '__READY__') {
      setIsReady(true);
    } else {
      onChange(data);
    }
  };

  // Actualizar contenido si el valor cambia externamente (solo si no es el mismo para evitar loops)
  useEffect(() => {
    if (isReady && webViewRef.current) {
      const script = `
        if (editor && editor.value !== ${JSON.stringify(value)}) {
          editor.value = ${JSON.stringify(value)};
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  }, [value, isReady]);

  return (
    <View style={[styles.container, { height: finalHeight }, style, { borderColor: colors.border }]}>
      <WebView
        ref={webViewRef}
        source={{ html: getHtml() }}
        onMessage={handleMessage}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
      />
      {!isReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      )}
    </View>
  );
}
