import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { AnalyzerService } from './analyzer.service';

describe('AnalyzerService', () => {
  let service: AnalyzerService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyzerService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://analyzer-server.url'),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyzerService>(AnalyzerService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return translation text', async () => {
    const result: AxiosResponse = {
      data: { data: ['translated text'] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: undefined,
      },
    };
    jest.spyOn(httpService, 'post').mockReturnValue(of(result));

    const translation = await service.getTranslation('test text');
    expect(translation).toBe('translated text');
  });

  it('should throw an error if translation service fails', async () => {
    jest.spyOn(httpService, 'post').mockImplementation(() => {
      throw new Error('HttpService error');
    });

    await expect(service.getTranslation('test text')).rejects.toThrow(
      'Translation service failed',
    );
  });
});
