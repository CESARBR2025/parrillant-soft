# Estilos.md — Sistema de Diseño POS (v2)

Basado en la implementación real de `NewOrderView.tsx` y componentes asociados.

---

## 1. Paleta de Colores

### Tokens del Sistema (Tailwind)

| Token CSS              | Hex / Valor         | Uso en la vista                                                |
| :--------------------- | :------------------ | :------------------------------------------------------------- |
| `bg-app`               | `#F5F5F5`           | Fondo raíz de la aplicación                                    |
| `bg-bg-base`           | `#F8F8F8`           | Fondo de inputs, fondos de filas alternas, áreas secundarias   |
| `bg-card`              | `#FFFFFF`           | Fondo de cards, sidebar, modales, paneles                      |
| `text-text-primary`    | `#1A1A1A`           | Títulos, nombres de producto, totales                          |
| `text-body`            | `#333333`           | Texto de párrafos y labels                                     |
| `text-muted`           | `#9CA3AF`           | Textos de soporte, descripciones, timestamps                   |
| `text-accent`          | `#F97316`           | Precios destacados, estados activos                            |
| `border-border/60`     | `rgba(0,0,0,0.10)`  | Borde de cards y paneles (60% de `--color-border`)             |
| `border-border/40`     | `rgba(0,0,0,0.06)`  | Divisores internos (bordes direccionales)                      |

### Colores Funcionales con Opacidad

| Uso                            | Clase                          | Se ve como             |
| :----------------------------- | :----------------------------- | :--------------------- |
| Botón + cantidad               | `bg-accent`                    | `#F97316` sólido       |
| Hover botón +                  | `hover:bg-accent-dark`         | `#EA6C0A`              |
| Gradiente header del modal     | `from-accent/10 to-amber-400/10` | Tinte naranja-ámbar |
| Fondo icono en modal           | `bg-accent/15`                 | Naranja 15%            |
| Precio total gradiente         | `from-accent to-amber-400`     | Gradiente texto        |
| Input de notas con nota        | `border-yellow-500/30 bg-yellow-500/5` | Borde amarillo 30%, fondo 5% |
| Botón "+ Agregar nota"         | `bg-yellow-500/10 text-yellow-600 border-yellow-500/20` | Amarillo translúcido |
| Overlay modal/móvil            | `bg-black/60`, `bg-black/70 backdrop-blur-sm` | Negro con opacidad + blur |

---

## 2. Tipografía

### Familia

```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Escala (en la vista de captura)

| Elemento                     | Clase                        | Tamaño  | Peso    | Color              |
| :--------------------------- | :--------------------------- | :------ | :------ | :----------------- |
| Título "Mesa {n}"            | `text-lg md:text-xl font-bold` | 18–20px | 700     | `text-text-primary` |
| Nombre de producto en card   | `text-sm md:text-base font-bold` | 14–16px | 700     | `text-text-primary` |
| Descripción del producto     | `text-xs md:text-sm font-semibold` | 12–14px | 600     | `#A0A0A0` (custom) |
| Precio del producto          | `text-xs md:text-sm font-bold` | 12–14px | 700     | `text-accent`      |
| Categoría tab                | `text-sm font-medium`        | 14px    | 500     | `text-muted` o `text-white` |
| Enlace "Mapa de Mesas"       | `text-xs md:text-sm`         | 12–14px | 400     | `text-muted`       |
| Item del carrito             | `text-sm font-medium`        | 14px    | 500     | `text-text-primary` |
| Nota del item                | `text-xs`                    | 12px    | 400     | `text-body`        |
| Total estimado               | `text-base font-bold`        | 16px    | 700     | `text-text-primary` |
| Total gradiente (modal)      | `text-xl font-bold`          | 20px    | 700     | gradient           |
| Badge de ítems               | `text-xs font-medium`        | 12px    | 500     | contextual         |
| Step indicator               | `text-xs`                    | 12px    | 400     | `text-muted` o `text-accent` |
| Empty state                  | `text-sm`                    | 14px    | 400     | `text-muted`       |

---

## 3. Layout y Espaciado

### Estructura Principal

