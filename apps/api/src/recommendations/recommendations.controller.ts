import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { User } from "@relocateit/types";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { GetRecommendationsQueryDto } from "./dto/get-recommendations-query.dto";
import { RecommendationsService } from "./recommendations.service";

@Controller("recommendations")
@UseGuards(SessionAuthGuard)
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  getForUser(@CurrentUser() user: User, @Query() query: GetRecommendationsQueryDto) {
    return this.recommendationsService.getRecommendationsForUser(user.id, query.limit);
  }
}
