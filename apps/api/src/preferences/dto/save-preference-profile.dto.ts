import { Type } from "class-transformer";
import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";

class PreferredClimateDto {
  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;
}

class DealBreakersDto {
  @IsOptional()
  @IsNumber()
  maxHousingCostIndex?: number;

  @IsOptional()
  @IsNumber()
  maxTaxBurdenIndex?: number;

  @IsOptional()
  @IsNumber()
  minSafetyScore?: number;

  @IsOptional()
  @IsNumber()
  minJobMarketScore?: number;

  @IsOptional()
  @IsNumber()
  minWalkabilityScore?: number;

  @IsOptional()
  @IsNumber()
  maxDisasterRiskIndex?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PreferredClimateDto)
  preferredClimate?: PreferredClimateDto;
}

class CategoryWeightsDto {
  @IsNumber()
  affordability!: number;

  @IsNumber()
  jobs!: number;

  @IsNumber()
  climate!: number;

  @IsNumber()
  safety!: number;

  @IsNumber()
  schools!: number;

  @IsNumber()
  healthcare!: number;

  @IsNumber()
  mobility!: number;

  @IsNumber()
  lifestyle!: number;
}

export class SavePreferenceProfileDto {
  @IsString()
  label!: string;

  @ValidateNested()
  @Type(() => CategoryWeightsDto)
  weights!: CategoryWeightsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DealBreakersDto)
  dealBreakers?: DealBreakersDto;
}
