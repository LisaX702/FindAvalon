import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

class LocationMetricsDto {
  @IsNumber()
  housingCostIndex!: number;

  @IsNumber()
  jobMarketScore!: number;

  @IsNumber()
  climateScore!: number;

  @IsNumber()
  transitScore!: number;

  @IsNumber()
  safetyScore!: number;

  @IsNumber()
  educationScore!: number;

  @IsNumber()
  healthcareScore!: number;

  @IsNumber()
  entertainmentScore!: number;

  @IsNumber()
  outdoorScore!: number;
}

export class LocationInputDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ValidateNested()
  @Type(() => LocationMetricsDto)
  metrics!: LocationMetricsDto;
}