| Elemento              | Clase / Detalle                                                    |
| :-------------------- | :----------------------------------------------------------------- |
| Contenedor raíz       | `flex flex-col md:flex-row gap-6 h-full`                           |
| Área de contenido     | `flex-1 min-w-0 space-y-4`                                         |
| Grid de productos     | `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[14px]`        |
| Sidebar orden (md+)   | `hidden md:block md:w-72 lg:w-80 shrink-0` , sticky               |
| Cart sheet (móvil)    | `fixed inset-0 z-50 md:hidden`                                     |
| Confirm modal         | `fixed inset-0 z-50 flex items-center justify-center p-4`          |

### Tokens de Espaciado Usados

| Clase          | Valor            | Uso en la vista                                                |
| :------------- | :--------------- | :------------------------------------------------------------- |
| `p-2.5`        | `10px`           | Padding interno de la card de producto                         |
| `pt-2.5`       | `10px`           | Separación entre imagen y contenido en card                    |
| `px-5`         | `20px`           | Padding horizontal del sidebar/cart sheet header/footer        |
| `py-4`         | `16px`           | Padding vertical del sidebar/cart sheet header/footer          |
| `px-4`         | `16px`           | Padding en tabs de categoría, padding en confirm modal         |
| `py-3`         | `12px`           | Padding vertical de items en listas                            |
| `gap-[14px]`   | `14px`           | Gap entre cards en el grid                                     |
| `gap-3`        | `12px`           | Gap entre items del carrito, gap entre botones en modal        |
| `gap-1.5`      | `6px`            | Gap interno en card (entre nombre, descripción, precio)        |
| `gap-2`        | `8px`            | Gap entre tabs, gap en step indicator, gap en CartItemRow      |
| `gap-4`        | `16px`           | Gap en header (título + botón carrito móvil)                   |
| `gap-6`        | `24px`           | Gap entre contenido principal y sidebar                        |
| `mb-1`         | `4px`            | Margen inferior del enlace "Mapa de Mesas"                     |
| `space-y-3`    | `12px`           | Espaciado vertical entre items del carrito y secciones         |
| `space-y-4`    | `16px`           | Espaciado vertical entre secciones del contenido               |

---

## 4. Border Radius

| Clase          | Valor    | Uso en la vista                          |
| :------------- | :------- | :--------------------------------------- |
| `rounded-lg`   | `8px`    | Imágenes, badges, botones de cantidad    |
| `rounded-xl`   | `12px`   | Inputs, tabs de categoría, iconos        |
| `rounded-2xl`  | `16px`   | Cards de producto, sidebar, cart sheet   |
| `rounded-3xl`  | `24px`   | Modal de confirmación                    |

---

## 5. Bordes

### Sistema de Bordes (Tailwind)

| Clase                     | Grosor | Opacidad | Uso                                              |
| :------------------------ | :----- | :------- | :----------------------------------------------- |
| `border-2 border-border/60` | 2px  | 60%      | Cards de producto, sidebar, cart sheet, modal    |
| `border border-border/60`   | 1px  | 60%      | Inputs, tabs inactivos, dropdown de búsqueda     |
| `border-b border-border/40` | 1px  | 40%      | Divisores de header/footer en sidebar            |
| `border-t border-border/40` | 1px  | 40%      | Divisor de total en sidebar                      |
| `border border-yellow-500/30` | 1px | 30%   | Input de notas con contenido                     |
| `border border-yellow-500/20` | 1px | 20%   | Botón "+ Agregar nota"                          |

### Regla General
- **Cards y paneles principales**: `border-2 border-border/60` (2px)
- **Inputs y elementos de formulario**: `border border-border/60` (1px)
- **Divisores internos**: `border-b/t border-border/40` (1px, 40%)
- **Notas**: borde amarillo con 20–30% de opacidad

---

## 6. Componentes Específicos

### Card de Producto

```tsx
<div className="bg-card rounded-2xl border-2 border-border/60 flex flex-col p-2.5">
  <div className="relative aspect-[16/9] bg-bg-base rounded-lg overflow-hidden">
    <Image fill className="object-cover" />
  </div>
  <div className="px-1.5 pb-1.5 pt-2.5 flex flex-col gap-1.5 flex-1">
    <h3 className="text-sm md:text-base font-bold text-text-primary line-clamp-2">
      {nombre}
    </h3>
    {descripcion && (
      <p className="text-xs md:text-sm font-semibold line-clamp-2" style={{ color: '#A0A0A0' }}>
        {descripcion}
      </p>
    )}
    <div className="flex items-center justify-between mt-auto pt-1.5">
      <span className="text-xs md:text-sm font-bold text-accent">${precio}</span>
      <button className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-dark">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</div>
```

