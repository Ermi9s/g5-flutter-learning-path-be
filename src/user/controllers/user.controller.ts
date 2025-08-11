import { Controller, Get, Req, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Request } from 'express';

import { UserService } from '../services/user.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('auth')
@Controller({ version: '2', path: 'users' })
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUsers() {
    return await this.userService.findAll();
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const user = (req as unknown as any).user;
    return {
      _id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }
}
