import { Module } from '@nestjs/common';
import { ThemeProvider } from './theme.provider';

@Module({
  providers: [ThemeProvider],
  exports: [ThemeProvider],
})
export class ThemeModule {}
