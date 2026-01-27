import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  SpoonacularRandomResponse,
  SpoonacularRecipeDetail,
} from './spoonacular.types';

@Injectable()
export class SpoonacularService {
  private readonly client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.client = axios.create({
      baseURL: 'https://api.spoonacular.com',
      params: {
        apiKey: this.config.getOrThrow<string>('SPOONACULAR_API_KEY'),
      },
    });
  }

  async getDailyRecipes(number = 10) {
    const response = await this.client.get<SpoonacularRandomResponse>(
      '/recipes/random',
      { params: { number } },
    );

    return response.data.recipes;
  }

  async getRecipeById(id: number) {
    try {
      const response = await this.client.get<SpoonacularRecipeDetail>(
        `/recipes/${id}/information`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException('Receta no encontrada');
      }
      throw error;
    }
  }

  async getSimilarRecipes(id: number, number = 6) {
    const response = await this.client.get<
      { id: number; title: string; imageType: string }[]
    >(`/recipes/${id}/similar`, {
      params: { number },
    });

    return response.data;
  }
}
