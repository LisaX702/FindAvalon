import { IsString } from "class-validator";

export class LocationSlugParamsDto {
  @IsString()
  slug!: string;
}

export class LocationIdParamsDto {
  @IsString()
  id!: string;
}
