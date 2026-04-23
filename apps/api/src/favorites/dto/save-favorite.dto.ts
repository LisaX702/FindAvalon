import { IsOptional, IsString } from "class-validator";

export class SaveFavoriteDto {
  @IsString()
  locationId!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
