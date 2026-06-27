'use server';

import { revalidatePath } from 'next/cache';
import { getServerSucursalSlug } from '@/lib/sucursal';
import { authorize } from '@/lib/auth';

export async function subirImagen(productoId: number, formData: FormData) {
  const auth = await authorize('sucursal.menu.administrar');
  if (!auth.authorized) return { error: auth.error };
  const slug = await getServerSucursalSlug();

  const file = formData.get('imagen') as File;
  if (!file || file.size === 0) return { error: 'No se seleccionó ninguna imagen' };

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!tiposPermitidos.includes(file.type)) {
    return { error: 'Formato no permitido. Usa JPG, PNG, WebP o GIF' };
  }

  const MAX_SIZE = 3 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { error: 'La imagen no debe superar 3MB' };
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const filepath = `productos/${productoId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await (auth.supabase.storage as any)
    .from('menu-imagenes')
    .upload(filepath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { data: publicUrlData } = (auth.supabase.storage as any)
    .from('menu-imagenes')
    .getPublicUrl(filepath);

  const publicUrl = publicUrlData.publicUrl;

  await (auth.supabase as any)
    .from('productos_menu')
    .update({ imagen_url: publicUrl })
    .eq('id', productoId);

  revalidatePath(`/${slug}/admin/menu`);
  return { success: true, url: publicUrl };
}

export async function eliminarImagen(productoId: number) {
  const auth = await authorize('sucursal.menu.administrar');
  if (!auth.authorized) return { error: auth.error };
  const slug = await getServerSucursalSlug();

  const { data: producto } = await (auth.supabase as any)
    .from('productos_menu')
    .select('imagen_url')
    .eq('id', productoId)
    .single();

  const url: string | null = producto?.imagen_url ?? null;

  if (url) {
    const segments = url.split('/');
    const path = segments.slice(-2).join('/');
    await (auth.supabase.storage as any)
      .from('menu-imagenes')
      .remove([path]);
  }

  await (auth.supabase as any)
    .from('productos_menu')
    .update({ imagen_url: null })
    .eq('id', productoId);

  revalidatePath(`/${slug}/admin/menu`);
  return { success: true };
}
