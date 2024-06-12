import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AnalyzerService {
  private analyzerUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.analyzerUrl = this.configService.get<string>('ANALYZER_URL');
  }

  async getTranslation(text: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.analyzerUrl}/translate`, {
          texts: [text],
        }),
      );
      return response.data.data[0];
    } catch (error) {
      throw new Error('Translation service failed');
    }
  }
}
