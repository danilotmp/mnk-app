/**
 * Pantalla principal de Chat IA
 * Interfaz administrativa para interactuar con clientes mediante Chat IA
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import type { Contact, ContactWithLastMessage, Message } from '@/src/domains/interacciones';
import { InteraccionesService, MessageDirection } from '@/src/domains/interacciones';
import { DynamicIcon } from '@/src/domains/security/components/shared/dynamic-icon/dynamic-icon';
import { useCompany } from '@/src/domains/shared';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
// Helper para formatear fecha relativa sin date-fns
const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    if (diffDays < 7) return `hace ${diffDays} d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
};

export default function ChatIAScreen() {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const { company } = useCompany();

  const [contacts, setContacts] = useState<ContactWithLastMessage[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isMessageInputFocused, setIsMessageInputFocused] = useState(false);
  
  // Calcular número de líneas del texto
  const lineHeight = 20; // Altura de línea aproximada (fontSize 15 + lineHeight)
  const paddingVertical = 20; // paddingVertical total (10 arriba + 10 abajo)
  const minHeight = 40; // Altura mínima (1 línea)
  const maxLines = 8; // Máximo de líneas antes de scroll
  const maxHeight = (lineHeight * maxLines) + paddingVertical; // ~180px para 8 líneas
  
  // Función para calcular altura basada en saltos de línea
  const calculateInputHeight = useCallback((text: string): number => {
    if (!text || text.trim().length === 0) {
      return minHeight;
    }
    
    // Contar saltos de línea (\n)
    const lineBreaks = (text.match(/\n/g) || []).length;
    // El número total de líneas es lineBreaks + 1 (la primera línea)
    const totalLines = Math.min(lineBreaks + 1, maxLines);
    
    // Calcular altura: minHeight + (líneas adicionales * lineHeight)
    // Si solo hay 1 línea, usamos minHeight
    const additionalLines = totalLines > 1 ? totalLines - 1 : 0;
    const calculatedHeight = minHeight + (additionalLines * lineHeight);
    
    return Math.min(calculatedHeight, maxHeight);
  }, [minHeight, lineHeight, maxLines, maxHeight]);
  
  const [messageInputHeight, setMessageInputHeight] = useState(minHeight);
  
  // Filtros de contactos
  const [contactFilter, setContactFilter] = useState<'all' | 'unread' | 'favorites'>('all');
  
  // Búsqueda en mensajes (con animación horizontal)
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const messageSearchWidthAnim = useRef(new Animated.Value(0)).current;
  
  // Panel de información del contacto - siempre visible cuando hay contacto seleccionado
  
  // Estado del Chat IA (mock por ahora)
  const [chatIAEnabled, setChatIAEnabled] = useState(true);
  
  // Estado del selector de emojis
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Estado del panel de información del contacto (oculto en móvil, visible en web por defecto)
  const [showContactInfoPanel, setShowContactInfoPanel] = useState(!isMobile);
  const contactInfoPanelAnim = useRef(new Animated.Value(isMobile ? 1 : 0)).current; // 0 = visible, 1 = oculto
  
  // Etiquetas disponibles (mock)
  const availableTags = [
    { id: '1', label: 'Los chillos', color: '#FF6B35' },
    { id: '2', label: 'Ecografia', color: '#4ECDC4' },
    { id: '3', label: 'Rayos X', color: '#45B7D1' },
    { id: '4', label: 'TUMBACO', color: '#96CEB4' },
    { id: '5', label: 'Resonancia Magnética', color: '#FFEAA7' },
  ];
  
  // Mensajes predeterminados (mock)
  const quickMessages = [
    'Buenos días, ¿en qué puedo ayudarle?',
    'Gracias por contactarnos',
    '¿Necesita más información?',
    'Estaremos encantados de atenderle',
  ];

  // Cargar contactos
  const loadContacts = useCallback(async () => {
    if (!company?.id || isLoadingContacts) return;

    try {
      setIsLoadingContacts(true);
      setLoading(true);
      const contactsList = await InteraccionesService.getContacts(company.id);
      
      // Para cada contacto, obtener solo el último mensaje (optimizado)
      const contactsWithMessages = await Promise.all(
        contactsList.map(async (contact) => {
          try {
            // Solo obtener el último mensaje, no todos los mensajes
            const contactMessages = await InteraccionesService.getMessagesByContact(contact.id, 1);
            const lastMessage = contactMessages[0] || undefined;
            
            // Contar mensajes no leídos solo si hay último mensaje y es inbound no leído
            // Para optimizar, solo contamos si el último mensaje es inbound y no leído
            // En una implementación real, el backend debería devolver el count de no leídos
            let unreadCount: number | undefined = undefined;
            if (lastMessage && lastMessage.direction === 'INBOUND' && lastMessage.status !== 'READ') {
              // Solo si el último mensaje es no leído, hacemos una llamada adicional para contar
              // En producción, esto debería venir del backend
              try {
                const allMessages = await InteraccionesService.getMessagesByContact(contact.id);
                const count = allMessages.filter(
                  (m) => m.direction === 'INBOUND' && m.status !== 'READ'
                ).length;
                unreadCount = count > 0 ? count : undefined;
              } catch {
                // Si falla, no mostramos contador
                unreadCount = undefined;
              }
            }

            return {
              ...contact,
              lastMessage,
              unreadCount,
            } as ContactWithLastMessage;
          } catch (error) {
            return {
              ...contact,
              lastMessage: undefined,
              unreadCount: undefined,
            } as ContactWithLastMessage;
          }
        })
      );

      // Ordenar por último mensaje (más reciente primero)
      contactsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      });

      setContacts(contactsWithMessages);
    } catch (error: any) {
      console.error('Error al cargar contactos:', error);
      alert.showError('Error al cargar contactos', error?.message);
    } finally {
      setLoading(false);
      setIsLoadingContacts(false);
    }
  }, [company?.id]);

  // Cargar mensajes de un contacto
  const loadMessages = useCallback(async (contactId: string) => {
    if (loadingMessages) return; // Evitar llamadas duplicadas
    
    try {
      setLoadingMessages(true);
      const messagesList = await InteraccionesService.getMessagesByContact(contactId);
      // Ordenar por fecha (más antiguo primero)
      messagesList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(messagesList);
    } catch (error: any) {
      console.error('Error al cargar mensajes:', error);
      alert.showError('Error al cargar mensajes', error?.message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Seleccionar contacto
  const handleSelectContact = useCallback(async (contact: Contact) => {
    setSelectedContact(contact);
    // En móvil, el panel se oculta por defecto. En web, se muestra.
    setShowContactInfoPanel(!isMobile);
    // Cargar mensajes directamente sin depender del callback
    try {
      setLoadingMessages(true);
      const messagesList = await InteraccionesService.getMessagesByContact(contact.id);
      messagesList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(messagesList);
    } catch (error: any) {
      console.error('Error al cargar mensajes:', error);
      alert.showError('Error al cargar mensajes', error?.message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Enviar mensaje
  const handleSendMessage = useCallback(async () => {
    if (!selectedContact || !messageText.trim() || !company?.id || sendingMessage) return;

    try {
      setSendingMessage(true);
      await InteraccionesService.createMessage({
        contactId: selectedContact.id,
        direction: MessageDirection.OUTBOUND,
        content: messageText.trim(),
        status: 'SENT' as any,
      });

      const messageContent = messageText.trim();
      setMessageText('');
      setMessageInputHeight(minHeight);
      
      // Recargar mensajes del contacto actual directamente
      if (selectedContact.id) {
        try {
          setLoadingMessages(true);
          const messagesList = await InteraccionesService.getMessagesByContact(selectedContact.id);
          messagesList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setMessages(messagesList);
        } catch (error) {
          console.error('Error al recargar mensajes:', error);
        } finally {
          setLoadingMessages(false);
        }
      }
      
      // Recargar contactos para actualizar último mensaje (solo si no está cargando)
      if (!isLoadingContacts && company?.id) {
        // Llamar directamente sin usar el callback para evitar dependencias
        try {
          setIsLoadingContacts(true);
          const contactsList = await InteraccionesService.getContacts(company.id);
          const contactsWithMessages = await Promise.all(
            contactsList.map(async (contact) => {
              try {
                const contactMessages = await InteraccionesService.getMessagesByContact(contact.id, 1);
                const lastMessage = contactMessages[0] || undefined;
                return {
                  ...contact,
                  lastMessage,
                  unreadCount: undefined, // Simplificado para evitar llamadas adicionales
                } as ContactWithLastMessage;
              } catch {
                return {
                  ...contact,
                  lastMessage: undefined,
                  unreadCount: undefined,
                } as ContactWithLastMessage;
              }
            })
          );
          contactsWithMessages.sort((a, b) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
          });
          setContacts(contactsWithMessages);
        } catch (error) {
          console.error('Error al recargar contactos:', error);
        } finally {
          setIsLoadingContacts(false);
        }
      }
    } catch (error: any) {
      console.error('Error al enviar mensaje:', error);
      alert.showError('Error al enviar mensaje', error?.message);
    } finally {
      setSendingMessage(false);
    }
  }, [selectedContact, messageText, company?.id, sendingMessage, isLoadingContacts]);

  // Efecto inicial - solo cargar una vez cuando se monta el componente
  useEffect(() => {
    if (company?.id && !isLoadingContacts && contacts.length === 0) {
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  // Filtrar contactos por búsqueda y filtros
  const filteredContacts = contacts.filter((contact) => {
    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        contact.name.toLowerCase().includes(query) ||
        contact.phoneNumber.includes(query) ||
        (contact.email && contact.email.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Filtros específicos
    switch (contactFilter) {
      case 'unread':
        return (contact.unreadCount && contact.unreadCount > 0) || false;
      case 'favorites':
        // Mock: asumimos que favoritos tienen un tag especial
        return contact.tags?.includes('favorite') || false;
      case 'all':
      default:
        return true;
    }
  });
  
  // Filtrar mensajes por búsqueda
  const filteredMessages = messageSearchQuery.trim()
    ? messages.filter((msg) => 
        msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase())
      )
    : messages;

  // Animación del buscador de mensajes
  useEffect(() => {
    Animated.timing(messageSearchWidthAnim, {
      toValue: showMessageSearch ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showMessageSearch, messageSearchWidthAnim]);

  // Animación del panel de información del contacto
  useEffect(() => {
    Animated.timing(contactInfoPanelAnim, {
      toValue: showContactInfoPanel ? 0 : 1, // 0 = visible, 1 = oculto
      duration: 300,
      useNativeDriver: false, // Necesario para animar width
    }).start();
  }, [showContactInfoPanel, contactInfoPanelAnim]);


  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerShown: false,
        }}
      />
      <ThemedView style={styles.container}>
        <View style={[styles.layout, { backgroundColor: colors.background, flexDirection: isMobile ? 'column' : 'row' }]}>
          {/* Panel izquierdo: Lista de contactos */}
          {(!isMobile || !selectedContact) && (
            <View style={[
              styles.contactsPanel,
              { backgroundColor: colors.surface },
              isMobile && { width: '100%', borderRightWidth: 0 }
            ]}>
            {/* Barra de búsqueda */}
            <View style={[styles.searchBar]}>
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name="search"
                  size={18}
                  color={colors.textSecondary}
                  style={{ position: 'absolute', left: 10, top: 10, zIndex: 1 }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 10, top: 8, zIndex: 1, padding: 4 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
                <InputWithFocus
                  containerStyle={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 6,
                    backgroundColor: colors.background,
                    paddingLeft: 36,
                    paddingRight: searchQuery.length > 0 ? 36 : 10,
                    height: 36,
                  }}
                  primaryColor={colors.primary}
                >
                  <TextInput
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={{
                      padding: 8,
                      color: colors.text,
                      fontSize: 14,
                    }}
                    placeholderTextColor={colors.textSecondary}
                  />
                </InputWithFocus>
              </View>
            </View>

            {/* Filtros de contactos */}
            <View style={[styles.filtersContainer]}>
              <View style={styles.filtersScroll}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: contactFilter === 'all' ? colors.primary : colors.surface,
                      borderColor: contactFilter === 'all' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setContactFilter('all')}
                >
                  <ThemedText
                    type="caption"
                    style={{
                      color: contactFilter === 'all' ? '#FFFFFF' : colors.text,
                      fontWeight: contactFilter === 'all' ? '600' : '400',
                    }}
                  >
                    Todos
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: contactFilter === 'unread' ? colors.primary : colors.surface,
                      borderColor: contactFilter === 'unread' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setContactFilter('unread')}
                >
                  <ThemedText
                    type="caption"
                    style={{
                      color: contactFilter === 'unread' ? '#FFFFFF' : colors.text,
                      fontWeight: contactFilter === 'unread' ? '600' : '400',
                    }}
                  >
                    No leídos
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: contactFilter === 'favorites' ? colors.primary : colors.surface,
                      borderColor: contactFilter === 'favorites' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setContactFilter('favorites')}
                >
                  <ThemedText
                    type="caption"
                    style={{
                      color: contactFilter === 'favorites' ? '#FFFFFF' : colors.text,
                      fontWeight: contactFilter === 'favorites' ? '600' : '400',
                    }}
                  >
                    Favoritos
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista de contactos */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText type="body2" style={{ marginTop: 16, color: colors.textSecondary }}>
                  Cargando contactos...
                </ThemedText>
              </View>
            ) : filteredContacts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
                <ThemedText type="body2" style={{ marginTop: 16, color: colors.textSecondary, textAlign: 'center' }}>
                  {searchQuery ? 'No se encontraron contactos' : 'No hay contactos aún'}
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.contactsList} showsVerticalScrollIndicator={false}>
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  return (
                    <TouchableOpacity
                      key={contact.id}
                      style={[
                        styles.contactItem,
                        {
                          backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                          borderLeftColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => handleSelectContact(contact)}
                    >
                      <View style={styles.contactAvatar}>
                        <ThemedText type="h4" style={{ color: '#FFFFFF' }}>
                          {contact.name.charAt(0).toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={styles.contactInfo}>
                        <View style={styles.contactHeader}>
                          <ThemedText type="body2" style={{ fontWeight: '600', color: colors.text }} numberOfLines={1}>
                            {contact.name}
                          </ThemedText>
                          {contact.lastMessage && (
                            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                              {formatRelativeTime(contact.lastMessage.createdAt)}
                            </ThemedText>
                          )}
                        </View>
                        <View style={styles.contactFooter}>
                          <ThemedText
                            type="caption"
                            style={{ color: colors.textSecondary, flex: 1 }}
                            numberOfLines={1}
                          >
                            {contact.lastMessage?.content || contact.phoneNumber}
                          </ThemedText>
                          {contact.unreadCount && contact.unreadCount > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                              <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                                {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                              </ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
          )}

          {/* Panel derecho: Chat */}
          {(!isMobile || selectedContact) && (
            selectedContact ? (
              <View style={[styles.chatPanel, { backgroundColor: colors.background }]}>
              {/* Header del chat */}
              <View style={[styles.chatHeader, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
                <View style={styles.chatHeaderInfo}>
                  <View style={[styles.chatAvatar, { backgroundColor: colors.primary }]}>
                    <ThemedText type="h4" style={{ color: '#FFFFFF' }}>
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="body2" style={{ fontWeight: '600', color: colors.text }}>
                      {selectedContact.name}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                      {selectedContact.phoneNumber}
                    </ThemedText>
                    {/* Etiquetas del contacto */}
                    {selectedContact.tags && selectedContact.tags.length > 0 && (
                      <View style={styles.contactTagsRow}>
                        {selectedContact.tags.map((tagId) => {
                          const tag = availableTags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <View
                              key={tagId}
                              style={[styles.contactTag, { backgroundColor: tag.color }]}
                            >
                              <ThemedText type="caption" style={{ color: '#FFFFFF', fontSize: 10 }}>
                                {tag.label}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.chatHeaderActions}>
                  {/* Botón para mostrar/ocultar panel de información del contacto */}
                  {!isMobile && (
                    <Tooltip
                      text={showContactInfoPanel ? 'Ocultar información' : 'Mostrar información'}
                      position="bottom"
                    >
                      <TouchableOpacity
                        onPress={() => setShowContactInfoPanel(!showContactInfoPanel)}
                        style={styles.chatIAToggle}
                      >
                        <Ionicons
                          name={showContactInfoPanel ? "information-circle" : "information-circle-outline"}
                          size={24}
                          color={showContactInfoPanel ? colors.primary : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </Tooltip>
                  )}
                  {/* Botón de activar/desactivar Chat IA */}
                  <Tooltip
                    text={chatIAEnabled ? 'Desactivar Chat IA' : 'Activar Chat IA'}
                    position="bottom"
                  >
                    <TouchableOpacity
                      onPress={() => setChatIAEnabled(!chatIAEnabled)}
                      style={styles.chatIAToggle}
                    >
                      <DynamicIcon
                        name="FontAwesome5:robot"
                        size={24}
                        color={chatIAEnabled ? colors.primary : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </Tooltip>
                  {/* Búsqueda en mensajes (expandible horizontalmente) */}
                  <Animated.View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      height: 40,
                      marginLeft: 8,
                      overflow: 'hidden',
                      width: messageSearchWidthAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 250],
                      }),
                    }}
                  >
                    {showMessageSearch ? (
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
                        <Ionicons
                          name="search"
                          size={18}
                          color={colors.textSecondary}
                          style={{ position: 'absolute', left: 10, top: 11, zIndex: 1 }}
                        />
                        {messageSearchQuery.length > 0 && (
                          <TouchableOpacity
                            onPress={() => setMessageSearchQuery('')}
                            style={{ position: 'absolute', right: 10, top: 9, zIndex: 1, padding: 4 }}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="close-circle"
                              size={18}
                              color={colors.textSecondary}
                            />
                          </TouchableOpacity>
                        )}
                        <InputWithFocus
                          containerStyle={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 6,
                            backgroundColor: colors.background,
                            paddingLeft: 36,
                            paddingRight: messageSearchQuery.length > 0 ? 36 : 10,
                            height: 36,
                            flex: 1,
                          }}
                          primaryColor={colors.primary}
                        >
                          <TextInput
                            placeholder="Buscar en mensajes..."
                            value={messageSearchQuery}
                            onChangeText={setMessageSearchQuery}
                            style={{
                              padding: 8,
                              color: colors.text,
                              fontSize: 14,
                            }}
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                          />
                        </InputWithFocus>
                        <TouchableOpacity
                          onPress={() => {
                            setShowMessageSearch(false);
                            setMessageSearchQuery('');
                          }}
                          style={{
                            marginLeft: 8,
                            width: 40,
                            height: 40,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons
                            name="close"
                            size={20}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setShowMessageSearch(true)}
                        style={{
                          width: 40,
                          height: 40,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons
                          name="search"
                          size={20}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </Animated.View>
                </View>
              </View>

              {/* Área de mensajes */}
              {loadingMessages ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <ScrollView
                  style={styles.messagesArea}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.length === 0 ? (
                    <View style={styles.emptyMessages}>
                      <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
                      <ThemedText type="body2" style={{ marginTop: 16, color: colors.textSecondary, textAlign: 'center' }}>
                        No hay mensajes aún
                      </ThemedText>
                    </View>
                  ) : (
                    filteredMessages.map((message) => {
                      // El backend devuelve direction en minúsculas: "inbound" o "outbound"
                      const directionStr = String(message.direction).toLowerCase();
                      const isOutbound = directionStr === 'outbound';
                      return (
                        <View
                          key={message.id}
                          style={[
                            styles.messageContainer,
                            isOutbound ? styles.messageOutbound : styles.messageInbound,
                          ]}
                        >
                          <View
                            style={[
                              styles.messageBubble,
                              {
                                backgroundColor: isOutbound ? colors.surfaceVariant : colors.surface,
                                borderColor: colors.border,
                              },
                            ]}
                          >
                            <ThemedText
                              type="body2"
                              style={{ color: colors.text }}
                            >
                              {message.content}
                            </ThemedText>
                            <ThemedText
                              type="caption"
                              style={{
                                color: colors.textSecondary,
                                marginTop: 4,
                                fontSize: 10,
                              }}
                            >
                              {new Date(message.createdAt).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              )}

              {/* Input de mensaje */}
              <View style={[
                styles.messageInputContainer, 
                { 
                  backgroundColor: colors.surfaceVariant, 
                  borderTopColor: colors.border,
                  marginBottom: showEmojiPicker ? 350 : 0,
                }
              ]}>
                {/* Botón adjuntar */}
                <TouchableOpacity 
                  style={[
                    styles.inputActionButton,
                    { backgroundColor: colors.surface }
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
                
                {/* Botón emoji */}
                <TouchableOpacity 
                  style={[
                    styles.inputActionButton,
                    { backgroundColor: showEmojiPicker ? colors.primary + '20' : colors.surface }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Ionicons 
                    name={showEmojiPicker ? "happy" : "happy-outline"} 
                    size={22} 
                    color={showEmojiPicker ? colors.primary : colors.textSecondary} 
                  />
                </TouchableOpacity>
                
                {/* Contenedor del input con crecimiento dinámico */}
                <View
                  style={[
                    styles.messageInputWrapper,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isMessageInputFocused ? colors.primary : colors.border,
                      height: Math.min(Math.max(messageInputHeight, minHeight), maxHeight),
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.messageInput,
                      {
                        color: colors.text,
                        height: '100%',
                        borderWidth: 0,
                        borderColor: 'transparent',
                      },
                    ]}
                    placeholder="Escribe un mensaje..."
                    placeholderTextColor={colors.textSecondary}
                    value={messageText}
                    onChangeText={(text) => {
                      setMessageText(text);
                      // Calcular altura basada en saltos de línea
                      const newHeight = calculateInputHeight(text);
                      setMessageInputHeight(newHeight);
                    }}
                    onFocus={() => setIsMessageInputFocused(true)}
                    onBlur={() => setIsMessageInputFocused(false)}
                    multiline
                    maxLength={1000}
                    editable={!sendingMessage}
                    scrollEnabled={messageInputHeight >= maxHeight || (messageText.match(/\n/g) || []).length + 1 >= maxLines}
                    textAlignVertical="top"
                    underlineColorAndroid="transparent"
                  />
                </View>
                
                {/* Botón enviar */}
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { 
                      backgroundColor: messageText.trim() ? colors.primary : colors.surface,
                    },
                    (!messageText.trim() || sendingMessage) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendMessage}
                  disabled={!messageText.trim() || sendingMessage}
                  activeOpacity={0.8}
                >
                  {sendingMessage ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons 
                      name="arrow-forward" 
                      size={20} 
                      color={messageText.trim() ? "#FFFFFF" : colors.textSecondary} 
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            ) : (
              <View style={[styles.emptyChat, { backgroundColor: colors.background }]}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
                <ThemedText type="h4" style={{ marginTop: 16, color: colors.text, textAlign: 'center' }}>
                  Selecciona un contacto para comenzar
                </ThemedText>
                <ThemedText type="body2" style={{ marginTop: 8, color: colors.textSecondary, textAlign: 'center' }}>
                  Elige una conversación de la lista para ver y enviar mensajes
                </ThemedText>
              </View>
            )
          )}

          {/* Panel de información del contacto (lateral derecho) - Se desliza desde la derecha */}
          {selectedContact && !isMobile && (
            <Animated.View
              style={[
                styles.contactInfoPanel,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderLeftWidth: 1,
                  borderLeftColor: colors.border,
                  width: contactInfoPanelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [350, 0], // Ancho del panel: 350px visible, 0px oculto
                  }),
                  overflow: 'hidden',
                },
              ]}
            >
              {/* Botón para cerrar el panel */}
              <TouchableOpacity
                style={[styles.contactInfoCloseButton, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                onPress={() => setShowContactInfoPanel(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <ScrollView style={styles.contactInfoScroll} showsVerticalScrollIndicator={false}>
                {/* Header con avatar y nombre */}
                <View style={styles.contactInfoHeaderSection}>
                  <View style={[styles.contactInfoAvatarSmall, { backgroundColor: colors.primary + '30' }]}>
                    <Ionicons name="person" size={32} color={colors.primary} />
                  </View>
                  <ThemedText type="body2" style={{ marginTop: 12, color: colors.text, fontWeight: '600', fontSize: 16 }}>
                    {selectedContact.name}
                  </ThemedText>
                  
                  {/* Información con iconos */}
                  <View style={styles.contactInfoIconsRow}>
                    <View style={styles.contactInfoIconItem}>
                      <Ionicons name="call" size={16} color={colors.textSecondary} />
                      <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                        {selectedContact.phoneNumber}
                      </ThemedText>
                    </View>
                    {selectedContact.email && (
                      <View style={styles.contactInfoIconItem}>
                        <Ionicons name="mail" size={16} color={colors.textSecondary} />
                        <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                          {selectedContact.email}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.contactInfoIconItem}>
                      <Ionicons name="briefcase" size={16} color={colors.textSecondary} />
                      <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                        Negociaciones: 0
                      </ThemedText>
                    </View>
                    <View style={styles.contactInfoIconItem}>
                      <Ionicons name="document-text" size={16} color={colors.textSecondary} />
                      <ThemedText type="caption" style={{ marginLeft: 6, color: colors.textSecondary }}>
                        Órdenes: 0
                      </ThemedText>
                    </View>
                  </View>

                  {/* Barra de navegación */}
                  <View style={styles.contactInfoNavBar}>
                    <Tooltip text="Cliente" position="top">
                      <TouchableOpacity style={[styles.contactInfoNavItem, { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
                        <Ionicons name="person" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </Tooltip>
                    <Tooltip text="Agendamiento" position="top">
                      <TouchableOpacity style={styles.contactInfoNavItem}>
                        <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </Tooltip>
                    <Tooltip text="Ordenes" position="top">
                      <TouchableOpacity style={styles.contactInfoNavItem}>
                        <Ionicons name="list" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </Tooltip>
                    <Tooltip text="Pagos" position="top">
                      <TouchableOpacity style={styles.contactInfoNavItem}>
                        <Ionicons name="card" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </Tooltip>
                  </View>
                </View>

                {/* Detalles del cliente */}
                <View style={styles.contactInfoSection}>
                  <View style={[styles.contactInfoSectionHeader, { borderBottomColor: colors.border }]}>
                    <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                      Detalles del cliente
                    </ThemedText>
                    <TouchableOpacity>
                      <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.contactInfoDetails}>
                    <View style={styles.contactInfoDetailRow}>
                      <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                        Nombres:
                      </ThemedText>
                      <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                        {selectedContact.name}
                      </ThemedText>
                    </View>
                    <View style={styles.contactInfoDetailRow}>
                      <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                        Teléfono:
                      </ThemedText>
                      <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                        {selectedContact.phoneNumber}
                      </ThemedText>
                    </View>
                    <View style={styles.contactInfoDetailRow}>
                      <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                        Email:
                      </ThemedText>
                      <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                        {selectedContact.email || 'Sin email'}
                      </ThemedText>
                    </View>
                    <View style={styles.contactInfoDetailRow}>
                      <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                        Identificación:
                      </ThemedText>
                      <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                        Sin identificación
                      </ThemedText>
                    </View>
                    <View style={styles.contactInfoDetailRow}>
                      <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                        Fecha de Nacimiento:
                      </ThemedText>
                      <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                        Sin fecha
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.contactInfoSeeMore}>
                    <ThemedText type="caption" style={{ color: colors.primary }}>
                      Ver más
                    </ThemedText>
                    <Ionicons name="chevron-down" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Etiquetas */}
                <View style={styles.contactInfoSection}>
                  <View style={[styles.contactInfoSectionHeader, { borderBottomColor: colors.border }]}>
                    <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                      Etiquetas
                    </ThemedText>
                    <TouchableOpacity>
                      <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.tagsContainer}>
                    {selectedContact.tags && selectedContact.tags.length > 0 ? (
                      selectedContact.tags.map((tagId) => {
                        const tag = availableTags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <View
                            key={tagId}
                            style={[styles.infoTag, { backgroundColor: tag.color }]}
                          >
                            <ThemedText type="caption" style={{ color: '#FFFFFF' }}>
                              {tag.label}
                            </ThemedText>
                          </View>
                        );
                      })
                    ) : (
                      <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                        Sin etiquetas
                      </ThemedText>
                    )}
                  </View>
                </View>

              </ScrollView>
            </Animated.View>
          )}

          {/* Modal de información del contacto (móvil) */}
          {selectedContact && isMobile && (
            <Animated.View
              style={[
                styles.contactInfoModal,
                {
                  backgroundColor: colors.background,
                  transform: [
                    {
                      translateX: contactInfoPanelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 400], // Ancho completo de la pantalla móvil
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.contactInfoModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                  <ThemedText type="h4" style={{ color: colors.text, fontWeight: '600' }}>
                    Info. del contacto
                  </ThemedText>
                  <TouchableOpacity onPress={() => setSelectedContact(null)}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
              </View>
              <ScrollView style={styles.contactInfoScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.contactInfoAvatarContainer}>
                  <View style={[styles.contactInfoAvatar, { backgroundColor: colors.primary }]}>
                    <ThemedText type="h2" style={{ color: '#FFFFFF' }}>
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText type="body2" style={{ marginTop: 12, color: colors.text, fontWeight: '600' }}>
                    {selectedContact.name}
                  </ThemedText>
                  <ThemedText type="caption" style={{ marginTop: 4, color: colors.textSecondary }}>
                    {selectedContact.phoneNumber}
                  </ThemedText>
                </View>
                <View style={styles.contactInfoSection}>
                  <View style={[styles.contactInfoSectionHeader, { borderBottomColor: colors.border }]}>
                    <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                      Detalles del cliente
                    </ThemedText>
                    <TouchableOpacity>
                      <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.contactInfoDetails}>
                    <View style={styles.contactInfoDetailRow}>
                      <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                        Nombres:
                      </ThemedText>
                      <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                        {selectedContact.name}
                      </ThemedText>
                    </View>
                    <View style={styles.contactInfoDetailRow}>
                      <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                        Teléfono:
                      </ThemedText>
                      <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                        {selectedContact.phoneNumber}
                      </ThemedText>
                    </View>
                    {selectedContact.email && (
                      <View style={styles.contactInfoDetailRow}>
                        <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                          Email:
                        </ThemedText>
                        <ThemedText type="body2" style={{ color: colors.text, marginLeft: 8 }}>
                          {selectedContact.email}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.contactInfoSection}>
                  <View style={[styles.contactInfoSectionHeader, { borderBottomColor: colors.border }]}>
                    <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                      Etiquetas
                    </ThemedText>
                    <TouchableOpacity>
                      <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.tagsContainer}>
                    {selectedContact.tags && selectedContact.tags.length > 0 ? (
                      selectedContact.tags.map((tagId) => {
                        const tag = availableTags.find(t => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <View
                            key={tagId}
                            style={[styles.infoTag, { backgroundColor: tag.color }]}
                          >
                            <ThemedText type="caption" style={{ color: '#FFFFFF' }}>
                              {tag.label}
                            </ThemedText>
                          </View>
                        );
                      })
                    ) : (
                      <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                        Sin etiquetas
                      </ThemedText>
                    )}
                  </View>
                </View>
                <View style={styles.contactInfoSection}>
                  <View style={[styles.contactInfoSectionHeader, { borderBottomColor: colors.border }]}>
                    <ThemedText type="body2" style={{ color: colors.text, fontWeight: '600' }}>
                      Mensajes rápidos
                    </ThemedText>
                  </View>
                  <View style={styles.quickMessagesContainer}>
                    {quickMessages.map((msg, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.quickMessageButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => {
                          setMessageText(msg);
                        }}
                      >
                        <ThemedText type="body2" style={{ color: colors.text }}>
                          {msg}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  contactsPanel: {
    width: 350,
    flexDirection: 'column',
  },
  searchBar: {
    padding: 13,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    padding: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  chatPanel: {
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
  },
  messageContainer: {
    marginBottom: 12,
    width: '100%',
    flexDirection: 'row',
  },
  messageOutbound: {
    justifyContent: 'flex-end',
  },
  messageInbound: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    minWidth: 0,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  messageInputWrapper: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  messageInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    includeFontPadding: false,
    lineHeight: 20,
    width: '100%',
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    outlineWidth: 0,
    outlineColor: 'transparent',
  },
  inputActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  filtersContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  filtersScroll: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatIAToggle: {
    padding: 8,
  },
  searchMessageButton: {
    padding: 8,
  },
  messageSearchBar: {
    padding: 12,
    borderBottomWidth: 1,
  },
  contactTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  contactTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  toolsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  toolsScroll: {
    gap: 8,
    paddingRight: 12,
  },
  toolButton: {
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 8,
  },
  contactInfoPanel: {
    borderLeftWidth: 1,
    flexDirection: 'column',
    minWidth: 0,
    maxWidth: 350,
  },
  contactInfoScroll: {
    flex: 1,
  },
  contactInfoToggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  contactInfoCloseButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  contactInfoHeaderSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  contactInfoAvatarSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  contactInfoIconsRow: {
    marginTop: 12,
    gap: 8,
  },
  contactInfoIconItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactInfoNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  contactInfoNavItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfoSeeMore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  contactInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  contactInfoAvatarContainer: {
    alignItems: 'center',
    padding: 24,
  },
  contactInfoAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  contactInfoActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  contactInfoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  contactInfoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  contactInfoCollapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
    width:20,
  },
  accordionContent: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  contactInfoDetails: {
    gap: 12,
  },
  contactInfoDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  infoTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickMessagesContainer: {
    gap: 8,
    marginTop: 8,
  },
  quickMessageButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactInfoModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  contactInfoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
});

