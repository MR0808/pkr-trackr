/*
  Warnings:

  - You are about to drop the column `name` on the `player` table. All the data in the column will be lost.
  - Added the required column `displayName` to the `player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "player" DROP COLUMN "name",
ADD COLUMN     "displayName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);
