import { Body, Controller, Delete, Get, Post, Query, UseGuards } from "@nestjs/common";
import type { User } from "@relocateit/types";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { ComparisonMutationQueryDto, ComparisonQueryDto } from "./dto/comparison-query.dto";
import { SaveComparisonItemDto } from "./dto/save-comparison-item.dto";
import { ComparisonsService } from "./comparisons.service";

@Controller("comparisons")
@UseGuards(SessionAuthGuard)
export class ComparisonsController {
  constructor(private readonly comparisonsService: ComparisonsService) {}

  @Get("current")
  getCurrent(@CurrentUser() user: User, _query: ComparisonQueryDto) {
    return this.comparisonsService.getCurrentSet(user.id);
  }

  @Get("payload")
  getPayload(@CurrentUser() user: User, _query: ComparisonQueryDto) {
    return this.comparisonsService.getComparisonPayload(user.id);
  }

  @Post("items")
  addItem(@CurrentUser() user: User, @Body() body: SaveComparisonItemDto) {
    return this.comparisonsService.addLocation(user.id, body.locationId);
  }

  @Delete("items")
  removeItem(@CurrentUser() user: User, @Query() query: ComparisonMutationQueryDto) {
    return this.comparisonsService.removeLocation(user.id, query.locationId);
  }
}
