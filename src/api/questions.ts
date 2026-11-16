import type { QuestionRequest, QuestionResponse } from '../types/question'
import { sendApi } from './client'

export const askQuestion = (request: QuestionRequest) =>
  sendApi<QuestionResponse>('/questions', 'POST', request)
