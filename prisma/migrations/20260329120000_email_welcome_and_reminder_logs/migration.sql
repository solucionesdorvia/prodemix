-- AlterTable
ALTER TABLE "User" ADD COLUMN "welcomeEmailSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProdeClosingReminderLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prodeId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProdeClosingReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProdeClosingReminderLog_userId_prodeId_key" ON "ProdeClosingReminderLog"("userId", "prodeId");

-- CreateIndex
CREATE INDEX "ProdeClosingReminderLog_prodeId_idx" ON "ProdeClosingReminderLog"("prodeId");

-- CreateIndex
CREATE INDEX "ProdeClosingReminderLog_sentAt_idx" ON "ProdeClosingReminderLog"("sentAt");

-- AddForeignKey
ALTER TABLE "ProdeClosingReminderLog" ADD CONSTRAINT "ProdeClosingReminderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdeClosingReminderLog" ADD CONSTRAINT "ProdeClosingReminderLog_prodeId_fkey" FOREIGN KEY ("prodeId") REFERENCES "Prode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
