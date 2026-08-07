import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtStrategyGuard } from '../auth/jwt.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(JwtStrategyGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.tasksService.findAllForUser(req.user.sub);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.tasksService.findOne(req.user.sub, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tasksService.remove(req.user.sub, id);
  }
}
