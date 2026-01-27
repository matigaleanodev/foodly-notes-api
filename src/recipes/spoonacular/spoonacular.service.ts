import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  SpoonacularRandomResponse,
  SpoonacularRecipeDetail,
} from './spoonacular.types';

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/';
@Injectable()
export class SpoonacularService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get apiKey(): string {
    return this.config.getOrThrow<string>('SPOONACULAR_API_KEY');
  }

  async getDailyRecipes(number = 10) {
    const { data } =
      await this.httpService.axiosRef.get<SpoonacularRandomResponse>(
        `${SPOONACULAR_BASE_URL}recipes/random`,
        {
          params: {
            apiKey: this.apiKey,
            number,
          },
        },
      );

    return data.recipes;
  }

  async getRecipeById(id: number) {
    try {
      const { data } =
        await this.httpService.axiosRef.get<SpoonacularRecipeDetail>(
          `${SPOONACULAR_BASE_URL}recipes/${id}/information`,
          {
            params: {
              apiKey: this.apiKey,
            },
          },
        );

      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException('Receta no encontrada');
      }
      throw error;
    }
  }

  async getSimilarRecipes(id: number, number = 6) {
    const { data } = await this.httpService.axiosRef.get<
      { id: number; title: string; imageType: string }[]
    >(`${SPOONACULAR_BASE_URL}recipes/${id}/similar`, {
      params: {
        apiKey: this.apiKey,
        number,
      },
    });

    return data;
  }
}
