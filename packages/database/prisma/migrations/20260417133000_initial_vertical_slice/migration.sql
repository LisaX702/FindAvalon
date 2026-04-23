-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "weightsJson" JSONB NOT NULL,
    "constraintsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PreferenceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "population" INTEGER NOT NULL,
    "description" TEXT,
    "latitude" DECIMAL(8,5),
    "longitude" DECIMAL(8,5),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationMetrics" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "housingCostIndex" DOUBLE PRECISION NOT NULL,
    "taxBurdenIndex" DOUBLE PRECISION NOT NULL,
    "climateScore" DOUBLE PRECISION NOT NULL,
    "safetyScore" DOUBLE PRECISION NOT NULL,
    "educationScore" DOUBLE PRECISION NOT NULL,
    "healthcareScore" DOUBLE PRECISION NOT NULL,
    "jobMarketScore" DOUBLE PRECISION NOT NULL,
    "walkabilityScore" DOUBLE PRECISION NOT NULL,
    "transitScore" DOUBLE PRECISION NOT NULL,
    "recreationScore" DOUBLE PRECISION NOT NULL,
    "internetQualityScore" DOUBLE PRECISION NOT NULL,
    "disasterRiskIndex" DOUBLE PRECISION NOT NULL,
    "sourceSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LocationMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedLocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonRow" (
    "id" TEXT NOT NULL,
    "comparisonId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "ComparisonRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PreferenceProfile_userId_isCurrent_idx" ON "PreferenceProfile"("userId", "isCurrent");

-- CreateIndex
CREATE INDEX "PreferenceProfile_userId_updatedAt_idx" ON "PreferenceProfile"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "Location"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LocationMetrics_locationId_key" ON "LocationMetrics"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedLocation_userId_locationId_key" ON "SavedLocation"("userId", "locationId");

-- CreateIndex
CREATE INDEX "SavedLocation_userId_idx" ON "SavedLocation"("userId");

-- CreateIndex
CREATE INDEX "SavedLocation_locationId_idx" ON "SavedLocation"("locationId");

-- CreateIndex
CREATE INDEX "Comparison_userId_idx" ON "Comparison"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonRow_comparisonId_locationId_key" ON "ComparisonRow"("comparisonId", "locationId");

-- CreateIndex
CREATE INDEX "ComparisonRow_comparisonId_position_idx" ON "ComparisonRow"("comparisonId", "position");

-- AddForeignKey
ALTER TABLE "PreferenceProfile" ADD CONSTRAINT "PreferenceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationMetrics" ADD CONSTRAINT "LocationMetrics_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedLocation" ADD CONSTRAINT "SavedLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedLocation" ADD CONSTRAINT "SavedLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonRow" ADD CONSTRAINT "ComparisonRow_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonRow" ADD CONSTRAINT "ComparisonRow_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
