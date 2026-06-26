import { IsString, IsNotEmpty, IsEnum, IsArray, IsNumber, IsBoolean, IsOptional, Max, Min } from 'class-validator';

export class CreateGoalTemplateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(['daily', 'weekly', 'specific_days'])
  @IsOptional()
  frequencyType?: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsOptional()
  selectedDays?: number[];

  @IsNumber()
  @IsOptional()
  targetCount?: number;

  @IsBoolean()
  @IsOptional()
  isDailyMinimum?: boolean;

  @IsBoolean()
  @IsOptional()
  isTop3Default?: boolean;

  @IsString()
  @IsOptional()
  reminderTime?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  icon?: string;
}
