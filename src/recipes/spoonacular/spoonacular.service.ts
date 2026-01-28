import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  SpoonacularIngredient,
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
    const { data } = await this.httpService.axiosRef.get<{
      results: {
        id: number;
        title: string;
        imageType?: string;
        extendedIngredients?: {
          id: number;
          name: string;
          original: string;
          amount: number;
          unit: string;
          image: string;
        }[];
      }[];
    }>(`${SPOONACULAR_BASE_URL}recipes/complexSearch`, {
      params: {
        apiKey: this.apiKey,
        number,
        addRecipeInformation: true,
      },
    });

    return data.results.map((r) => ({
      id: r.id,
      title: r.title,
      image: this.buildImage(r.id, r.imageType),
      ingredients: r.extendedIngredients ?? [],
    }));
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

    return data.map((r) => ({
      id: r.id,
      title: r.title,
      image: this.buildImage(r.id, r.imageType),
    }));
  }

  async searchRecipes(query: string, limit = 12) {
    const { data } = await this.httpService.axiosRef.get<{
      results: {
        id: number;
        title: string;
        imageType?: string;
        extendedIngredients?: SpoonacularIngredient[];
      }[];
    }>(`${SPOONACULAR_BASE_URL}recipes/complexSearch`, {
      params: {
        apiKey: this.apiKey,
        query,
        number: Math.min(limit, 12),
        addRecipeInformation: true,
      },
    });

    return data.results.map((r) => ({
      id: r.id,
      title: r.title,
      image: this.buildImage(r.id, r.imageType),
      extendedIngredients: r.extendedIngredients ?? [],
    }));
  }

  private buildImage(id: number, imageType?: string) {
    return imageType
      ? `https://img.spoonacular.com/recipes/${id}-556x370.${imageType}`
      : null;
  }
}
