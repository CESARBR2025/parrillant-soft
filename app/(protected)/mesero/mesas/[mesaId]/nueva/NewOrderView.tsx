'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Minus, ShoppingCart, X, ChevronRight, UtensilsCrossed, Star, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { crearOrden } from '@/app/actions/crearOrden';
import { agregarItemsOrden } from '@/app/actions/agregarItemsOrden';
import { useHeaderActions } from '@/components/providers/HeaderActionsProvider';
import type { Tables } from '@/types/database.types';

type Categoria = Tables<'categorias'>;
type Producto = Tables<'productos_menu'>;

interface NewOrderViewProps {
  mesa: { id: number; numero: number; zona: string | null };
  categorias: Categoria[];
  productos: Producto[];
  ordenExistente: { id: number; estado: string } | null;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
  notas: string;
}

export function NewOrderView({ mesa, categorias, productos, ordenExistente }: NewOrderViewProps) {
  const router = useRouter();
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(
    categorias[0]?.id ?? null,
  );
  const [cart, setCart] = useState<Map<number, CartItem>>(new Map());
  const [notaGeneral, setNotaGeneral] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { setHeaderCenter } = useHeaderActions();

  const alimentoImages = [
    '/menu/alimentos/hamburguesa.jpg',
    '/menu/alimentos/ribeye.jpg',
    '/menu/alimentos/tbone.jpg',
  ];

  const bebidaImages = [
    '/menu/bebidas/cocacola.jpg',
    '/menu/bebidas/limonada.jpg',
  ];

  const getProductImage = (producto: Producto, index: number) => {
    if (producto.imagen_url) return producto.imagen_url;
    const images = producto.tipo === 'bebida' ? bebidaImages : alimentoImages;
    return images[index % images.length];
  };

  const productosFiltrados = productos.filter(
    p => p.categoria_id === selectedCategoriaId,
  );

  const searchResults = searchQuery.trim()
    ? productos.filter(p =>
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : [];

  const totalItems = [...cart.values()].reduce((sum, item) => sum + item.cantidad, 0);
  const totalEstimado = [...cart.values()].reduce(
    (sum, item) => sum + item.producto.precio * item.cantidad,
    0,
  );

  const addToCart = useCallback((producto: Producto) => {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(producto.id);
      if (existing) {
        next.set(producto.id, { ...existing, cantidad: existing.cantidad + 1 });
      } else {
        next.set(producto.id, { producto, cantidad: 1, notas: '' });
      }
      return next;
    });
    setShowCartSheet(true);
  }, []);

  const removeFromCart = useCallback((productoId: number) => {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(productoId);
      if (!existing) return next;
      if (existing.cantidad <= 1) {
        next.delete(productoId);
      } else {
        next.set(productoId, { ...existing, cantidad: existing.cantidad - 1 });
      }
      return next;
    });
  }, []);

  const updateItemNotes = useCallback((productoId: number, notas: string) => {
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(productoId);
      if (existing) {
        next.set(productoId, { ...existing, notas });
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (cart.size === 0) return;
    setIsSubmitting(true);

    const items = [...cart.values()].map(item => ({
      producto_id: item.producto.id,
      cantidad: item.cantidad,
      notas: item.notas || undefined,
      tipo: item.producto.tipo,
      precio_unitario: item.producto.precio,
    }));

    if (ordenExistente) {
      const result = await agregarItemsOrden(ordenExistente.id, items);
      setIsSubmitting(false);
      setShowConfirm(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Ítems agregados a la orden');
        router.replace(`/mesero/mesas/${mesa.id}`);
      }
    } else {
      const result = await crearOrden(
        mesa.id,
        notaGeneral || null,
        items,
      );

      setIsSubmitting(false);
      setShowConfirm(false);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Orden enviada a cocina/barra');
        router.replace(`/mesero/mesas/${mesa.id}`);
      }
    }
  }, [cart, notaGeneral, mesa.id, ordenExistente, router]);

  // Scroll selected category into view
  useEffect(() => {
    if (!tabsRef.current) return;
    const activeTab = tabsRef.current.querySelector('[data-active="true"]');
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedCategoriaId]);

  // Register search bar in global header
  useEffect(() => {
    setHeaderCenter(
      <div ref={searchRef} className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          className="w-full bg-card border border-border/60 rounded-xl pl-9 pr-4 py-2 text-sm text-body placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-xl shadow-lg z-30 max-h-72 overflow-y-auto">
            {searchResults.map(p => {
              const cartItem = cart.get(p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-bg-base transition-colors border-b border-border/40 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{p.nombre}</p>
                    <p className="text-xs text-muted">${Number(p.precio).toFixed(2)}</p>
                  </div>
                  {cartItem ? (
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => removeFromCart(p.id)}
                        className="w-6 h-6 rounded-lg bg-bg-base text-muted hover:text-body flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center text-xs font-medium text-text-primary">{cartItem.cantidad}</span>
                      <button
                        onClick={() => addToCart(p)}
                        className="w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { addToCart(p); setSearchFocused(false); }}
                      className="shrink-0 ml-2 rounded-lg bg-accent text-white px-2.5 py-1 text-xs font-medium hover:bg-accent-dark transition-colors"
                    >
                      + Agregar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>,
    );
    return () => setHeaderCenter(null);
  }, [searchQuery, searchFocused, searchResults, cart, addToCart, removeFromCart, setHeaderCenter]);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchRef, setSearchFocused]);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <button
              onClick={() => {
                if (ordenExistente) {
                  router.push(`/mesero/mesas/${mesa.id}`);
                } else {
                  router.push('/mesero');
                }
              }}
              className="text-sm text-muted hover:text-body transition-colors mb-1"
            >
              ← {ordenExistente ? 'Volver a la orden' : 'Mapa de Mesas'}
            </button>
            <h1 className="text-xl font-bold text-text-primary">
              Mesa {mesa.numero}
              {mesa.zona && (
                <span className="text-sm font-normal text-muted ml-2 capitalize">
                  {mesa.zona.replace('_', ' ')}
                </span>
              )}
              {ordenExistente && (
                <span className="text-sm font-normal text-accent ml-2">+ Agregar ítems</span>
              )}
            </h1>
          </div>

          <button
            onClick={() => setShowCartSheet(true)}
            className="md:hidden relative p-2 rounded-xl bg-card border border-border/60 text-muted hover:text-body"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="text-accent font-medium">1. Elegir productos</span>
          <ChevronRight className="w-3 h-3" />
          <span className={totalItems > 0 ? 'text-accent font-medium' : ''}>
            2. Revisar pedido
          </span>
          <ChevronRight className="w-3 h-3" />
          <span>3. Confirmar</span>
        </div>

        {/* Category tabs */}
        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
        >
          {categorias.map(cat => (
            <button
              key={cat.id}
              data-active={selectedCategoriaId === cat.id}
              onClick={() => setSelectedCategoriaId(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategoriaId === cat.id
                  ? 'bg-accent text-white'
                  : 'bg-card text-muted hover:text-body border border-border/60'
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted">
            <UtensilsCrossed className="w-10 h-10 mb-3" />
            <p className="text-sm">No hay productos en esta categoría</p>
          </div>
        ) : (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[14px] pb-32 md:pb-0">
            {productosFiltrados.map((producto, index) => {
              const cartItem = cart.get(producto.id);
              const qty = cartItem?.cantidad ?? 0;
              return (
                <div
                  key={producto.id}
                  className="bg-card rounded-2xl border-2 border-border/60 flex flex-col p-2.5"
                >
                  <div className="relative aspect-[16/9] bg-bg-base rounded-lg overflow-hidden">
                    <Image
                      src={getProductImage(producto, index)}
                      alt={producto.nombre}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <div className="px-1.5 pb-1.5 pt-2.5 flex flex-col gap-1.5 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-base font-bold text-text-primary line-clamp-2">
                        {producto.nombre}
                      </h3>
                      <span className="text-xs font-bold text-accent shrink-0">
                        ${Number(producto.precio).toFixed(2)}
                      </span>
                    </div>
                    {producto.descripcion && (
                      <p className="text-sm font-semibold line-clamp-2" style={{ color: '#A0A0A0' }}>
                        {producto.descripcion}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-1.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-muted">5.0</span>
                      </div>
                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => removeFromCart(producto.id)}
                            className="w-7 h-7 rounded-lg bg-bg-base text-muted hover:text-body flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-medium text-text-primary">{qty}</span>
                          <button
                            onClick={() => addToCart(producto)}
                            className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(producto)}
                           className="rounded-lg bg-accent text-white px-3 py-1.5 text-sm font-medium hover:bg-accent-dark transition-colors"
                        >
                          + Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order summary sidebar (desktop/tablet) */}
      <div className="hidden md:block md:w-72 lg:w-80 shrink-0">
        <div className="sticky top-6 bg-card rounded-2xl border border-border/60 flex flex-col max-h-[calc(100vh-10rem)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Pedido
            </h2>
            <Badge>{totalItems} ítems</Badge>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {cart.size === 0 ? (
              <p className="text-sm text-muted text-center py-8">
                Selecciona productos del menú
              </p>
            ) : (
              [...cart.values()].map(item => (
                <CartItemRow
                  key={item.producto.id}
                  item={item}
                  onRemove={removeFromCart}
                  onIncrement={addToCart}
                  onUpdateNotes={updateItemNotes}
                />
              ))
            )}
          </div>

          <div className="px-5 py-3 border-t border-border/40">
            <textarea
              placeholder="Nota general para la mesa..."
              value={notaGeneral}
              onChange={e => setNotaGeneral(e.target.value)}
              rows={2}
              className="w-full bg-bg-base rounded-xl border border-border/60 px-3 py-2 text-sm text-body placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          </div>

          <div className="px-5 py-4 border-t border-border/40 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-primary font-bold">Total estimado</span>
              <span className="text-text-primary font-bold">${totalEstimado.toFixed(2)}</span>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={cart.size === 0}
              onClick={() => setShowConfirm(true)}
            >
              {ordenExistente ? 'Agregar a la Orden' : 'Enviar a Cocina/Barra'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile cart sheet */}
      {showCartSheet && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowCartSheet(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl border border-border/60 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Pedido
              </h2>
              <div className="flex items-center gap-3">
                <Badge>{totalItems} ítems</Badge>
                <button
                  onClick={() => setShowCartSheet(false)}
                  className="text-muted hover:text-body"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {cart.size === 0 ? (
                <p className="text-sm text-muted text-center py-8">
                  Selecciona productos del menú
                </p>
              ) : (
                [...cart.values()].map(item => (
                  <CartItemRow
                    key={item.producto.id}
                    item={item}
                    onRemove={removeFromCart}
                    onIncrement={addToCart}
                    onUpdateNotes={updateItemNotes}
                  />
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-border/40">
              <textarea
                placeholder="Nota general para la mesa..."
                value={notaGeneral}
                onChange={e => setNotaGeneral(e.target.value)}
                rows={2}
                className="w-full bg-bg-base rounded-xl border border-border/60 px-3 py-2 text-sm text-body placeholder:text-muted resize-none focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>

            <div className="px-5 py-4 border-t border-border/40 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Total estimado</span>
                <span className="text-white font-bold">${totalEstimado.toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={cart.size === 0}
                onClick={() => {
                  setShowCartSheet(false);
                  setShowConfirm(true);
                }}
              >
                {ordenExistente ? 'Agregar a la Orden' : 'Enviar a Cocina/Barra'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-border/60 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-0">
              <h2 className="text-lg font-semibold text-text-primary">Confirmar pedido</h2>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-muted hover:text-body transition-colors p-1 rounded-lg hover:bg-bg-base"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="text-sm text-muted">
                Mesa <span className="text-text-primary font-medium">{mesa.numero}</span>
                {mesa.zona && (
                  <> · <span className="capitalize">{mesa.zona.replace('_', ' ')}</span></>
                )}
              </div>

              <div className="bg-bg-base rounded-xl divide-y divide-border/40">
                {[...cart.values()].map(item => (
                  <div key={item.producto.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {item.cantidad}x {item.producto.nombre}
                      </p>
                      {item.notas && (
                        <p className="text-xs text-muted italic truncate mt-0.5">{item.notas}</p>
                      )}
                    </div>
                    <span className="text-sm text-muted ml-3">
                      ${(item.producto.precio * item.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {notaGeneral && (
                <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 text-sm text-warning">
                  Nota: {notaGeneral}
                </div>
              )}

              <div className="flex justify-between text-lg font-bold text-text-primary pt-2">
                <span>Total estimado</span>
                <span>${totalEstimado.toFixed(2)}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  loading={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartItemRow({
  item,
  onRemove,
  onIncrement,
  onUpdateNotes,
}: {
  item: CartItem;
  onRemove: (id: number) => void;
  onIncrement: (producto: Producto) => void;
  onUpdateNotes: (id: number, notes: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="bg-bg-base rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {item.producto.nombre}
          </p>
          <p className="text-xs text-muted">
            ${Number(item.producto.precio).toFixed(2)} c/u
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onRemove(item.producto.id)}
            className="w-6 h-6 rounded-lg bg-bg-base text-muted hover:text-body flex items-center justify-center transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-5 text-center text-sm font-medium text-text-primary">{item.cantidad}</span>
          <button
            onClick={() => onIncrement(item.producto)}
            className="w-6 h-6 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent-dark transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowNotes(!showNotes)}
        className={`text-xs mt-2 transition-colors ${
          item.notas ? 'text-accent' : 'text-muted hover:text-body'
        }`}
      >
        {item.notas ? `Nota: ${item.notas}` : '+ Agregar nota'}
      </button>

      {showNotes && (
        <input
          type="text"
          placeholder="Ej: sin cebolla, término medio..."
          value={item.notas}
          onChange={e => onUpdateNotes(item.producto.id, e.target.value)}
          className="w-full bg-card rounded-lg border border-border/60 px-3 py-1.5 text-xs text-body placeholder:text-muted mt-2 focus:outline-none focus:ring-1 focus:ring-accent/50"
          autoFocus
        />
      )}
    </div>
  );
}
