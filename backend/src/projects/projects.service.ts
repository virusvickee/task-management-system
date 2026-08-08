import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  create(ownerId: string, dto: CreateProjectDto) {
    return this.projectModel.create({ ...dto, owner: ownerId });
  }

  findAllForUser(ownerId: string) {
    return this.projectModel.find({ owner: ownerId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(ownerId: string, id: string) {
    const project = await this.projectModel.findById(id).exec();
    if (!project) throw new NotFoundException('Project not found');
    if (project.owner.toString() !== ownerId) throw new ForbiddenException();
    return project;
  }

  async update(ownerId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(ownerId, id);
    return this.projectModel.findByIdAndUpdate(id, dto, { new: true }).exec();
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.projectModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
