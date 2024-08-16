import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  generateJwt(payload: any) {
    return this.jwtService.sign(payload);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = (await this.findUserByEmail(email)) as unknown as UserDocument;

    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    } as unknown as any;
  }

  async register(user: User): Promise<any> {
    const oldUser = await this.findUserByEmail(user.email);

    if (oldUser) {
      throw new ConflictException('User already exists');
    }

    user.password = await bcrypt.hash(user.password, 10);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const newUser = await (await this.userModel.create(user)).save();

    return {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    };
  }
}
