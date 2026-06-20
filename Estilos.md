# Estilos.md — Sistema de Diseño POS

## 1. Paleta de Colores

### Primarios

| Token                   | Hex                        | Observación en imagen                                                                                                              |
| :---------------------- | :------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `--color-accent`        | `#F97316`                  | Naranja principal. Usado en: botones CTA, barra lateral activa, header de sidebar, badges "Paid", gráfica de área, iconos de logo. |
| `--color-accent-dark`   | `#EA6C0A`                  | Estado hover/press del naranja. Botón "Place Order" en versión más densa.                                                          |
| `--color-accent-light`  | `#FFF4ED`                  | Fondo tint naranja. Fondo del badge de estado "Paid" y filas seleccionadas.                                                        |
| `--color-accent-border` | `rgba(249, 115, 22, 0.25)` | Borde sutil naranja para tarjetas seleccionadas o con acento.                                                                      |

### Fondos y Superficies

| Token                  | Hex       | Observación en imagen                                      |
| :--------------------- | :-------- | :--------------------------------------------------------- |
| `--bg-app`             | `#F5F5F5` | Fondo raíz de la aplicación. Gris muy claro neutro.        |
| `--bg-sidebar`         | `#FFFFFF` | Sidebar izquierdo blanco puro con iconos grises.           |
| `--bg-card`            | `#FFFFFF` | Todas las tarjetas/paneles: blanco puro con sombra suave.  |
| `--bg-header-accent`   | `#F97316` | Header/topbar naranja sólido visible en panel "Pointsell". |
| `--bg-input`           | `#F8F8F8` | Fondo de inputs de búsqueda y campos de formulario.        |
| `--bg-table-row-alt`   | `#FAFAFA` | Filas alternadas en tabla de productos.                    |
| `--bg-table-row-hover` | `#FFF8F3` | Fila de tabla en hover con tinte naranja muy sutil.        |

### Texto

| Token                   | Hex       | Observación en imagen                                                        |
| :---------------------- | :-------- | :--------------------------------------------------------------------------- |
| `--text-primary`        | `#1A1A1A` | Títulos principales, nombres de productos, totales.                          |
| `--text-secondary`      | `#4B5563` | Subtítulos, columnas de tabla (Product, Status, Price).                      |
| `--text-muted`          | `#9CA3AF` | Textos de soporte, descripciones de tarjetas de menú, timestamps.            |
| `--text-accent`         | `#F97316` | Precios destacados en naranja, links de edición, labels de categoría activa. |
| `--text-on-accent`      | `#FFFFFF` | Texto sobre fondos naranjas (botones CTA, header naranja).                   |
| `--text-success`        | `#16A34A` | "In Stock", estado "Paid" en verde.                                          |
| `--text-danger`         | `#DC2626` | Botón "Delete", precios en rojo, "Unpaid".                                   |
| `--text-sidebar-icon`   | `#D1D5DB` | Iconos inactivos del sidebar.                                                |
| `--text-sidebar-active` | `#FFFFFF` | Icono activo del sidebar (sobre fondo naranja).                              |

### Semánticos / Estado

| Token                | Hex       | Uso                                            |
| :------------------- | :-------- | :--------------------------------------------- |
| `--color-success`    | `#22C55E` | Badge "Paid", dot indicador verde, "In Stock". |
| `--color-success-bg` | `#F0FDF4` | Fondo del badge "Paid".                        |
| `--color-danger`     | `#EF4444` | Botón Delete, texto "Unpaid".                  |
| `--color-danger-bg`  | `#FEF2F2` | Fondo badge "Unpaid".                          |
| `--color-warning`    | `#F59E0B` | Indicadores de advertencia menores.            |

---

## 2. Tipografía

### Familia

