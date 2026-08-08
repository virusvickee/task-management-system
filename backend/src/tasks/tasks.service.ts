import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  create(ownerId: string, dto: CreateTaskDto) {
    return this.taskModel.create({ ...dto, owner: ownerId });
  }

  findAllForUser(ownerId: string, projectId?: string) {
    const query: any = { owner: ownerId };
    if (projectId) {
      query.projectId = projectId;
    }
    return this.taskModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(ownerId: string, id: string) {
    const task = await this.taskModel.findById(id).exec();
    if (!task) throw new NotFoundException('Task not found');
    if (task.owner.toString() !== ownerId) throw new ForbiddenException();
    return task;
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto) {
    await this.findOne(ownerId, id); // ownership + existence check
    return this.taskModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.taskModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
