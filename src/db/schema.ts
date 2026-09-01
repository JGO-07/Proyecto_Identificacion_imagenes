import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  tinyint,
  double,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// Tabla de Categorías
export const categories = mysqlTable('categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 7 }).notNull().default('#3B82F6'), // Hex color (ej. #FF5733)
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Tabla de Imágenes
export const images = mysqlTable('images', {
  id: int('id').autoincrement().primaryKey(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storagePath: text('storage_path').notNull(), // Path/Key en MinIO
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  sizeBytes: int('size_bytes').notNull(),
  width: int('width').notNull(),
  height: int('height').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'in_progress' | 'completed'
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// Tabla de Anotaciones (Bounding Boxes)
export const annotations = mysqlTable('annotations', {
  id: int('id').autoincrement().primaryKey(),
  imageId: int('image_id')
    .notNull()
    .references(() => images.id, { onDelete: 'cascade' }),
  categoryId: int('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  // Coordenadas absolutas en píxeles requeridas para exportación COCO
  x: double('x').notNull(),
  y: double('y').notNull(),
  width: double('width').notNull(),
  height: double('height').notNull(),
  area: double('area').notNull(),
  isCrowd: tinyint('is_crowd').notNull().default(0), // 0 o 1
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});
