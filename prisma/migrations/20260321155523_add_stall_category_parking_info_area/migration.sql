/*
  Warnings:

  - You are about to drop the column `parkingCharges` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `parkingSlotId` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN "parkingInfo" TEXT;
ALTER TABLE "Event" ADD COLUMN "stallCategories" TEXT;

-- AlterTable
ALTER TABLE "Stall" ADD COLUMN "stallCategory" TEXT;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "area" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingNumber" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "stallId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "stallCategory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "amenityCharges" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "paymentId" TEXT,
    "paymentOrderId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Stall" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("amenityCharges", "amount", "bookingNumber", "createdAt", "eventId", "id", "notes", "paidAt", "paymentId", "paymentOrderId", "paymentStatus", "stallId", "status", "tax", "totalAmount", "updatedAt", "vendorId") SELECT "amenityCharges", "amount", "bookingNumber", "createdAt", "eventId", "id", "notes", "paidAt", "paymentId", "paymentOrderId", "paymentStatus", "stallId", "status", "tax", "totalAmount", "updatedAt", "vendorId" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "Booking"("bookingNumber");
CREATE UNIQUE INDEX "Booking_stallId_key" ON "Booking"("stallId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