### CartItemRow (Item del Carrito)

```tsx
<div className="flex gap-2">
  {/* Columna izquierda: imagen + aumentador */}
  <div className="flex flex-col items-center gap-1.5">
    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
      <Image fill className="object-cover" />
    </div>
    <div className="flex items-center gap-1">
      <button className="w-6 h-6 rounded-lg bg-bg-base text-muted"><Minus className="w-3 h-3" /></button>
      <span className="w-5 text-center text-xs font-medium text-text-primary">{qty}</span>
      <button className="w-6 h-6 rounded-lg bg-accent text-white"><Plus className="w-3 h-3" /></button>
    </div>
  </div>
  {/* Columna derecha: nombre + notas */}
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-text-primary truncate mb-1.5">{nombre}</p>
    {/* Input de notas (visible si tiene nota o está en edición) */}
    <input
      className="w-full rounded-lg border px-3 py-1.5 text-xs text-body
                 border-yellow-500/30 bg-yellow-500/5
                 focus:bg-card focus:border-border/60"
    />
    {/* Botón "+ Agregar nota" (visible si no tiene nota) */}
    <button className="w-full text-xs py-1 px-2 rounded-lg border
                       bg-yellow-500/10 text-yellow-600 border-yellow-500/20
                       hover:bg-yellow-500/20">
      + Agregar nota
    </button>
  </div>
</div>
```

### Sidebar / Cart Panel (Desktop)

```tsx
<div className="sticky top-6 bg-card rounded-2xl border-2 border-border/60
                flex flex-col max-h-[calc(100vh-10rem)] md:w-72 lg:w-80">

  {/* Header con título + badge */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
    <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
      <ShoppingCart className="w-4 h-4" />
      Pedido
    </h2>
    <Badge>{totalItems} ítems</Badge>
  </div>

  {/* Lista de items */}
  <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
    {items.map(item => <CartItemRow ... />)}
  </div>

  {/* Footer con total + botón */}
  <div className="px-5 py-4 border-t border-border/40 space-y-3">
    <div className="flex justify-between text-sm">
      <span className="text-text-primary font-bold">Total estimado</span>
      <span className="text-text-primary font-bold">${total}</span>
    </div>
    <Button className="w-full" size="lg">Enviar a Cocina/Barra</Button>
  </div>
</div>
```

### Cart Sheet (Móvil)

```tsx
<div className="fixed inset-0 z-50 md:hidden">
  <div className="absolute inset-0 bg-black/60" onClick={close} />
  <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl
                  border-2 border-border/60 max-h-[80vh] flex flex-col
                  animate-in slide-in-from-bottom">
    {/* Misma estructura que sidebar: header, lista, footer */}
  </div>
</div>
```

### Modal de Confirmación

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
  <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-lg shadow-2xl
                  animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col overflow-hidden">

    {/* Header gradiente */}
    <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
      {/* icono + título + botón cerrar */}
    </div>

    {/* Lista de items */}
    <div className="p-6 overflow-y-auto space-y-4">
      <div className="bg-bg-base rounded-2xl divide-y divide-border/40">
        {items.map(item => (
          <div className="flex items-center gap-3 px-4 py-3">
            <Image className="w-10 h-10 rounded-lg" />
            <p className="text-sm font-semibold">{cantidad}x {nombre}</p>
            <span className="text-sm font-bold">${subtotal}</span>
          </div>
        ))}
      </div>

      {/* Total con gradiente */}
      <div className="flex justify-between py-3 px-1">
        <span className="text-base font-bold">Total estimado</span>
        <span className="text-xl font-bold bg-gradient-to-r from-accent to-amber-400 bg-clip-text text-transparent">
          ${total}
        </span>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1">Cancelar</Button>
        <Button className="flex-1">Confirmar y Enviar</Button>
      </div>
    </div>
  </div>
