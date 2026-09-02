CREATE TABLE `annotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`image_id` int NOT NULL,
	`category_id` int NOT NULL,
	`x` double NOT NULL,
	`y` double NOT NULL,
	`width` double NOT NULL,
	`height` double NOT NULL,
	`area` double NOT NULL,
	`is_crowd` tinyint NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) NOT NULL DEFAULT '#3B82F6',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`storage_path` text NOT NULL,
	`mime_type` varchar(50) NOT NULL,
	`size_bytes` int NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `images_id` PRIMARY KEY(`id`),
	CONSTRAINT `uqx_images_file_name` UNIQUE(`file_name`)
);
--> statement-breakpoint
ALTER TABLE `annotations` ADD CONSTRAINT `annotations_image_id_images_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `annotations` ADD CONSTRAINT `annotations_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_annotations_image_id` ON `annotations` (`image_id`);--> statement-breakpoint
CREATE INDEX `idx_annotations_category_id` ON `annotations` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_images_status` ON `images` (`status`);--> statement-breakpoint
CREATE INDEX `idx_images_created_at` ON `images` (`created_at`);