```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

> La imagen usa una sans-serif geométrica moderna, claramente Inter o equivalente. Sin serifa, sin decoración.

### Escala Tipográfica

| Rol           | Tamaño  | Peso | Color              | Uso en imagen                                                |
| :------------ | :------ | :--- | :----------------- | :----------------------------------------------------------- |
| Display / KPI | 28–32px | 700  | `--text-primary`   | "$60,000", "$24,500" en tarjetas métricas.                   |
| Heading card  | 16–18px | 600  | `--text-primary`   | "Best Dishes", "Pointsell", "Pending Order".                 |
| Subheading    | 14px    | 600  | `--text-primary`   | Nombres de producto en tabla y tarjetas.                     |
| Body          | 13–14px | 400  | `--text-secondary` | Contenido general, columnas de tabla.                        |
| Small / Meta  | 12px    | 400  | `--text-muted`     | Descripciones de platillos, timestamps ("30 Minutes Later"). |
| Micro / Label | 11px    | 500  | `--text-muted`     | Etiquetas de eje en gráficas, "Table No.", "Guest".          |
| Price accent  | 14–16px | 700  | `--text-accent`    | Precios en naranja sobre tarjetas de menú.                   |
| Badge text    | 11–12px | 600  | contextual         | "Paid", "Unpaid", "In Stock".                                |

### Letter Spacing

```css
heading: letter-spacing: -0.02em;
body: letter-spacing: 0;
label/badge: letter-spacing: 0.02em;
```

---

### Sidebar

```css
width: 64px;
background: #ffffff;
border-right: 1px solid #f0f0f0;
display: flex;
flex-direction: column;
align-items: center;
padding: 16px 0;
gap: 8px;
```

### Tokens de Espaciado

| Token         | Valor  | Uso                                                             |
| :------------ | :----- | :-------------------------------------------------------------- |
| `--space-xs`  | `4px`  | Gap entre badge e icono, padding interno de chips.              |
| `--space-sm`  | `8px`  | Gap entre icono y label, padding de celdas de tabla.            |
| `--space-md`  | `12px` | Padding interno de tarjetas pequeñas, gap entre items de lista. |
| `--space-lg`  | `16px` | Padding estándar de tarjetas (`padding: 16px`).                 |
| `--space-xl`  | `20px` | Separación entre secciones, padding de headers de panel.        |
| `--space-2xl` | `24px` | Padding de paneles principales.                                 |

### Border Radius

| Token           | Valor    | Uso en imagen                                                       |
| :-------------- | :------- | :------------------------------------------------------------------ |
| `--radius-sm`   | `6px`    | Badges de estado ("Paid", "In Stock"), chips pequeños.              |
| `--radius-md`   | `10px`   | Botones de acción (Add Product, Edit, Delete).                      |
| `--radius-lg`   | `14px`   | Tarjetas de menú con foto, tarjetas de métricas KPI.                |
| `--radius-xl`   | `18px`   | Paneles principales (Pointsell, Pending Order, Order card).         |
| `--radius-full` | `9999px` | Avatares de chat, indicadores de notificación, botón "Place Order". |

---

## 4. Sombras

Observadas en la imagen — sombras suaves, nunca dramáticas:

```css
/* Tarjeta estándar (mayoría de panels) */
--shadow-card: 0 1px 4px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);

/* Panel elevado (modal de orden, panel central) */
--shadow-elevated:
  0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 6px rgba(0, 0, 0, 0.05);

/* Sombra de botón CTA naranja */
--shadow-accent: 0 4px 12px rgba(249, 115, 22, 0.3);

/* Sidebar / nav */
--shadow-sidebar: 2px 0 8px rgba(0, 0, 0, 0.04);
```

---

## 5. Componentes — Especificaciones

### Sidebar Icono

```css
.sidebar-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  transition:
    background 0.15s,
    color 0.15s;
}

.sidebar-icon.active {
  background: #f97316;
  color: #ffffff;
}

.sidebar-icon:hover:not(.active) {
  background: #fff4ed;
  color: #f97316;
}
```

### Tarjeta / Panel

```css
.card {
  background: #ffffff;
  border-radius: 18px;
  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.06),
    0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 20px 24px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
}
```

### Botón CTA Principal (naranja sólido)

```css
.btn-primary {
  background: #f97316;
  color: #ffffff;
  border: none;
  border-radius: 999px; /* pill shape — observado en "Place Order" */
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
}