</div>
```

### Category Tabs

```tsx
<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
  {categorias.map(cat => (
    <button
      className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors
                  ${selected
                    ? 'bg-accent text-white'
                    : 'bg-card text-muted hover:text-body border border-border/60'
                  }`}
    >
      {cat.nombre}
    </button>
  ))}
</div>
```

### Input de Búsqueda (en Header Global)

```tsx
<input
  className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-4 py-2
             text-sm text-body placeholder:text-muted
             focus:outline-none focus:ring-1 focus:ring-accent/50"
  placeholder="Buscar producto..."
/>
```

---

## 7. Iconografía

- **Librería:** Lucide Icons
- **Tamaños usados:**
  | Contexto          | Tamaño |
  | :---------------- | :----- |
  | Icono en card     | `w-3.5 h-3.5` (Plus/Minus en cards) |
  | Icono en carrito  | `w-3 h-3` (Plus/Minus en CartItemRow) |
  | Icono ShoppingCart | `w-4 h-4` (sidebar header), `w-5 h-5` (botón móvil, modal) |
  | Icono Search      | `w-4 h-4` |
  | Icono ChevronRight | `w-3 h-3` |
  | Icono X (cerrar)  | `w-5 h-5` |
  | Icono UtensilsCrossed | `w-10 h-10` (empty state) |

---

## 8. Animaciones y Transiciones

```css
/* Transiciones estándar */
transition-colors   /* enlaces, botones de texto, hover de items */

/* Animaciones del modal */
animate-in fade-in zoom-in-95    /* modal de confirmación */

/* Animación del cart sheet móvil */
animate-in slide-in-from-bottom   /* sheet inferior */

/* Hover de botones */
hover:bg-accent-dark              /* botón + */
hover:bg-yellow-500/20            /* botón "Agregar nota" */
hover:bg-bg-base                  /* hover de items en dropdown */
hover:text-body                    /* hover de enlaces y texto */
```

---

## 9. Variantes Responsive

| Breakpoint | Clase              | Comportamiento                                     |
| :--------- | :----------------- | :------------------------------------------------- |
| Default    | `grid-cols-2`      | 2 columnas de productos                            |
| `md:`      | `md:grid-cols-3`   | 3 columnas de productos                            |
| `md:`      | `md:flex-row`      | Layout horizontal (sidebar al lado)                |
| `md:`      | `md:w-72`          | Sidebar de 288px                                   |
| `md:`      | `md:hidden`        | Ocultar cart sheet móvil                           |
| `md:`      | `hidden md:block`  | Mostrar sidebar desktop                            |
| `md:`      | `md:pb-0`          | Quitar padding bottom en desktop (evitar overlap con BottomNav) |
| `md:`      | `md:text-base`     | Texto base en desktop                              |
| `md:`      | `md:text-sm`       | Texto pequeño en desktop                           |
| `lg:`      | `lg:grid-cols-4`   | 4 columnas de productos                            |
| `lg:`      | `lg:w-80`          | Sidebar de 320px                                   |

---

## 10. Patrón de Notas (Amarillo)

| Estado               | Clase                                              |
| :------------------- | :------------------------------------------------- |
| Sin nota, mostrando  | `bg-yellow-500/10 text-yellow-600 border-yellow-500/20` (botón) |
| Sin nota, editando   | `border-yellow-500/30 bg-yellow-500/5` (input)     |
| Con nota guardada    | `border-yellow-500/30 bg-yellow-500/5` (input, persistente) |
| Con nota, al escribir| `focus:bg-card focus:border-border/60` (input en focus blanco) |

---

## 11. Variables CSS — Sistema Completo

```css
:root {
  /* === COLORES DE ACENTO === */
  --color-accent: #F97316;
  --color-accent-dark: #EA6C0A;

  /* === SUPERFICIES === */
  --bg-app: #F5F5F5;
  --bg-bg-base: #F8F8F8;
  --bg-card: #FFFFFF;

  /* === TEXTO === */
  --text-text-primary: #1A1A1A;
  --text-body: #333333;
  --text-muted: #9CA3AF;
  --text-accent: #F97316;

  /* === BORDES (vía opacidad Tailwind) === */
  /* border-border/60 → rgba(0,0,0,0.10) */
  /* border-border/40 → rgba(0,0,0,0.06) */

  /* === RADIO === */
  --radius-lg: 8px;    /* rounded-lg */
  --radius-xl: 12px;   /* rounded-xl */
  --radius-2xl: 16px;  /* rounded-2xl */
  --radius-3xl: 24px;  /* rounded-3xl */
}
```
