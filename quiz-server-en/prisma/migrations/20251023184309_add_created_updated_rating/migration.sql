/*
  Warnings:

  - A unique constraint covering the columns `[sessionId]` on the table `UserSession` will be added. If there are existing duplicate values, this will fail.
  - Made the column `sessionId` on table `UserSession` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Quiz` ADD COLUMN `rating` DOUBLE NULL;

-- AlterTable
ALTER TABLE `UserSession` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NULL,
    MODIFY `sessionId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UserSession_sessionId_key` ON `UserSession`(`sessionId`);
