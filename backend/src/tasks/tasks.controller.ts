import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtStrategyGuard } from '../auth/jwt.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('tasks')
@UseGuards(JwtStrategyGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Req() req: any, @Query('projectId') projectId?: string) {
    return this.tasksService.findAllForUser(req.user.sub, projectId);
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

  @Post(':id/comments')
  addComment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tasksService.addComment(req.user.sub, id, dto.text, dto.attachments);
  }

  @Post(':id/comments/:commentId/reactions')
  addReaction(
    @Req() req: any,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body('emoji') emoji: string,
  ) {
    return this.tasksService.addReaction(req.user.sub, id, commentId, emoji);
  }

  @Patch(':id/comments/:commentId')
  updateComment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.tasksService.updateComment(req.user.sub, id, commentId, dto.text);
  }

  @Delete(':id/comments/:commentId')
  removeComment(
    @Req() req: any,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.tasksService.removeComment(req.user.sub, id, commentId);
  }
}
