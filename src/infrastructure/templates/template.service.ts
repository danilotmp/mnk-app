/**
 * Servicio centralizado para gestión de plantillas de carga masiva
 * Todas las plantillas de Excel/CSV se gestionan desde aquí
 */

import * as XLSX from 'xlsx-js-style';

export type TemplateType = 'offerings' | 'products' | 'services' | 'packages' | 'customers' | 'inventory';

export interface TemplateInfo {
  type: TemplateType;
  name: string;
  description: string;
  fileName: string;
  columns: TemplateColumn[];
}

export interface TemplateColumn {
  name: string;
  label: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[];
  description?: string;
}

/**
 * Servicio para gestionar plantillas de carga masiva
 */
export class TemplateService {
  /**
   * Obtiene la información de una plantilla
   */
  static getTemplateInfo(type: TemplateType): TemplateInfo {
    switch (type) {
      case 'offerings':
        return {
          type: 'offerings',
          name: 'Plantilla de Ofertas',
          description: 'Plantilla para cargar productos, servicios y paquetes de forma masiva',
          fileName: 'plantilla-ofertas.xlsx',
          columns: [
            {
              name: 'tipo',
              label: 'Tipo',
              required: true,
              type: 'select',
              options: ['producto', 'servicio'], // Solo producto y servicio para el wizard
              description: 'Tipo de oferta: producto o servicio',
            },
            {
              name: 'nombre',
              label: 'Nombre',
              required: true,
              type: 'text',
              description: 'Nombre de la oferta (ej: Habitación estándar, Consulta médica)',
            },
            {
              name: 'descripcion',
              label: 'Descripción (opcional)',
              required: false,
              type: 'text',
              description: 'Descripción detallada de la oferta (opcional, puede afinarse después)',
            },
            {
              name: 'precio_base',
              label: 'Precio Base',
              required: true,
              type: 'number',
              description: 'Precio base de la oferta (requerido)',
            },
            {
              name: 'modo_impuestos',
              label: 'Modo de Impuestos',
              required: true,
              type: 'select',
              options: ['included', 'excluded'],
              description: 'included = impuestos incluidos, excluded = impuestos excluidos (requerido)',
            },
          ],
        };
      default:
        throw new Error(`Tipo de plantilla no soportado: ${type}`);
    }
  }

