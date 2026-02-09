import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EmailModule } from '../email/email.module';
import { UsersQueryService } from './users.query.service';
import { UsersCommandService } from './users.command.service';
import { UserSessionsCommandService } from './user-sessions/user-sessions.command.service';
import { UserMapper } from './mappers/user.mapper';
import { UserSessionMapper } from './mappers/user-session.mapper';

@Module({
  imports: [EmailModule],
  controllers: [UsersController],
  providers: [
    // Main service
    UsersService,
    // CQRS services
    UsersQueryService,
    UsersCommandService,
    UserSessionsCommandService,

    // Mappers
    UserMapper,
    UserSessionMapper,

    // Infrastructure
    PrismaService,
  ],
  exports: [
    UsersService, 
    UsersQueryService, 
    UsersService,
    UsersQueryService,
    UsersCommandService
  ]
})
export class UsersModule {}