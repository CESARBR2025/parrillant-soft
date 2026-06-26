-- Seeds para categorias y productos_menu por sucursal
-- Ejecutar después de tener sucursales creadas

DO $$
DECLARE
  rec record;
  cat_platos_fuertes int;
  cat_bebidas int;
BEGIN

  FOR rec IN SELECT id, slug FROM public.sucursales LOOP

    -- Insertar categorías para esta sucursal
    INSERT INTO public.categorias (nombre, descripcion, orden, sucursal_id) VALUES
      ('Platos Fuertes', 'Platos fuertes y especialidades', 1, rec.id)
    RETURNING id INTO cat_platos_fuertes;

    INSERT INTO public.categorias (nombre, descripcion, orden, sucursal_id) VALUES
      ('Bebidas', 'Refrescos, aguas, cervezas y cocteles', 2, rec.id)
    RETURNING id INTO cat_bebidas;

    -- Insertar productos para esta sucursal
    -- PLATOS FUERTES
    INSERT INTO public.productos_menu (categoria_id, nombre, descripcion, precio, tipo, disponible, sucursal_id) VALUES
      (cat_platos_fuertes, 'Tacos al Pastor',     'Tacos de cerdo adobado con piña, cebolla y cilantro',  120.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Tacos de Suadero',    'Tacos de suadero bañado en su jugo',                   130.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Tacos de Canasta',    'Tacos de canasta de chicharrón, papa y frijol',         90.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Torta Ahogada',       'Torta de carnita ahogada en salsa de tomate',          110.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Carnitas Estilo Michoacán', 'Carnitas de cerdo con cebolla, cilantro y salsa', 150.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Arrachera a la Parrilla', 'Arrachera asada con nopales, frijoles y guacamole', 230.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Pechuga a la Plancha', 'Pechuga de pollo con verduras asadas y arroz',         170.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Hamburguesa Parrillera', 'Hamburguesa con queso, tocineta, aguacate y papas',  140.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Quesadillas de Huitlacoche', 'Quesadillas con huitlacoche y queso Oaxaca',     100.00, 'alimento', true, rec.id),
      (cat_platos_fuertes, 'Chiles Rellenos',     'Chiles poblanos rellenos de queso con salsa roja',      160.00, 'alimento', true, rec.id);

    -- BEBIDAS
    INSERT INTO public.productos_menu (categoria_id, nombre, descripcion, precio, tipo, disponible, sucursal_id) VALUES
      (cat_bebidas, 'Refresco de Cola',          'Refresco de cola 355ml',            30.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Refresco de Naranja',       'Refresco sabor naranja 355ml',      30.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Agua de Horchata',          'Agua fresca de horchata 500ml',     35.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Agua de Jamaica',           'Agua fresca de jamaica 500ml',      35.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Cerveza Clara',             'Cerveza clara 355ml',               45.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Cerveza Oscura',            'Cerveza oscura 355ml',              50.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Michelada Clásica',         'Cerveza con clamato, limón y chile', 65.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Margarita',                 'Tequila, limón, triple sec',         90.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Paloma',                    'Tequila, refresco de toronja, limón', 80.00, 'bebida', true, rec.id),
      (cat_bebidas, 'Agua Natural',              'Agua purificada 500ml',             20.00, 'bebida', true, rec.id);

    RAISE NOTICE 'Insertado menú para sucursal: %', rec.slug;

  END LOOP;

  RAISE NOTICE 'Seed completado para todas las sucursales';

END $$;

-- Verificar lo insertado
SELECT s.nombre as sucursal, c.nombre as categoria, p.nombre, p.precio, p.tipo
FROM public.productos_menu p
JOIN public.categorias c ON c.id = p.categoria_id
JOIN public.sucursales s ON s.id = p.sucursal_id
ORDER BY s.nombre, c.orden, p.nombre;
