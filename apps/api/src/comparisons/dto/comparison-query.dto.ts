import { IsString } from "class-validator";

export class ComparisonQueryDto {}

export class ComparisonMutationQueryDto {
  @IsString()
  locationId!: string;
}
