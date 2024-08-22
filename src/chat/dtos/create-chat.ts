import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class InitiateChatDto {
  @ApiProperty()
  @IsString()
  userId: string;
}
