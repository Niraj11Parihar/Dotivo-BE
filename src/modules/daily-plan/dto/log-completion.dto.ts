import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';

export class LogCompletionDto {
  @IsString()
  @IsNotEmpty()
  goalTemplateId: string;

  @IsString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsNumber()
  @Min(1)
  completedCount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsEnum(['app', 'widget', 'wallpaper'])
  @IsOptional()
  source?: string = 'app';
}
