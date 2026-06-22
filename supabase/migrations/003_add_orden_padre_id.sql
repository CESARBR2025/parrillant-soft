ALTER TABLE ordenes
ADD COLUMN orden_padre_id INTEGER REFERENCES ordenes(id) ON DELETE SET NULL;

CREATE INDEX idx_ordenes_orden_padre_id ON ordenes(orden_padre_id);
