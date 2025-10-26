
CREATE TABLE "category" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "image" VARCHAR(255),
  "parent_category_id" INTEGER,
  "rank" INTEGER
);

CREATE TABLE "vertical" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "image" VARCHAR(255),
  "min_price" INTEGER
);

CREATE TABLE "products" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "key_name" VARCHAR(255) UNIQUE NOT NULL,
  "image" VARCHAR(255),
  "highlights" TEXT,
  "storage" VARCHAR(255),
  "ram" VARCHAR(255),
  "colour" VARCHAR(255),
  "vertical_id" INTEGER REFERENCES "vertical"("id"),
  "rating" DECIMAL(2, 1),
  "rating_count" INTEGER,
  "review_count" INTEGER,
  "specifications" JSON,
  "mrp" INTEGER,
  "parent_category_id" INTEGER REFERENCES "category"("id"),
  "sub_category_id" INTEGER REFERENCES "category"("id")
);

CREATE TABLE "store" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "image" VARCHAR(255),
  "rating" DECIMAL(2, 1),
  "latitude" DECIMAL(10, 8),
  "longitude" DECIMAL(11, 8),
  "city" VARCHAR(255)
);

CREATE TABLE "store_product_mapping" (
  "store_id" INTEGER REFERENCES "store"("id"),
  "product_id" INTEGER REFERENCES "products"("id"),
  "price" INTEGER,
  "offers" JSON,
  "affiliate_link" VARCHAR(255),
  PRIMARY KEY ("store_id", "product_id")
);

CREATE TABLE "entity" (
  "id" SERIAL PRIMARY KEY,
  "header" VARCHAR(255),
  "page" VARCHAR(255),
  "entity_type" VARCHAR(255),
  "rank" INTEGER
);

CREATE TABLE "entity_product_mapping" (
  "entity_id" INTEGER REFERENCES "entity"("id"),
  "product_id" INTEGER REFERENCES "products"("id"),
  PRIMARY KEY ("entity_id", "product_id")
);

CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "user_image" VARCHAR(255)
);

CREATE TABLE "ratings_reviews" (
  "id" SERIAL PRIMARY KEY,
  "entity_id" INTEGER NOT NULL,
  "entity_type" VARCHAR(255) NOT NULL,
  "review" TEXT,
  "rating" DECIMAL(2, 1),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "images" JSON,
  "user_id" INTEGER REFERENCES "users"("id")
);

CREATE TABLE "entity_image" (
  "id" SERIAL PRIMARY KEY,
  "entity_id" INTEGER NOT NULL,
  "entity_type" VARCHAR(255) NOT NULL,
  "image_type" VARCHAR(255),
  "image_url" VARCHAR(255) NOT NULL
);
