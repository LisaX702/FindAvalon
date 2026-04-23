import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import type { User } from "@relocateit/types";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { GetLocationQueryDto } from "./dto/get-location-query.dto";
import { LocationIdParamsDto, LocationSlugParamsDto } from "./dto/location-params.dto";
import { LocationsService } from "./locations.service";

@Controller("locations")
@UseGuards(SessionAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get("slug/:slug")
  getBySlug(
    @CurrentUser() user: User,
    @Param() params: LocationSlugParamsDto,
    _query: GetLocationQueryDto
  ) {
    return this.locationsService.getLocationBySlug(params.slug, user.id);
  }

  @Get("id/:id")
  getById(
    @CurrentUser() user: User,
    @Param() params: LocationIdParamsDto,
    _query: GetLocationQueryDto
  ) {
    return this.locationsService.getLocationById(params.id, user.id);
  }
}
