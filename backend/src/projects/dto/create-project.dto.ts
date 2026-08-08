import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TaskPriority } from '../../tasks/schemas/task.schema';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  lead?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
