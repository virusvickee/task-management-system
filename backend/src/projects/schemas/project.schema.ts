import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TaskPriority } from '../../tasks/schemas/task.schema';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: Object.values(TaskPriority), default: TaskPriority.NO_PRIORITY })
  priority: TaskPriority;

  @Prop({ trim: true })
  lead?: string;

  @Prop()
  dueDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
