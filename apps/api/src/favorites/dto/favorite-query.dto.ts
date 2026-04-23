import { IsString } from "class-validator";

export class FavoritesQueryDto {}

export class FavoriteMutationQueryDto {
  @IsString()
  locationId!: string;
}
