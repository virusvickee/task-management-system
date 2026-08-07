import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async guestLogin(name?: string) {
    const user = await this.usersService.createGuest(name);
    const token = this.jwtService.sign({ sub: user._id, isGuest: true });
    return {
      accessToken: token,
      user: { id: user._id, name: user.name, isGuest: user.isGuest },
    };
  }
}
