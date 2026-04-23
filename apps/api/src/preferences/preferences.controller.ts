import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import type { User } from "@relocateit/types";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { GetCurrentProfileQueryDto } from "./dto/get-current-profile-query.dto";
import { SavePreferenceProfileDto } from "./dto/save-preference-profile.dto";
import { PreferencesService } from "./preferences.service";

@Controller("preferences")
@UseGuards(SessionAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get("current")
  getCurrent(@CurrentUser() user: User, _query: GetCurrentProfileQueryDto) {
    return this.preferencesService.getCurrentProfile(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: SavePreferenceProfileDto) {
    return this.preferencesService.createProfile(user.id, body);
  }

  @Put(":profileId")
  update(
    @CurrentUser() user: User,
    @Param("profileId") profileId: string,
    @Body() body: SavePreferenceProfileDto
  ) {
    return this.preferencesService.updateProfile(user.id, profileId, body);
  }
}