  /**
   * Genera un archivo Excel con formato basado en la plantilla
   * Usa xlsx-js-style para aplicar estilos (colores, fuentes, etc.)
   */
  static async generateExcelTemplate(type: TemplateType): Promise<XLSX.WorkBook> {
    const template = this.getTemplateInfo(type);
    const workbook = XLSX.utils.book_new();

    // Preparar datos para la hoja
    const data: any[][] = [];

    // Título principal (fila 1)
    const titleRow: any[] = ['Carga masiva de ofertas'];
    // Rellenar el resto de columnas para el merge visual
    for (let i = 1; i < template.columns.length; i++) {
      titleRow.push('');
    }
    data.push(titleRow);

    // Encabezados de columnas (fila 2)
    data.push(template.columns.map(col => col.label));

    // Fila de ejemplo (fila 3)
    const exampleRow = template.columns.map(col => {
      switch (col.name) {
        case 'tipo':
          return 'producto';
        case 'nombre':
          return 'Ejemplo de Producto';
        case 'descripcion':
          return 'Descripción del producto';
        case 'precio_base':
          return 100;
        default:
          return '';
      }
    });
    data.push(exampleRow);

    // Texto instructivo (fila 4)
    const instructionRow: any[] = ['Agrega aquí las ofertas (productos o servicios) que desees incluir en las respuestas de la IA. Los campos marcados con * son obligatorios.'];
    // Rellenar el resto de columnas
    for (let i = 1; i < template.columns.length; i++) {
      instructionRow.push('');
    }
    data.push(instructionRow);

    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Definir estilos
    const headerFill = {
      fgColor: { rgb: '1E3A5F' }, // Azul oscuro
    };

    const headerFont = {
      name: 'Arial',
      sz: 11,
      bold: true,
      color: { rgb: 'FFFFFFFF' }, // Blanco
    };

    const headerAlignment = {
      vertical: 'center',
      horizontal: 'center',
      wrapText: true,
    };

    const titleFont = {
      name: 'Arial',
      sz: 14,
      bold: true,
      color: { rgb: 'FFFFFFFF' }, // Blanco
    };

    const instructionFont = {
      name: 'Arial',
      sz: 10,
      italic: true,
      color: { rgb: '666666' }, // Gris
    };

    const borderThin = {
      style: 'thin',
      color: { rgb: '000000' },
    };

    const borderThinGray = {
      style: 'thin',
      color: { rgb: 'CCCCCC' },
    };

    // Aplicar estilos al título (fila 1)
    const titleCellRef = XLSX.utils.encode_cell({ c: 0, r: 0 });
    if (worksheet[titleCellRef]) {
      worksheet[titleCellRef].s = {
        font: titleFont,
        fill: headerFill,
        alignment: { vertical: 'middle', horizontal: 'center' },
      };
    }
    // Fusionar celdas del título
    worksheet['!merges'] = worksheet['!merges'] || [];
    worksheet['!merges'].push({
      s: { c: 0, r: 0 },
      e: { c: template.columns.length - 1, r: 0 },
    });

    // Aplicar estilos a los encabezados (fila 2)
    template.columns.forEach((col, index) => {
      const cellRef = XLSX.utils.encode_cell({ c: index, r: 1 });
      if (!worksheet[cellRef]) worksheet[cellRef] = { v: col.label, t: 's' };
      worksheet[cellRef].s = {
        font: headerFont,
        fill: headerFill,
        alignment: headerAlignment,
        border: {
          top: borderThin,
          bottom: borderThin,
          left: borderThin,
          right: borderThin,
        },
      };
    });

    // Aplicar estilos a la fila de ejemplo (fila 3)
    exampleRow.forEach((value, index) => {
      const cellRef = XLSX.utils.encode_cell({ c: index, r: 2 });
      const col = template.columns[index];
      
      // Preparar el valor de la celda
      const cellValue: any = value;
      const cellType: 's' | 'n' | 'd' = (col.type === 'date' || col.type === 'number') && typeof value === 'number' ? 'n' : 's';
      
      // Asegurar que la celda existe y tiene el valor correcto
      if (worksheet[cellRef]) {
        worksheet[cellRef].v = cellValue;
        worksheet[cellRef].t = cellType;
      } else {
        worksheet[cellRef] = { v: cellValue, t: cellType };
      }
      
      const cellStyle: any = {
        border: {
          top: borderThinGray,
          bottom: borderThinGray,
          left: borderThinGray,
          right: borderThinGray,
        },
        alignment: { vertical: 'middle', horizontal: 'left', wrapText: true },
      };

      // Formato especial para fechas y números
      if (col.type === 'date' && typeof cellValue === 'number') {
        cellStyle.numFmt = 'dd/mm/yyyy';
      } else if (col.type === 'number' && typeof cellValue === 'number') {
        cellStyle.numFmt = '#,##0.00';
      }

      worksheet[cellRef].s = cellStyle;
    });

    // Aplicar estilos al texto instructivo (fila 4)
    const instructionCellRef = XLSX.utils.encode_cell({ c: 0, r: 3 });
    if (worksheet[instructionCellRef]) {
      worksheet[instructionCellRef].s = {
        font: instructionFont,
        alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
      };
      // Fusionar celdas del texto instructivo
      worksheet['!merges'].push({
        s: { c: 0, r: 3 },
        e: { c: template.columns.length - 1, r: 3 },
      });
    }

    // Ajustar ancho de columnas
    const colWidths = template.columns.map(col => ({
      wch: col.label.length > 15 ? col.label.length + 2 : 15,
    }));
    worksheet['!cols'] = colWidths;

    // Ajustar altura de filas
    worksheet['!rows'] = [
      { hpt: 30 }, // Título
      { hpt: 25 }, // Encabezados
      { hpt: 20 }, // Ejemplo
      { hpt: 20 }, // Instrucciones
    ];

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ofertas');

    return workbook;
  }

