import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  TODO = 'To Do',
  DOING = 'Doing',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
}

export enum TaskPriority {
  NO_PRIORITY = 'No Priority',
  URGENT = 'Urgent',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: Object.values(TaskStatus), default: TaskStatus.TODO })
  status: TaskStatus;

  @Prop({ enum: Object.values(TaskPriority), default: TaskPriority.NO_PRIORITY })
  priority: TaskPriority;

  @Prop({ trim: true })
  assignee?: string;

  @Prop({ type: [String], default: [] })
  members: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  dueDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
