import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { User } from "@relocateit/types";

type RequestWithUser = {
  user?: User;
};

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
