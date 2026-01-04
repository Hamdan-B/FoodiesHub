# Firestore Database Schema

## Collections Overview

### 1. `users`
Stores user account information and roles.

**Fields:**
- `uid` (string): Firebase Auth UID (document ID)
- `email` (string): User email address
- `displayName` (string, optional): User's display name
- `roles` (array of strings): User roles - can contain: `["buyer"]`, `["seller"]`, `["rider"]`, or combinations like `["buyer", "seller"]`
- `sellerApproved` (boolean): Whether seller role is approved by admin (default: false)
- `riderApproved` (boolean): Whether rider role is approved by admin (default: false)
- `riderStatus` (string, optional): Rider status - `"online"` or `"offline"` (only for riders)
- `riderAvailability` (string, optional): Rider availability - `"available"` or `"busy"` (only for riders)
- `riderProfileImage` (string, optional): URL to rider profile image in Firebase Storage
- `createdAt` (timestamp): Account creation timestamp
- `updatedAt` (timestamp): Last update timestamp

**Note:** Admin is NOT stored here. Admin access is email-based only via `.env`.

---

### 2. `stores`
Stores restaurant/store information.

**Fields:**
- `storeId` (string): Unique store ID (document ID)
- `sellerId` (string): UID of the seller who owns this store
- `name` (string): Store name
- `description` (string): Store description
- `city` (string): City where store is located
- `logoUrl` (string): URL to store logo in Firebase Storage
- `isActive` (boolean): Whether store is active/visible
- `createdAt` (timestamp): Store creation timestamp
- `updatedAt` (timestamp): Last update timestamp

**Constraints:** Each seller can create only ONE store.

---

### 3. `foodItems`
Stores food items/menu items from stores.

**Fields:**
- `foodId` (string): Unique food item ID (document ID)
- `storeId` (string): ID of the store this item belongs to
- `name` (string): Food item name
- `description` (string): Food item description
- `price` (number): Price of the food item
- `category` (string): Food category (e.g., "Pizza", "Burgers", "Desserts")
- `imageUrl` (string): URL to food image in Firebase Storage
- `variants` (array, optional): Array of variant objects
  - `name` (string): Variant name (e.g., "Size", "Spice Level")
  - `options` (array): Array of option strings (e.g., ["Small", "Medium", "Large"])
- `stockStatus` (string): `"in_stock"` or `"out_of_stock"`
- `nutrition` (object): Nutrition information
  - `calories` (number): Calories per serving
  - `protein` (number): Protein in grams
  - `carbs` (number): Carbs in grams
  - `fat` (number): Fat in grams
  - `isAIGenerated` (boolean): Whether nutrition was AI-generated
- `averageRating` (number, optional): Average rating from reviews (0-5)
- `totalReviews` (number, optional): Total number of reviews
- `createdAt` (timestamp): Item creation timestamp
- `updatedAt` (timestamp): Last update timestamp

---

### 4. `orders`
Stores order information.

**Fields:**
- `orderId` (string): Unique order ID (document ID)
- `buyerId` (string): UID of the buyer
- `storeId` (string): ID of the store
- `riderId` (string, optional): UID of assigned rider (if any)
- `items` (array): Array of ordered items
  - `foodId` (string): Food item ID
  - `foodName` (string): Food item name (snapshot)
  - `quantity` (number): Quantity ordered
  - `price` (number): Price per item (snapshot)
  - `variants` (object, optional): Selected variants
- `groupSize` (string): Group size selected - `"individual"`, `"2-3"`, `"4-6"`, or custom number
- `subtotal` (number): Subtotal amount
- `deliveryFee` (number): Delivery fee
- `total` (number): Total amount
- `paymentMethod` (string): `"cod"` (Cash on Delivery) or `"online"` (demo)
- `paymentStatus` (string): `"pending"`, `"paid"`, or `"failed"`
- `orderStatus` (string): Order status - `"pending"`, `"accepted"`, `"preparing"`, `"ready"`, `"picked_up"`, `"delivering"`, `"delivered"`, `"rejected"`, `"cancelled"`
- `deliveryAddress` (string): Delivery address
- `deliveryOTP` (string, optional): OTP for delivery confirmation (generated when rider picks up)
- `createdAt` (timestamp): Order creation timestamp
- `updatedAt` (timestamp): Last update timestamp
- `deliveredAt` (timestamp, optional): Delivery completion timestamp

---

### 5. `riders`
Stores rider-specific information and assignments.

**Fields:**
- `riderId` (string): UID of the rider (document ID, same as user UID)
- `status` (string): `"online"` or `"offline"`
- `availability` (string): `"available"` or `"busy"`
- `currentOrderId` (string, optional): ID of currently assigned order
- `totalDeliveries` (number): Total number of completed deliveries
- `averageRating` (number, optional): Average rating from buyers
- `createdAt` (timestamp): Rider profile creation timestamp
- `updatedAt` (timestamp): Last update timestamp

**Note:** This collection complements the `users` collection for rider-specific data.

---

### 6. `reviews`
Stores reviews/ratings for food items and sellers.

**Fields:**
- `reviewId` (string): Unique review ID (document ID)
- `buyerId` (string): UID of the buyer who wrote the review
- `orderId` (string): ID of the order this review is for
- `type` (string): Review type - `"food"` or `"seller"`
- `targetId` (string): ID of the item being reviewed (foodId for food, storeId for seller)
- `rating` (number): Rating (1-5)
- `comment` (string, optional): Review comment
- `createdAt` (timestamp): Review creation timestamp
- `updatedAt` (timestamp): Last update timestamp

---

## Relationships

- `users.uid` → `stores.sellerId` (One seller can have one store)
- `users.uid` → `riders.riderId` (One-to-one relationship)
- `stores.storeId` → `foodItems.storeId` (One store has many food items)
- `orders.buyerId` → `users.uid` (Buyer relationship)
- `orders.storeId` → `stores.storeId` (Store relationship)
- `orders.riderId` → `users.uid` (Rider relationship)
- `reviews.buyerId` → `users.uid` (Buyer relationship)
- `reviews.targetId` → `foodItems.foodId` OR `stores.storeId` (Review target)

---

## Indexes Required

Create composite indexes in Firestore for:
1. `stores`: `city` (for city-based filtering)
2. `foodItems`: `storeId`, `category` (for filtering)
3. `orders`: `buyerId`, `orderStatus` (for buyer order history)
4. `orders`: `storeId`, `orderStatus` (for seller order management)
5. `orders`: `riderId`, `orderStatus` (for rider order management)
6. `reviews`: `targetId`, `type` (for review aggregation)

