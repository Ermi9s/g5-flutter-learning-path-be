import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('auth')
@Controller({ version: '3', path: 'users' })
@UseGuards(JwtAuthGuard)
export class UserV3Controller {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    const user = (req as unknown as any).user;
    return {
      _id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
