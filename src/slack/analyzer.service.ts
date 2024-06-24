import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AnalyzerService {
  private analyzerConfig;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.analyzerConfig = {
      host: this.configService.get<string>('ANALYZER_HOST'),
    };
  }

  async getTranslation(text: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.analyzerConfig.host}/translate`, {
          text,
        }),
      );
      return response.data.result;
    } catch (error) {
      throw new Error('Translation service failed');
    }
  }
}
