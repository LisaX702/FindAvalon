import { Module } from "@nestjs/common";
import { PreferencesModule } from "../preferences/preferences.module";
import { ComparisonsController } from "./comparisons.controller";
import { ComparisonsService } from "./comparisons.service";

@Module({
  imports: [PreferencesModule],
  controllers: [ComparisonsController],
  providers: [ComparisonsService],
  exports: [ComparisonsService]
})
export class ComparisonsModule {}
