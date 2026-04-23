import { Body, Controller, Delete, Get, Post, Query, UseGuards } from "@nestjs/common";
import type { User } from "@relocateit/types";
import { CurrentUser } from "../auth/current-user.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { FavoritesQueryDto, FavoriteMutationQueryDto } from "./dto/favorite-query.dto";
import { SaveFavoriteDto } from "./dto/save-favorite.dto";
import { FavoritesService } from "./favorites.service";

@Controller("favorites")
@UseGuards(SessionAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: User, _query: FavoritesQueryDto) {
    return this.favoritesService.listFavorites(user.id);
  }

  @Post()
  save(@CurrentUser() user: User, @Body() body: SaveFavoriteDto) {
    return this.favoritesService.saveFavorite(user.id, body);
  }

  @Delete()
  remove(@CurrentUser() user: User, @Query() query: FavoriteMutationQueryDto) {
    return this.favoritesService.removeFavorite(user.id, query.locationId);
  }
}