  /**
   * Descarga la plantilla como archivo Excel
   */
  static async downloadTemplate(type: TemplateType): Promise<void> {
    if (typeof globalThis.window === 'undefined' || !document) {
      throw new Error('La descarga de plantillas solo está disponible en el navegador');
    }

    const template = this.getTemplateInfo(type);
    const workbook = await this.generateExcelTemplate(type);

    // Generar buffer del archivo Excel usando xlsx-js-style
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    // Crear blob y descargar
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', template.fileName);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  /**
   * Parsea un archivo CSV/Excel y retorna los datos
   */
  static async parseFile(file: File): Promise<any[]> {
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (isExcel) {
      return this.parseExcelFile(file);
    } else {
      return this.parseCSVFile(file);
    }
  }

  /**
   * Parsea un archivo Excel usando xlsx
   */
  private static async parseExcelFile(file: File): Promise<any[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Convertir la hoja a JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '',
      raw: false, // Convertir fechas y números a strings
    }) as any[][];

    if (jsonData.length === 0) {
      throw new Error('El archivo Excel está vacío');
    }

    // Buscar la fila de encabezados (buscar "Tipo" o "Nombre" como indicador)
    // Puede estar en la fila 1 (índice 0) o en la fila 2 (índice 1) después del título
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
      const row = jsonData[i] || [];
      const firstCell = (row[0]?.toString() || '').toLowerCase().trim();
      // Buscar "Tipo" o "Nombre" como indicador de encabezados
      if (firstCell === 'tipo' || firstCell === 'nombre') {
        headerRowIndex = i;
        break;
      }
      // También buscar en otras columnas por si el título está en la primera columna
      const secondCell = (row[1]?.toString() || '').toLowerCase().trim();
      if (secondCell === 'tipo' || secondCell === 'nombre') {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('No se encontró la fila de encabezados en el archivo Excel. Asegúrate de que la plantilla tenga los encabezados correctos.');
    }

    // Leer encabezados
    const headerRow = jsonData[headerRowIndex] || [];
    const headers: string[] = headerRow
      .map((h: any) => h?.toString()?.trim() || '')
      .filter((h: string) => h.length > 0);

    if (headers.length === 0) {
      throw new Error('No se encontraron encabezados válidos en el archivo');
    }

    // Leer datos (empezar desde la siguiente fila después de los encabezados)
    const data: any[] = [];
    for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
      const row = jsonData[i] || [];
      const rowData: any = {};
      let hasData = false;

      headers.forEach((header, index) => {
        let value: any = row[index];
        
        // Convertir valores
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'number') {
          // Si es un número, verificar si es una fecha de Excel
          // Las fechas en Excel son números de días desde 1900-01-01
          if (value > 0 && value < 100000) {
            // Podría ser una fecha, intentar convertir usando la utilidad de xlsx
            try {
              // xlsx tiene utilidades para convertir fechas de Excel
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
              if (!isNaN(date.getTime())) {
                value = date.toISOString().split('T')[0]; // YYYY-MM-DD
              } else {
                value = value.toString();
              }
            } catch {
              value = value.toString();
            }
          } else {
            value = value.toString();
          }
        } else {
          value = value.toString().trim();
        }

        rowData[header] = value;
        if (value && value.toString().trim()) {
          hasData = true;
        }
      });

      // Solo agregar filas que tengan al menos un dato
      if (hasData) {
        data.push(rowData);
      }
    }

    return data;
  }

  /**
   * Parsea un archivo CSV
   */
  private static async parseCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());

          if (lines.length < 2) {
            reject(new Error('El archivo debe tener al menos una fila de encabezados y una fila de datos'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim());
          const data: any[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: any = {};

            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            // Solo agregar filas que tengan al menos un dato
            if (Object.values(row).some(v => v)) {
              data.push(row);
            }
          }

          resolve(data);
        } catch (error) {
          reject(new Error(`Error al parsear el archivo: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };

      reader.readAsText(file);
    });
  }
}
