'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Plus, X, Pencil, Trash2, ChevronDown, ChevronRight,
  UtensilsCrossed, Wine, Package, Upload, Loader2,
} from 'lucide-react';
import {
  crearCategoria, editarCategoria, eliminarCategoria,
} from '@/app/actions/categorias';
import {
  crearProducto, editarProducto, eliminarProducto,
} from '@/app/actions/productos';
import {
  subirImagen, eliminarImagen,
} from '@/app/actions/subirImagen';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Tables } from '@/types/database.types';

type Categoria = Tables<'categorias'>;
type Producto = Tables<'productos_menu'>;

const TIPO_VARIANT: Record<string, 'default' | 'info' | 'purple' | 'warning'> = {
  alimento: 'default',
  bebida: 'info',
  postre: 'warning',
  combo: 'purple',
};

const TIPO_LABEL: Record<string, string> = {
  alimento: 'Alimento',
  bebida: 'Bebida',
  postre: 'Postre',
  combo: 'Combo',
};

const TIPO_ICON: Record<string, typeof UtensilsCrossed> = {
  alimento: UtensilsCrossed,
  bebida: Wine,
  postre: UtensilsCrossed,
  combo: Package,
};

export function AdminMenuClient({
  categorias: categoriasIniciales,
  productos: productosIniciales,
  sucursalId,
}: {
  categorias: Categoria[];
  productos: Producto[];
  sucursalId: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<Set<number>>(new Set(categoriasIniciales.map(c => c.id)));

  // Create category modal
  const [showCrearCategoria, setShowCrearCategoria] = useState(false);
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [nuevaCatDesc, setNuevaCatDesc] = useState('');
  const [nuevaCatTipo, setNuevaCatTipo] = useState('alimento');

  // Edit category modal
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [editCatNombre, setEditCatNombre] = useState('');
  const [editCatTipo, setEditCatTipo] = useState('alimento');

  // Create product modal
  const [showCrearProducto, setShowCrearProducto] = useState(false);
  const [productoStep, setProductoStep] = useState(1);
  const [crearProdCatId, setCrearProdCatId] = useState<number | null>(null);
  const [nuevoProdNombre, setNuevoProdNombre] = useState('');
  const [nuevoProdPrecio, setNuevoProdPrecio] = useState('');
  const [nuevoProdTipo, setNuevoProdTipo] = useState('alimento');
  const [nuevoProdDesc, setNuevoProdDesc] = useState('');

  // Edit product modal
  const [editProdId, setEditProdId] = useState<number | null>(null);
  const [editProdNombre, setEditProdNombre] = useState('');
  const [editProdPrecio, setEditProdPrecio] = useState('');
  const [editProdTipo, setEditProdTipo] = useState('alimento');
  const [editProdDesc, setEditProdDesc] = useState('');

  // Image upload
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [nuevoProdFile, setNuevoProdFile] = useState<File | null>(null);
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const catProductos = (catId: number) =>
    productosIniciales.filter(p => p.categoria_id === catId);

  const toggleExpand = (catId: number) => {
    setExpandedCat(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  async function handleCrearCategoria(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaCatNombre.trim()) return;
    setIsSubmitting('crear-cat');
    const result = await crearCategoria(sucursalId, nuevaCatNombre.trim(), nuevaCatTipo, nuevaCatDesc || null);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setShowCrearCategoria(false);
      setNuevaCatNombre('');
      setNuevaCatDesc('');
      setNuevaCatTipo('alimento');
      toast.success('Categoría creada');
      router.refresh();
    }
  }

  async function handleEditarCategoria() {
    if (editCatId === null || !editCatNombre.trim()) return;
    setIsSubmitting('edit-cat');
    const result = await editarCategoria(editCatId, { nombre: editCatNombre.trim(), tipo: editCatTipo });
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setEditCatId(null);
      setEditCatNombre('');
      toast.success('Categoría actualizada');
      router.refresh();
    }
  }

  async function handleEliminarCategoria(id: number) {
    if (!confirm('¿Eliminar esta categoría? No se puede si tiene productos.')) return;
    setIsSubmitting(`del-cat-${id}`);
    const result = await eliminarCategoria(id);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Categoría eliminada');
      router.refresh();
    }
  }

  function abrirCrearProducto(catId: number) {
    const cat = categoriasIniciales.find(c => c.id === catId);
    setCrearProdCatId(catId);
    setNuevoProdNombre('');
    setNuevoProdPrecio('');
    setNuevoProdTipo(cat?.tipo ?? 'alimento');
    setNuevoProdDesc('');
    setNuevoProdFile(null);
    setProductoStep(1);
    setShowCrearProducto(true);
  }

  async function handleCrearProducto() {
    if (crearProdCatId === null || !nuevoProdNombre.trim()) return;
    const precio = parseFloat(nuevoProdPrecio);
    if (isNaN(precio) || precio < 0) {
      toast.error('Precio inválido');
      return;
    }
    setIsSubmitting('crear-prod');
    const result = await crearProducto(sucursalId, {
      categoria_id: crearProdCatId,
      nombre: nuevoProdNombre.trim(),
      precio,
      tipo: nuevoProdTipo,
      descripcion: nuevoProdDesc || null,
    });
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else if (nuevoProdFile && result.productoId) {
      const fd = new FormData();
      fd.append('imagen', nuevoProdFile);
      const imgResult = await subirImagen(result.productoId, fd);
      if (imgResult.error) {
        toast.error('Producto creado pero falló la imagen: ' + imgResult.error);
      } else {
        toast.success('Producto creado con imagen');
      }
      setShowCrearProducto(false);
      setNuevoProdFile(null);
      router.refresh();
    } else {
      setShowCrearProducto(false);
      setNuevoProdFile(null);
      toast.success('Producto creado');
      router.refresh();
    }
  }

  function abrirEditarProducto(p: Producto) {
    setEditProdId(p.id);
    setEditProdNombre(p.nombre);
    setEditProdPrecio(String(p.precio));
    setEditProdTipo(p.tipo);
    setEditProdDesc(p.descripcion ?? '');
  }

  async function handleEditarProducto() {
    if (editProdId === null || !editProdNombre.trim()) return;
    const precio = parseFloat(editProdPrecio);
    if (isNaN(precio) || precio < 0) {
      toast.error('Precio inválido');
      return;
    }
    setIsSubmitting('edit-prod');
    const result = await editarProducto(editProdId, {
      nombre: editProdNombre.trim(),
      precio,
      tipo: editProdTipo,
      descripcion: editProdDesc || null,
    });
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      setEditProdId(null);
      toast.success('Producto actualizado');
      router.refresh();
    }
  }

  async function handleToggleDisponible(p: Producto) {
    setIsSubmitting(`toggle-${p.id}`);
    const result = await editarProducto(p.id, { disponible: !p.disponible });
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(p.disponible ? 'Producto desactivado' : 'Producto activado');
      router.refresh();
    }
  }

  async function handleEliminarProducto(id: number) {
    if (!confirm('¿Eliminar este producto?')) return;
    setIsSubmitting(`del-prod-${id}`);
    const result = await eliminarProducto(id);
    setIsSubmitting(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Producto eliminado');
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {categoriasIniciales.length} categorías
        </p>
        <Button onClick={() => setShowCrearCategoria(true)} variant="primary" size="sm">
          <Plus className="w-4 h-4" />
          Categoría
        </Button>
      </div>

      {categoriasIniciales.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Sin categorías"
          description="Crea tu primera categoría para comenzar a armar el menú"
          action={
            <Button onClick={() => setShowCrearCategoria(true)} variant="primary">
              <Plus className="w-4 h-4" />
              Crear categoría
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {categoriasIniciales.map(cat => {
            const productos = catProductos(cat.id);
            const isExpanded = expandedCat.has(cat.id);

            return (
              <div key={cat.id} className="bg-card rounded-2xl border-2 border-border-default overflow-hidden">
                {/* Category header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-bg-base/50 transition-colors"
                  onClick={() => toggleExpand(cat.id)}
                >
                  <button className="text-muted hover:text-text-primary transition-colors">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {(() => {
                    const CatIcon = TIPO_ICON[cat.tipo] ?? UtensilsCrossed;
                    return <CatIcon className="w-4 h-4 text-accent shrink-0" />;
                  })()}
                  <span className="flex-1 font-semibold text-text-primary text-sm">{cat.nombre}</span>
                  {cat.descripcion && (
                    <span className="text-xs text-muted hidden sm:block truncate max-w-[200px]">{cat.descripcion}</span>
                  )}
                  <Badge variant={TIPO_VARIANT[cat.tipo] ?? 'default'}>{TIPO_LABEL[cat.tipo] ?? cat.tipo}</Badge>
                  <Badge variant="default">{productos.length}</Badge>

                  {/* Edit category name */}
                  {editCatId === cat.id ? (
                    <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editCatNombre}
                        onChange={e => setEditCatNombre(e.target.value)}
                        className="w-28 bg-bg-base border border-border/60 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        autoFocus
                      />
                      <select
                        value={editCatTipo}
                        onChange={e => setEditCatTipo(e.target.value)}
                        className="bg-bg-base border border-border/60 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        <option value="alimento">Alimento</option>
                        <option value="bebida">Bebida</option>
                        <option value="postre">Postre</option>
                        <option value="combo">Combo</option>
                      </select>
                      <button
                        onClick={handleEditarCategoria}
                        disabled={isSubmitting === 'edit-cat'}
                        className="text-green-500 hover:text-green-400 text-xs font-medium disabled:opacity-50"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditCatId(null)}
                        className="text-muted hover:text-text-primary"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => { setEditCatId(cat.id); setEditCatNombre(cat.nombre); setEditCatTipo(cat.tipo); }}
                        className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                        title="Renombrar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEliminarCategoria(cat.id)}
                        disabled={isSubmitting === `del-cat-${cat.id}`}
                        className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Product list */}
                {isExpanded && (
                  <div className="border-t border-border/40">
                    {productos.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <p className="text-xs text-muted mb-3">Sin productos en esta categoría</p>
                        <Button onClick={() => abrirCrearProducto(cat.id)} variant="secondary" size="sm">
                          <Plus className="w-3 h-3" />
                          Agregar producto
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {productos.map(p => {
                          const TipoIcon = TIPO_ICON[p.tipo] ?? Package;

                          return (
                            <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-base/30 transition-colors">
                              <button
                                onClick={() => handleToggleDisponible(p)}
                                disabled={isSubmitting === `toggle-${p.id}`}
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${p.disponible
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-border-default hover:border-muted'
                                  }`}
                                title={p.disponible ? 'Desactivar' : 'Activar'}
                              >
                                {p.disponible && (
                                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-white">
                                    <path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>

                              <TipoIcon className={`w-3.5 h-3.5 shrink-0 ${p.disponible ? 'text-muted' : 'text-muted/40'}`} />

                              {editProdId === p.id ? (
                                <div className="flex-1 flex flex-col gap-2" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                      type="text"
                                      value={editProdNombre}
                                      onChange={e => setEditProdNombre(e.target.value)}
                                      className="w-28 bg-bg-base border border-border/60 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                      autoFocus
                                    />
                                    <div className="relative">
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editProdPrecio}
                                        onChange={e => setEditProdPrecio(e.target.value)}
                                        className="w-20 bg-bg-base border border-border/60 rounded-lg pl-5 pr-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                      />
                                    </div>
                                    <span className="text-xs text-muted bg-bg-base rounded-lg px-2 py-1">
                                      {TIPO_LABEL[editProdTipo] ?? editProdTipo}
                                    </span>
                                    <input
                                      type="text"
                                      value={editProdDesc}
                                      onChange={e => setEditProdDesc(e.target.value)}
                                      placeholder="Descripción"
                                      className="w-32 bg-bg-base border border-border/60 rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 hidden sm:block"
                                    />
                                    <button
                                      onClick={handleEditarProducto}
                                      disabled={isSubmitting === 'edit-prod'}
                                      className="text-green-500 hover:text-green-400 text-xs font-medium disabled:opacity-50"
                                    >
                                      Guardar
                                    </button>
                                    <button
                                      onClick={() => setEditProdId(null)}
                                      className="text-muted hover:text-text-primary"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Image upload row */}
                                  <div className="flex items-center gap-2">
                                    {p.imagen_url ? (
                                      <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-bg-base">
                                        <Image
                                          src={p.imagen_url}
                                          alt={p.nombre}
                                          fill
                                          className="object-cover"
                                          sizes="32px"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-bg-base flex items-center justify-center shrink-0">
                                        <Upload className="w-3.5 h-3.5 text-muted" />
                                      </div>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/gif"
                                      className="hidden"
                                      ref={el => {
                                        if (el) fileInputRefs.current.set(p.id, el);
                                        else fileInputRefs.current.delete(p.id);
                                      }}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploadingImage(p.id);
                                        const fd = new FormData();
                                        fd.append('imagen', file);
                                        const result = await subirImagen(p.id, fd);
                                        setUploadingImage(null);
                                        e.target.value = '';
                                        if (result.error) {
                                          toast.error(result.error);
                                        } else {
                                          toast.success('Imagen subida');
                                          router.refresh();
                                        }
                                      }}
                                    />
                                    {uploadingImage === p.id ? (
                                      <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
                                    ) : (
                                      <button
                                        onClick={() => fileInputRefs.current.get(p.id)?.click()}
                                        className="text-xs text-accent hover:text-accent-dark font-medium transition-colors"
                                      >
                                        {p.imagen_url ? 'Cambiar' : 'Subir imagen'}
                                      </button>
                                    )}
                                    {p.imagen_url && (
                                      <button
                                        onClick={async () => {
                                          setUploadingImage(p.id);
                                          const result = await eliminarImagen(p.id);
                                          setUploadingImage(null);
                                          if (result.error) {
                                            toast.error(result.error);
                                          } else {
                                            toast.success('Imagen eliminada');
                                            router.refresh();
                                          }
                                        }}
                                        disabled={uploadingImage === p.id}
                                        className="text-xs text-red-500 hover:text-red-400 font-medium transition-colors disabled:opacity-50"
                                      >
                                        Quitar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {p.imagen_url && (
                                      <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-bg-base">
                                        <Image
                                          src={p.imagen_url}
                                          alt={p.nombre}
                                          fill
                                          className="object-cover"
                                          sizes="28px"
                                        />
                                      </div>
                                    )}
                                    <span className={`text-sm font-medium truncate ${p.disponible ? 'text-text-primary' : 'text-muted/50 line-through'}`}>
                                      {p.nombre}
                                    </span>
                                  </div>
                                  <span className={`text-sm font-semibold shrink-0 ${p.disponible ? 'text-text-primary' : 'text-muted/50'}`}>
                                    ${p.precio.toFixed(2)}
                                  </span>
                                  <Badge variant={TIPO_VARIANT[p.tipo] ?? 'default'}>
                                    {TIPO_LABEL[p.tipo] ?? p.tipo}
                                  </Badge>
                                  {!p.disponible && (
                                    <Badge variant="danger">No disponible</Badge>
                                  )}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => abrirEditarProducto(p)}
                                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/5 transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleEliminarProducto(p.id)}
                                      disabled={isSubmitting === `del-prod-${p.id}`}
                                      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}

                        {/* Add product button at bottom of category */}
                        <div className="px-5 py-2">
                          <button
                            onClick={() => abrirCrearProducto(cat.id)}
                            className="flex items-center gap-2 text-xs text-accent hover:text-accent-dark font-medium transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar producto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear categoría */}
      {showCrearCategoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Nueva categoría</h2>
                <button onClick={() => setShowCrearCategoria(false)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCrearCategoria} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Nombre</label>
                <input
                  type="text"
                  value={nuevaCatNombre}
                  onChange={e => setNuevaCatNombre(e.target.value)}
                  className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Ej: Entradas, Platos Fuertes..."
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Tipo</label>
                <select
                  value={nuevaCatTipo}
                  onChange={e => setNuevaCatTipo(e.target.value)}
                  className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="alimento">Alimento</option>
                  <option value="bebida">Bebida</option>
                  <option value="postre">Postre</option>
                  <option value="combo">Combo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Descripción (opcional)</label>
                <input
                  type="text"
                  value={nuevaCatDesc}
                  onChange={e => setNuevaCatDesc(e.target.value)}
                  className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                  placeholder="Breve descripción de la categoría"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCrearCategoria(false)}
                  className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting === 'crear-cat' || !nuevaCatNombre.trim()}
                  className="flex-1 bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting === 'crear-cat' ? '...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear producto */}
      {showCrearProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card rounded-3xl border-2 border-border/60 w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-accent/10 to-amber-400/10 px-6 pt-6 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Nuevo producto</h2>
                    <p className="text-xs text-muted mt-0.5">Paso {productoStep} de 2</p>
                  </div>
                </div>
                <button onClick={() => setShowCrearProducto(false)} className="text-muted hover:text-body p-1.5 rounded-lg hover:bg-bg-base">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${productoStep >= 1 ? 'bg-accent' : 'bg-border/60'}`} />
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${productoStep >= 2 ? 'bg-accent' : 'bg-border/60'}`} />
              </div>
            </div>

            {productoStep === 1 && (
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Nombre</label>
                  <input
                    type="text"
                    value={nuevoProdNombre}
                    onChange={e => setNuevoProdNombre(e.target.value)}
                    className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="Ej: Tacos al Pastor"
                    required
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-secondary">Precio ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={nuevoProdPrecio}
                      onChange={e => setNuevoProdPrecio(e.target.value)}
                      className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-secondary">Tipo</label>
                    <div className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input/50">
                      {TIPO_LABEL[nuevoProdTipo] ?? nuevoProdTipo}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Descripción (opcional)</label>
                  <input
                    type="text"
                    value={nuevoProdDesc}
                    onChange={e => setNuevoProdDesc(e.target.value)}
                    className="w-full rounded-xl border border-border-default/60 px-4 py-3 text-sm text-text-primary bg-bg-input focus:outline-none focus:ring-2 focus:ring-accent/30"
                    placeholder="Descripción del producto"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Imagen (opcional)</label>
                  <div className="flex items-center gap-3">
                    {nuevoProdFile ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-bg-base">
                        <Image
                          src={URL.createObjectURL(nuevoProdFile)}
                          alt="Preview"
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-bg-base flex items-center justify-center shrink-0 border-2 border-dashed border-border/60">
                        <Upload className="w-5 h-5 text-muted" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="rounded-xl border-2 border-dashed border-border/60 px-4 py-3 text-sm text-muted hover:border-accent/50 hover:text-body transition-colors text-center">
                        {nuevoProdFile ? nuevoProdFile.name : 'Seleccionar archivo'}
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={e => setNuevoProdFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {nuevoProdFile && (
                      <button
                        type="button"
                        onClick={() => setNuevoProdFile(null)}
                        className="p-2 text-muted hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCrearProducto(false)}
                    className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!nuevoProdNombre.trim() || !nuevoProdPrecio) {
                        toast.error('Completa todos los campos obligatorios');
                        return;
                      }
                      if (isNaN(parseFloat(nuevoProdPrecio)) || parseFloat(nuevoProdPrecio) < 0) {
                        toast.error('Precio inválido');
                        return;
                      }
                      setProductoStep(2);
                    }}
                    className="flex-1 bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {productoStep === 2 && (
              <div className="p-6 space-y-5">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Vista previa</h3>

                <div className="bg-card rounded-2xl border-2 border-border/60 flex flex-col p-2.5 max-w-[240px] mx-auto">
                  <div className="relative aspect-[16/9] bg-bg-base rounded-lg overflow-hidden">
                    {nuevoProdFile ? (
                      <Image
                        src={URL.createObjectURL(nuevoProdFile)}
                        alt={nuevoProdNombre}
                        fill
                        className="object-cover"
                        sizes="240px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {(() => {
                          const TipoIcon = TIPO_ICON[nuevoProdTipo] ?? UtensilsCrossed;
                          return <TipoIcon className="w-8 h-8 text-muted/40" />;
                        })()}
                      </div>
                    )}
                  </div>
                  <div className="px-1.5 pb-1.5 pt-2.5 flex flex-col gap-1.5 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-sm md:text-base font-bold text-text-primary line-clamp-2">
                        {nuevoProdNombre}
                      </h3>
                    </div>
                    {nuevoProdDesc && (
                      <p className="text-xs md:text-sm font-semibold line-clamp-2" style={{ color: '#A0A0A0' }}>
                        {nuevoProdDesc}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-1.5">
                      <span className="text-xs md:text-sm font-bold text-accent">
                        ${parseFloat(nuevoProdPrecio).toFixed(2)}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center opacity-50">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-bg-base rounded-2xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Categoría</span>
                    <span className="font-medium text-text-primary">
                      {categoriasIniciales.find(c => c.id === crearProdCatId)?.nombre ?? '—'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setProductoStep(1)}
                    className="flex-1 rounded-xl border-2 border-border-default px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-base transition-colors"
                    disabled={isSubmitting === 'crear-prod'}
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleCrearProducto}
                    disabled={isSubmitting === 'crear-prod'}
                    className="flex-1 bg-accent text-white hover:bg-accent-dark rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting === 'crear-prod' ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
