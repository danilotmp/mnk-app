/**
 * Componente para Capa 3: Ofertas
 * Gestiona ofertas (productos, servicios, paquetes), precios, ajustes de precio, condiciones de servicio y composición de ofertas
 * Según documento técnico V1.0: offering, offering_composition, offering_price, price_adjustment, service_condition
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Select } from "@/components/ui/select";
import { SplitInput } from "@/components/ui/split-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { CatalogService } from "@/src/domains/catalog";
import { CommercialService } from "@/src/domains/commercial";
import {
  CommercialProfile,
  Offering,
  OfferingPrice,
  OfferingPricePayload,
} from "@/src/domains/commercial/types";
import { useCompany } from "@/src/domains/shared";
import {
  AttributesEditor,
  CurrencyInput,
  DatePicker,
} from "@/src/domains/shared/components";
import {
  getStatusDescription,
  RecordStatus,
} from "@/src/domains/shared/types/status.types";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { TemplateService } from "@/src/infrastructure/templates/template.service";
import { formatCode } from "@/src/infrastructure/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ConditionsModal } from "../conditions-modal";
import { PromotionsModal } from "../promotions-modal";

import { styles } from "./operational-layer.styles";

interface OperationalLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: () => void; // Callback cuando la capa se completa al 100%
  searchFilter?: string; // Filtro de búsqueda
}

export function OperationalLayer({
  onProgressUpdate,
  onDataChange,
  onComplete,
  searchFilter = "",
}: OperationalLayerProps) {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const O = t.wizard?.layers?.offerings;
  const alert = useAlert();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [originalOfferings, setOriginalOfferings] = useState<Offering[]>([]); // Ofertas originales del backend
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(
    null,
  );
  const [prices, setPrices] = useState<OfferingPrice[]>([]);
  const [offeringsPrices, setOfferingsPrices] = useState<
    Record<string, OfferingPrice | null>
  >({}); // Precio principal de cada oferta
  const [expandedOfferingId, setExpandedOfferingId] = useState<string | null>(
    null,
  ); // ID de oferta expandida (acordeón)
  const [newOfferings, setNewOfferings] = useState<
    Array<{
      offering: Partial<Offering>;
      price: { basePrice: number; taxMode: "included" | "excluded" };
    }>
  >([]); // Nuevas ofertas en memoria
  const [modifiedOfferings, setModifiedOfferings] = useState<
    Record<
      string,
      {
        offering: Partial<Offering>;
        price?: { basePrice: number; taxMode: "included" | "excluded" };
      }
    >
  >({}); // Ofertas modificadas en memoria
  const [deletedOfferings, setDeletedOfferings] = useState<string[]>([]); // IDs de ofertas a eliminar (cambiar estado a inactive)
  const [originalOfferingsPrices, setOriginalOfferingsPrices] = useState<
    Record<string, OfferingPrice | null>
  >({}); // Precios originales para detectar cambios
  const [saving, setSaving] = useState(false);
  const [conditionsModalVisible, setConditionsModalVisible] = useState(false);
  const [conditionsOfferingId, setConditionsOfferingId] = useState<string | undefined>(undefined);
  const [conditionsOfferingLabel, setConditionsOfferingLabel] = useState("");
  const [conditionsScope, setConditionsScope] = useState<"general" | "specific">("general");
  const [promotionsModalVisible, setPromotionsModalVisible] = useState(false);
  const [promotionsOfferingId, setPromotionsOfferingId] = useState<string | undefined>(undefined);
  const [promotionsOfferingLabel, setPromotionsOfferingLabel] = useState("");
  const [promotionsScope, setPromotionsScope] = useState<"general" | "specific">("general");
  const [promotionsPreloaded, setPromotionsPreloaded] = useState<any[] | undefined>(undefined);
  const [conditionsPreloaded, setConditionsPreloaded] = useState<any[] | undefined>(undefined);
  const [isLoadingOfferings, setIsLoadingOfferings] = useState(false); // Flag para evitar llamados repetitivos
  const [commercialProfile, setCommercialProfile] =
    useState<CommercialProfile | null>(null); // Perfil comercial para obtener defaultTaxMode, currency, timezone, language
  const [currentPage, setCurrentPage] = useState(1); // Página actual de la paginación
  const [itemsPerPage, setItemsPerPage] = useState(5); // Registros por página (selector)
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null); // URI para ver imagen ampliada

  const [offeringType, setOfferingType] = useState<"product" | "service">(
    "product",
  );
  const [productTypeOptions, setProductTypeOptions] = useState<
    Array<{ value: string; label: string; icon?: string }>
  >([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  // requiresConditions removido del estado - siempre se envía como false
  const [offeringForm, setOfferingForm] = useState({
    name: "",
    description: "",
    code: "",
    image: null as string | null,
    status: RecordStatus.PENDING as number,
    properties: null as Record<string, unknown> | null,
  });
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Inicializar priceForm con defaultTaxMode del perfil (se actualizará cuando se cargue el perfil)
  const [priceForm, setPriceForm] = useState({
    basePrice: "",
    taxMode: "included" as "included" | "excluded", // Se actualizará con defaultTaxMode del perfil
    validFrom: new Date().toISOString().split("T")[0],
    validTo: "",
  });
  const [showPriceForm, setShowPriceForm] = useState(false);

  // Cargar perfil comercial para obtener defaultTaxMode
  const loadProfile = useCallback(async () => {
    if (!company?.id) return;

    try {
      const profile = await CommercialService.getProfile(company.id);
      setCommercialProfile(profile);
    } catch (error: any) {
      // Si no existe perfil (404), es normal - usar valor por defecto
      if (error?.statusCode !== 404) {
        console.error("Error al cargar perfil comercial:", error);
      }
    }
  }, [company?.id]);

  // Currency, timezone y language vienen del perfil comercial, no del contexto

  // Cargar catálogo de tipos de producto
  useEffect(() => {
    if (!company?.id || isLoadingCatalogs) return;

    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        const productTypesResponse = await CatalogService.queryCatalog(
          "PRODUCT_TYPES",
          company.id,
          false,
        );
        // Mapear opciones con iconos y convertir códigos a formato esperado
        const options = productTypesResponse.details
          .filter((entry) => entry.status === 1)
          .map((entry) => {
            const codeLower = entry.code.toLowerCase();
            // Convertir "producto" -> "product", "servicio" -> "service"
            const mappedValue =
              codeLower === "producto"
                ? "product"
                : codeLower === "servicio"
                  ? "service"
                  : codeLower;
            return {
              value: mappedValue,
              label: entry.name,
              icon:
                codeLower === "producto"
                  ? "cube-outline"
                  : codeLower === "servicio"
                    ? "construct-outline"
                    : "ellipse-outline",
            };
          });
        setProductTypeOptions(options);
        // Establecer tipo inicial basado en la primera opción
        if (options.length > 0) {
          setOfferingType(options[0].value as "product" | "service");
        }
      } catch (error: any) {
        console.error("Error al cargar catálogo de tipos de producto:", error);
        alert.showError("Error al cargar tipos de producto", error.message);
        setProductTypeOptions([]);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, [company?.id]);

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
          const mainPrice =
            offering.prices.find((p) => !p.branchId) ||
            offering.prices[0] ||
            null;
          // Asegurar que basePrice sea un número
          if (mainPrice && typeof mainPrice.basePrice === "string") {
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
      console.error("Error al cargar ofertas:", error);
      const errorMessage = error?.message || "Error al cargar ofertas";
      const errorDetail =
        typeof error?.details === "object"
          ? JSON.stringify(error.details)
          : error?.details ||
            error?.result?.description ||
            error?.result?.details;

      alert.showError(
        errorMessage,
        errorDetail ||
          `Error del servidor: ${error?.statusCode || "Desconocido"}`,
      );
    } finally {
      setLoading(false);
      setIsLoadingOfferings(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para evitar loops

  // Filtrar ofertas según el término de búsqueda
  const filteredOfferings = useMemo(() => {
    if (!searchFilter.trim()) {
      return offerings;
    }
    const searchLower = searchFilter.toLowerCase().trim();
    return offerings.filter((offering) => {
      const name = (offering.name || "").toLowerCase();
      const code = (offering.code || "").toLowerCase();
      const description = (offering.description || "").toLowerCase();
      return (
        name.includes(searchLower) ||
        code.includes(searchLower) ||
        description.includes(searchLower)
      );
    });
  }, [offerings, searchFilter]);

  // Cargar precios de una oferta
  // ❌ CAMBIO V1.0: companyId removido del endpoint
  const loadPrices = useCallback(async (offeringId: string) => {
    if (!offeringId) return;

    try {
      const data = await CommercialService.getOfferingPrices(offeringId);
      setPrices(data);
    } catch (error: any) {
      console.error("Error al cargar precios:", error);
      // No mostrar error aquí - solo log
    }
  }, []);

  // Cargar ofertas solo una vez cuando cambia company.id
  useEffect(() => {
    loadOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Cargar perfil comercial al inicio
  useEffect(() => {
    if (company?.id) {
      loadProfile();
    }
  }, [company?.id, loadProfile]);

  // Actualizar priceForm cuando se carga el perfil comercial
  useEffect(() => {
    if (commercialProfile?.defaultTaxMode && !expandedOfferingId) {
      // Solo actualizar si no hay una oferta expandida (para no sobrescribir datos de edición)
      setPriceForm((prev) => ({
        ...prev,
        taxMode: commercialProfile.defaultTaxMode || "included",
      }));
    }
  }, [commercialProfile?.defaultTaxMode, expandedOfferingId]);

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
    const hasPrices = Object.values(offeringsPrices).some(
      (price) => price !== null && price !== undefined,
    );
    const progress = hasOfferings && hasPrices ? 100 : hasOfferings ? 50 : 0;

    onProgressUpdate?.(progress);
    onDataChange?.(hasOfferings || hasPrices);

    // No llamar automáticamente a onComplete - solo cuando el usuario presione "Continuar"
  }, [offerings, offeringsPrices, company?.id, onProgressUpdate, onDataChange]);

  // Normalizar status de oferta (backend puede devolver number o string)
  const normalizeOfferingStatus = useCallback(
    (s: Offering["status"] | undefined): number => {
      if (typeof s === "number") return s;
      if (s === "active") return RecordStatus.ACTIVE;
      if (s === "inactive") return RecordStatus.INACTIVE;
      return RecordStatus.PENDING;
    },
    [],
  );

  // Inicializar formulario cuando se expande una oferta (acordeón)
  useEffect(() => {
    if (expandedOfferingId) {
      const offering = offerings.find((o) => o.id === expandedOfferingId);
      if (offering) {
        setOfferingType(offering.type as "product" | "service");
        setOfferingForm({
          name: offering.name,
          description: offering.description || "",
          code: offering.code || "",
          image: offering.image ?? null,
          status: normalizeOfferingStatus(offering.status),
          properties:
            offering.properties &&
            Object.keys(offering.properties).length > 0
              ? offering.properties
              : null,
        });

        // Cargar precio principal (usar precio modificado si existe, sino el original)
        const modifiedPrice = modifiedOfferings[offering.id]?.price;
        const mainPrice = modifiedPrice
          ? {
              basePrice: modifiedPrice.basePrice,
              taxMode: modifiedPrice.taxMode,
              validFrom: new Date().toISOString().split("T")[0],
              validTo: null,
            }
          : offeringsPrices[offering.id];

        if (mainPrice) {
          setPriceForm({
            basePrice: mainPrice.basePrice.toString(),
            taxMode: mainPrice.taxMode,
            validFrom: mainPrice.validFrom,
            validTo: mainPrice.validTo || "",
          });
        } else {
          // Usar defaultTaxMode del perfil comercial, o 'included' por defecto
          const defaultTaxMode =
            commercialProfile?.defaultTaxMode || "included";
          setPriceForm({
            basePrice: "",
            taxMode: defaultTaxMode,
            validFrom: new Date().toISOString().split("T")[0],
            validTo: "",
          });
        }
      }
    } else {
      // Resetear formulario cuando se cierra el acordeón
      setOfferingForm({
        name: "",
        description: "",
        code: "",
        image: null,
        status: RecordStatus.PENDING,
        properties: null,
      });
      // Usar defaultTaxMode del perfil comercial, o 'included' por defecto
      const defaultTaxMode = commercialProfile?.defaultTaxMode || "included";
      setPriceForm({
        basePrice: "",
        taxMode: defaultTaxMode,
        validFrom: new Date().toISOString().split("T")[0],
        validTo: "",
      });
      setOfferingType("product");
    }
  }, [
    expandedOfferingId,
    offerings,
    offeringsPrices,
    modifiedOfferings,
    commercialProfile,
    normalizeOfferingStatus,
  ]);

  // Ajustar página actual si es necesario cuando cambia la cantidad de ofertas filtradas
  useEffect(() => {
    const totalPages = Math.ceil(filteredOfferings.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredOfferings.length, currentPage, itemsPerPage]);

  // Detectar si hay cambios pendientes
  const hasPendingChanges = useMemo(() => {
    return (
      newOfferings.length > 0 ||
      Object.keys(modifiedOfferings).length > 0 ||
      deletedOfferings.length > 0
    );
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

  // Elegir imagen para la oferta (crear/editar)
  const pickOfferingImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert.showError("Se necesita permiso para acceder a las fotos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = asset.base64;
        const dataUri = base64
          ? `data:image/jpeg;base64,${base64}`
          : asset.uri || null;
        setOfferingForm((prev) => ({ ...prev, image: dataUri }));
      }
    } catch (e) {
      alert.showError("Error al seleccionar la imagen");
    }
  };

  // Aceptar cambios (actualizar en memoria)
  const handleAcceptChanges = () => {
    if (!expandedOfferingId) return;

    if (!offeringForm.name.trim()) {
      alert.showError(O?.nameRequired ?? "El nombre de la oferta es requerido");
      return;
    }

    if (!priceForm.basePrice || isNaN(parseFloat(priceForm.basePrice))) {
      alert.showError(
        O?.basePriceRequired ??
          "El precio base es requerido y debe ser un número válido",
      );
      return;
    }

    const offering = offerings.find((o) => o.id === expandedOfferingId);
    if (!offering) return;

    const isNewOffering = offering.id.startsWith("temp-");

    // Actualizar oferta en memoria
    const updatedOffering: Partial<Offering> = {
      code: offeringForm.code?.trim() || undefined,
      name: offeringForm.name.trim(),
      description: offeringForm.description.trim() || undefined,
      type: offeringType,
      requiresConditions: false, // Siempre false por ahora
      image: offeringForm.image ?? undefined,
      status: offeringForm.status,
      properties: offeringForm.properties,
    };

    // Usar defaultTaxMode del perfil comercial para todas las ofertas
    const defaultTaxMode = commercialProfile?.defaultTaxMode || "included";
    const updatedPrice = {
      basePrice: parseFloat(priceForm.basePrice),
      taxMode: defaultTaxMode, // Siempre usar el valor del perfil comercial
    };

    if (isNewOffering) {
      // Es una nueva oferta: agregar a newOfferings
      setNewOfferings((prev) => [
        ...prev,
        { offering: { ...offering, ...updatedOffering }, price: updatedPrice },
      ]);
    } else {
      // Es una oferta existente: agregar a modifiedOfferings
      setModifiedOfferings((prev) => ({
        ...prev,
        [offering.id]: {
          offering: updatedOffering,
          price: updatedPrice,
        },
      }));
    }

    // Actualizar lista de ofertas en memoria (incluir image)
    setOfferings((prev) =>
      prev.map((o) =>
        o.id === offering.id
          ? {
              ...o,
              ...updatedOffering,
              image:
                updatedOffering.image !== undefined
                  ? (updatedOffering.image ?? null)
                  : o.image,
            }
          : o,
      ),
    );

    // Actualizar precio en memoria
    setOfferingsPrices((prev) => ({
      ...prev,
      [offering.id]: {
        id: offeringsPrices[offering.id]?.id || "",
        offeringId: offering.id,
        branchId: null,
        basePrice: updatedPrice.basePrice,
        taxMode: updatedPrice.taxMode,
        validFrom: new Date().toISOString().split("T")[0],
        validTo: null,
        status: "active",
      },
    }));

    // Cerrar acordeón
    setExpandedOfferingId(null);
  };

  // Cancelar edición (descartar cambios del registro actual)
  const handleCancelEdit = () => {
    if (!expandedOfferingId) return;

    const offering = offerings.find((o) => o.id === expandedOfferingId);
    if (!offering) return;

    const isNewOffering = offering.id.startsWith("temp-");

    if (isNewOffering) {
      // Si es nueva oferta, eliminarla de la lista
      setOfferings((prev) => prev.filter((o) => o.id !== offering.id));
      setOfferingsPrices((prev) => {
        const updated = { ...prev };
        delete updated[offering.id];
        return updated;
      });
      // Eliminar de newOfferings si estaba ahí
      setNewOfferings((prev) =>
        prev.filter((n) => n.offering.id !== offering.id),
      );
    } else {
      // Restaurar valores originales
      const originalOffering = originalOfferings.find(
        (o) => o.id === offering.id,
      );
      if (originalOffering) {
        setOfferingType(originalOffering.type as "product" | "service");
        setOfferingForm({
          name: originalOffering.name,
          description: originalOffering.description || "",
          code: originalOffering.code || "",
          image: originalOffering.image ?? null,
          status: normalizeOfferingStatus(originalOffering.status),
          properties:
            originalOffering.properties &&
            Object.keys(originalOffering.properties).length > 0
              ? originalOffering.properties
              : null,
        });
      }

      const originalPrice = originalOfferingsPrices[offering.id];
      if (originalPrice) {
        setPriceForm({
          basePrice: originalPrice.basePrice.toString(),
          taxMode: originalPrice.taxMode,
          validFrom: originalPrice.validFrom,
          validTo: originalPrice.validTo || "",
        });
      }

      // Eliminar modificaciones pendientes de este registro
      setModifiedOfferings((prev) => {
        const updated = { ...prev };
        delete updated[offering.id];
        return updated;
      });

      // Eliminar de deletedOfferings si estaba ahí
      setDeletedOfferings((prev) => prev.filter((id) => id !== offering.id));

      // Restaurar oferta original en la lista
      if (originalOffering) {
        setOfferings((prev) =>
          prev.map((o) => (o.id === offering.id ? originalOffering : o)),
        );
      }

      // Restaurar precio original
      if (originalPrice) {
        setOfferingsPrices((prev) => ({
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

    const offering = offerings.find((o) => o.id === expandedOfferingId);
    if (!offering) return;

    const isNewOffering = offering.id.startsWith("temp-");

    if (isNewOffering) {
      // Si es nueva oferta, eliminarla de la lista directamente
      setOfferings((prev) => prev.filter((o) => o.id !== offering.id));
      setOfferingsPrices((prev) => {
        const updated = { ...prev };
        delete updated[offering.id];
        return updated;
      });
      // Eliminar de newOfferings si estaba ahí (comparar por el ID de la oferta)
      setNewOfferings((prev) =>
        prev.filter((n) => {
          // El offering en newOfferings tiene el id porque se copia desde la lista
          return (n.offering as Offering).id !== offering.id;
        }),
      );
    } else {
      // Si es existente, marcarla para eliminación (cambiar estado a inactive)
      setDeletedOfferings((prev) => [
        ...prev.filter((id) => id !== offering.id),
        offering.id,
      ]);
      // Eliminar de modifiedOfferings si estaba ahí
      setModifiedOfferings((prev) => {
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
      companyId: company?.id || "",
      name: O?.newOffering ?? "Nueva Oferta",
      description: null,
      code: null,
      type: "product",
      requiresConditions: false,
      status: RecordStatus.PENDING,
      image: null,
    };

    // Usar defaultTaxMode del perfil comercial, o 'included' por defecto
    const defaultTaxMode = commercialProfile?.defaultTaxMode || "included";
    const newPrice: OfferingPrice = {
      id: "",
      offeringId: tempId,
      branchId: null,
      basePrice: 0,
      taxMode: defaultTaxMode,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: null,
      status: "active",
    };

    // Ir a la última página para que el nuevo ítem (al final) y el panel de creación sean visibles
    const nextTotal = offerings.length + 1;
    const lastPage = Math.max(1, Math.ceil(nextTotal / itemsPerPage));
    setCurrentPage(lastPage);

    // Agregar a la lista visual
    setOfferings((prev) => [...prev, newOffering]);
    setOfferingsPrices((prev) => ({
      ...prev,
      [tempId]: newPrice,
    }));

    // Expandir automáticamente para editar
    setExpandedOfferingId(tempId);
    setOfferingForm({
      name: "",
      description: "",
      code: "",
      image: null,
      status: RecordStatus.PENDING,
      properties: null,
    });
    setPriceForm({
      basePrice: "",
      taxMode: defaultTaxMode,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: "",
    });
    setOfferingType("product");
  };

  // Guardar todos los cambios al backend
  const handleSaveAll = async () => {
    if (!company?.id) return;
    if (!hasPendingChanges) return;

    setSaving(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const bulkPayloads: any[] = [];

      // Agregar nuevas ofertas
      for (const newOffering of newOfferings) {
        if (!newOffering.offering.name) continue;
        bulkPayloads.push({
          companyId: company.id,
          code: newOffering.offering.code || undefined,
          name: newOffering.offering.name,
          description: newOffering.offering.description,
          type: newOffering.offering.type || "product",
          requiresConditions: false, // Siempre false por ahora
          status:
            typeof newOffering.offering.status === "number"
              ? newOffering.offering.status
              : RecordStatus.PENDING,
          image: newOffering.offering.image ?? null,
          properties: newOffering.offering.properties ?? null,
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

        const originalOffering = originalOfferings.find(
          (o) => o.id === offeringId,
        );
        if (!originalOffering) continue;

        const originalPrice = originalOfferingsPrices[offeringId];
        bulkPayloads.push({
          id: offeringId,
          companyId: company.id,
          code:
            modified.offering.code !== undefined
              ? modified.offering.code
              : (originalOffering.code ?? undefined),
          name: modified.offering.name || originalOffering.name,
          description:
            modified.offering.description !== undefined
              ? modified.offering.description
              : originalOffering.description,
          type: modified.offering.type || originalOffering.type,
          requiresConditions: false, // Siempre false por ahora
          status:
            typeof modified.offering.status === "number"
              ? modified.offering.status
              : normalizeOfferingStatus(originalOffering.status),
          image:
            modified.offering.image !== undefined
              ? modified.offering.image
              : (originalOffering.image ?? null),
          properties:
            modified.offering.properties !== undefined
              ? modified.offering.properties
              : (originalOffering.properties ?? null),
          price: {
            id: originalPrice?.id,
            basePrice:
              modified.price?.basePrice || originalPrice?.basePrice || 0,
            taxMode:
              modified.price?.taxMode || originalPrice?.taxMode || "included",
            branchId: null,
            validFrom: today,
            validTo: null,
          },
        });
      }

      // Agregar ofertas a eliminar (cambiar estado a inactive)
      for (const offeringId of deletedOfferings) {
        const originalOffering = originalOfferings.find(
          (o) => o.id === offeringId,
        );
        if (!originalOffering) continue;

        const originalPrice = originalOfferingsPrices[offeringId];
        bulkPayloads.push({
          id: offeringId,
          companyId: company.id,
          code: originalOffering.code ?? undefined,
          name: originalOffering.name,
          description: originalOffering.description,
          type: originalOffering.type,
          requiresConditions: false,
          status: RecordStatus.INACTIVE, // Cambiar estado a inactive (0)
          image: originalOffering.image ?? null,
          properties: originalOffering.properties ?? null,
          price: {
            id: originalPrice?.id,
            basePrice: originalPrice?.basePrice || 0,
            taxMode:
              originalPrice?.taxMode ||
              commercialProfile?.defaultTaxMode ||
              "included",
            branchId: null,
            validFrom: today,
            validTo: null,
          },
        });
      }

      if (bulkPayloads.length === 0) {
        setSaving(false);
        return;
      }

      const bulkResult = await CommercialService.bulkCreateOfferings({
        offerings: bulkPayloads,
      });

      if (bulkResult.errors && bulkResult.errors.length > 0) {
        const errorMessages = bulkResult.errors
          .slice(0, 3)
          .map((err) => err.message)
          .join(", ");
        alert.showError(
          `${O?.errorsSaving ?? "Errores al guardar"}: ${errorMessages}${bulkResult.errors.length > 3 ? ` y ${bulkResult.errors.length - 3} más` : ""}`,
        );
        return;
      }

      alert.showSuccess(
        `${bulkResult.created || bulkPayloads.length} ${O?.offeringsSaved ?? "oferta(s) guardada(s) correctamente"}`,
      );

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
      console.error("Error al guardar cambios:", error);
      alert.showError(
        (O?.errorSaving ?? "Error al guardar cambios") +
          ": " +
          (error?.message || "Error desconocido"),
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancelar todos los cambios pendientes
  const handleCancelAll = () => {
    // Eliminar ofertas nuevas de la lista
    const newOfferingIds = newOfferings
      .map((n) => (n.offering as Offering).id)
      .filter((id) => id?.startsWith("temp-"));
    setOfferings((prev) => prev.filter((o) => !newOfferingIds.includes(o.id)));

    // Eliminar precios de ofertas nuevas
    setOfferingsPrices((prev) => {
      const updated = { ...prev };
      newOfferingIds.forEach((id) => {
        delete updated[id];
      });
      return updated;
    });

    // Restaurar ofertas modificadas a sus valores originales
    for (const [offeringId, modified] of Object.entries(modifiedOfferings)) {
      const originalOffering = originalOfferings.find(
        (o) => o.id === offeringId,
      );
      if (originalOffering) {
        setOfferings((prev) =>
          prev.map((o) => (o.id === offeringId ? originalOffering : o)),
        );
      }

      const originalPrice = originalOfferingsPrices[offeringId];
      if (originalPrice) {
        setOfferingsPrices((prev) => ({
          ...prev,
          [offeringId]: originalPrice,
        }));
      }
    }

    // Restaurar ofertas eliminadas (quitar de deletedOfferings)
    for (const offeringId of deletedOfferings) {
      const originalOffering = originalOfferings.find(
        (o) => o.id === offeringId,
      );
      if (originalOffering) {
        // Asegurarse de que la oferta esté en la lista
        setOfferings((prev) => {
          const exists = prev.find((o) => o.id === offeringId);
          if (!exists) {
            return [...prev, originalOffering];
          }
          return prev.map((o) => (o.id === offeringId ? originalOffering : o));
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
      await TemplateService.downloadTemplate("offerings");
      alert.showSuccess(
        O?.templateDownloaded ?? "Plantilla descargada correctamente",
      );
    } catch (error: any) {
      alert.showError(
        (O?.errorDownloadTemplate ?? "Error al descargar plantilla") +
          ": " +
          (error.message || "Error desconocido"),
      );
    }
  };

  const handleBulkUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !company?.id) return;

    setUploadingBulk(true);

    try {
      const data = await TemplateService.parseFile(file);

      if (data.length === 0) {
        alert.showError(
          O?.noValidData ?? "El archivo no contiene datos válidos",
        );
        setUploadingBulk(false);
        return;
      }

      // Columnas estándar (no van a properties)
      const STANDARD_COLS = new Set([
        "tipo", "nombre", "descripción", "descripcion",
        "precio base", "precio_base", "modo de impuestos", "modo_impuestos",
      ]);

      // Mapeo header Excel -> clave en properties (normalizado sin espacios/acentos)
      const PROPERTY_HEADERS: Record<string, string> = {
        "valor mínimo (opcional)": "valorMinimo",
        "valorminimo": "valorMinimo",
        "valor por persona (opcional)": "valorPorPersona",
        "valorporpersona": "valorPorPersona",
        "máx. personas (opcional)": "maxPersonas",
        "máx personas (opcional)": "maxPersonas",
        "maxpersonas": "maxPersonas",
        "max personas": "maxPersonas",
      };

      const toCamelCase = (s: string): string =>
        s.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toLowerCase());

      const buildPropertiesFromRow = (row: Record<string, unknown>): Record<string, unknown> | null => {
        const props: Record<string, unknown> = {};
        for (const [header, value] of Object.entries(row)) {
          if (value === null || value === undefined || value === "") continue;
          const h = String(header).toLowerCase().trim().replace(/\s+/g, " ");
          if (STANDARD_COLS.has(h)) continue;
          const key = PROPERTY_HEADERS[h] ?? toCamelCase(String(header).trim());
          const num = Number(value);
          props[key] = !Number.isNaN(num) && String(value).trim() !== "" ? num : value;
        }
        return Object.keys(props).length > 0 ? props : null;
      };

      // Preparar ofertas para el endpoint bulk
      const offeringsPayload: Array<{
        companyId: string;
        code?: string;
        name: string;
        description?: string;
        type: "product" | "service";
        requiresConditions?: boolean;
        properties?: Record<string, unknown> | null;
        price: {
          basePrice: number;
          taxMode: "included" | "excluded";
          branchId: null;
          validFrom?: string;
          validTo?: string | null;
        };
      }> = [];

      // Procesar cada fila
      for (let index = 0; index < data.length; index++) {
        const row = data[index] as Record<string, unknown>;

        try {
          // Validar campos requeridos
          const name = (row["Nombre"] || row["nombre"] || "").toString().trim();
          if (!name) {
            throw new Error("El nombre es requerido");
          }

          const precioBase = row["Precio Base"] || row["precio_base"];
          if (!precioBase || Number.isNaN(Number.parseFloat(String(precioBase)))) {
            throw new Error(
              "El precio base es requerido y debe ser un número válido",
            );
          }

          // Usar defaultTaxMode del perfil comercial en lugar de leer de la fila
          const modoImpuestos = (commercialProfile?.defaultTaxMode ||
            "included") as "included" | "excluded";

          // Mapear tipo: convertir español a inglés (solo producto y servicio para wizard)
          const tipoStr = (row["Tipo"] || row["tipo"] || "producto")
            .toString()
            .toLowerCase()
            .trim();
          let type: "product" | "service" = "product";
          if (tipoStr === "servicio" || tipoStr === "service") {
            type = "service";
          }

          // Preparar precio - validFrom siempre usa fecha actual, validTo siempre null
          const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

          // Construir properties desde columnas no estándar (valorMinimo, valorPorPersona, maxPersonas, etc.)
          const properties = buildPropertiesFromRow(row);

          offeringsPayload.push({
            companyId: company.id,
            name,
            description:
              (row["Descripción"] || row["descripcion"] || "").toString().trim() ||
              undefined,
            type,
            requiresConditions: type === "service" ? false : undefined,
            properties: properties ?? null,
            price: {
              basePrice: Number.parseFloat(String(precioBase)),
              taxMode: modoImpuestos,
              branchId: null,
              validFrom: today,
              validTo: null,
            },
          });
        } catch (error: any) {
          // Los errores se manejarán en la respuesta del bulk
          console.error(`Error procesando fila ${index + 1}:`, error);
        }
      }

      if (offeringsPayload.length === 0) {
        alert.showError(
          O?.noOfferingsProcessed ??
            "No se pudo procesar ninguna oferta del archivo",
        );
        setUploadingBulk(false);
        return;
      }

      // Llamar al endpoint bulk
      const bulkResult = await CommercialService.bulkCreateOfferings({
        offerings: offeringsPayload,
      });

      const successCount = bulkResult.created || 0;
      const errorCount = bulkResult.errors?.length || 0;

      // Recargar ofertas
      await loadOfferings();

      // Limpiar el input de archivo para permitir cargar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (errorCount > 0) {
        const errorMessages =
          bulkResult.errors
            ?.slice(0, 3)
            .map(
              (err) =>
                `Fila ${err.index + 1}${err.code ? ` (${err.code})` : ""}: ${err.message}`,
            )
            .join(", ") || "";
        alert.showError(
          `Se procesaron ${successCount} de ${bulkResult.total} ofertas. Errores: ${errorMessages}${bulkResult.errors && bulkResult.errors.length > 3 ? ` y ${bulkResult.errors.length - 3} más` : ""}`,
        );
      } else {
        alert.showSuccess(
          `${successCount} ${O?.offeringsLoaded ?? "ofertas cargadas correctamente"}`,
        );
      }
    } catch (error: any) {
      alert.showError(
        "Error al procesar el archivo: " +
          (error.message || "El archivo no tiene el formato correcto"),
      );
    } finally {
      setUploadingBulk(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCreatePrice = async () => {
    if (!company?.id || !selectedOffering) return;

    if (!priceForm.basePrice || parseFloat(priceForm.basePrice) <= 0) {
      alert.showError(
        O?.basePriceGreaterZero ?? "El precio base debe ser mayor a 0",
      );
      return;
    }

    setSaving(true);

    try {
      // ❌ CAMBIO V1.0: companyId y currency removidos del payload
      // Usar defaultTaxMode del perfil comercial
      const defaultTaxMode = commercialProfile?.defaultTaxMode || "included";
      const payload: OfferingPricePayload = {
        offeringId: selectedOffering.id,
        branchId: null, // NULL = precio global, NOT NULL = precio por sucursal
        basePrice: parseFloat(priceForm.basePrice),
        taxMode: defaultTaxMode, // Usar defaultTaxMode del perfil comercial (no se muestra en UI)
        validFrom: priceForm.validFrom, // Formato YYYY-MM-DD según V1.0
        validTo: priceForm.validTo || null, // Formato YYYY-MM-DD o null
      };

      await CommercialService.createOfferingPrice(selectedOffering.id, payload);
      alert.showSuccess(O?.priceCreated ?? "Precio creado correctamente");
      setShowPriceForm(false);
      setPriceForm({
        basePrice: "",
        taxMode: "included",
        validFrom: new Date().toISOString().split("T")[0],
        validTo: "",
      });
      // Recargar precios sin mostrar toast de error si falla
      try {
        await loadPrices(selectedOffering.id);
      } catch (error) {
        // Error silencioso - solo log
        console.error("Error al recargar precios:", error);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Error al crear precio";
      const errorDetail =
        typeof error?.details === "object"
          ? JSON.stringify(error.details)
          : error?.details || error?.result?.description;

      alert.showError(errorMessage + (errorDetail ? `: ${errorDetail}` : ""));
    } finally {
      setSaving(false);
    }
  };

  if (loading && offerings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText
          type="body2"
          style={[styles.loadingMessage, { color: colors.textSecondary }]}
        >
          {O?.loadingOfferings ?? "Cargando ofertas..."}
        </ThemedText>
      </View>
    );
  }

  return (
    <>
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.formContainer}>
        {/* Sección: Ofertas */}
        <Card variant="elevated" style={styles.sectionCard}>
          <View style={[styles.sectionHeader, { justifyContent: "space-between" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="cube-outline" size={24} color={colors.primary} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                {O?.sectionTitle ?? "Ofertas"}
              </ThemedText>
            </View>
            <Tooltip text={(t as any).conditions?.conditionsButton || "Condiciones"} position="left">
              <TouchableOpacity
                onPress={() => { setConditionsModalVisible(true); setConditionsOfferingId(undefined); setConditionsScope("general"); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="list-outline" size={20} color={colors.primary} />
                {!isMobile && (
                  <ThemedText type="body2" style={{ color: colors.primary, fontWeight: "600" }}>
                    {(t as any).conditions?.conditionsButton || "Condiciones"}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </Tooltip>
            <Tooltip text={(t as any).promotions?.promotionsButton || "Promociones"} position="left">
              <TouchableOpacity
                onPress={() => { setPromotionsModalVisible(true); setPromotionsOfferingId(undefined); setPromotionsScope("general"); }}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
                {!isMobile && (
                  <ThemedText type="body2" style={{ color: colors.primary, fontWeight: "600" }}>
                    {(t as any).promotions?.promotionsButton || "Promociones"}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </Tooltip>
          </View>
          <View
            style={[
              styles.sectionDescriptionContainer,
              { backgroundColor: colors.filterInputBackground },
            ]}
          >
            <ThemedText
              type="body2"
              style={[
                styles.sectionDescription,
                { color: colors.textSecondary },
              ]}
            >
              {O?.sectionDescription ??
                "Define los productos, servicios o paquetes que ofreces"}
            </ThemedText>
            {filteredOfferings.length > 0 && (
              <ThemedText
                type="body2"
                style={[styles.sectionRecordsCount, { color: colors.textSecondary }]}
              >
                {filteredOfferings.length}{" "}
                {filteredOfferings.length === 1
                  ? (O?.record ?? "registro")
                  : (O?.records ?? "registros")}
              </ThemedText>
            )}
          </View>

          {/* Lista de ofertas con paginación */}
          {filteredOfferings.length > 0 &&
            (() => {
              const totalPages = Math.ceil(
                filteredOfferings.length / itemsPerPage,
              );
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const currentOfferings = filteredOfferings.slice(
                startIndex,
                endIndex,
              );

              return (
                <>
                  <View style={styles.paginatedListContainer}>
                    <View style={styles.listContainer}>
                      {currentOfferings.map((offering) => {
                        const mainPrice = offeringsPrices[offering.id];
                        // Icono según el tipo de oferta
                        const typeIcon =
                          offering.type === "service"
                            ? "construct-outline"
                            : "cube-outline";
                        const typeLabel =
                          offering.type === "service"
                            ? (O?.service ?? "Servicio")
                            : (O?.product ?? "Producto");

                        const isExpanded = expandedOfferingId === offering.id;
                        const isPendingSave =
                          offering.id.startsWith("temp-") ||
                          !!modifiedOfferings[offering.id];
                        const displayStatus = isExpanded
                          ? offeringForm.status
                          : (modifiedOfferings[offering.id]?.offering?.status ??
                            offering.status);
                        const displayStatusNorm = normalizeOfferingStatus(
                          typeof displayStatus === "number"
                            ? displayStatus
                            : offering.status,
                        );

                        return (
                          <View key={offering.id}>
                            <TouchableOpacity
                              style={[
                                styles.listItem,
                                isMobile && styles.listItemMobile,
                                {
                                  backgroundColor: isExpanded
                                    ? colors.primary + "20"
                                    : colors.filterInputBackground,
                                  borderColor: isExpanded
                                    ? colors.primary
                                    : colors.border,
                                },
                              ]}
                              onPress={() => handleOfferingClick(offering)}
                            >
                              {isMobile ? (
                                <>
                                  {/* Fila 1: Nombre + Estado - ancho completo */}
                                  <View style={styles.listItemNameRow}>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 6,
                                        flex: 1,
                                        minWidth: 0,
                                      }}
                                    >
                                      <ThemedText
                                        type="body1"
                                        style={{
                                          fontWeight: "600",
                                        }}
                                      >
                                        {offering.name}
                                      </ThemedText>
                                      <ThemedText
                                        type="caption"
                                        style={{
                                          color: colors.textSecondary,
                                        }}
                                      >
                                        ({typeLabel})
                                      </ThemedText>
                                    </View>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 6,
                                      }}
                                    >
                                      <StatusBadge
                                        status={displayStatusNorm}
                                        statusDescription={getStatusDescription(
                                          displayStatusNorm,
                                        )}
                                        size="small"
                                      />
                                      {isPendingSave ? (
                                        <View
                                          style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor:
                                              colors.suspended ?? "#e74c3c",
                                          }}
                                        />
                                      ) : null}
                                    </View>
                                  </View>
                                  {/* Fila 2: Detalle (izq) | Precio (der) */}
                                  <View
                                    style={[
                                      styles.listItemDetailRow,
                                      isMobile && styles.listItemDetailRowMobile,
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.listItemContentMobile,
                                        { flex: 1, minWidth: 0 },
                                      ]}
                                    >
                                      {offering.image ? (
                                        <Image
                                          source={{
                                            uri: offering.image.startsWith("data:")
                                              ? offering.image
                                              : `data:image/jpeg;base64,${offering.image}`,
                                          }}
                                          style={{
                                            width: 80,
                                            height: 80,
                                            borderRadius: 8,
                                            marginBottom: 8,
                                            backgroundColor: colors.border,
                                          }}
                                          resizeMode="cover"
                                        />
                                      ) : null}
                                      {offering.description ? (
                                        <ThemedText
                                          type="body2"
                                          numberOfLines={3}
                                          style={{
                                            color: colors.textSecondary,
                                            marginTop: 2,
                                            fontSize: 13,
                                          }}
                                        >
                                          {offering.description}
                                        </ThemedText>
                                      ) : null}
                                      {offering.properties &&
                                        Object.keys(offering.properties).length >
                                          0 ? (
                                        <View
                                          style={styles.propertiesChipsRow}
                                        >
                                          {Object.entries(
                                            offering.properties,
                                          ).slice(0, 4).map(([k, v]) => (
                                            <ThemedText
                                              key={k}
                                              type="caption"
                                              style={[styles.propertyChip, { color: colors.textSecondary, backgroundColor: colors.filterInputBackground }]}
                                              numberOfLines={1}
                                            >
                                              {k}: {String(v)}
                                            </ThemedText>
                                          ))}
                                          {Object.keys(offering.properties).length > 4 && (
                                            <ThemedText
                                              type="caption"
                                              style={[styles.propertyChipMore, { color: colors.textSecondary, backgroundColor: colors.filterInputBackground }]}
                                            >
                                              +{Object.keys(offering.properties).length - 4}
                                            </ThemedText>
                                          )}
                                      </View>
                                    ) : null}
                                    </View>
                                    <View
                                      style={[styles.listItemRight, isMobile && styles.listItemRightMobile]}
                                    >
                                        <View style={styles.alignEnd}>
                                          {mainPrice &&
                                          mainPrice.basePrice > 0 ? (
                                          <>
                                            <ThemedText
                                              type="h4"
                                              style={{
                                                fontWeight: "700",
                                                color: colors.primary,
                                              }}
                                            >
                                              {commercialProfile?.currency ||
                                                "USD"}{" "}
                                              {Number(
                                                mainPrice.basePrice,
                                              ).toFixed(2)}
                                            </ThemedText>
                                            <ThemedText
                                              type="body2"
                                              style={{
                                                color: colors.textSecondary,
                                                fontSize: 12,
                                              }}
                                            >
                                              Impuestos{" "}
                                              {mainPrice.taxMode === "included"
                                                ? (O?.taxesIncluded ??
                                                  "Incluidos")
                                                : (O?.taxesExcluded ??
                                                  "Excluidos")}
                                            </ThemedText>
                                          </>
                                        ) : (
                                          <ThemedText
                                            type="body2"
                                            style={{
                                              color: colors.textSecondary,
                                              fontStyle: "italic",
                                            }}
                                          >
                                            {O?.noPrice ?? "Sin precio"}
                                          </ThemedText>
                                        )}
                                      </View>
                                      <Ionicons
                                        name={
                                          isExpanded
                                            ? "chevron-down"
                                            : "chevron-forward"
                                        }
                                        size={20}
                                        color={colors.textSecondary}
                                      />
                                    </View>
                                  </View>
                                </>
                              ) : (
                                <>
                                  {/* Fila 1: Nombre + Estado - ancho completo */}
                                  <View style={styles.listItemNameRow}>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 6,
                                        flex: 1,
                                        minWidth: 0,
                                      }}
                                    >
                                      <Ionicons
                                        name={typeIcon}
                                        size={24}
                                        color={colors.textSecondary}
                                        style={styles.listItemTypeIcon}
                                      />
                                      <ThemedText
                                        type="body1"
                                        style={{ fontWeight: "600" }}
                                      >
                                        {offering.name}
                                      </ThemedText>
                                      <ThemedText
                                        type="caption"
                                        style={{
                                          color: colors.textSecondary,
                                          fontSize: 11,
                                        }}
                                      >
                                        ({typeLabel})
                                      </ThemedText>
                                    </View>
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <StatusBadge
                                        status={displayStatusNorm}
                                        statusDescription={getStatusDescription(
                                          displayStatusNorm,
                                        )}
                                        size="small"
                                      />
                                      {isPendingSave ? (
                                        <View
                                          style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor:
                                              colors.suspended ?? "#e74c3c",
                                          }}
                                        />
                                      ) : null}
                                    </View>
                                  </View>
                                  {/* Fila 2: Detalle (izq) | Precio (der) */}
                                  <View style={[styles.listItemDetailRow, isMobile && styles.listItemDetailRowMobile]}>
                                    <View
                                      style={[
                                        styles.listItemLeft,
                                        { flex: 1, minWidth: 0 },
                                      ]}
                                    >
                                      {offering.image ? (
                                        <Image
                                          source={{
                                            uri: offering.image.startsWith(
                                              "data:",
                                            )
                                              ? offering.image
                                              : `data:image/jpeg;base64,${offering.image}`,
                                          }}
                                          style={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: 8,
                                            marginRight: 12,
                                            backgroundColor: colors.border,
                                          }}
                                          resizeMode="cover"
                                        />
                                      ) : null}
                                      <View
                                        style={[
                                          styles.listItemContent,
                                          { flex: 1 },
                                        ]}
                                      >
                                        {offering.description && (
                                          <ThemedText
                                            type="body2"
                                            numberOfLines={3}
                                            style={{
                                              color: colors.textSecondary,
                                              fontSize: 13,
                                            }}
                                          >
                                            {offering.description}
                                          </ThemedText>
                                        )}
                                        {offering.properties &&
                                          Object.keys(offering.properties)
                                            .length > 0 && (
                                            <View style={styles.propertiesChipsRow}>
                                              {Object.entries(
                                                offering.properties,
                                              ).slice(0, 4).map(([k, v]) => (
                                                <ThemedText
                                                  key={k}
                                                  type="caption"
                                                  style={[styles.propertyChip, { color: colors.textSecondary, backgroundColor: colors.filterInputBackground }]}
                                                  numberOfLines={1}
                                                >
                                                  {k}: {String(v)}
                                                </ThemedText>
                                              ))}
                                              {Object.keys(offering.properties).length > 4 && (
                                                <ThemedText
                                                  type="caption"
                                                  style={[styles.propertyChipMore, { color: colors.textSecondary, backgroundColor: colors.filterInputBackground }]}
                                                >
                                                  +{Object.keys(offering.properties).length - 4}
                                                </ThemedText>
                                              )}
                                            </View>
                                          )}
                                      </View>
                                    </View>
                                    <View style={[styles.listItemRight, isMobile && styles.listItemRightMobile]}>
                                        <View style={styles.alignEnd}>
                                          {mainPrice &&
                                          mainPrice.basePrice > 0 ? (
                                          <>
                                            <ThemedText
                                              type="h4"
                                              style={{
                                                fontWeight: "700",
                                                color: colors.primary,
                                              }}
                                            >
                                              {commercialProfile?.currency ||
                                                "USD"}{" "}
                                              {Number(
                                                mainPrice.basePrice,
                                              ).toFixed(2)}
                                            </ThemedText>
                                            <ThemedText
                                              type="body2"
                                              style={{
                                                color: colors.textSecondary,
                                                marginTop: 4,
                                                fontSize: 12,
                                              }}
                                            >
                                              Impuestos{" "}
                                              {mainPrice.taxMode === "included"
                                                ? (O?.taxesIncluded ??
                                                  "Incluidos")
                                                : (O?.taxesExcluded ??
                                                  "Excluidos")}
                                            </ThemedText>
                                          </>
                                        ) : (
                                          <ThemedText
                                            type="body2"
                                            style={{
                                              color: colors.textSecondary,
                                              fontStyle: "italic",
                                            }}
                                          >
                                            {O?.noPrice ?? "Sin precio"}
                                          </ThemedText>
                                        )}
                                      </View>
                                      <Ionicons
                                        name={
                                          isExpanded
                                            ? "chevron-down"
                                            : "chevron-forward"
                                        }
                                        size={20}
                                        color={colors.textSecondary}
                                        style={styles.listItemCaptionSpacer}
                                      />
                                    </View>
                                  </View>
                                </>
                              )}
                            </TouchableOpacity>

                            {/* Acordeón: Formulario de edición debajo de la oferta */}
                            {isExpanded && (
                              <Card
                                variant="outlined"
                                style={[styles.accordionCard, isMobile && styles.accordionCardMobile]}
                              >
                                {/* Web: Imagen + Tipo + Estado en una fila, todo el ancho. Móvil: fila1=Imagen+Tipo, fila2=Estado (mismo margen que Nombre) */}
                                <View
                                  style={[
                                    styles.expandableFormRowMargins,
                                    isMobile && styles.expandableFormRowMarginsMobile,
                                    {
                                      flexDirection: isMobile ? "column" : "row",
                                      alignItems: "center",
                                      gap: 12,
                                      marginBottom: 4,
                                      overflow: "hidden",
                                    },
                                  ]}
                                >
                                  {isMobile ? (
                                    <>
                                      {/* Móvil: Imagen + Tipo en una fila, centrados verticalmente, sin desborde */}
                                      <View
                                        style={[
                                          styles.imageAndTypeRow,
                                          {
                                            width: "100%",
                                            minWidth: 0,
                                            overflow: "hidden",
                                          },
                                        ]}
                                      >
                                        <View
                                          style={{
                                            position: "relative",
                                            width: 56,
                                            height: 56,
                                          }}
                                        >
                                    {offeringForm.image ? (
                                      <>
                                        <Image
                                          source={{
                                            uri: offeringForm.image.startsWith(
                                              "data:",
                                            )
                                              ? offeringForm.image
                                              : `data:image/jpeg;base64,${offeringForm.image}`,
                                          }}
                                          style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: 56,
                                            height: 56,
                                            borderRadius: 8,
                                            backgroundColor: colors.border,
                                          }}
                                          resizeMode="cover"
                                        />
                                        <View
                                          style={{
                                            position: "absolute",
                                            top: 4,
                                            left: 4,
                                            right: 4,
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            zIndex: 10,
                                          }}
                                        >
                                          <Tooltip
                                            text={
                                              O?.removeImage ?? "Quitar imagen"
                                            }
                                            position="top"
                                          >
                                            <TouchableOpacity
                                              onPress={() =>
                                                setOfferingForm((p) => ({
                                                  ...p,
                                                  image: null,
                                                }))
                                              }
                                              style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 12,
                                                backgroundColor:
                                                  "rgba(0,0,0,0.5)",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <Ionicons
                                                name="trash-outline"
                                                size={14}
                                                color="#fff"
                                              />
                                            </TouchableOpacity>
                                          </Tooltip>
                                          <Tooltip
                                            text={O?.viewImage ?? "Ver imagen"}
                                            position="top"
                                          >
                                            <TouchableOpacity
                                              onPress={() =>
                                                setImageViewerUri(
                                                  offeringForm.image!.startsWith(
                                                    "data:",
                                                  )
                                                    ? offeringForm.image!
                                                    : `data:image/jpeg;base64,${offeringForm.image}`,
                                                )
                                              }
                                              style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 12,
                                                backgroundColor:
                                                  "rgba(0,0,0,0.5)",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <Ionicons
                                                name="expand-outline"
                                                size={14}
                                                color="#fff"
                                              />
                                            </TouchableOpacity>
                                          </Tooltip>
                                        </View>
                                      </>
                                    ) : (
                                      <TouchableOpacity
                                        onPress={pickOfferingImage}
                                        style={{
                                          width: 56,
                                          height: 56,
                                          borderRadius: 8,
                                          backgroundColor: colors.border + "60",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          borderWidth: 1,
                                          borderStyle: "dashed",
                                          borderColor:
                                            colors.textSecondary + "60",
                                        }}
                                      >
                                        <Ionicons
                                          name="image-outline"
                                          size={24}
                                          color={colors.textSecondary}
                                        />
                                      </TouchableOpacity>
                                    )}
                                        </View>
                                        <View style={[styles.typeSelector, { flex: 1, minWidth: 0 }]}>
                                        {productTypeOptions.map((option) => {
                                          const isSelected =
                                            offeringType === option.value;

                                          return (
                                            <TouchableOpacity
                                              key={option.value}
                                              style={[
                                                styles.typeOption,
                                                {
                                                  backgroundColor: isSelected
                                                    ? colors.primary
                                                    : "transparent",
                                                  borderColor: isSelected
                                                    ? colors.primary
                                                    : colors.border,
                                                },
                                              ]}
                                              onPress={() =>
                                                setOfferingType(
                                                  option.value as
                                                    | "product"
                                                    | "service",
                                                )
                                              }
                                            >
                                              {option.icon && (
                                                <Ionicons
                                                  name={option.icon as any}
                                                  size={18}
                                                  color={
                                                    isSelected
                                                      ? colors.contrastText
                                                      : colors.textSecondary
                                                  }
                                                />
                                              )}
                                              <ThemedText
                                                type="body2"
                                                style={{
                                                  color: isSelected
                                                    ? colors.contrastText
                                                    : colors.text,
                                                  marginLeft: 6,
                                                  fontWeight: isSelected
                                                    ? "600"
                                                    : "400",
                                                }}
                                              >
                                                {option.label}
                                              </ThemedText>
                                            </TouchableOpacity>
                                          );
                                        })}
                                        </View>
                                      </View>
                                      {/* Móvil: estado en la siguiente fila, contenido sin desbordar */}
                                      <View
                                        style={{
                                          width: "100%",
                                          marginTop: 8,
                                          overflow: "hidden",
                                          flexDirection: "row",
                                          alignItems: "center",
                                        }}
                                      >
                                        <ScrollView
                                          horizontal
                                          showsHorizontalScrollIndicator={false}
                                          style={{ flex: 1 }}
                                        >
                                          <View
                                            style={[
                                              styles.statusOptionsContainer,
                                              styles.statusOptionsContainerMobile,
                                            ]}
                                          >
                                          <TouchableOpacity
                                            style={[
                                              styles.statusOption,
                                              {
                                                backgroundColor:
                                                  offeringForm.status ===
                                                  RecordStatus.ACTIVE
                                                    ? colors.success
                                                    : "transparent",
                                                borderColor:
                                                  offeringForm.status ===
                                                  RecordStatus.ACTIVE
                                                    ? colors.success
                                                    : colors.border,
                                              },
                                            ]}
                                            onPress={() =>
                                              setOfferingForm((prev) => ({
                                                ...prev,
                                                status: RecordStatus.ACTIVE,
                                              }))
                                            }
                                          >
                                            <ThemedText
                                              type="caption"
                                              style={{
                                                color:
                                                  offeringForm.status ===
                                                  RecordStatus.ACTIVE
                                                    ? colors.contrastText
                                                    : colors.text,
                                              }}
                                            >
                                              {t.security?.users?.active ||
                                                "Activo"}
                                            </ThemedText>
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={[
                                              styles.statusOption,
                                              {
                                                backgroundColor:
                                                  offeringForm.status ===
                                                  RecordStatus.INACTIVE
                                                    ? colors.error
                                                    : "transparent",
                                                borderColor:
                                                  offeringForm.status ===
                                                  RecordStatus.INACTIVE
                                                    ? colors.error
                                                    : colors.border,
                                              },
                                            ]}
                                            onPress={() =>
                                              setOfferingForm((prev) => ({
                                                ...prev,
                                                status: RecordStatus.INACTIVE,
                                              }))
                                            }
                                          >
                                            <ThemedText
                                              type="caption"
                                              style={{
                                                color:
                                                  offeringForm.status ===
                                                  RecordStatus.INACTIVE
                                                    ? colors.contrastText
                                                    : colors.text,
                                              }}
                                            >
                                              {t.security?.users?.inactive ||
                                                "Inactivo"}
                                            </ThemedText>
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={[
                                              styles.statusOption,
                                              {
                                                backgroundColor:
                                                  offeringForm.status ===
                                                  RecordStatus.PENDING
                                                    ? colors.warning
                                                    : "transparent",
                                                borderColor:
                                                  offeringForm.status ===
                                                  RecordStatus.PENDING
                                                    ? colors.warning
                                                    : colors.border,
                                              },
                                            ]}
                                            onPress={() =>
                                              setOfferingForm((prev) => ({
                                                ...prev,
                                                status: RecordStatus.PENDING,
                                              }))
                                            }
                                          >
                                            <ThemedText
                                              type="caption"
                                              style={{
                                                color:
                                                  offeringForm.status ===
                                                  RecordStatus.PENDING
                                                    ? "#FFFFFF"
                                                    : colors.text,
                                              }}
                                            >
                                              {t.security?.users?.pending ||
                                                "Pendiente"}
                                            </ThemedText>
                                          </TouchableOpacity>
                                          <TouchableOpacity
                                            style={[
                                              styles.statusOption,
                                              {
                                                backgroundColor:
                                                  offeringForm.status ===
                                                  RecordStatus.SUSPENDED
                                                    ? colors.suspended
                                                    : "transparent",
                                                borderColor:
                                                  offeringForm.status ===
                                                  RecordStatus.SUSPENDED
                                                    ? colors.suspended
                                                    : colors.border,
                                              },
                                            ]}
                                            onPress={() =>
                                              setOfferingForm((prev) => ({
                                                ...prev,
                                                status: RecordStatus.SUSPENDED,
                                              }))
                                            }
                                          >
                                            <ThemedText
                                              type="caption"
                                              style={{
                                                color:
                                                  offeringForm.status ===
                                                  RecordStatus.SUSPENDED
                                                    ? colors.contrastText
                                                    : colors.text,
                                              }}
                                            >
                                              {t.security?.users?.suspended ||
                                                "Suspendido"}
                                            </ThemedText>
                                          </TouchableOpacity>
                                        </View>
                                      </ScrollView>
                                      <Tooltip text={(t as any).conditions?.conditionsButton || "Condiciones"} position="left">
                                        <TouchableOpacity
                                          onPress={async () => {
                                            const oid = expandedOfferingId || undefined;
                                            setConditionsOfferingId(oid);
                                            setConditionsScope("specific");
                                            if (oid) {
                                              try {
                                                const { apiClient: api } = await import("@/src/infrastructure/api");
                                                const res = await api.get<any>(`/commercial/offerings/${oid}`);
                                                const raw = res.data?.conditions || res.data?.data?.conditions || [];
                                                setConditionsPreloaded(Array.isArray(raw) ? raw.filter((c: any) => c.scope === "specific") : []);
                                                const o = offerings.find((x) => x.id === oid);
                                                setConditionsOfferingLabel(o ? `${o.code || ""} — ${o.name}` : "");
                                              } catch { setConditionsPreloaded([]); setConditionsOfferingLabel(""); }
                                            }
                                            setConditionsModalVisible(true);
                                          }}
                                          style={{ padding: 8 }}
                                        >
                                          <Ionicons name="list-outline" size={22} color={isDark ? colors.primaryDark : colors.primary} />
                                        </TouchableOpacity>
                                      </Tooltip>
                                    </View>
                                  </>
                                  ) : (
                                    <>
                                      {/* Web: Imagen + Tipo + Estado en una fila, cubriendo todo el ancho */}
                                      <View
                                        style={{
                                          position: "relative",
                                          width: 56,
                                          height: 56,
                                        }}
                                      >
                                        {offeringForm.image ? (
                                          <>
                                            <Image
                                              source={{
                                                uri: offeringForm.image.startsWith("data:")
                                                  ? offeringForm.image
                                                  : `data:image/jpeg;base64,${offeringForm.image}`,
                                              }}
                                              style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: 56,
                                                height: 56,
                                                borderRadius: 8,
                                                backgroundColor: colors.border,
                                              }}
                                              resizeMode="cover"
                                            />
                                            <View
                                              style={{
                                                position: "absolute",
                                                top: 4,
                                                left: 4,
                                                right: 4,
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                zIndex: 10,
                                              }}
                                            >
                                              <Tooltip text={O?.removeImage ?? "Quitar imagen"} position="top">
                                                <TouchableOpacity
                                                  onPress={() => setOfferingForm((p) => ({ ...p, image: null }))}
                                                  style={{
                                                    width: 24, height: 24, borderRadius: 12,
                                                    backgroundColor: "rgba(0,0,0,0.5)",
                                                    alignItems: "center", justifyContent: "center",
                                                  }}
                                                >
                                                  <Ionicons name="trash-outline" size={14} color="#fff" />
                                                </TouchableOpacity>
                                              </Tooltip>
                                              <Tooltip text={O?.viewImage ?? "Ver imagen"} position="top">
                                                <TouchableOpacity
                                                  onPress={() =>
                                                    setImageViewerUri(
                                                      offeringForm.image!.startsWith("data:")
                                                        ? offeringForm.image!
                                                        : `data:image/jpeg;base64,${offeringForm.image}`,
                                                    )
                                                  }
                                                  style={{
                                                    width: 24, height: 24, borderRadius: 12,
                                                    backgroundColor: "rgba(0,0,0,0.5)",
                                                    alignItems: "center", justifyContent: "center",
                                                  }}
                                                >
                                                  <Ionicons name="expand-outline" size={14} color="#fff" />
                                                </TouchableOpacity>
                                              </Tooltip>
                                            </View>
                                          </>
                                        ) : (
                                          <TouchableOpacity
                                            onPress={pickOfferingImage}
                                            style={{
                                              width: 56, height: 56, borderRadius: 8,
                                              backgroundColor: colors.border + "60",
                                              alignItems: "center", justifyContent: "center",
                                              borderWidth: 1, borderStyle: "dashed",
                                              borderColor: colors.textSecondary + "60",
                                            }}
                                          >
                                            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                    <View style={[styles.flexShrink, { flex: 1, alignSelf: "stretch" }]}>
                                      <View style={styles.typeAndStatusRow}>
                                        <View
                                          style={[
                                            styles.typeSelector,
                                            styles.typeSelectorFlex,
                                          ]}
                                        >
                                          {productTypeOptions.map((option) => {
                                            const isSelected =
                                              offeringType === option.value;
                                            return (
                                              <TouchableOpacity
                                                key={option.value}
                                                style={[
                                                  styles.typeOption,
                                                  {
                                                    backgroundColor: isSelected
                                                      ? colors.primary
                                                      : "transparent",
                                                    borderColor: isSelected
                                                      ? colors.primary
                                                      : colors.border,
                                                  },
                                                ]}
                                                onPress={() =>
                                                  setOfferingType(
                                                    option.value as
                                                      | "product"
                                                      | "service",
                                                  )
                                                }
                                              >
                                                {option.icon && (
                                                  <Ionicons
                                                    name={option.icon as any}
                                                    size={18}
                                                    color={
                                                      isSelected
                                                        ? colors.contrastText
                                                        : colors.textSecondary
                                                    }
                                                  />
                                                )}
                                                <ThemedText
                                                  type="body2"
                                                  style={{
                                                    color: isSelected
                                                      ? colors.contrastText
                                                      : colors.text,
                                                    marginLeft: 6,
                                                    fontWeight: isSelected
                                                      ? "600"
                                                      : "400",
                                                  }}
                                                >
                                                  {option.label}
                                                </ThemedText>
                                              </TouchableOpacity>
                                            );
                                          })}
                                        </View>
                                        {/* Web: View para que estado cubra el ancho; sin ScrollView */}
                                        <View
                                          style={[
                                            styles.statusOptionsContainer,
                                            styles.statusOptionsContainerWeb,
                                          ]}
                                        >
                                            <TouchableOpacity
                                              style={[
                                                styles.statusOption,
                                                styles.statusOptionWeb,
                                                {
                                                  backgroundColor:
                                                    offeringForm.status ===
                                                    RecordStatus.ACTIVE
                                                      ? colors.success
                                                      : "transparent",
                                                  borderColor:
                                                    offeringForm.status ===
                                                    RecordStatus.ACTIVE
                                                      ? colors.success
                                                      : colors.border,
                                                },
                                              ]}
                                              onPress={() =>
                                                setOfferingForm((prev) => ({
                                                  ...prev,
                                                  status: RecordStatus.ACTIVE,
                                                }))
                                              }
                                            >
                                              <ThemedText
                                                type="caption"
                                                style={{
                                                  color:
                                                    offeringForm.status ===
                                                    RecordStatus.ACTIVE
                                                      ? colors.contrastText
                                                      : colors.text,
                                                }}
                                              >
                                                {t.security?.users?.active ||
                                                  "Activo"}
                                              </ThemedText>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                              style={[
                                                styles.statusOption,
                                                styles.statusOptionWeb,
                                                {
                                                  backgroundColor:
                                                    offeringForm.status ===
                                                    RecordStatus.INACTIVE
                                                      ? colors.error
                                                      : "transparent",
                                                  borderColor:
                                                    offeringForm.status ===
                                                    RecordStatus.INACTIVE
                                                      ? colors.error
                                                      : colors.border,
                                                },
                                              ]}
                                              onPress={() =>
                                                setOfferingForm((prev) => ({
                                                  ...prev,
                                                  status: RecordStatus.INACTIVE,
                                                }))
                                              }
                                            >
                                              <ThemedText
                                                type="caption"
                                                style={{
                                                  color:
                                                    offeringForm.status ===
                                                    RecordStatus.INACTIVE
                                                      ? colors.contrastText
                                                      : colors.text,
                                                }}
                                              >
                                                {t.security?.users?.inactive ||
                                                  "Inactivo"}
                                              </ThemedText>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                              style={[
                                                styles.statusOption,
                                                styles.statusOptionWeb,
                                                {
                                                  backgroundColor:
                                                    offeringForm.status ===
                                                    RecordStatus.PENDING
                                                      ? colors.warning
                                                      : "transparent",
                                                  borderColor:
                                                    offeringForm.status ===
                                                    RecordStatus.PENDING
                                                      ? colors.warning
                                                      : colors.border,
                                                },
                                              ]}
                                              onPress={() =>
                                                setOfferingForm((prev) => ({
                                                  ...prev,
                                                  status: RecordStatus.PENDING,
                                                }))
                                              }
                                            >
                                              <ThemedText
                                                type="caption"
                                                style={{
                                                  color:
                                                    offeringForm.status ===
                                                    RecordStatus.PENDING
                                                      ? "#FFFFFF"
                                                      : colors.text,
                                                }}
                                              >
                                                {t.security?.users?.pending ||
                                                  "Pendiente"}
                                              </ThemedText>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                              style={[
                                                styles.statusOption,
                                                styles.statusOptionWeb,
                                                {
                                                  backgroundColor:
                                                    offeringForm.status ===
                                                    RecordStatus.SUSPENDED
                                                      ? colors.suspended
                                                      : "transparent",
                                                  borderColor:
                                                    offeringForm.status ===
                                                    RecordStatus.SUSPENDED
                                                      ? colors.suspended
                                                      : colors.border,
                                                },
                                              ]}
                                              onPress={() =>
                                                setOfferingForm((prev) => ({
                                                  ...prev,
                                                  status: RecordStatus.SUSPENDED,
                                                }))
                                              }
                                            >
                                              <ThemedText
                                                type="caption"
                                                style={{
                                                  color:
                                                    offeringForm.status ===
                                                    RecordStatus.SUSPENDED
                                                      ? colors.contrastText
                                                      : colors.text,
                                                }}
                                              >
                                                {t.security?.users?.suspended ||
                                                  "Suspendido"}
                                              </ThemedText>
                                            </TouchableOpacity>
                                          </View>
                                          <Tooltip text={(t as any).conditions?.conditionsButton || "Condiciones"} position="left">
                                            <TouchableOpacity
                                              onPress={async () => {
                                                const oid = expandedOfferingId || undefined;
                                                setConditionsOfferingId(oid);
                                                setConditionsScope("specific");
                                                if (oid) {
                                                  try {
                                                    const { apiClient: api } = await import("@/src/infrastructure/api");
                                                    const res = await api.get<any>(`/commercial/offerings/${oid}`);
                                                    const raw = res.data?.conditions || res.data?.data?.conditions || [];
                                                    setConditionsPreloaded(Array.isArray(raw) ? raw.filter((c: any) => c.scope === "specific") : []);
                                                    const o = offerings.find((x) => x.id === oid);
                                                    setConditionsOfferingLabel(o ? `${o.code || ""} — ${o.name}` : "");
                                                  } catch { setConditionsPreloaded([]); setConditionsOfferingLabel(""); }
                                                }
                                                setConditionsModalVisible(true);
                                              }}
                                              style={{ padding: 8 }}
                                            >
                                              <Ionicons name="list-outline" size={22} color={isDark ? colors.primaryDark : colors.primary} />
                                            </TouchableOpacity>
                                          </Tooltip>
                                      </View>
                                    </View>
                                    </>
                                  )}
                                </View>

                                {/* Resto del formulario alineado con la fila de imagen (mismo margen) */}
                                <View
                                  style={[styles.expandableFormRowMargins, isMobile && styles.expandableFormRowMarginsMobile]}
                                >
                                  {/* Fila 2: mantener 50/50 original: (izq) Código 20% + Nombre 80% ; (der) Precio Base */}
                                  <View
                                    style={[
                                      styles.rowContainer,
                                      isMobile && { flexDirection: "column" },
                                    ]}
                                  >
                                    <View
                                      style={[
                                        styles.halfWidth,
                                        isMobile && { width: "100%" },
                                      ]}
                                    >
                                      <SplitInput
                                        label={O?.nameLabel ?? "Nombre *"}
                                        labelStyle={styles.label}
                                        wrapperStyle={{ marginTop: 16 }}
                                        leftPlaceholder="Codigo"
                                        rightPlaceholder={
                                          O?.namePlaceholder ??
                                          "Nombre"
                                        }
                                        leftValue={offeringForm.code}
                                        rightValue={offeringForm.name}
                                        onChangeLeft={(val) =>
                                          setOfferingForm((prev) => ({
                                            ...prev,
                                            code: formatCode(val),
                                          }))
                                        }
                                        onChangeRight={(val) =>
                                          setOfferingForm((prev) => ({
                                            ...prev,
                                            name: val,
                                          }))
                                        }
                                        leftTopCaption="Codigo"
                                        disabled={saving}
                                      />
                                    </View>
                                    <View
                                      style={[
                                        styles.halfWidth,
                                        isMobile && { width: "100%" },
                                      ]}
                                    >
                                      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
                                        <ThemedText
                                          type="body2"
                                          style={[styles.label, { color: colors.text }]}
                                        >
                                          {O?.basePriceLabel ?? "Precio Base *"}
                                        </ThemedText>
                                      </View>
                                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <View style={{ flex: 1 }}>
                                          <CurrencyInput
                                            value={priceForm.basePrice}
                                            onChangeText={(val) =>
                                              setPriceForm((prev) => ({
                                                ...prev,
                                                basePrice: val,
                                              }))
                                            }
                                            currency={
                                              commercialProfile?.currency || "USD"
                                            }
                                            disabled={saving}
                                          />
                                        </View>
                                        <Tooltip text={(t as any).promotions?.promotionsButton || "Promociones"} position="left">
                                          <TouchableOpacity
                                            onPress={async () => {
                                              const oid = expandedOfferingId || undefined;
                                              setPromotionsOfferingId(oid);
                                              setPromotionsScope("specific");
                                              if (oid) {
                                                try {
                                                  const { apiClient: api } = await import("@/src/infrastructure/api");
                                                  const res = await api.get<any>(`/commercial/offerings/${oid}`);
                                                  const raw = res.data?.promotions || res.data?.data?.promotions || [];
                                                  setPromotionsPreloaded(Array.isArray(raw) ? raw.filter((p: any) => p.scope === "specific") : []);
                                                  const o = offerings.find((x) => x.id === oid);
                                                  setPromotionsOfferingLabel(o ? `${o.code || ""} — ${o.name}` : "");
                                                } catch { setPromotionsPreloaded([]); setPromotionsOfferingLabel(""); }
                                              }
                                              setPromotionsModalVisible(true);
                                            }}
                                            style={{ padding: 4 }}
                                          >
                                            <Ionicons name="pricetag-outline" size={22} color={isDark ? colors.primaryDark : colors.primary} />
                                          </TouchableOpacity>
                                        </Tooltip>
                                      </View>
                                    </View>
                                  </View>

                                  {/* Descripción y Atributos 50-50 (columna en móvil) */}
                                  <View style={[styles.rowContainer, isMobile && styles.rowContainerMobile, { marginTop: 16 }]}>
                                    <View style={[styles.halfWidth, isMobile && styles.halfWidthMobile]}>
                                      <ThemedText
                                        type="body2"
                                        style={[
                                          styles.label,
                                          { color: colors.text },
                                        ]}
                                      >
                                        {O?.descriptionOptional ??
                                          "Descripción (opcional)"}
                                      </ThemedText>
                                      <InputWithFocus
                                        containerStyle={[
                                          styles.textAreaContainer,
                                          {
                                            backgroundColor:
                                              colors.filterInputBackground,
                                            borderColor: colors.border,
                                          },
                                        ]}
                                        primaryColor={colors.primary}
                                      >
                                        <TextInput
                                          style={[
                                            styles.textArea,
                                            { color: colors.text },
                                          ]}
                                          placeholder={
                                            O?.descriptionPlaceholder ??
                                            "Describe brevemente la oferta"
                                          }
                                          placeholderTextColor={
                                            colors.textSecondary
                                          }
                                          value={offeringForm.description}
                                          onChangeText={(val) =>
                                            setOfferingForm((prev) => ({
                                              ...prev,
                                              description: val,
                                            }))
                                          }
                                          multiline
                                          numberOfLines={3}
                                        />
                                      </InputWithFocus>
                                    </View>
                                    <View style={[styles.halfWidth, isMobile && styles.halfWidthMobile]}>
                                      <AttributesEditor
                                        key={expandedOfferingId ?? "new"}
                                        value={offeringForm.properties}
                                        onChange={(val) =>
                                          setOfferingForm((prev) => ({
                                            ...prev,
                                            properties: val,
                                          }))
                                        }
                                        label={
                                          O?.propertiesLabel ??
                                          "Atributos"
                                        }
                                        placeholder={
                                          O?.propertiesPlaceholder ??
                                          "Sin atributos"
                                        }
                                        addButtonLabel="Agregar"
                                        suggestions={["Category", "Price", "Unit Price", "Quantity", "Max Quantity", "URL"]}
                                      />
                                    </View>
                                  </View>

                                  {/* Botones del acordeón */}
                                  <View style={styles.formActions}>
                                    <View style={styles.formActionsSpacer} />
                                    <Button
                                      title={O?.cancel ?? "Cancelar"}
                                      onPress={handleCancelEdit}
                                      variant="outlined"
                                      size="md"
                                      disabled={saving}
                                    />
                                    <Button
                                      title={O?.accept ?? "Aceptar"}
                                      onPress={handleAcceptChanges}
                                      variant="primary"
                                      size="md"
                                      disabled={saving}
                                    />
                                  </View>
                                </View>
                              </Card>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Fila: paginación centrada (web) / izquierda (móvil); registros por página a la derecha */}
                  <View style={styles.paginationWrapper}>
                    <View
                      style={[
                        styles.paginationLeftSlot,
                        isMobile && styles.paginationLeftSlotMobile,
                      ]}
                    />
                    {totalPages > 1 ? (
                      <View style={styles.paginationContainer}>
                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            {
                              backgroundColor:
                                currentPage === 1
                                  ? colors.surface
                                  : colors.primary,
                              borderColor:
                                currentPage === 1
                                  ? colors.border
                                  : colors.primary,
                            },
                          ]}
                          onPress={() => {
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                              setExpandedOfferingId(null); // Cerrar acordeón al cambiar de página
                            }
                          }}
                          disabled={currentPage === 1}
                        >
                          <Ionicons
                            name="chevron-back"
                            size={18}
                            color={
                              currentPage === 1
                                ? colors.textSecondary
                                : "#FFFFFF"
                            }
                          />
                        </TouchableOpacity>

                        <View style={styles.paginationNumbers}>
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                          ).map((page) => {
                            // Mostrar solo algunas páginas alrededor de la actual
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1)
                            ) {
                              return (
                                <TouchableOpacity
                                  key={page}
                                  style={[
                                    styles.paginationNumber,
                                    {
                                      backgroundColor:
                                        currentPage === page
                                          ? colors.primary
                                          : "transparent",
                                      borderColor:
                                        currentPage === page
                                          ? colors.primary
                                          : colors.border,
                                    },
                                  ]}
                                  onPress={() => {
                                    setCurrentPage(page);
                                    setExpandedOfferingId(null); // Cerrar acordeón al cambiar de página
                                  }}
                                >
                                  <ThemedText
                                    type="body2"
                                    style={{
                                      color:
                                        currentPage === page
                                          ? colors.contrastText
                                          : colors.text,
                                      fontWeight:
                                        currentPage === page ? "600" : "400",
                                    }}
                                  >
                                    {page}
                                  </ThemedText>
                                </TouchableOpacity>
                              );
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return (
                                <ThemedText
                                  key={page}
                                  type="body2"
                                  style={{
                                    color: colors.textSecondary,
                                    marginHorizontal: 4,
                                  }}
                                >
                                  ...
                                </ThemedText>
                              );
                            }
                            return null;
                          })}
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.paginationButton,
                            {
                              backgroundColor:
                                currentPage === totalPages
                                  ? colors.surface
                                  : colors.primary,
                              borderColor:
                                currentPage === totalPages
                                  ? colors.border
                                  : colors.primary,
                            },
                          ]}
                          onPress={() => {
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                              setExpandedOfferingId(null); // Cerrar acordeón al cambiar de página
                            }
                          }}
                          disabled={currentPage === totalPages}
                        >
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={
                              currentPage === totalPages
                                ? colors.textSecondary
                                : "#FFFFFF"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View />
                    )}
                    <View style={styles.paginationRightSlot}>
                      <View style={styles.itemsPerPageRow}>
                        {!isMobile && (
                          <ThemedText
                            type="body2"
                            style={[
                              styles.itemsPerPageLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {O?.recordsPerPage ?? "Registros por página"}
                          </ThemedText>
                        )}
                        <View style={styles.itemsPerPageSelectWrap}>
                          <Select
                            value={String(itemsPerPage)}
                            options={[
                              { value: "5", label: "5" },
                              { value: "10", label: "10" },
                              { value: "25", label: "25" },
                              { value: "50", label: "50" },
                            ]}
                            onSelect={(val) => {
                              const n = Number(val);
                              if (!Number.isNaN(n) && n > 0) {
                                setItemsPerPage(n);
                                setCurrentPage(1);
                                setExpandedOfferingId(null);
                              }
                            }}
                            placeholder={String(itemsPerPage)}
                            searchable={false}
                            triggerStyle={styles.itemsPerPageTrigger}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              );
            })()}

          {/* Input de archivo oculto (solo web) - siempre presente para acceso directo */}
          {Platform.OS === "web" && (
            <>
              {/* @ts-ignore - input HTML nativo para web, siempre presente pero oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleBulkUpload}
                style={styles.hiddenInput}
              />
            </>
          )}

          {/* Botón Continuar/Guardar (solo se muestra si hay al menos una oferta) */}
          {offerings.length > 0 && (
            <View style={styles.continueButtonContainer}>
              <Button
                title={
                  saving
                    ? (O?.processing ?? "Guardando...")
                    : hasPendingChanges
                      ? `${O?.saveChanges ?? "Guardar Cambios"} (${newOfferings.length + Object.keys(modifiedOfferings).length + deletedOfferings.length})`
                      : (O?.continue ?? "Continuar")
                }
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
                {saving && (
                  <ActivityIndicator
                    size="small"
                    color={colors.contrastText}
                    style={styles.actionButtonLeadingIcon}
                  />
                )}
                <Ionicons
                  name={
                    hasPendingChanges ? "save-outline" : "arrow-forward-outline"
                  }
                  size={20}
                  color={colors.contrastText}
                  style={styles.actionButtonLeadingIcon}
                />
              </Button>
            </View>
          )}

          {/* Botones de acción: Carga individual y masiva */}
          <View
            style={[
              styles.actionButtons,
              isMobile && styles.actionButtonsMobile,
            ]}
          >
            {expandedOfferingId === null && (
              <>
                <Button
                  title={O?.addOffering ?? "Agregar Oferta"}
                  onPress={handleAddNewOffering}
                  variant="outlined"
                  size="md"
                  style={[styles.addButton, isMobile && styles.addButtonMobile]}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={colors.primary}
                    style={styles.actionButtonLeadingIcon}
                  />
                </Button>
                {Platform.OS === "web" ? (
                  <Button
                    title={
                      uploadingBulk
                        ? (O?.processing ?? "Procesando...")
                        : (O?.bulkUpload ?? "Carga Masiva")
                    }
                    onPress={() => {
                      // Abrir directamente el selector de archivos
                      if (fileInputRef.current && !uploadingBulk) {
                        fileInputRef.current.click();
                      }
                    }}
                    variant="outlined"
                    size="md"
                    style={[
                      styles.addButton,
                      isMobile && styles.addButtonMobile,
                    ]}
                    disabled={uploadingBulk}
                  >
                    {uploadingBulk ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={styles.actionButtonLeadingIcon}
                      />
                    ) : (
                      <Ionicons
                        name="cloud-upload-outline"
                        size={20}
                        color={colors.primary}
                        style={styles.actionButtonLeadingIcon}
                      />
                    )}
                  </Button>
                ) : (
                  <Button
                    title={O?.bulkUpload ?? "Carga Masiva"}
                    onPress={() => {
                      alert.showInfo(
                        O?.bulkOnlyWeb ??
                          "La carga masiva está disponible solo en la versión web por ahora.",
                      );
                    }}
                    variant="outlined"
                    size="md"
                    style={[
                      styles.addButton,
                      isMobile && styles.addButtonMobile,
                    ]}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color={colors.primary}
                      style={styles.actionButtonLeadingIcon}
                    />
                  </Button>
                )}
                <Button
                  title={O?.downloadTemplate ?? "Descargar Plantilla"}
                  onPress={handleDownloadTemplate}
                  variant="outlined"
                  size="md"
                  style={[styles.addButton, isMobile && styles.addButtonMobile]}
                >
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={colors.primary}
                    style={styles.actionButtonLeadingIcon}
                  />
                </Button>
              </>
            )}
          </View>
        </Card>

        {/* Sección: Precios */}
        {selectedOffering && (
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="pricetag-outline"
                size={24}
                color={colors.primary}
              />
              <ThemedText type="h4" style={styles.sectionTitle}>
                {O?.pricesFor ?? "Precios de"} {selectedOffering.name}
              </ThemedText>
            </View>
            <ThemedText
              type="body2"
              style={[
                styles.sectionDescription,
                { color: colors.textSecondary },
              ]}
            >
              {O?.definePricesFor ?? "Define los precios para esta oferta"}
            </ThemedText>

            {/* Lista de precios */}
            {prices.length > 0 && (
              <View style={styles.listContainer}>
                {prices.map((price) => (
                  <View
                    key={price.id}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: colors.filterInputBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.listItemContent}>
                      <ThemedText type="body1" style={styles.priceModalTitle}>
                        {commercialProfile?.currency || "USD"}{" "}
                        {price.basePrice.toFixed(2)}
                      </ThemedText>
                      <ThemedText
                        type="body2"
                        style={[styles.priceModalCaption, { color: colors.textSecondary }]}
                      >
                        Impuestos{" "}
                        {price.taxMode === "included"
                          ? (O?.taxesIncluded ?? "Incluidos")
                          : (O?.taxesExcluded ?? "Excluidos")}
                      </ThemedText>
                      <ThemedText
                        type="caption"
                        style={[styles.priceModalCaption, { color: colors.textSecondary }]}
                      >
                        {O?.validFrom?.replace(" *", "") ?? "Válido desde"}:{" "}
                        {new Date(price.validFrom).toLocaleDateString()}
                        {price.validTo &&
                          ` hasta ${new Date(price.validTo).toLocaleDateString()}`}
                      </ThemedText>
                    </View>
                    <StatusBadge
                      status={price.status === "active" ? 1 : 0}
                      statusDescription={
                        price.status === "active"
                          ? (O?.active ?? "Activo")
                          : (O?.inactive ?? "Inactivo")
                      }
                      size="small"
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Formulario de nuevo precio */}
            {showPriceForm ? (
              <Card variant="outlined" style={styles.formCard}>
                <ThemedText
                  type="body2"
                  style={[styles.label, { color: colors.text }]}
                >
                  {O?.basePriceLabel ?? "Precio Base *"}
                </ThemedText>
                <CurrencyInput
                  value={priceForm.basePrice}
                  onChangeText={(val) =>
                    setPriceForm((prev) => ({ ...prev, basePrice: val }))
                  }
                  currency={commercialProfile?.currency || "USD"}
                  disabled={saving}
                />

                <ThemedText
                  type="body2"
                  style={[styles.formLabelWithTopSpacing, { color: colors.text }]}
                >
                  {O?.validFrom ?? "Válido desde *"}
                </ThemedText>
                <DatePicker
                  value={priceForm.validFrom}
                  onChange={(date) =>
                    setPriceForm((prev) => ({ ...prev, validFrom: date || "" }))
                  }
                  placeholder="YYYY-MM-DD"
                  required
                />

                <ThemedText
                  type="body2"
                  style={[styles.formLabelWithTopSpacing, { color: colors.text }]}
                >
                  {O?.validToOptional ?? "Válido hasta (opcional)"}
                </ThemedText>
                <DatePicker
                  value={priceForm.validTo}
                  onChange={(date) =>
                    setPriceForm((prev) => ({ ...prev, validTo: date || "" }))
                  }
                  placeholder="YYYY-MM-DD"
                />

                <View style={styles.formActions}>
                  <Button
                    title={O?.cancel ?? "Cancelar"}
                    onPress={() => {
                      setShowPriceForm(false);
                      // Usar defaultTaxMode del perfil comercial, o 'included' por defecto
                      const defaultTaxMode =
                        commercialProfile?.defaultTaxMode || "included";
                      setPriceForm({
                        basePrice: "",
                        taxMode: defaultTaxMode,
                        validFrom: new Date().toISOString().split("T")[0],
                        validTo: "",
                      });
                    }}
                    variant="outlined"
                    size="md"
                    disabled={saving}
                  />
                  <Button
                    title={
                      saving
                        ? (O?.processing ?? "Guardando...")
                        : (O?.createPrice ?? "Crear Precio")
                    }
                    onPress={handleCreatePrice}
                    variant="primary"
                    size="md"
                    disabled={saving}
                  />
                </View>
              </Card>
            ) : (
              <Button
                title={O?.addPrice ?? "Agregar Precio"}
                onPress={() => setShowPriceForm(true)}
                variant="outlined"
                size="md"
                style={styles.addButton}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={colors.primary}
                  style={styles.actionButtonLeadingIcon}
                />
              </Button>
            )}
          </Card>
        )}

        {!selectedOffering && offerings.length > 0 && (
          <Card variant="outlined" style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
            <ThemedText
              type="body2"
              style={[styles.infoCardText, { color: colors.textSecondary }]}
            >
              {O?.infoPackages ??
                "Si deseas generar Paquetes, promociones o descuentos, puedes realizarlos desde la pantalla de administración de Chat IA"}
            </ThemedText>
          </Card>
        )}

        {offerings.length === 0 && !loading && (
          <Card variant="outlined" style={styles.infoCard}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            <ThemedText
              type="body2"
              style={[styles.infoCardText, { color: colors.textSecondary }]}
            >
              {O?.startWithFirstOffering ??
                "Comienza creando tu primera oferta. Puede ser un producto, servicio o paquete."}
            </ThemedText>
          </Card>
        )}
        {offerings.length > 0 &&
          filteredOfferings.length === 0 &&
          searchFilter.trim() && (
            <Card variant="outlined" style={styles.infoCard}>
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.primary}
              />
              <ThemedText
                type="body2"
                style={[styles.infoCardText, { color: colors.textSecondary }]}
              >
                {O?.noResultsFilter ??
                  "No se encontraron ofertas que coincidan con el filtro"}{" "}
                "{searchFilter}".
              </ThemedText>
            </Card>
          )}

        {/* Modal ver imagen ampliada */}
        <Modal
          visible={!!imageViewerUri}
          transparent
          animationType="fade"
          onRequestClose={() => setImageViewerUri(null)}
        >
          <Pressable
            style={styles.imageViewerOverlay}
            onPress={() => setImageViewerUri(null)}
          >
            <Pressable
              style={styles.imageViewerContent}
              onPress={(e) => e.stopPropagation()}
            >
              {imageViewerUri ? (
                <Image
                  source={{ uri: imageViewerUri }}
                  style={styles.imageViewerImage}
                  resizeMode="contain"
                />
              ) : null}
            </Pressable>
            <TouchableOpacity
              onPress={() => setImageViewerUri(null)}
              style={[
                styles.imageViewerCloseButton,
                { top: Platform.OS === "web" ? 48 : 56 },
              ]}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </Pressable>
        </Modal>
      </View>
    </ScrollView>

    <ConditionsModal
      visible={conditionsModalVisible}
      onClose={() => { setConditionsModalVisible(false); setConditionsOfferingId(undefined); setConditionsPreloaded(undefined); }}
      companyId={company?.id || ""}
      scope={conditionsScope}
      offeringId={conditionsOfferingId}
      offeringLabel={conditionsOfferingLabel}
      preloadedConditions={conditionsPreloaded}
    />
    <PromotionsModal
      visible={promotionsModalVisible}
      onClose={() => { setPromotionsModalVisible(false); setPromotionsOfferingId(undefined); setPromotionsPreloaded(undefined); }}
      companyId={company?.id || ""}
      scope={promotionsScope}
      offeringId={promotionsOfferingId}
      offeringLabel={promotionsOfferingLabel}
      preloadedPromotions={promotionsPreloaded}
    />
    </>
  );
}
