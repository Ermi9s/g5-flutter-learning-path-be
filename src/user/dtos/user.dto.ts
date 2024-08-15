import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from '../entities/user.entity';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  constructor(partial: UserDocument) {
    this.id = partial.id;
    this.name = partial.name;
    this.email = partial.email;
  }
}
