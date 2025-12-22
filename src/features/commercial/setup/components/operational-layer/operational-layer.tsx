/**
 * Componente para Capa 3: Ofertas
 * Gestiona ofertas (productos, servicios, paquetes), precios, ajustes de precio, condiciones de servicio y composición de ofertas
 * Según documento técnico V1.0: offering, offering_composition, offering_price, price_adjustment, service_condition
 */

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { InputWithFocus } from '@/components/ui/input-with-focus';
import { StatusBadge } from '@/components/ui/status-badge';
import { useTheme } from '@/hooks/use-theme';
import { CommercialService } from '@/src/domains/commercial';
import { Offering, OfferingPrice, OfferingPricePayload } from '@/src/domains/commercial/types';
import { useCompany } from '@/src/domains/shared';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { TemplateService } from '@/src/infrastructure/templates/template.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface OperationalLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: () => void; // Callback cuando la capa se completa al 100%
}

export function OperationalLayer({ onProgressUpdate, onDataChange, onComplete }: OperationalLayerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [originalOfferings, setOriginalOfferings] = useState<Offering[]>([]); // Ofertas originales del backend
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const [prices, setPrices] = useState<OfferingPrice[]>([]);
  const [offeringsPrices, setOfferingsPrices] = useState<Record<string, OfferingPrice | null>>({}); // Precio principal de cada oferta
  const [expandedOfferingId, setExpandedOfferingId] = useState<string | null>(null); // ID de oferta expandida (acordeón)
  const [newOfferings, setNewOfferings] = useState<Array<{ offering: Partial<Offering>; price: { basePrice: number; taxMode: 'included' | 'excluded' } }>>([]); // Nuevas ofertas en memoria
  const [modifiedOfferings, setModifiedOfferings] = useState<Record<string, { offering: Partial<Offering>; price?: { basePrice: number; taxMode: 'included' | 'excluded' } }>>({}); // Ofertas modificadas en memoria
  const [deletedOfferings, setDeletedOfferings] = useState<string[]>([]); // IDs de ofertas a eliminar (cambiar estado a inactive)
  const [originalOfferingsPrices, setOriginalOfferingsPrices] = useState<Record<string, OfferingPrice | null>>({}); // Precios originales para detectar cambios
  const [saving, setSaving] = useState(false);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false); // Flag para evitar llamados repetitivos

  const [offeringType, setOfferingType] = useState<'product' | 'service'>('product');
  // requiresConditions removido del estado - siempre se envía como false
  const [offeringForm, setOfferingForm] = useState({
    name: '',
    description: '',
    code: '',
  });
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [priceForm, setPriceForm] = useState({
    basePrice: '',
    taxMode: 'included' as 'included' | 'excluded',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
  });

  // Cargar ofertas - evitar llamados repetitivos
  const loadOfferings = useCallback(async () => {
    if (!company?.id || isLoadingOfferings) return;

    setIsLoadingOfferings(true);
    setLoading(true);

    try {
      const data = await CommercialService.getOfferings(company.id);
      setOfferings(data);
      setOriginalOfferings(data); // Guardar copia original para detectar cambios
      
      // Extraer precio principal de cada oferta desde la respuesta (ya vienen incluidos)
      const pricesMap: Record<string, OfferingPrice | null> = {};
      for (const offering of data) {
        // Los precios ya vienen en la respuesta del endpoint
        if (offering.prices && offering.prices.length > 0) {
          // Obtener el precio principal (el primero o el que no tiene branchId)
          const mainPrice = offering.prices.find(p => !p.branchId) || offering.prices[0] || null;
          // Asegurar que basePrice sea un número
          if (mainPrice && typeof mainPrice.basePrice === 'string') {
            mainPrice.basePrice = parseFloat(mainPrice.basePrice);
          }
          pricesMap[offering.id] = mainPrice;
        } else {
          pricesMap[offering.id] = null;
        }
      }
      setOfferingsPrices(pricesMap);
      setOriginalOfferingsPrices(pricesMap); // Guardar precios originales
      setOriginalOfferings(data); // Guardar copia original para detectar cambios
    } catch (error: any) {
      console.error('Error al cargar ofertas:', error);
      const errorMessage = error?.message || 'Error al cargar ofertas';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description || error?.result?.details;
      
      setGeneralError({ 
        message: errorMessage,
        detail: errorDetail || `Error del servidor: ${error?.statusCode || 'Desconocido'}`
      });
      // No mostrar toast - solo InlineAlert en la pantalla
    } finally {
      setLoading(false);
      setIsLoadingOfferings(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para evitar loops

  // Cargar precios de una oferta
  // ❌ CAMBIO V1.0: companyId removido del endpoint
  const loadPrices = useCallback(async (offeringId: string) => {
    if (!offeringId) return;

    try {
      const data = await CommercialService.getOfferingPrices(offeringId);
      setPrices(data);
    } catch (error: any) {
      console.error('Error al cargar precios:', error);
      // No mostrar error aquí - solo log
    }
  }, []);

  // Cargar ofertas solo una vez cuando cambia company.id
  useEffect(() => {
    loadOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  useEffect(() => {
    if (selectedOffering) {
      loadPrices(selectedOffering.id);
    }
  }, [selectedOffering, loadPrices]);

  // Calcular progreso
  useEffect(() => {
    if (!company?.id) return;

    const hasOfferings = offerings.length > 0;
    // Verificar si hay precios en offeringsPrices (al menos una oferta con precio)
    const hasPrices = Object.values(offeringsPrices).some(price => price !== null && price !== undefined);
    const progress = hasOfferings && hasPrices ? 100 : hasOfferings ? 50 : 0;

    onProgressUpdate?.(progress);
    onDataChange?.(hasOfferings || hasPrices);
    
    // No llamar automáticamente a onComplete - solo cuando el usuario presione "Continuar"
  }, [offerings, offeringsPrices, company?.id, onProgressUpdate, onDataChange]);

  // Inicializar formulario cuando se expande una oferta (acordeón)
  useEffect(() => {
    if (expandedOfferingId) {
      const offering = offerings.find(o => o.id === expandedOfferingId);
      if (offering) {
        setOfferingType(offering.type as 'product' | 'service');
        setOfferingForm({
          name: offering.name,
          description: offering.description || '',
          code: offering.code || '',
        });
        
        // Cargar precio principal (usar precio modificado si existe, sino el original)
        const modifiedPrice = modifiedOfferings[offering.id]?.price;
        const mainPrice = modifiedPrice 
          ? { basePrice: modifiedPrice.basePrice, taxMode: modifiedPrice.taxMode, validFrom: new Date().toISOString().split('T')[0], validTo: null }
          : offeringsPrices[offering.id];
          
        if (mainPrice) {
          setPriceForm({
            basePrice: mainPrice.basePrice.toString(),
            taxMode: mainPrice.taxMode,
            validFrom: mainPrice.validFrom,
            validTo: mainPrice.validTo || '',
          });
        } else {
          setPriceForm({
            basePrice: '',
            taxMode: 'included',
            validFrom: new Date().toISOString().split('T')[0],
            validTo: '',
          });
        }
      }
    } else {
      // Resetear formulario cuando se cierra el acordeón
      setOfferingForm({ name: '', description: '', code: '' });
      setPriceForm({
        basePrice: '',
        taxMode: 'included',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
      });
      setOfferingType('product');
    }
  }, [expandedOfferingId, offerings, offeringsPrices, modifiedOfferings]);

  // Detectar si hay cambios pendientes
  const hasPendingChanges = useMemo(() => {
    return newOfferings.length > 0 || Object.keys(modifiedOfferings).length > 0 || deletedOfferings.length > 0;
  }, [newOfferings, modifiedOfferings, deletedOfferings]);

  // Manejar click en oferta (acordeón)
  const handleOfferingClick = (offering: Offering) => {
    if (expandedOfferingId === offering.id) {
      // Si ya está expandida, cerrarla
      setExpandedOfferingId(null);
    } else {
      // Expandir esta oferta (cierra la anterior automáticamente)
      setExpandedOfferingId(offering.id);
    }
  };

  // Aceptar cambios (actualizar en memoria)
  const handleAcceptChanges = () => {
    if (!expandedOfferingId) return;

    if (!offeringForm.name.trim()) {
      alert.showError('El nombre de la oferta es requerido');
      return;
    }

    if (!priceForm.basePrice || isNaN(parseFloat(priceForm.basePrice))) {
      alert.showError('El precio base es requerido y debe ser un número válido');
      return;
    }

    const offering = offerings.find(o => o.id === expandedOfferingId);
    if (!offering) return;

    const isNewOffering = offering.id.startsWith('temp-');

    // Actualizar oferta en memoria
    const updatedOffering: Partial<Offering> = {
      name: offeringForm.name.trim(),
      description: offeringForm.description.trim() || undefined,
      type: offeringType,
      requiresConditions: false, // Siempre false por ahora
    };

    const updatedPrice = {
      basePrice: parseFloat(priceForm.basePrice),
      taxMode: priceForm.taxMode,
    };

    if (isNewOffering) {
      // Es una nueva oferta: agregar a newOfferings
      setNewOfferings(prev => [...prev, { offering: { ...offering, ...updatedOffering }, price: updatedPrice }]);
    } else {
      // Es una oferta existente: agregar a modifiedOfferings
      setModifiedOfferings(prev => ({
        ...prev,
        [offering.id]: {
          offering: updatedOffering,
          price: updatedPrice,
        },
      }));
    }

    // Actualizar lista de ofertas en memoria
    setOfferings(prev => prev.map(o => 
      o.id === offering.id 
        ? { ...o, ...updatedOffering }
        : o
    ));

    // Actualizar precio en memoria
    setOfferingsPrices(prev => ({
      ...prev,
      [offering.id]: {
        id: offeringsPrices[offering.id]?.id || '',
        offeringId: offering.id,
        branchId: null,
        basePrice: updatedPrice.basePrice,
        taxMode: updatedPrice.taxMode,
        validFrom: new Date().toISOString().split('T')[0],
        validTo: null,
        status: 'active',
      },
    }));

    // Cerrar acordeón
    setExpandedOfferingId(null);
  };

  // Cancelar edición (descartar cambios del registro actual)
  const handleCancelEdit = () => {
    if (!expandedOfferingId) return;

    const offering = offerings.find(o => o.id === expandedOfferingId);
    if (!offering) return;

    const isNewOffering = offering.id.startsWith('temp-');

    if (isNewOffering) {
      // Si es nueva oferta, eliminarla de la lista
      setOfferings(prev => prev.filter(o => o.id !== offering.id));
      setOfferingsPrices(prev => {
        const updated = { ...prev };
        delete updated[offering.id];
        return updated;
      });
      // Eliminar de newOfferings si estaba ahí
      setNewOfferings(prev => prev.filter(n => n.offering.id !== offering.id));
    } else {
      // Restaurar valores originales
      const originalOffering = originalOfferings.find(o => o.id === offering.id);
      if (originalOffering) {
        setOfferingType(originalOffering.type as 'product' | 'service');
        setOfferingForm({
          name: originalOffering.name,
          description: originalOffering.description || '',
          code: originalOffering.code || '',
        });
      }

      const originalPrice = originalOfferingsPrices[offering.id];
      if (originalPrice) {
        setPriceForm({
          basePrice: originalPrice.basePrice.toString(),
          taxMode: originalPrice.taxMode,
          validFrom: originalPrice.validFrom,
          validTo: originalPrice.validTo || '',
        });
      }

      // Eliminar modificaciones pendientes de este registro
      setModifiedOfferings(prev => {
        const updated = { ...prev };
        delete updated[offering.id];
        return updated;
      });

      // Eliminar de deletedOfferings si estaba ahí
      setDeletedOfferings(prev => prev.filter(id => id !== offering.id));

      // Restaurar oferta original en la lista
      if (originalOffering) {
        setOfferings(prev => prev.map(o => 
          o.id === offering.id ? originalOffering : o
        ));
      }

      // Restaurar precio original
      if (originalPrice) {
        setOfferingsPrices(prev => ({
          ...prev,
          [offering.id]: originalPrice,
        }));
      }
    }

    // Cerrar acordeón
    setExpandedOfferingId(null);
  };

  // Eliminar oferta
  const handleDeleteOffering = () => {
    if (!expandedOfferingId) return;

    const offering = offerings.find(o => o.id === expandedOfferingId);
    if (!offering) return;

    const isNewOffering = offering.id.startsWith('temp-');

    if (isNewOffering) {
      // Si es nueva oferta, eliminarla de la lista directamente
      setOfferings(prev => prev.filter(o => o.id !== offering.id));
      setOfferingsPrices(prev => {
        const updated = { ...prev };
        delete updated[offering.id];
        return updated;
      });
      // Eliminar de newOfferings si estaba ahí (comparar por el ID de la oferta)
      setNewOfferings(prev => prev.filter(n => {
        // El offering en newOfferings tiene el id porque se copia desde la lista
        return (n.offering as Offering).id !== offering.id;
      }));
    } else {
      // Si es existente, marcarla para eliminación (cambiar estado a inactive)
      setDeletedOfferings(prev => [...prev.filter(id => id !== offering.id), offering.id]);
      // Eliminar de modifiedOfferings si estaba ahí
      setModifiedOfferings(prev => {
        const updated = { ...prev };
        delete updated[offering.id];
        return updated;
      });
      // Actualizar visualmente en la lista (opcional - podrías ocultarla o marcarla visualmente)
      // Por ahora la dejamos visible pero se eliminará al guardar
    }

    // Cerrar acordeón
    setExpandedOfferingId(null);
  };

  // Agregar nueva oferta en memoria (se muestra como nueva oferta en la lista)
  const handleAddNewOffering = () => {
    // Crear una nueva oferta temporal con ID único
    const tempId = `temp-${Date.now()}`;
    const newOffering: Offering = {
      id: tempId,
      companyId: company?.id || '',
      name: 'Nueva Oferta',
      description: null,
      code: null,
      type: 'product',
      requiresConditions: false,
      status: 'active',
    };

    const newPrice: OfferingPrice = {
      id: '',
      offeringId: tempId,
      branchId: null,
      basePrice: 0,
      taxMode: 'included',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: null,
      status: 'active',
    };

    // Agregar a la lista visual
    setOfferings(prev => [...prev, newOffering]);
    setOfferingsPrices(prev => ({
      ...prev,
      [tempId]: newPrice,
    }));

    // Expandir automáticamente para editar
    setExpandedOfferingId(tempId);
    setOfferingForm({ name: '', description: '', code: '' });
    setPriceForm({
      basePrice: '',
      taxMode: 'included',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
    });
    setOfferingType('product');
  };

  // Guardar todos los cambios al backend
  const handleSaveAll = async () => {
    if (!company?.id) return;
    if (!hasPendingChanges) return;

    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const bulkPayloads: any[] = [];

      // Agregar nuevas ofertas
      for (const newOffering of newOfferings) {
        if (!newOffering.offering.name) continue;
        bulkPayloads.push({
          companyId: company.id,
          name: newOffering.offering.name,
          description: newOffering.offering.description,
          type: newOffering.offering.type || 'product',
          requiresConditions: false, // Siempre false por ahora
          price: {
            basePrice: newOffering.price.basePrice,
            taxMode: newOffering.price.taxMode,
            branchId: null,
            validFrom: today,
            validTo: null,
          },
        });
      }

      // Agregar ofertas modificadas
      for (const [offeringId, modified] of Object.entries(modifiedOfferings)) {
        // Si está en deletedOfferings, no agregarla aquí (se manejará después)
        if (deletedOfferings.includes(offeringId)) continue;

        const originalOffering = originalOfferings.find(o => o.id === offeringId);
        if (!originalOffering) continue;

        const originalPrice = originalOfferingsPrices[offeringId];
        bulkPayloads.push({
          id: offeringId,
          companyId: company.id,
          name: modified.offering.name || originalOffering.name,
          description: modified.offering.description !== undefined ? modified.offering.description : originalOffering.description,
          type: modified.offering.type || originalOffering.type,
          requiresConditions: false, // Siempre false por ahora
          price: {
            id: originalPrice?.id,
            basePrice: modified.price?.basePrice || originalPrice?.basePrice || 0,
            taxMode: modified.price?.taxMode || originalPrice?.taxMode || 'included',
            branchId: null,
            validFrom: today,
            validTo: null,
          },
        });
      }

      // Agregar ofertas a eliminar (cambiar estado a inactive)
      for (const offeringId of deletedOfferings) {
        const originalOffering = originalOfferings.find(o => o.id === offeringId);
        if (!originalOffering) continue;

        const originalPrice = originalOfferingsPrices[offeringId];
        bulkPayloads.push({
          id: offeringId,
          companyId: company.id,
          name: originalOffering.name,
          description: originalOffering.description,
          type: originalOffering.type,
          requiresConditions: false,
          status: 'inactive', // Cambiar estado a inactive
          price: {
            id: originalPrice?.id,
            basePrice: originalPrice?.basePrice || 0,
            taxMode: originalPrice?.taxMode || 'included',
            branchId: null,
            validFrom: today,
            validTo: null,
          },
        } as any); // Usar 'as any' porque status no está en el tipo TypeScript pero el backend lo acepta
      }

      if (bulkPayloads.length === 0) {
        setSaving(false);
        return;
      }

      const bulkResult = await CommercialService.bulkCreateOfferings({
        offerings: bulkPayloads,
      });

      if (bulkResult.errors && bulkResult.errors.length > 0) {
        const errorMessages = bulkResult.errors.slice(0, 3).map(err => err.message).join(', ');
        alert.showError(`Errores al guardar: ${errorMessages}${bulkResult.errors.length > 3 ? ` y ${bulkResult.errors.length - 3} más` : ''}`);
        return;
      }

      alert.showSuccess(`${bulkResult.created || bulkPayloads.length} oferta(s) guardada(s) correctamente`);

      // Limpiar cambios pendientes
      setNewOfferings([]);
      setModifiedOfferings({});
      setDeletedOfferings([]);
      setExpandedOfferingId(null);

      // Recargar ofertas del backend
      await loadOfferings();
      
      // Después de guardar exitosamente, actualizar el progreso a 100%
      // (si se guardó exitosamente, significa que hay al menos una oferta con precio)
      onProgressUpdate?.(100);
      
      // No llamar automáticamente a onComplete - el usuario debe presionar "Continuar" para avanzar
    } catch (error: any) {
      console.error('Error al guardar cambios:', error);
      alert.showError('Error al guardar cambios: ' + (error?.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  // Cancelar todos los cambios pendientes
  const handleCancelAll = () => {
    // Eliminar ofertas nuevas de la lista
    const newOfferingIds = newOfferings.map(n => (n.offering as Offering).id).filter(id => id?.startsWith('temp-'));
    setOfferings(prev => prev.filter(o => !newOfferingIds.includes(o.id)));
    
    // Eliminar precios de ofertas nuevas
    setOfferingsPrices(prev => {
      const updated = { ...prev };
      newOfferingIds.forEach(id => {
        delete updated[id];
      });
      return updated;
    });

    // Restaurar ofertas modificadas a sus valores originales
    for (const [offeringId, modified] of Object.entries(modifiedOfferings)) {
      const originalOffering = originalOfferings.find(o => o.id === offeringId);
      if (originalOffering) {
        setOfferings(prev => prev.map(o => 
          o.id === offeringId ? originalOffering : o
        ));
      }

      const originalPrice = originalOfferingsPrices[offeringId];
      if (originalPrice) {
        setOfferingsPrices(prev => ({
          ...prev,
          [offeringId]: originalPrice,
        }));
      }
    }

    // Restaurar ofertas eliminadas (quitar de deletedOfferings)
    for (const offeringId of deletedOfferings) {
      const originalOffering = originalOfferings.find(o => o.id === offeringId);
      if (originalOffering) {
        // Asegurarse de que la oferta esté en la lista
        setOfferings(prev => {
          const exists = prev.find(o => o.id === offeringId);
          if (!exists) {
            return [...prev, originalOffering];
          }
          return prev.map(o => o.id === offeringId ? originalOffering : o);
        });
      }
    }

    // Limpiar todos los cambios pendientes
    setNewOfferings([]);
    setModifiedOfferings({});
    setDeletedOfferings([]);
    setExpandedOfferingId(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      await TemplateService.downloadTemplate('offerings');
      alert.showSuccess('Plantilla descargada correctamente');
    } catch (error: any) {
      alert.showError('Error al descargar plantilla: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !company?.id) return;

    setUploadingBulk(true);
    setGeneralError(null);

    try {
      const data = await TemplateService.parseFile(file);
      
      if (data.length === 0) {
        alert.showError('El archivo no contiene datos válidos');
        setUploadingBulk(false);
        return;
      }

      // Preparar ofertas para el endpoint bulk
      const offeringsPayload: Array<{
        companyId: string;
        code?: string;
        name: string;
        description?: string;
        type: 'product' | 'service';
        requiresConditions?: boolean;
        price: {
          basePrice: number;
          taxMode: 'included' | 'excluded';
          branchId: null; // Siempre null para precio global en wizard
          validFrom?: string; // YYYY-MM-DD
          validTo?: string | null; // YYYY-MM-DD o null
        };
      }> = [];

      // Procesar cada fila
      for (let index = 0; index < data.length; index++) {
        const row = data[index];
        
        try {
          // Validar campos requeridos
          const name = (row['Nombre'] || row['nombre'] || '').trim();
          if (!name) {
            throw new Error('El nombre es requerido');
          }

          const precioBase = row['Precio Base'] || row['precio_base'];
          if (!precioBase || isNaN(parseFloat(String(precioBase)))) {
            throw new Error('El precio base es requerido y debe ser un número válido');
          }

          const modoImpuestos = (row['Modo de Impuestos'] || row['modo_impuestos'] || 'included').toLowerCase().trim();
          if (modoImpuestos !== 'included' && modoImpuestos !== 'excluded') {
            throw new Error('El modo de impuestos debe ser "included" o "excluded"');
          }

          // Mapear tipo: convertir español a inglés (solo producto y servicio para wizard)
          const tipoStr = (row['Tipo'] || row['tipo'] || 'producto').toLowerCase().trim();
          let type: 'product' | 'service' = 'product';
          if (tipoStr === 'servicio' || tipoStr === 'service') {
            type = 'service';
          }

          // Preparar precio - validFrom siempre usa fecha actual, validTo siempre null
          const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

          // Construir payload según nuevo endpoint (campos esenciales para wizard)
          offeringsPayload.push({
            companyId: company.id,
            name,
            description: (row['Descripción'] || row['descripcion'] || '').trim() || undefined,
            type,
            requiresConditions: type === 'service' ? false : undefined, // Por defecto false para servicios
            price: {
              basePrice: parseFloat(String(precioBase)),
              taxMode: modoImpuestos === 'included' ? 'included' : 'excluded',
              branchId: null, // Siempre null para precio global en wizard
              validFrom: today, // Siempre fecha actual
              validTo: null, // Siempre null (sin caducidad)
            },
          });
        } catch (error: any) {
          // Los errores se manejarán en la respuesta del bulk
          console.error(`Error procesando fila ${index + 1}:`, error);
        }
      }

      if (offeringsPayload.length === 0) {
        setGeneralError({ message: 'No se pudo procesar ninguna oferta del archivo' });
        setUploadingBulk(false);
        return;
      }

      // Llamar al endpoint bulk
      const bulkResult = await CommercialService.bulkCreateOfferings({ offerings: offeringsPayload });
      
      const successCount = bulkResult.created || 0;
      const errorCount = bulkResult.errors?.length || 0;

      // Recargar ofertas
      await loadOfferings();

      // Limpiar el input de archivo para permitir cargar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (errorCount > 0) {
        const errorMessages = bulkResult.errors?.slice(0, 3).map(err => 
          `Fila ${err.index + 1}${err.code ? ` (${err.code})` : ''}: ${err.message}`
        ).join(', ') || '';
        alert.showError(`Se procesaron ${successCount} de ${bulkResult.total} ofertas. Errores: ${errorMessages}${bulkResult.errors && bulkResult.errors.length > 3 ? ` y ${bulkResult.errors.length - 3} más` : ''}`);
      } else {
        alert.showSuccess(`${successCount} ofertas cargadas correctamente`);
      }
    } catch (error: any) {
      alert.showError('Error al procesar el archivo: ' + (error.message || 'El archivo no tiene el formato correcto'));
    } finally {
      setUploadingBulk(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCreatePrice = async () => {
    if (!company?.id || !selectedOffering) return;

    if (!priceForm.basePrice || parseFloat(priceForm.basePrice) <= 0) {
      setGeneralError({ message: 'El precio base debe ser mayor a 0' });
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      // ❌ CAMBIO V1.0: companyId y currency removidos del payload
      const payload: OfferingPricePayload = {
        offeringId: selectedOffering.id,
        branchId: null, // NULL = precio global, NOT NULL = precio por sucursal
        basePrice: parseFloat(priceForm.basePrice),
        taxMode: priceForm.taxMode,
        validFrom: priceForm.validFrom, // Formato YYYY-MM-DD según V1.0
        validTo: priceForm.validTo || null, // Formato YYYY-MM-DD o null
      };

      await CommercialService.createOfferingPrice(selectedOffering.id, payload);
      alert.showSuccess('Precio creado correctamente');
      setShowPriceForm(false);
      setPriceForm({
        basePrice: '',
        taxMode: 'included',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
      });
      // Recargar precios sin mostrar toast de error si falla
      try {
        await loadPrices(selectedOffering.id);
      } catch (error) {
        // Error silencioso - solo log
        console.error('Error al recargar precios:', error);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al crear precio';
      const errorDetail = typeof error?.details === 'object' 
        ? JSON.stringify(error.details) 
        : error?.details || error?.result?.description;
      
      alert.showError(errorMessage + (errorDetail ? `: ${errorDetail}` : ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading && offerings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" style={{ marginTop: 16, color: colors.textSecondary }}>
          Cargando ofertas...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.formContainer}>
        {/* Sección: Ofertas */}
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={24} color={colors.primary} />
            <ThemedText type="h4" style={styles.sectionTitle}>
              Ofertas
            </ThemedText>
          </View>
          <ThemedText type="body2" style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Define los productos, servicios o paquetes que ofreces
          </ThemedText>

          {/* Lista de ofertas */}
          {offerings.length > 0 && (
            <View style={styles.listContainer}>
              {offerings.map((offering) => {
                const mainPrice = offeringsPrices[offering.id];
                // Icono según el tipo de oferta
                const typeIcon = offering.type === 'service' ? 'construct-outline' : 'cube-outline';
                const typeLabel = offering.type === 'service' ? 'Servicio' : 'Producto';
                
                const isExpanded = expandedOfferingId === offering.id;
                
                return (
                  <View key={offering.id}>
                    <TouchableOpacity
                      style={[
                        styles.listItem,
                        {
                          backgroundColor: isExpanded ? colors.primary + '20' : colors.surface,
                          borderColor: isExpanded ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handleOfferingClick(offering)}
                    >
                      <View style={styles.listItemLeft}>
                        <Ionicons 
                          name={typeIcon} 
                          size={24} 
                          color={colors.textSecondary} 
                          style={{ marginRight: 12 }}
                        />
                        <View style={[styles.listItemContent, { flex: 1 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ThemedText type="body1" style={{ fontWeight: '600' }}>
                              {offering.name}
                            </ThemedText>
                            <ThemedText type="caption" style={{ color: colors.textSecondary, fontSize: 11 }}>
                              ({typeLabel})
                            </ThemedText>
                          </View>
                          {offering.description && (
                            <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 4 }}>
                              {offering.description}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <View style={styles.listItemRight}>
                        <View style={{ alignItems: 'flex-end' }}>
                          {mainPrice && mainPrice.basePrice > 0 ? (
                            <>
                              <ThemedText type="h4" style={{ fontWeight: '700', color: colors.primary }}>
                                ${Number(mainPrice.basePrice).toFixed(2)}
                              </ThemedText>
                              <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>
                                Impuestos: {mainPrice.taxMode === 'included' ? 'Incluidos' : 'Excluidos'}
                              </ThemedText>
                            </>
                          ) : (
                            <ThemedText type="body2" style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                              Sin precio
                            </ThemedText>
                          )}
                        </View>
                        <Ionicons 
                          name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                          size={20} 
                          color={colors.textSecondary} 
                          style={{ marginLeft: 8 }} 
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Acordeón: Formulario de edición debajo de la oferta */}
                    {isExpanded && (
                      <Card variant="outlined" style={styles.accordionCard}>
                        {/* Fila 1: Tipo de oferta (selector tipo estados) y Nombre */}
                        <View style={styles.rowContainer}>
                          <View style={styles.halfWidth}>
                            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                              Tipo de Oferta *
                            </ThemedText>
                            <View style={styles.typeSelector}>
                              <TouchableOpacity
                                style={[
                                  styles.typeOption,
                                  {
                                    backgroundColor: offeringType === 'product' ? colors.primary : 'transparent',
                                    borderColor: offeringType === 'product' ? colors.primary : colors.border,
                                  },
                                ]}
                                onPress={() => setOfferingType('product')}
                              >
                                <Ionicons 
                                  name="cube-outline" 
                                  size={18} 
                                  color={offeringType === 'product' ? '#FFFFFF' : colors.textSecondary} 
                                />
                                <ThemedText 
                                  type="body2" 
                                  style={{ 
                                    color: offeringType === 'product' ? '#FFFFFF' : colors.text,
                                    marginLeft: 6,
                                    fontWeight: offeringType === 'product' ? '600' : '400',
                                  }}
                                >
                                  Producto
                                </ThemedText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.typeOption,
                                  {
                                    backgroundColor: offeringType === 'service' ? colors.primary : 'transparent',
                                    borderColor: offeringType === 'service' ? colors.primary : colors.border,
                                  },
                                ]}
                                onPress={() => setOfferingType('service')}
                              >
                                <Ionicons 
                                  name="construct-outline" 
                                  size={18} 
                                  color={offeringType === 'service' ? '#FFFFFF' : colors.textSecondary} 
                                />
                                <ThemedText 
                                  type="body2" 
                                  style={{ 
                                    color: offeringType === 'service' ? '#FFFFFF' : colors.text,
                                    marginLeft: 6,
                                    fontWeight: offeringType === 'service' ? '600' : '400',
                                  }}
                                >
                                  Servicio
                                </ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={styles.halfWidth}>
                            <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                              Nombre de la oferta *
                            </ThemedText>
                            <InputWithFocus
                              containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                              primaryColor={colors.primary}
                            >
                              <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Ej: Habitación estándar"
                                placeholderTextColor={colors.textSecondary}
                                value={offeringForm.name}
                                onChangeText={(val) => setOfferingForm(prev => ({ ...prev, name: val }))}
                              />
                            </InputWithFocus>
                          </View>
                        </View>

                        {/* Fila 2: Precio Base y Modo de Impuestos */}
                        <View style={styles.rowContainer}>
                          <View style={styles.halfWidth}>
                            <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                              Precio Base *
                            </ThemedText>
                            <InputWithFocus
                              containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                              primaryColor={colors.primary}
                            >
                              <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.textSecondary}
                                value={priceForm.basePrice}
                                onChangeText={(val) => setPriceForm(prev => ({ ...prev, basePrice: val }))}
                                keyboardType="decimal-pad"
                              />
                            </InputWithFocus>
                          </View>
                          <View style={styles.halfWidth}>
                            <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                              Modo de Impuestos *
                            </ThemedText>
                            <View style={styles.taxModeSelector}>
                              <TouchableOpacity
                                style={[
                                  styles.taxModeOption,
                                  {
                                    backgroundColor: priceForm.taxMode === 'included' ? colors.primary : 'transparent',
                                    borderColor: priceForm.taxMode === 'included' ? colors.primary : colors.border,
                                  },
                                ]}
                                onPress={() => setPriceForm(prev => ({ ...prev, taxMode: 'included' }))}
                              >
                                <ThemedText 
                                  type="body2" 
                                  style={{ 
                                    color: priceForm.taxMode === 'included' ? '#FFFFFF' : colors.text,
                                    fontWeight: priceForm.taxMode === 'included' ? '600' : '400',
                                  }}
                                >
                                  Incluidos
                                </ThemedText>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.taxModeOption,
                                  {
                                    backgroundColor: priceForm.taxMode === 'excluded' ? colors.primary : 'transparent',
                                    borderColor: priceForm.taxMode === 'excluded' ? colors.primary : colors.border,
                                  },
                                ]}
                                onPress={() => setPriceForm(prev => ({ ...prev, taxMode: 'excluded' }))}
                              >
                                <ThemedText 
                                  type="body2" 
                                  style={{ 
                                    color: priceForm.taxMode === 'excluded' ? '#FFFFFF' : colors.text,
                                    fontWeight: priceForm.taxMode === 'excluded' ? '600' : '400',
                                  }}
                                >
                                  Excluidos
                                </ThemedText>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>

                        {/* Descripción al final */}
                        <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                          Descripción (opcional)
                        </ThemedText>
                        <InputWithFocus
                          containerStyle={[styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          primaryColor={colors.primary}
                        >
                          <TextInput
                            style={[styles.textArea, { color: colors.text }]}
                            placeholder="Describe brevemente la oferta"
                            placeholderTextColor={colors.textSecondary}
                            value={offeringForm.description}
                            onChangeText={(val) => setOfferingForm(prev => ({ ...prev, description: val }))}
                            multiline
                            numberOfLines={3}
                          />
                        </InputWithFocus>

                        {/* Botones del acordeón */}
                        <View style={styles.formActions}>
                          <View style={{ flex: 1 }} />
                          <Button
                            title="Cancelar"
                            onPress={handleCancelEdit}
                            variant="outlined"
                            size="md"
                            disabled={saving}
                          />
                          <Button
                            title="Aceptar"
                            onPress={handleAcceptChanges}
                            variant="primary"
                            size="md"
                            disabled={saving}
                          />
                        </View>
                      </Card>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Input de archivo oculto (solo web) - siempre presente para acceso directo */}
          {Platform.OS === 'web' && (
            <>
              {/* @ts-ignore - input HTML nativo para web, siempre presente pero oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleBulkUpload}
                style={{ display: 'none' }}
              />
            </>
          )}

          {/* Botones Guardar/Cancelar Global (solo se muestra si hay cambios pendientes) */}
          {hasPendingChanges && (
            <View style={styles.saveAllContainer}>
              <Button
                title="Cancelar"
                onPress={handleCancelAll}
                variant="outlined"
                size="lg"
                disabled={saving}
                style={styles.cancelAllButton}
              >
                <Ionicons name="close-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
              </Button>
              <Button
                title={saving ? 'Guardando...' : `Guardar Cambios (${newOfferings.length + Object.keys(modifiedOfferings).length + deletedOfferings.length})`}
                onPress={handleSaveAll}
                variant="primary"
                size="lg"
                disabled={saving}
                style={styles.saveAllButton}
              >
                {saving && (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                )}
                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              </Button>
            </View>
          )}

          {/* Botón Continuar/Guardar (solo se muestra si hay al menos una oferta) */}
          {offerings.length > 0 && (
            <View style={styles.continueButtonContainer}>
              <Button
                title={hasPendingChanges 
                  ? 'Guardar Información' 
                  : 'Continuar'}
                onPress={async () => {
                  if (hasPendingChanges) {
                    await handleSaveAll();
                    // Después de guardar, el botón cambiará a "Continuar" y el usuario puede presionarlo de nuevo
                  } else {
                    // Solo avanzar cuando el usuario presiona "Continuar" explícitamente
                    onComplete?.();
                  }
                }}
                variant="primary"
                size="lg"
                disabled={saving}
                style={styles.continueButton}
              >
                <Ionicons 
                  name={hasPendingChanges ? "save-outline" : "arrow-forward-outline"} 
                  size={20} 
                  color="#FFFFFF" 
                  style={{ marginRight: 8 }} 
                />
              </Button>
            </View>
          )}

          {/* Botones de acción: Carga individual y masiva */}
          <View style={styles.actionButtons}>
            {expandedOfferingId === null && (
              <>
                <Button
                  title="Agregar Oferta"
                  onPress={handleAddNewOffering}
                  variant="outlined"
                  size="md"
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                </Button>
                {Platform.OS === 'web' ? (
                  <Button
                    title={uploadingBulk ? 'Procesando...' : 'Carga Masiva'}
                    onPress={() => {
                      // Abrir directamente el selector de archivos
                      if (fileInputRef.current && !uploadingBulk) {
                        fileInputRef.current.click();
                      }
                    }}
                    variant="outlined"
                    size="md"
                    style={styles.addButton}
                    disabled={uploadingBulk}
                  >
                    {uploadingBulk ? (
                      <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                    )}
                  </Button>
                ) : (
                  <Button
                    title="Carga Masiva"
                    onPress={() => {
                      alert.showInfo('La carga masiva está disponible solo en la versión web por ahora.');
                    }}
                    variant="outlined"
                    size="md"
                    style={styles.addButton}
                  >
                    <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  </Button>
                )}
                <Button
                  title="Descargar Plantilla"
                  onPress={handleDownloadTemplate}
                  variant="outlined"
                  size="md"
                  style={styles.addButton}
                >
                  <Ionicons name="download-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                </Button>
              </>
            )}
          </View>

        </Card>

        {/* Sección: Precios */}
        {selectedOffering && (
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="pricetag-outline" size={24} color={colors.primary} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Precios de {selectedOffering.name}
              </ThemedText>
            </View>
            <ThemedText type="body2" style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Define los precios para esta oferta
            </ThemedText>

            {/* Lista de precios */}
            {prices.length > 0 && (
              <View style={styles.listContainer}>
                {prices.map((price) => (
                  <View
                    key={price.id}
                    style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.listItemContent}>
                      <ThemedText type="body1" style={{ fontWeight: '600' }}>
                        ${price.basePrice.toFixed(2)}
                      </ThemedText>
                      <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 4 }}>
                        Impuestos: {price.taxMode === 'included' ? 'Incluidos' : 'Excluidos'}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 4 }}>
                        Válido desde: {new Date(price.validFrom).toLocaleDateString()}
                        {price.validTo && ` hasta ${new Date(price.validTo).toLocaleDateString()}`}
                      </ThemedText>
                    </View>
                    <StatusBadge
                      status={price.status === 'active' ? 1 : 0}
                      statusDescription={price.status === 'active' ? 'Activo' : 'Inactivo'}
                      size="small"
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Formulario de nuevo precio */}
            {showPriceForm ? (
              <Card variant="outlined" style={styles.formCard}>
                <ThemedText type="body2" style={[styles.label, { color: colors.text }]}>
                  Precio Base *
                </ThemedText>
                <InputWithFocus
                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <Ionicons name="cash-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    value={priceForm.basePrice}
                    onChangeText={(val) => setPriceForm(prev => ({ ...prev, basePrice: val }))}
                    keyboardType="decimal-pad"
                  />
                </InputWithFocus>

                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  ¿Los impuestos están incluidos?
                </ThemedText>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      {
                        borderColor: priceForm.taxMode === 'included' ? colors.primary : colors.border,
                        backgroundColor: priceForm.taxMode === 'included' ? colors.primary + '20' : 'transparent',
                      },
                    ]}
                    onPress={() => setPriceForm(prev => ({ ...prev, taxMode: 'included' }))}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        { borderColor: priceForm.taxMode === 'included' ? colors.primary : colors.border },
                      ]}
                    >
                      {priceForm.taxMode === 'included' && (
                        <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <ThemedText type="body2" style={{ color: colors.text, marginLeft: 12 }}>
                      Sí, incluidos
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.radioOption,
                      {
                        borderColor: priceForm.taxMode === 'excluded' ? colors.primary : colors.border,
                        backgroundColor: priceForm.taxMode === 'excluded' ? colors.primary + '20' : 'transparent',
                      },
                    ]}
                    onPress={() => setPriceForm(prev => ({ ...prev, taxMode: 'excluded' }))}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        { borderColor: priceForm.taxMode === 'excluded' ? colors.primary : colors.border },
                      ]}
                    >
                      {priceForm.taxMode === 'excluded' && (
                        <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <ThemedText type="body2" style={{ color: colors.text, marginLeft: 12 }}>
                      No, se agregan aparte
                    </ThemedText>
                  </TouchableOpacity>
                </View>

                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  Válido desde *
                </ThemedText>
                <InputWithFocus
                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    value={priceForm.validFrom}
                    onChangeText={(val) => setPriceForm(prev => ({ ...prev, validFrom: val }))}
                  />
                </InputWithFocus>

                <ThemedText type="body2" style={[styles.label, { color: colors.text, marginTop: 16 }]}>
                  Válido hasta (opcional)
                </ThemedText>
                <InputWithFocus
                  containerStyle={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                    value={priceForm.validTo}
                    onChangeText={(val) => setPriceForm(prev => ({ ...prev, validTo: val }))}
                  />
                </InputWithFocus>

                <View style={styles.formActions}>
                  <Button
                    title="Cancelar"
                    onPress={() => {
                      setShowPriceForm(false);
                      setPriceForm({
                        basePrice: '',
                        taxMode: 'included',
                        validFrom: new Date().toISOString().split('T')[0],
                        validTo: '',
                      });
                    }}
                    variant="outlined"
                    size="md"
                    disabled={saving}
                  />
                  <Button
                    title={saving ? 'Guardando...' : 'Crear Precio'}
                    onPress={handleCreatePrice}
                    variant="primary"
                    size="md"
                    disabled={saving}
                  />
                </View>
              </Card>
            ) : (
              <Button
                title="Agregar Precio"
                onPress={() => setShowPriceForm(true)}
                variant="outlined"
                size="md"
                style={styles.addButton}
              >
                <Ionicons name="add" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              </Button>
            )}
          </Card>
        )}

        {!selectedOffering && offerings.length > 0 && (
          <Card variant="outlined" style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <ThemedText type="body2" style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
              Selecciona una oferta para configurar sus precios
            </ThemedText>
          </Card>
        )}

        {offerings.length === 0 && (
          <Card variant="outlined" style={styles.infoCard}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            <ThemedText type="body2" style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}>
              Comienza creando tu primera oferta. Puede ser un producto, servicio o paquete.
            </ThemedText>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    gap: 20,
  },
  sectionCard: {
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    flex: 1,
  },
  sectionDescription: {
    lineHeight: 20,
  },
  listContainer: {
    gap: 12,
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  formCard: {
    padding: 16,
    marginTop: 8,
    gap: 16,
  },
  accordionCard: {
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 16,
  },
  saveAllContainer: {
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
  },
  saveAllButton: {
    flex: 1,
  },
  cancelAllButton: {
    flex: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
  },
  textArea: {
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  halfWidth: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  taxModeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  taxModeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  radioGroup: {
    gap: 12,
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  addButton: {
    marginTop: 8,
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  uploadButton: {
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  continueButtonContainer: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  continueButton: {
    minWidth: 200,
    width: '100%',
  },
});