.btn-primary:hover {
  background: #ea6c0a;
}
.btn-primary:active {
  transform: scale(0.97);
}
```

### Botón "Add Product" (naranja outline/ghost)

```css
.btn-accent-outline {
  background: transparent;
  color: #f97316;
  border: 1.5px solid #f97316;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-accent-outline:hover {
  background: #fff4ed;
}
```

### Botón Acción Tabla — Edit / Delete

```css
/* Edit */
.btn-edit {
  background: transparent;
  color: #22c55e;
  border: none;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  cursor: pointer;
}

/* Delete */
.btn-delete {
  background: transparent;
  color: #ef4444;
  border: none;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  cursor: pointer;
}
```

### Badge de Estado

```css
/* Paid / Success */
.badge-paid {
  background: #f0fdf4;
  color: #16a34a;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

/* Unpaid / Danger */
.badge-unpaid {
  background: #fef2f2;
  color: #dc2626;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

/* In Stock */
.badge-stock {
  background: transparent;
  color: #22c55e;
  font-size: 12px;
  font-weight: 500;
}
```

### Tarjeta de Producto / Menú (con foto)

```css
.product-card {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-card img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 12px 12px 0 0;
}

.product-card-body {
  padding: 10px 12px 12px;
}

.product-card-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.product-card-desc {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 6px;
  line-height: 1.4;
}

.product-card-price {
  font-size: 15px;
  font-weight: 700;
  color: #f97316;
}

/* Estrellas de rating */
.product-card-rating {
  font-size: 11px;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 3px;
}
```

### Tarjeta de Orden (Comanda)

```css
.order-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  padding: 12px 14px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.order-card:hover {
  border-color: rgba(249, 115, 22, 0.3);
}

.order-card-id {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.order-card-meta {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.order-card-total {
  font-size: 14px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: right;
}
```

### Input / Campo de Búsqueda

```css
.search-input {
  background: #f8f8f8;
  border: 1px solid #ebebeb;
  border-radius: 10px;
  padding: 10px 14px 10px 38px; /* espacio para icono lupa */
  font-size: 13px;
  color: #1a1a1a;
  width: 100%;
  outline: none;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.search-input::placeholder {
  color: #9ca3af;
}

.search-input:focus {
  border-color: #f97316;
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
  background: #ffffff;
}
```

### Tabla de Productos

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
  letter-spacing: 0.02em;
}

.data-table td {
  padding: 12px 12px;
  color: #1a1a1a;
  border-bottom: 1px solid #f8f8f8;
  vertical-align: middle;
}

.data-table tr:hover td {
  background: #fff8f3;
}

/* Thumbnail de producto en tabla */
.table-product-thumb {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

/* ID de producto */
.table-product-id {
  font-size: 12px;
  color: #9ca3af;
}
```

### Avatar de Chat / Iniciales

```css
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  flex-shrink: 0;
}

/* Colores por usuario — observados en panel Messages */
.avatar-a {
  background: #f97316;
} /* Anne */
.avatar-h {
  background: #8b5cf6;
} /* Hope */
.avatar-s {
  background: #ec4899;
} /* Sarah */
.avatar-l {
  background: #14b8a6;
} /* Lynne */
```

### Gráfica de Área (Daily Selling)

```css
/* Configuración visual de la gráfica observada */
--chart-line-color: #f97316;
--chart-fill-start: rgba(249, 115, 22, 0.2);
--chart-fill-end: rgba(249, 115, 22, 0);
--chart-axis-color: #e5e7eb;
--chart-label-color: #9ca3af;
--chart-dot-color: #f97316;
--chart-dot-size: 5px;
```

> Tipo: área suavizada (smooth curve). Sin bordes de punto. Relleno degradado vertical de naranja a transparente. Ejes horizontales como líneas punteadas grises.

### Donut Chart (Income)

```css
--donut-primary: #1a1a1a; /* arco principal (mayoría) */
--donut-accent: #f97316; /* arco naranja (segmento Foodies) */
--donut-muted: #e5e7eb; /* arco Others */
--donut-center-value: 28px font-weight 700 color #1a1a1a;
--donut-stroke-width: 14px;
--donut-size: 90px;
```

### Header Naranja de Panel

```css
.panel-header-accent {
  background: #f97316;
  border-radius: 18px 18px 0 0;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-header-accent .logo-icon {
  width: 28px;
  height: 28px;
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f97316;
}

.panel-header-accent .title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}
```

---

## 6. Iconografía

- **Estilo:** Outline de trazo fino (1.5–2px). Sin relleno sólido.
- **Tamaño en sidebar:** 20px
- **Tamaño en tarjetas / acciones:** 16px
- **Color inactivo:** `#D1D5DB`
- **Color activo/hover:** `#F97316`
- **Color sobre fondo naranja:** `#FFFFFF`
- **Librería recomendada:** Lucide Icons o Heroicons Outline — ambas coinciden con el estilo observado.

### Iconos observados en sidebar (de arriba a abajo):

1. Home / Dashboard
2. Grid / Módulos
3. Clipboard / Órdenes
4. User / Clientes
5. Bell / Notificaciones
6. Settings / Configuración

---

## 7. Animaciones y Transiciones

```css
/* Transición estándar para todos los elementos interactivos */
--transition-fast: 0.12s ease;
--transition-base: 0.18s ease;
--transition-slow: 0.28s ease;

/* Aplicación */
button,
.card,
.order-card,
.sidebar-icon,
input {
  transition: all var(--transition-base);
}

/* Escala en press */
.btn-primary:active,
.product-card:active {
  transform: scale(0.97);
}

/* Fade-in de cards al cargar */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeUp 0.25s ease forwards;
}
```

---

## 8. Variables CSS — Sistema Completo

```css
:root {
  /* === COLORES DE ACENTO === */
  --color-accent: #f97316;
  --color-accent-dark: #ea6c0a;
  --color-accent-light: #fff4ed;
  --color-accent-subtle: #ffe4cc;
  --color-accent-border: rgba(249, 115, 22, 0.25);

  /* === SUPERFICIES === */
  --bg-app: #f5f5f5;
  --bg-sidebar: #ffffff;
  --bg-card: #ffffff;
  --bg-input: #f8f8f8;
  --bg-table-row-alt: #fafafa;
  --bg-table-row-hover: #fff8f3;

  /* === TEXTO === */
  --text-primary: #1a1a1a;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;
  --text-accent: #f97316;
  --text-on-accent: #ffffff;
  --text-success: #16a34a;
  --text-danger: #dc2626;
  --text-disabled: #d1d5db;

  /* === BORDES === */
  --border-light: #f0f0f0;
  --border-default: #ebebeb;
  --border-medium: #e5e7eb;
  --border-focus: rgba(249, 115, 22, 0.5);

  /* === ESTADOS SEMÁNTICOS === */
  --color-success: #22c55e;
  --color-success-bg: #f0fdf4;
  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;

  /* === SOMBRAS === */
  --shadow-card: 0 1px 4px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
  --shadow-elevated:
    0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 6px rgba(0, 0, 0, 0.05);
  --shadow-accent: 0 4px 12px rgba(249, 115, 22, 0.3);
  --shadow-sidebar: 2px 0 8px rgba(0, 0, 0, 0.04);

  /* === RADIO === */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --radius-full: 9999px;

  /* === ESPACIADO === */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;

  /* === TIPOGRAFÍA === */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 13px;
  --font-size-md: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-display: 28px;

  /* === TRANSICIONES === */
  --transition-fast: 0.12s ease;
  --transition-base: 0.18s ease;
  --transition-slow: 0.28s ease;

  /* === LAYOUT === */
  --sidebar-width: 64px;
  --panel-right-width: 320px;
}
```

---
