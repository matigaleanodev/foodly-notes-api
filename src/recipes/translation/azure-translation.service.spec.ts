import { Test, TestingModule } from '@nestjs/testing';
import { AzureTranslationService } from './azure-translation.service';

describe('AzureTransalationService', () => {
  let service: AzureTranslationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AzureTranslationService],
    }).compile();

    service = module.get<AzureTranslationService>(AzureTranslationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
