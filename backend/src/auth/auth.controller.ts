import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GuestLoginDto } from './dto/guest-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('guest')
  async guestLogin(@Body() dto: GuestLoginDto) {
    return this.authService.guestLogin(dto.name);
  }
}
