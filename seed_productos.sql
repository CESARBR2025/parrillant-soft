-- Seeds para productos_menu
-- Categorías existentes: 1=Platos Fuertes, 2=Bebidas

INSERT INTO public.productos_menu (categoria_id, nombre, descripcion, precio, tipo, disponible) VALUES

-- ============================================================
-- PLATOS FUERTES (categoria_id = 1) → tipo = 'alimento'
-- ============================================================
(1, 'Tacos al Pastor',     'Tacos de cerdo adobado con piña, cebolla y cilantro',  120.00, 'alimento', true),
(1, 'Tacos de Suadero',    'Tacos de suadero bañado en su jugo',                   130.00, 'alimento', true),
(1, 'Tacos de Canasta',    'Tacos de canasta de chicharrón, papa y frijol',         90.00, 'alimento', true),
(1, 'Torta Ahogada',       'Torta de carnita ahogada en salsa de tomate',          110.00, 'alimento', true),
(1, 'Carnitas Estilo Michoacán', 'Carnitas de cerdo con cebolla, cilantro y salsa', 150.00, 'alimento', true),
(1, 'Arrachera a la Parrilla', 'Arrachera asada con nopales, frijoles y guacamole', 230.00, 'alimento', true),
(1, 'Pechuga a la Plancha', 'Pechuga de pollo con verduras asadas y arroz',         170.00, 'alimento', true),
(1, 'Hamburguesa Parrillera', 'Hamburguesa con queso, tocineta, aguacate y papas',  140.00, 'alimento', true),
(1, 'Quesadillas de Huitlacoche', 'Quesadillas con huitlacoche y queso Oaxaca',     100.00, 'alimento', true),
(1, 'Chiles Rellenos',     'Chiles poblanos rellenos de queso con salsa roja',      160.00, 'alimento', true),

-- ============================================================
-- BEBIDAS (categoria_id = 2) → tipo = 'bebida'
-- ============================================================
(2, 'Refresco de Cola',          'Refresco de cola 355ml',            30.00, 'bebida', true),
(2, 'Refresco de Naranja',       'Refresco sabor naranja 355ml',      30.00, 'bebida', true),
(2, 'Agua de Horchata',          'Agua fresca de horchata 500ml',     35.00, 'bebida', true),
(2, 'Agua de Jamaica',           'Agua fresca de jamaica 500ml',      35.00, 'bebida', true),
(2, 'Cerveza Clara',             'Cerveza clara 355ml',               45.00, 'bebida', true),
(2, 'Cerveza Oscura',            'Cerveza oscura 355ml',              50.00, 'bebida', true),
(2, 'Michelada Clásica',         'Cerveza con clamato, limón y chile',65.00, 'bebida', true),
(2, 'Margarita',                 'Tequila, limón, triple sec',         90.00, 'bebida', true),
(2, 'Paloma',                    'Tequila, refresco de toronja, limón',80.00, 'bebida', true),
(2, 'Agua Natural',              'Agua purificada 500ml',             20.00, 'bebida', true);

-- Verificar lo insertado
SELECT p.id, c.nombre as categoria, p.nombre, p.precio, p.tipo
FROM public.productos_menu p
JOIN public.categorias c ON c.id = p.categoria_id
ORDER BY c.orden, p.nombre;
