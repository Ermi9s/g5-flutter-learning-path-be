import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { LoginDto, RegisterUserDto } from '../dtos/requests.dto';

@ApiTags('auth')
@Controller({ version: '3', path: 'auth' })
export class AuthV3Controller {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @ApiBody({
    type: LoginDto,
  })
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() user: RegisterUserDto) {
    return this.authService.register(user);
  }
}
