import { IsString } from "class-validator";

export class SaveComparisonItemDto {
  @IsString()
  locationId!: string;
}
