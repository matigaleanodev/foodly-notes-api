import { Test, TestingModule } from '@nestjs/testing';
import { SpoonacularService } from './spoonacular.service';

describe('SpoonacularService', () => {
  let service: SpoonacularService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpoonacularService],
    }).compile();

    service = module.get<SpoonacularService>(SpoonacularService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
