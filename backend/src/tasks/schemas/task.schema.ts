import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  TODO = 'To Do',
  DOING = 'Doing',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
}

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: Object.values(TaskStatus), default: TaskStatus.TODO })
  status: TaskStatus;

  @Prop({ trim: true })
  assignee?: string;

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
}

export const TaskSchema = SchemaFactory.createForClass(Task);
