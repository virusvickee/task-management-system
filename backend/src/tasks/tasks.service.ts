import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private usersService: UsersService,
  ) {}

  async create(ownerId: string, dto: CreateTaskDto) {
    const user = await this.usersService.findById(ownerId);
    return this.taskModel.create({
      ...dto,
      owner: ownerId,
      reporterName: user?.name || 'Guest',
    });
  }

  findAllForUser(ownerId: string, projectId?: string) {
    const query: any = { owner: ownerId, parentTaskId: { $exists: false } };
    if (projectId) {
      query.projectId = projectId;
    }
    return this.taskModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(ownerId: string, id: string) {
    const task = await this.taskModel.findById(id).exec();
    if (!task) throw new NotFoundException('Task not found');
    if (task.owner.toString() !== ownerId) throw new ForbiddenException();
    const subtasks = await this.taskModel
      .find({ owner: ownerId, parentTaskId: task._id })
      .sort({ createdAt: 1 })
      .exec();
    return { ...task.toObject(), subtasks };
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto) {
    await this.findOne(ownerId, id); // ownership + existence check
    return this.taskModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.taskModel.findByIdAndDelete(id).exec();
    await this.taskModel.deleteMany({ owner: ownerId, parentTaskId: id }).exec();
    return { deleted: true };
  }

  async addComment(
    ownerId: string,
    id: string,
    text: string,
    attachments: { name: string; dataUrl: string; type: string }[] = [],
  ) {
    await this.findOne(ownerId, id);
    const task = await this.taskModel.findById(id).exec();
    if (!task) throw new NotFoundException('Task not found');
    const user = await this.usersService.findById(ownerId);
    const author = user ? user.name : 'Guest';
    const newComment = {
      author,
      text,
      attachments,
      reactions: [],
      createdAt: new Date(),
    };
    task.comments = task.comments || [];
    task.comments.push(newComment as any);
    await task.save();
    return task;
  }

  async addReaction(ownerId: string, id: string, commentId: string, emoji: string) {
    if (!['👍', '🎉', '❤️', '😂'].includes(emoji)) {
      throw new BadRequestException('Unsupported reaction');
    }
    await this.findOne(ownerId, id);
    const task = await this.taskModel.findById(id).exec();
    if (!task) throw new NotFoundException('Task not found');
    const comment = (task.comments as any)?.id(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    comment.reactions = Array.from(new Set([...(comment.reactions || []), emoji]));
    await task.save();
    return task;
  }

  async updateComment(ownerId: string, id: string, commentId: string, text: string) {
    await this.findOne(ownerId, id);
    const task = await this.taskModel.findById(id).exec();
    if (!task) throw new NotFoundException('Task not found');
    const comment = (task.comments as any)?.id(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    comment.text = text;
    await task.save();
    return task;
  }

  async removeComment(ownerId: string, id: string, commentId: string) {
    await this.findOne(ownerId, id);
    const task = await this.taskModel.findById(id).exec();
    if (!task) throw new NotFoundException('Task not found');
    const comment = (task.comments as any)?.id(commentId);
    if (!comment) throw new NotFoundException('Comment not found');
    comment.deleteOne();
    await task.save();
    return task;
  }
}
