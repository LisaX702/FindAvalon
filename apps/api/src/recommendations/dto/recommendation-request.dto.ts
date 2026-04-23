import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";
import { LocationInputDto } from "./location-input.dto";

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
  minSafetyScore?: number;

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
  transit!: number;

  @IsNumber()
  safety!: number;

  @IsNumber()
  education!: number;

  @IsNumber()
  healthcare!: number;

  @IsNumber()
  lifestyle!: number;
}

export class RecommendationRequestDto {
  @IsString()
  userId!: string;

  @ValidateNested()
  @Type(() => CategoryWeightsDto)
  weights!: CategoryWeightsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DealBreakersDto)
  dealBreakers?: DealBreakersDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LocationInputDto)
  locations!: LocationInputDto[];
}
