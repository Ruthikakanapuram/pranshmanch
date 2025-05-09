import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('/generate')
  create(@Body() createQuestionDto: CreateQuestionDto) {
    console.log("in the controller");
    return this.questionsService.generateQuestions(createQuestionDto);
  }

 
}
